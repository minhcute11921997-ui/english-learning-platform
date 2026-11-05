import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vocabListApi } from '../../api/services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VocabImage from '../../components/vocab/VocabImage';
import VocabSidebarInfo from '../../components/vocab/VocabSidebarInfo';
import {
  HiArrowLeft,
  HiOutlineBookOpen,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiVolumeUp,
  HiSearch,
  HiCheckCircle,
  HiOutlineSparkles,
  HiChevronDown,
  HiChevronUp
} from 'react-icons/hi';

export default function UserVocabListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [vocabularies, setVocabularies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedInfoIds, setExpandedInfoIds] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await vocabListApi.getById(id);
      const data = res.data;
      setList(data);
      setVocabularies(data.vocabularies || []);
      setEditName(data.name || '');
      setEditDesc(data.description || '');
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách từ vựng');
      navigate('/topics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleExpand = (vocabId) => {
    setExpandedInfoIds((prev) => ({
      ...prev,
      [vocabId]: !prev[vocabId]
    }));
  };

  const handleRemoveWord = async (vocabId, word) => {
    if (!window.confirm(`Bạn có chắc muốn gỡ từ "${word}" khỏi danh sách này?`)) {
      return;
    }

    try {
      await vocabListApi.removeWord(id, vocabId);
      toast.success(`Đã gỡ "${word}" khỏi danh sách!`);
      setVocabularies((prev) => prev.filter((v) => v.id !== vocabId));
    } catch (err) {
      toast.error(err.message || 'Gỡ từ thất bại');
    }
  };

  const handleUpdateList = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setIsUpdating(true);
      const res = await vocabListApi.update(id, {
        name: editName.trim(),
        description: editDesc.trim()
      });
      setList((prev) => ({ ...prev, name: res.data.name, description: res.data.description }));
      setIsEditing(false);
      toast.success('Đã cập nhật thông tin bộ từ!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteList = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ từ "${list.name}"? Các từ vựng vẫn được lưu trong hệ thống.`)) {
      return;
    }

    try {
      await vocabListApi.delete(id);
      toast.success('Đã xóa bộ từ!');
      navigate('/topics');
    } catch (err) {
      toast.error(err.message || 'Xóa bộ từ thất bại');
    }
  };

  const filteredVocabs = vocabularies.filter((v) => {
    const matchSearch =
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning_vi.toLowerCase().includes(search.toLowerCase()) ||
      (v.cultural_note && v.cultural_note.toLowerCase().includes(search.toLowerCase())) ||
      (v.related_artist && v.related_artist.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Đang mở sổ từ cá nhân..." />
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-14">
      {/* Back button */}
      <div>
        <Link
          to="/topics"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider"
        >
          <HiArrowLeft /> Quay lại danh mục chủ đề
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-sm space-y-4">
        {isEditing ? (
          <form onSubmit={handleUpdateList} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                Tên bộ từ: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="input py-2.5 px-3.5 text-xs w-full rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">Mô tả:</label>
              <textarea
                rows="2"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="input py-2.5 px-3.5 text-xs w-full rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="btn btn-primary py-2 px-4 text-xs rounded-xl"
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary py-2 px-4 text-xs rounded-xl"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  {list.name}
                </h1>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {vocabularies.length} từ
                </span>
              </div>
              {list.description && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {list.description}
                </p>
              )}
            </div>

            {/* Actions for this list */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {vocabularies.length > 0 && (
                <Link
                  to={`/vocab-lists/${id}/flashcards`}
                  className="btn btn-primary py-2 px-4 text-xs gap-1.5 flex items-center rounded-xl shadow-xs"
                >
                  <HiOutlineBookOpen className="w-4 h-4" />
                  <span>Flashcard ({vocabularies.length})</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Chỉnh sửa thông tin bộ từ"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              >
                <HiOutlinePencilAlt className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDeleteList}
                title="Xóa bộ từ này"
                className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search bar inside list */}
        {vocabularies.length > 0 && (
          <div className="pt-2">
            <div className="relative max-w-md">
              <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm thuật ngữ hoặc nghệ sĩ trong sổ từ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9.5 pr-4 py-2 text-xs w-full rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Grid */}
      {filteredVocabs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredVocabs.map((vocab) => {
            const isExpanded = !!expandedInfoIds[vocab.id];

            return (
              <div
                key={vocab.id}
                className="card p-6 border border-slate-200/90 hover:border-blue-300 bg-white rounded-3xl shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Word title, artwork, audio, part of speech */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-1 shrink-0 shadow-xs">
                        <VocabImage
                          src={vocab.image_url}
                          alt={vocab.image_alt || vocab.word}
                          enableZoom={true}
                          className="w-full h-full rounded-xl"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-extrabold text-slate-950 truncate tracking-tight">
                            {vocab.word}
                          </h2>
                          <button
                            onClick={() => handleSpeak(vocab.word)}
                            title="Nghe phát âm chuẩn"
                            className="p-1 rounded-xl hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer shrink-0"
                          >
                            <HiVolumeUp className="w-4 h-4" />
                          </button>
                        </div>
                        {vocab.pronunciation && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {vocab.pronunciation}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {vocab.part_of_speech && (
                        <span className="badge bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] uppercase font-bold">
                          {vocab.part_of_speech}
                        </span>
                      )}
                      {vocab.source_ref && (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 font-semibold">
                          {vocab.source_ref}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-base font-bold text-slate-900 mb-3">
                    {vocab.meaning_vi}
                  </p>

                  {vocab.example_sentence && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 text-xs space-y-1 mb-3 border border-slate-200/70">
                      <p className="font-bold text-slate-800">
                        "{vocab.example_sentence}"
                      </p>
                      {vocab.example_translation && (
                        <p className="text-slate-500 italic">
                          "{vocab.example_translation}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Collapsible toggle for Cultural Side-Notes */}
                  {(vocab.cultural_note || vocab.related_artist) && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(vocab.id)}
                        className="w-full text-left flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 py-1.5 px-3 rounded-xl bg-slate-100/70 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" />
                          {isExpanded ? 'Ẩn thông tin bên lề' : 'Xem bối cảnh văn hóa & nghệ sĩ'}
                        </span>
                        {isExpanded ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5">
                          <VocabSidebarInfo
                            culturalNote={vocab.cultural_note}
                            relatedArtist={vocab.related_artist}
                            sourceRef={vocab.source_ref}
                            imageCredit={vocab.image_credit}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer of card */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                    <HiCheckCircle className="w-3.5 h-3.5" /> Trong lộ trình ôn SM-2
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveWord(vocab.id, vocab.word)}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-1 px-2.5 rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                    title="Gỡ từ khỏi danh sách này"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    <span>Gỡ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center p-14 bg-white rounded-3xl border border-slate-200/90 space-y-4 shadow-sm">
          <HiOutlineSparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-slate-900">
            {search ? 'Không tìm thấy từ phù hợp' : 'Chưa có từ vựng nào trong bộ này'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'Thử tìm kiếm với từ khóa khác.'
              : 'Hãy vào trang Chủ đề Mỹ thuật và nhấn "+ Học từ này" để lưu từ vào đây.'}
          </p>
          {!search && (
            <div className="pt-2">
              <Link to="/topics" className="btn btn-primary text-xs py-2 px-4 rounded-xl">
                Khám phá chủ đề ngay
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
