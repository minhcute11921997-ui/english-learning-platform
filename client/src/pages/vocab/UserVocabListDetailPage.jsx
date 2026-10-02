import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vocabListApi } from '../../api/services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiArrowLeft,
  HiOutlineBookOpen,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiVolumeUp,
  HiSearch,
  HiCheckCircle,
  HiOutlineSparkles
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
      toast.success('Đã xóa bộ danh sách từ!');
      navigate('/topics');
    } catch (err) {
      toast.error(err.message || 'Xóa danh sách thất bại');
    }
  };

  const filteredVocabs = vocabularies.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.word && v.word.toLowerCase().includes(q)) ||
      (v.meaning_vi && v.meaning_vi.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div>
        <Link
          to="/topics"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#6C726E] hover:text-[#195646] transition-colors"
        >
          <HiArrowLeft /> Quay lại Danh sách từ vựng
        </Link>
      </div>

      {/* List Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6 sm:p-8 space-y-4">
        {isEditing ? (
          <form onSubmit={handleUpdateList} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#16201B]">Tên bộ từ:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input py-2 px-3 text-sm w-full font-serif font-bold text-lg border-[#CCD5D0] focus:border-[#195646] mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#16201B]">Mô tả (tùy chọn):</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="input py-2 px-3 text-xs w-full border-[#CCD5D0] focus:border-[#195646] mt-1"
                rows="2"
                placeholder="Ghi chú mục đích của bộ từ này..."
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isUpdating || !editName.trim()}
                className="btn btn-primary py-1.5 px-4 text-xs cursor-pointer"
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-outline py-1.5 px-3 text-xs text-[#6C726E] cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16201B]">
                  {list.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF5EC] text-[#8C6D3B] border border-[#EFE5D0]">
                  {vocabularies.length} từ
                </span>
              </div>
              {list.description && (
                <p className="text-sm text-[#6C726E] leading-relaxed max-w-2xl">
                  {list.description}
                </p>
              )}
            </div>

            {/* Actions for this list */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {vocabularies.length > 0 && (
                <Link
                  to={`/vocab-lists/${id}/flashcards`}
                  className="btn btn-primary py-2 px-4 text-xs gap-1.5 flex items-center shadow-xs"
                >
                  <HiOutlineBookOpen className="w-4 h-4" />
                  <span>Luyện Flashcard ({vocabularies.length})</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Chỉnh sửa thông tin bộ từ"
                className="p-2 rounded-xl border border-[#E0DACE] hover:bg-[#F2EFE8] text-[#555C58] transition-colors cursor-pointer"
              >
                <HiOutlinePencilAlt className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDeleteList}
                title="Xóa bộ từ này"
                className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
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
              <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A918D]" />
              <input
                type="text"
                placeholder="Tìm kiếm từ tiếng Anh hoặc nghĩa tiếng Việt trong bộ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9.5 pr-4 py-2 text-xs w-full border-[#CCD5D0] focus:border-[#195646]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Grid */}
      {filteredVocabs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVocabs.map((vocab) => {
            return (
              <div
                key={vocab.id}
                className="card p-5 border-[#E8E4DC] hover:border-[#CCD5D0] bg-white transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Word title, audio, part of speech */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <h2 className="font-serif text-xl font-bold text-[#16201B] truncate">
                        {vocab.word}
                      </h2>
                      <button
                        onClick={() => handleSpeak(vocab.word)}
                        title="Nghe phát âm"
                        className="p-1.5 rounded-full hover:bg-[#F0F7F4] text-[#195646] transition-colors cursor-pointer flex-shrink-0"
                      >
                        <HiVolumeUp className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {vocab.part_of_speech && (
                        <span className="badge bg-[#F0F7F4] text-[#195646] border border-[#D7E9E1] text-[11px] font-semibold">
                          {vocab.part_of_speech}
                        </span>
                      )}
                    </div>
                  </div>

                  {vocab.pronunciation && (
                    <p className="text-xs text-[#7B827E] font-mono mb-2">
                      {vocab.pronunciation}
                    </p>
                  )}

                  <p className="text-sm font-semibold text-[#11382E] mb-3">
                    {vocab.meaning_vi}
                  </p>

                  {vocab.example_sentence && (
                    <div className="p-3 rounded-xl bg-[#FAF8F5] text-xs space-y-1 mb-4 border border-[#ECE7DC]">
                      <p className="font-serif text-[#16201B] italic">
                        &ldquo;{vocab.example_sentence}&rdquo;
                      </p>
                      {vocab.example_translation && (
                        <p className="text-[#6C726E] text-[11.5px]">
                          ↳ {vocab.example_translation}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer of card */}
                <div className="pt-3 border-t border-[#ECE7DC] flex items-center justify-between text-xs text-[#7B827E]">
                  <span className="inline-flex items-center gap-1 text-[#195646] font-medium text-[11px]">
                    <HiCheckCircle className="w-3.5 h-3.5 text-[#195646]" /> Trong lịch ôn tập
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveWord(vocab.id, vocab.word)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 py-1 px-2.5 rounded-lg border border-red-200 transition-colors cursor-pointer flex items-center gap-1"
                    title="Gỡ từ khỏi danh sách này"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    <span>Gỡ khỏi bộ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : vocabularies.length === 0 ? (
        /* Empty State */
        <div className="card p-12 text-center border-dashed border-[#DFD9CD] bg-[#FAF8F5] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EBE7DF] text-[#6C726E] flex items-center justify-center mx-auto">
            <HiOutlineBookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#16201B]">
            Bộ từ này chưa có từ vựng nào
          </h3>
          <p className="text-xs text-[#6C726E] max-w-md mx-auto leading-relaxed">
            Bạn có thể thêm từ vào danh sách này bằng cách:
            <br />
            1. Bôi đen từ khi đọc bài đọc và bấm <strong>&ldquo;Lưu vào danh sách&rdquo;</strong>.
            <br />
            2. Bấm nút <strong>&ldquo;+ Thêm vào danh sách&rdquo;</strong> tại các thẻ từ trong mục Chủ đề từ vựng.
          </p>
          <div className="pt-2">
            <Link to="/topics" className="btn btn-outline text-xs py-2 px-4">
              Khám phá chủ đề từ vựng →
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 card bg-[#FAF8F5]">
          <p className="text-xs text-[#7B827E]">
            Không tìm thấy từ vựng nào khớp với từ khóa &ldquo;{search}&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
