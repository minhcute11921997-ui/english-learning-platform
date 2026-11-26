import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [topic, setTopic] = useState(null);
  const [vocabularies, setVocabularies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [difficulty, setDifficulty] = useState('');
  const [selectedVocabForModal, setSelectedVocabForModal] = useState(null);
  const [expandedInfoIds, setExpandedInfoIds] = useState({});

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  useEffect(() => {
    let active = true;
    const fetchTopicData = async () => {
      try {
        const [tRes, vRes] = await Promise.all([
          topicApi.getById(id),
          vocabApi.getByTopic(id, { difficulty, limit: 100 })
        ]);
        if (!active) return;
        setTopic(tRes.data);
        setVocabularies(vRes.data || []);
      } catch (err) {
        if (active) toast.error(err.message || 'Không thể tải dữ liệu chủ đề');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchTopicData();
    return () => {
      active = false;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id, difficulty]);

  const handleMarkLearned = async (vocab) => {
    try {
      await vocabApi.markAsLearned(vocab.id);
      setVocabularies((prev) =>
        prev.map((v) =>
          v.id === vocab.id
            ? { ...v, user_progress: { status: 'learning', correct_count: 1 } }
            : v
        )
      );
      toast.success(`Đã thêm "${vocab.word}" vào lộ trình ôn tập!`);
    } catch (err) {
      toast.error(err.message || 'Không thể lưu tiến độ học');
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
      {/* Back button & Header */}
      <div className="page-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link
            to="/topics"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-1.5 transition-colors"
          >
            <HiArrowLeft className="w-3.5 h-3.5" /> Chủ đề
          </Link>
          <h1 className="page-title">
            {topic?.name_vi}
          </h1>
          {topic?.name && <p lang="en" className="topic-guide">{topic.name}</p>}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to={`/topics/${id}/flashcards`} className="btn btn-secondary text-xs py-2.5 px-4 gap-2 rounded-xl">
            <HiViewGrid className="w-4 h-4 text-blue-600" /> Flashcard
          </Link>
          <Link to={`/topics/${id}/exercise`} className="btn btn-primary text-xs py-2.5 px-4 gap-2 rounded-xl">
            <HiLightningBolt className="w-4 h-4" /> Luyện tập
          </Link>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="gallery-search flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <HiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            className="input pl-10 py-2 text-xs rounded-xl"
            placeholder="Tìm từ, nghệ sĩ hoặc làng nghề"
            aria-label="Tìm từ trong chủ đề"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <HiFilter className="text-slate-400 w-4 h-4" />
          <select
            className="input py-2 text-xs rounded-xl"
            value={difficulty}
            aria-label="Lọc độ khó"
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Tất cả mức độ</option>
            <option value="easy">Căn bản (Easy)</option>
            <option value="medium">Trung cấp (Medium)</option>
            <option value="hard">Chuyên sâu (Hard)</option>
          </select>
        </div>
      </div>

      {/* Vocabulary gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVocabs.map((vocab) => {
          const isLearned = !!vocab.user_progress;
          const isExpanded = !!expandedInfoIds[vocab.id];
          const hasExtra = !!(vocab.example_sentence || vocab.cultural_note || vocab.related_artist);
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
              className={`gallery-vocab border overflow-hidden transition-colors flex flex-col justify-between ${
                isLearned
                  ? 'bg-blue-50/20 border-blue-200/80'
                  : 'bg-white border-slate-200/90 hover:border-blue-300'
              }`}
            >
              <div>
                {/* Artwork Banner */}
                <div className="gallery-vocab-image relative border-b border-slate-200 overflow-hidden">
                  <VocabImage
                    src={vocab.image_url}
                    alt={vocab.image_alt || vocab.word}
                    fit="contain"
                    enableZoom={true}
                    className="w-full h-full"
                  />
                  <span
                    className={`absolute top-3 right-3 badge font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 shadow-sm backdrop-blur-sm ${
                      vocab.difficulty === 'easy'
                        ? 'bg-emerald-50/95 text-emerald-700 border border-emerald-200'
                        : vocab.difficulty === 'medium'
                        ? 'bg-blue-50/95 text-blue-700 border border-blue-200'
                        : 'bg-rose-50/95 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {vocab.difficulty}
                  </span>
                </div>

                <div className="p-5 pb-3">
                  {/* Word & Pronunciation */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2 className="text-xl font-bold text-slate-950 tracking-tight">
                        {vocab.word}
                      </h2>
                      <button
                        onClick={() => handleSpeak(vocab.word)}
                        title="Nghe phát âm"
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer shrink-0"
                      >
                        <HiVolumeUp className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="badge bg-slate-100 text-slate-600 font-mono text-[10px] uppercase font-bold px-2 py-0.5 shrink-0 mt-1">
                      {posLabels[vocab.part_of_speech] || vocab.part_of_speech}
                    </span>
                  </div>

                  {vocab.pronunciation && (
                    <p className="text-xs text-slate-400 font-mono mb-2">{vocab.pronunciation}</p>
                  )}

                  {/* Nghĩa tiếng Việt */}
                  <p className="text-base font-bold text-slate-900 mb-3">{vocab.meaning_vi}</p>

                  {/* Collapsible details (Example + Cultural info) */}
                  {hasExtra && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(vocab.id)}
                        aria-expanded={isExpanded}
                        className="w-full text-left flex items-center justify-between text-xs font-bold text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" />
                          {isExpanded ? 'Thu gọn' : 'Chi tiết & ví dụ'}
                        </span>
                        {isExpanded ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2.5">
                          {vocab.example_sentence && (
                            <div className="p-3 rounded-2xl bg-slate-50 text-xs space-y-1 border border-slate-200/70">
                              <p className="font-semibold text-slate-800">"{vocab.example_sentence}"</p>
                              <p className="text-slate-500 italic">"{vocab.example_translation}"</p>
                            </div>
                          )}
                          {(vocab.cultural_note || vocab.related_artist) && (
                            <VocabSidebarInfo
                              culturalNote={vocab.cultural_note}
                              relatedArtist={vocab.related_artist}
                              sourceRef={vocab.source_ref}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {isLearned && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <HiCheckCircle className="w-4 h-4" /> Đã lưu
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedVocabForModal(vocab)}
                    className="py-1.5 px-3 text-xs text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                    title="Lưu vào sổ từ"
                  >
                    <HiOutlineBookmark className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sổ từ</span>
                  </button>
                  {isLearned ? (
                    <Link
                      to="/review"
                      className="py-1.5 px-3 text-xs rounded-xl border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors"
                    >
                      Ôn tập →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkLearned(vocab)}
                      className="py-1.5 px-3 text-xs rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-colors cursor-pointer shadow-sm shadow-blue-600/25"
                    >
                      + Học từ
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
          onSuccess={(selectedListIds) => {
            if (Array.isArray(selectedListIds) && selectedListIds.length > 0) {
              setVocabularies((prev) =>
                prev.map((v) =>
                  v.id === selectedVocabForModal.id
                    ? { ...v, user_progress: { status: 'learning', correct_count: 1 } }
                    : v
                )
              );
            }
          }}
        />
      )}
    </div>
  );
}
