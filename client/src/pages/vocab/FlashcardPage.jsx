import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vocabApi, topicApi, vocabListApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VocabImage from '../../components/vocab/VocabImage';
import VocabSidebarInfo from '../../components/vocab/VocabSidebarInfo';
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
      toast.success(`Đã lưu "${current.word}" vào lịch ôn tập hôm nay!`);
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Đang chuẩn bị bộ thẻ học mỹ thuật..." />
      </div>
    );
  }

  const current = vocabs[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={isCustomList ? `/vocab-lists/${id}` : `/topics/${id}`}
          className="btn btn-ghost text-sm gap-2"
        >
          <HiArrowLeft /> Quay lại danh sách
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleShuffle} title="Xáo trộn thứ tự từ">
            <HiRefresh className="w-4 h-4" /> Xáo thẻ
          </Button>
          <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {currentIndex + 1} / {vocabs.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${vocabs.length > 0 ? Math.round(((currentIndex + 1) / vocabs.length) * 100) : 0}%` }}
        />
      </div>

      {/* 3D Flip Flashcard */}
      {current ? (
        <div
          className="perspective-1000 min-h-[460px] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`w-full min-h-[460px] rounded-3xl shadow-lg border-2 p-6 sm:p-8 transition-all duration-500 flex flex-col justify-between select-none ${
              isFlipped
                ? 'bg-gradient-to-br from-amber-50/70 via-stone-50 to-orange-50/40 border-amber-300'
                : 'bg-white border-stone-200 hover:border-amber-400'
            }`}
          >
            {/* Header of card */}
            <div className="flex justify-between items-center text-xs font-semibold text-stone-400 uppercase tracking-wider">
              <span>{isFlipped ? 'Mặt sau • Nghĩa & Bối cảnh nghệ thuật' : 'Mặt trước • Thuật ngữ tiếng Anh'}</span>
              <div className="flex items-center gap-2">
                {current.source_ref && (
                  <span className="text-[10px] text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 font-medium">
                    {current.source_ref}
                  </span>
                )}
                <span className="badge bg-amber-100 text-amber-900 border border-amber-200 font-semibold">{current.part_of_speech}</span>
              </div>
            </div>

            {/* Content Front vs Back */}
            {!isFlipped ? (
              <div className="text-center py-4 flex flex-col items-center justify-center flex-1">
                {/* Visual Image */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-4 rounded-2xl overflow-hidden shadow-xs border border-stone-200/90 bg-white p-2">
                  <VocabImage
                    src={current.image_url}
                    alt={current.image_alt || current.word}
                    enableZoom={false}
                    className="w-full h-full rounded-xl"
                  />
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold text-stone-900 mb-2 tracking-tight">
                  {current.word}
                </h2>
                <p className="text-base text-stone-500 font-mono mb-4">{current.pronunciation}</p>
                <button
                  onClick={(e) => handleSpeak(current.word, e)}
                  className="btn btn-secondary text-sm gap-2 mx-auto rounded-xl shadow-2xs hover:bg-stone-100"
                >
                  <HiVolumeUp className="w-5 h-5 text-amber-700" /> Nghe phát âm chuẩn
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-4 flex flex-col justify-center flex-1">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-200 bg-white p-1 shadow-2xs shrink-0">
                    <VocabImage
                      src={current.image_url}
                      alt={current.image_alt || current.word}
                      className="w-full h-full rounded-lg"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl sm:text-3xl font-extrabold text-amber-900">{current.meaning_vi}</p>
                    <p className="text-xs text-stone-500 font-mono">{current.word} • {current.pronunciation}</p>
                  </div>
                </div>

                {/* Example sentence */}
                {current.example_sentence && (
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200/80 text-left space-y-1 shadow-2xs">
                    <p className="text-sm font-semibold text-stone-800">"{current.example_sentence}"</p>
                    <p className="text-xs sm:text-sm text-stone-600 italic">"{current.example_translation}"</p>
                  </div>
                )}

                {/* Rich Cultural Side-Notes */}
                <VocabSidebarInfo
                  culturalNote={current.cultural_note}
                  relatedArtist={current.related_artist}
                  sourceRef={current.source_ref}
                  imageCredit={current.image_credit}
                />
              </div>
            )}

            {/* Footer tip */}
            <div className="flex justify-between items-center pt-4 border-t border-stone-200/70 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <HiLightBulb className="w-4 h-4 text-amber-500" /> Nhấn thẻ hoặc phím Cách để lật
              </span>
              <button
                onClick={handleMarkLearned}
                className="btn btn-success text-xs py-1.5 px-3.5 gap-1.5 rounded-xl shadow-xs"
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
          <Button variant="secondary" onClick={handlePrev} className="gap-2 rounded-xl">
            <HiArrowLeft /> Từ trước
          </Button>
          <Button onClick={handleNext} className="gap-2 rounded-xl">
            Từ tiếp theo <HiArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}
