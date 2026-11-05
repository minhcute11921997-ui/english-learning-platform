import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { topicApi, vocabApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiVolumeUp,
  HiCheckCircle,
  HiSparkles,
  HiSearch,
  HiFilter,
  HiArrowLeft,
  HiLightningBolt,
  HiViewGrid
} from 'react-icons/hi';
import { HiOutlineBookmark } from 'react-icons/hi2';
import AddToListModal from '../../components/vocab/AddToListModal';

export default function TopicDetailPage() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [vocabularies, setVocabularies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedVocabForModal, setSelectedVocabForModal] = useState(null);

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

  const handleMarkLearned = async (vocabId) => {
    try {
      await vocabApi.markAsLearned(vocabId);
      toast.success('Đã thêm từ vào sổ học và lên lịch ôn tập!');
      setVocabularies((prev) =>
        prev.map((v) =>
          v.id === vocabId
            ? { ...v, user_progress: { status: 'learning', correct_count: 1 } }
            : v
        )
      );
    } catch (err) {
      toast.error(err.message || 'Lưu tiến độ thất bại');
    }
  };

  const filteredVocabs = vocabularies.filter((v) => {
    const matchSearch =
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning_vi.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  if (isLoading && !topic) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/topics" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 mb-2">
            <HiArrowLeft /> Quay lại danh sách chủ đề
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {topic?.name_vi} ({topic?.name})
          </h1>
          <p className="text-sm text-gray-600">{topic?.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/topics/${id}/flashcards`} className="btn btn-secondary text-sm gap-2">
            <HiViewGrid className="w-4 h-4" /> Flashcards
          </Link>
          <Link to={`/topics/${id}/exercise`} className="btn btn-primary text-sm gap-2">
            <HiLightningBolt className="w-4 h-4" /> Làm bài tập
          </Link>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <HiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            className="input pl-10 py-2 text-sm"
            placeholder="Tìm kiếm từ tiếng Anh hoặc nghĩa tiếng Việt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <HiFilter className="text-gray-400 w-4 h-4" />
          <select
            className="input py-2 text-sm"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Tất cả độ khó</option>
            <option value="easy">Dễ (Easy)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="hard">Nâng cao (Hard)</option>
          </select>
        </div>
      </div>

      {/* Vocabulary list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVocabs.map((vocab) => {
          const isLearned = !!vocab.user_progress;
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
              className={`card p-5 border hover:shadow-sm transition-all flex flex-col justify-between ${
                isLearned ? 'bg-green-50/20 border-green-200' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    {vocab.image_url && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 bg-white p-0.5 shrink-0 shadow-2xs">
                        <img
                          src={vocab.image_url}
                          alt={vocab.word}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{vocab.word}</h2>
                        <button
                          onClick={() => handleSpeak(vocab.word)}
                          title="Nghe phát âm"
                          className="p-1 rounded-full hover:bg-gray-100 text-primary-600 transition-colors cursor-pointer"
                        >
                          <HiVolumeUp className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{vocab.pronunciation}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="badge bg-blue-100 text-blue-700 text-xs font-semibold">
                        {posLabels[vocab.part_of_speech] || vocab.part_of_speech}
                      </span>
                      <span
                        className={`badge text-xs font-semibold ${
                          vocab.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : vocab.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
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

                <p className="text-base font-semibold text-primary-900 mb-3">{vocab.meaning_vi}</p>

                {vocab.example_sentence && (
                  <div className="p-3 rounded-lg bg-gray-50 text-xs space-y-1 mb-4 border border-gray-100">
                    <p className="font-medium text-gray-800">"{vocab.example_sentence}"</p>
                    <p className="text-gray-500 italic">"{vocab.example_translation}"</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#ECE7DC] flex items-center justify-between text-xs text-gray-500">
                {isLearned ? (
                  <span className="inline-flex items-center gap-1 text-[#195646] font-semibold">
                    <HiCheckCircle className="w-4 h-4 text-[#195646]" /> Đang học
                  </span>
                ) : (
                  <span className="text-[#7B827E]">Chưa thêm</span>
                )}

                <div className="flex items-center gap-1.5">
                  {isLearned ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedVocabForModal(vocab)}
                        className="py-1 px-2.5 text-xs text-[#555C58] hover:text-[#195646] hover:bg-[#F0F7F4] rounded-lg border border-[#E0DACE] transition-colors cursor-pointer flex items-center gap-1"
                        title="Quản lý danh sách lưu"
                      >
                        <HiOutlineBookmark className="w-3.5 h-3.5 text-[#195646]" />
                        <span>Sổ từ</span>
                      </button>
                      <Link
                        to="/review"
                        className="py-1 px-3 text-xs rounded-lg border border-[#D7E9E1] bg-[#F0F7F4] text-[#195646] hover:bg-[#E2F0EA] font-semibold transition-colors"
                      >
                        Ôn tập ngay →
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedVocabForModal(vocab)}
                      className="py-1 px-3 text-xs rounded-lg border border-[#195646] bg-[#195646] text-white hover:bg-[#134235] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Lưu vào danh sách học và lên lịch ôn tập"
                    >
                      <HiOutlineBookmark className="w-3.5 h-3.5 text-white/90" />
                      + Thêm vào danh sách học
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVocabs.length === 0 && (
        <div className="text-center py-12 card">
          <p className="text-gray-500">Không tìm thấy từ vựng nào khớp với bộ lọc.</p>
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
