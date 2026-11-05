import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vocabApi, topicApi, vocabListApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiVolumeUp,
  HiArrowLeft,
  HiArrowRight,
  HiRefresh,
  HiCheck,
  HiLightBulb
} from 'react-icons/hi';

export default function FlashcardPage() {
  const { id } = useParams();
  const location = useLocation();
  const isCustomList = location.pathname.includes('/vocab-lists/');
  const [topic, setTopic] = useState(null);
  const [vocabs, setVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id, isCustomList]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (isCustomList) {
        const res = await vocabListApi.getById(id);
        const listData = res.data;
        setTopic({ name_vi: listData.name, name: 'Sổ từ cá nhân' });
        setVocabs(listData.vocabularies || []);
      } else {
        const [tRes, vRes] = await Promise.all([
          topicApi.getById(id),
          vocabApi.getByTopic(id, { limit: 100 })
        ]);
        setTopic(tRes.data);
        setVocabs(vRes.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải từ vựng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (word, e) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < vocabs.length - 1 ? prev + 1 : 0));
  }, [vocabs.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : vocabs.length - 1));
  }, [vocabs.length]);

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...vocabs].sort(() => Math.random() - 0.5);
    setVocabs(shuffled);
    setCurrentIndex(0);
    toast.success('Đã xáo trộn danh sách flashcard!');
  };

  const handleMarkLearned = async (e) => {
    e.stopPropagation();
    const current = vocabs[currentIndex];
    if (!current) return;
    try {
      await vocabApi.markAsLearned(current.id);
      toast.success(`Đã lưu "${current.word}" vào lịch ôn tập!`);
      handleNext();
    } catch (err) {
      toast.error(err.message || 'Không thể lưu tiến độ');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const current = vocabs[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          to={isCustomList ? `/vocab-lists/${id}` : `/topics/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600"
        >
          <HiArrowLeft /> Quay lại {isCustomList ? 'danh sách từ' : 'chủ đề'}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">
            {currentIndex + 1} / {vocabs.length}
          </span>
          <button
            onClick={handleShuffle}
            title="Xáo trộn thẻ"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
          >
            <HiRefresh className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${vocabs.length > 0 ? Math.round(((currentIndex + 1) / vocabs.length) * 100) : 0}%` }}
        />
      </div>

      {/* 3D Flip Flashcard */}
      {current ? (
        <div
          className="perspective-1000 min-h-[380px] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`w-full min-h-[380px] rounded-2xl shadow-md border-2 p-8 transition-transform duration-500 transform-style-3d flex flex-col justify-between select-none ${
              isFlipped
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-primary-300'
                : 'bg-white border-gray-200 hover:border-primary-400'
            }`}
          >
            {/* Header of card */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>{isFlipped ? 'Mặt sau (Nghĩa tiếng Việt)' : 'Mặt trước (Tiếng Anh)'}</span>
              <div className="flex items-center gap-2">
                {current.source_ref && (
                  <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                    Ref: {current.source_ref}
                  </span>
                )}
                <span className="badge bg-primary-100 text-primary-700">{current.part_of_speech}</span>
              </div>
            </div>

            {/* Content Front vs Back */}
            {!isFlipped ? (
              <div className="text-center py-4">
                {current.image_url && (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-3 rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 bg-white p-1">
                    <img
                      src={current.image_url}
                      alt={current.word}
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  {current.word}
                </h2>
                <p className="text-base text-gray-500 font-mono mb-4">{current.pronunciation}</p>
                <button
                  onClick={(e) => handleSpeak(current.word, e)}
                  className="btn btn-secondary text-sm gap-2 mx-auto"
                >
                  <HiVolumeUp className="w-5 h-5 text-primary-600" /> Nghe phát âm
                </button>
              </div>
            ) : (
              <div className="text-center py-3 space-y-3">
                {current.image_url && (
                  <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden border border-stone-200/80 bg-white p-1 shadow-xs">
                    <img
                      src={current.image_url}
                      alt={current.word}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <p className="text-2xl sm:text-3xl font-bold text-primary-700">{current.meaning_vi}</p>
                {current.example_sentence && (
                  <div className="p-3.5 rounded-xl bg-white/90 border border-primary-100 text-left space-y-1.5 shadow-2xs">
                    <p className="text-sm font-semibold text-gray-800">"{current.example_sentence}"</p>
                    <p className="text-sm text-gray-600 italic">"{current.example_translation}"</p>
                  </div>
                )}
                {current.source_ref && (
                  <p className="text-xs text-stone-500 italic">Nguồn tham chiếu chuẩn: {current.source_ref}</p>
                )}
              </div>
            )}

            {/* Footer tip */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200/60 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <HiLightBulb className="w-4 h-4 text-yellow-500" /> Nhấn chuột hoặc phím Cách để lật thẻ
              </span>
              <button
                onClick={handleMarkLearned}
                className="btn btn-success text-xs py-1.5 px-3 gap-1"
              >
                <HiCheck className="w-4 h-4" /> Đã nhớ từ này
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">Chưa có từ vựng nào trong chủ đề này.</p>
        </div>
      )}

      {/* Navigation buttons */}
      {vocabs.length > 0 && (
        <div className="flex justify-between items-center pt-2">
          <Button variant="secondary" onClick={handlePrev} className="gap-2">
            <HiArrowLeft /> Từ trước
          </Button>
          <Button onClick={handleNext} className="gap-2">
            Từ tiếp theo <HiArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}
