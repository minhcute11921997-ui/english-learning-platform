import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { topicApi, vocabApi } from '../../api/services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VocabImage from '../../components/vocab/VocabImage';
import VocabSidebarInfo from '../../components/vocab/VocabSidebarInfo';
import {
  HiVolumeUp,
  HiCheckCircle,
  HiSearch,
  HiFilter,
  HiArrowLeft,
  HiLightningBolt,
  HiViewGrid,
  HiChevronDown,
  HiChevronUp
} from 'react-icons/hi';
import { HiOutlineBookmark, HiOutlineSparkles } from 'react-icons/hi2';
import AddToListModal from '../../components/vocab/AddToListModal';

export default function TopicDetailPage() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [vocabularies, setVocabularies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedVocabForModal, setSelectedVocabForModal] = useState(null);
  const [expandedInfoIds, setExpandedInfoIds] = useState({});

  useEffect(() => {
    loadData();
  }, [id, difficulty]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tRes, vRes] = await Promise.all([
        topicApi.getById(id),
        vocabApi.getByTopic(id, { difficulty, limit: 100 })
      ]);
      setTopic(tRes.data);
      setVocabularies(vRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu chủ đề');
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
    } else {
      toast.error('Trình duyệt không hỗ trợ phát âm tự động');
    }
  };

  const toggleExpand = (vocabId) => {
    setExpandedInfoIds((prev) => ({
      ...prev,
      [vocabId]: !prev[vocabId]
    }));
  };

  const filteredVocabs = vocabularies.filter((v) => {
    const matchSearch =
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning_vi.toLowerCase().includes(search.toLowerCase()) ||
      (v.cultural_note && v.cultural_note.toLowerCase().includes(search.toLowerCase())) ||
      (v.related_artist && v.related_artist.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  if (isLoading && !topic) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Đang tải phòng triển lãm..." />
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-14">
      {/* Back button & Contemporary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-200 pb-6">
        <div>
          <Link
            to="/topics"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors uppercase tracking-wider"
          >
            <HiArrowLeft className="w-3.5 h-3.5" /> Quay lại danh mục triển lãm
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {topic?.name_vi}{' '}
            <span className="text-slate-400 font-mono font-normal text-xl block sm:inline mt-1 sm:mt-0">
              ({topic?.name})
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {topic?.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to={`/topics/${id}/flashcards`} className="btn btn-secondary text-xs py-2.5 px-4 gap-2 rounded-xl">
            <HiViewGrid className="w-4 h-4 text-blue-600" /> Flashcard 3D
          </Link>
          <Link to={`/topics/${id}/exercise`} className="btn btn-primary text-xs py-2.5 px-4 gap-2 rounded-xl">
            <HiLightningBolt className="w-4 h-4" /> Luyện tập đố tranh
          </Link>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white border border-slate-200/90 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <HiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            className="input pl-10 py-2 text-xs rounded-xl"
            placeholder="Tìm theo từ tiếng Anh, tiếng Việt, nghệ sĩ, làng nghề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <HiFilter className="text-slate-400 w-4 h-4" />
          <select
            className="input py-2 text-xs rounded-xl"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Tất cả mức độ</option>
            <option value="easy">Căn bản (Easy)</option>
            <option value="medium">Trung cấp (Medium)</option>
            <option value="hard">Chuyên sâu (Hard)</option>
          </select>
        </div>
      </div>

      {/* Vocabulary list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVocabs.map((vocab) => {
          const isLearned = !!vocab.user_progress;
          const isExpanded = !!expandedInfoIds[vocab.id];
          const posLabels = {
            noun: 'danh từ',
            verb: 'động từ',
            adjective: 'tính từ',
            adverb: 'trạng từ',
            preposition: 'giới từ',
            conjunction: 'liên từ',
            pronoun: 'đại từ'
          };

          return (
            <div
              key={vocab.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-sm ${
                isLearned
                  ? 'bg-blue-50/20 border-blue-200/80'
                  : 'bg-white border-slate-200/90 hover:border-blue-300'
              }`}
            >
              <div>
                {/* Header item */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-1 shrink-0 shadow-md">
                      <VocabImage
                        src={vocab.image_url}
                        alt={vocab.image_alt || vocab.word}
                        enableZoom={true}
                        className="w-full h-full rounded-xl"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                          {vocab.word}
                        </h2>
                        <button
                          onClick={() => handleSpeak(vocab.word)}
                          title="Nghe phát âm chuẩn"
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer"
                        >
                          <HiVolumeUp className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{vocab.pronunciation}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="badge bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold px-2 py-0.5">
                        {posLabels[vocab.part_of_speech] || vocab.part_of_speech}
                      </span>
                      <span
                        className={`badge font-mono text-[10px] uppercase font-bold px-2 py-0.5 ${
                          vocab.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : vocab.difficulty === 'medium'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {vocab.difficulty}
                      </span>
                    </div>
                    {vocab.source_ref && (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 font-semibold">
                        {vocab.source_ref}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nghĩa tiếng Việt */}
                <p className="text-base font-bold text-slate-900 mb-3">{vocab.meaning_vi}</p>

                {/* Ví dụ ngữ cảnh */}
                {vocab.example_sentence && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 text-xs space-y-1 mb-4 border border-slate-200/70">
                    <p className="font-semibold text-slate-800">"{vocab.example_sentence}"</p>
                    <p className="text-slate-500 italic">"{vocab.example_translation}"</p>
                  </div>
                )}

                {/* Collapsible toggle for Cultural Side-Notes */}
                {(vocab.cultural_note || vocab.related_artist) && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => toggleExpand(vocab.id)}
                      className="w-full text-left flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 py-1.5 px-3 rounded-xl bg-slate-100/70 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" />
                        {isExpanded ? 'Ẩn thông tin bên lề & nghệ sĩ' : 'Xem bối cảnh văn hóa & nghệ sĩ tiêu biểu'}
                      </span>
                      {isExpanded ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3">
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

              {/* Card Footer Actions */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                {isLearned ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                    <HiCheckCircle className="w-4 h-4" /> Đang ôn tập SM-2
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono text-[11px]">Chưa lưu</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVocabForModal(vocab)}
                    className="py-1.5 px-3 text-xs text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
                    title="Quản lý sổ từ cá nhân"
                  >
                    <HiOutlineBookmark className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sổ từ</span>
                  </button>
                  {isLearned ? (
                    <Link
                      to="/review"
                      className="py-1.5 px-3.5 text-xs rounded-xl border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors"
                    >
                      Ôn tập ngay →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedVocabForModal(vocab)}
                      className="py-1.5 px-3.5 text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-600/25"
                      title="Lưu vào danh sách học và lên lịch ôn tập"
                    >
                      <HiOutlineBookmark className="w-3.5 h-3.5 text-white/90" />
                      + Học từ này
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVocabs.length === 0 && (
        <div className="text-center py-16 card border-slate-200/90 rounded-3xl">
          <p className="text-slate-500 text-sm">Không tìm thấy thuật ngữ nào khớp với từ khóa tìm kiếm.</p>
        </div>
      )}

      {/* Modal lưu từ vào các bộ danh sách cá nhân */}
      {selectedVocabForModal && (
        <AddToListModal
          isOpen={!!selectedVocabForModal}
          onClose={() => setSelectedVocabForModal(null)}
          vocab={selectedVocabForModal}
          onSuccess={() => {
            setVocabularies((prev) =>
              prev.map((v) =>
                v.id === selectedVocabForModal.id
                  ? { ...v, user_progress: { status: 'learning', correct_count: 1 } }
                  : v
              )
            );
          }}
        />
      )}
    </div>
  );
}
