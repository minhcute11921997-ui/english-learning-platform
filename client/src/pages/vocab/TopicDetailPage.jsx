import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { topicApi, vocabApi } from '../../api/services';
import Button from '../../components/ui/Button';
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
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" text="Đang tải danh mục thuật ngữ mỹ thuật..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/topics" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-amber-800 mb-2 transition-colors">
            <HiArrowLeft /> Quay lại danh sách chủ đề
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-serif">
            {topic?.name_vi} <span className="text-stone-400 font-sans font-normal text-xl">({topic?.name})</span>
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">{topic?.description}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to={`/topics/${id}/flashcards`} className="btn btn-secondary text-sm gap-2 rounded-xl shadow-2xs">
            <HiViewGrid className="w-4 h-4 text-amber-700" /> Học Flashcards
          </Link>
          <Link to={`/topics/${id}/exercise`} className="btn btn-primary text-sm gap-2 rounded-xl shadow-xs">
            <HiLightningBolt className="w-4 h-4" /> Làm bài tập
          </Link>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 justify-between items-center bg-stone-50/60 border-stone-200/80">
        <div className="relative w-full sm:w-80">
          <HiSearch className="absolute left-3.5 top-3 text-stone-400 w-4 h-4" />
          <input
            type="text"
            className="input pl-10 py-2 text-sm rounded-xl"
            placeholder="Tìm theo thuật ngữ, nghệ sĩ hoặc bối cảnh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <HiFilter className="text-stone-400 w-4 h-4" />
          <select
            className="input py-2 text-sm rounded-xl"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Tất cả độ khó</option>
            <option value="easy">Căn bản (Easy)</option>
            <option value="medium">Trung cấp (Medium)</option>
            <option value="hard">Chuyên sâu (Hard)</option>
          </select>
        </div>
      </div>

      {/* Vocabulary list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-2xs ${
                isLearned ? 'bg-amber-50/15 border-amber-200/80' : 'bg-white border-stone-200 hover:border-amber-300'
              }`}
            >
              <div>
                {/* Header item */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-1 shrink-0 shadow-2xs">
                      <VocabImage
                        src={vocab.image_url}
                        alt={vocab.image_alt || vocab.word}
                        enableZoom={true}
                        className="w-full h-full rounded-xl"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-stone-900">{vocab.word}</h2>
                        <button
                          onClick={() => handleSpeak(vocab.word)}
                          title="Nghe phát âm chuẩn"
                          className="p-1 rounded-full hover:bg-stone-100 text-amber-700 transition-colors cursor-pointer"
                        >
                          <HiVolumeUp className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-stone-500 font-mono mt-0.5">{vocab.pronunciation}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="badge bg-amber-100/80 text-amber-900 border border-amber-200/60 text-xs font-semibold">
                        {posLabels[vocab.part_of_speech] || vocab.part_of_speech}
                      </span>
                      <span
                        className={`badge text-xs font-semibold ${
                          vocab.difficulty === 'easy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : vocab.difficulty === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {vocab.difficulty}
                      </span>
                    </div>
                    {vocab.source_ref && (
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 font-medium">
                        {vocab.source_ref}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nghĩa tiếng Việt */}
                <p className="text-base font-bold text-stone-900 mb-3">{vocab.meaning_vi}</p>

                {/* Ví dụ ngữ cảnh */}
                {vocab.example_sentence && (
                  <div className="p-3 rounded-xl bg-stone-50/80 text-xs space-y-1 mb-3 border border-stone-200/60">
                    <p className="font-semibold text-stone-800">"{vocab.example_sentence}"</p>
                    <p className="text-stone-500 italic">"{vocab.example_translation}"</p>
                  </div>
                )}

                {/* Collapsible toggle for Cultural Side-Notes */}
                {(vocab.cultural_note || vocab.related_artist) && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(vocab.id)}
                      className="w-full text-left flex items-center justify-between text-xs font-medium text-amber-900/90 hover:text-amber-800 py-1 px-2.5 rounded-lg bg-amber-50/50 hover:bg-amber-50 border border-amber-200/50 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-600" />
                        {isExpanded ? 'Ẩn thông tin bên lề & nghệ sĩ' : 'Xem thông tin bên lề & bối cảnh lịch sử'}
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

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500">
                {isLearned ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Đang trong lộ trình ôn
                  </span>
                ) : (
                  <span className="text-stone-400">Chưa thêm vào sổ</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedVocabForModal(vocab)}
                    className="py-1 px-2.5 text-xs text-stone-700 hover:text-amber-900 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    title="Quản lý sổ từ cá nhân"
                  >
                    <HiOutlineBookmark className="w-3.5 h-3.5 text-amber-700" />
                    <span>Sổ từ</span>
                  </button>
                  {isLearned ? (
                    <Link
                      to="/review"
                      className="py-1 px-3 text-xs rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold transition-colors"
                    >
                      Ôn tập ngay →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedVocabForModal(vocab)}
                      className="py-1 px-3 text-xs rounded-lg border border-stone-800 bg-stone-800 text-white hover:bg-stone-900 font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
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
        <div className="text-center py-12 card border-stone-200">
          <p className="text-stone-500">Không tìm thấy thuật ngữ nào khớp với từ khóa tìm kiếm.</p>
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
