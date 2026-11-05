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
import { HiOutlineSparkles } from 'react-icons/hi2';

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
      toast.success(`Đã lưu "${current.word}" vào lịch ôn tập SM-2!`);
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
        <LoadingSpinner size="lg" text="Đang chuẩn bị bộ thẻ học triển lãm..." />
      </div>
    );
  }

  const current = vocabs[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-14">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={isCustomList ? `/vocab-lists/${id}` : `/topics/${id}`}
          className="btn btn-secondary text-xs gap-2 py-2 px-3.5 rounded-xl"
        >
          <HiArrowLeft /> Quay lại danh mục
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            title="Xáo trộn thứ tự từ"
            className="btn btn-secondary text-xs gap-1.5 py-1.5 px-3 rounded-xl cursor-pointer"
          >
            <HiRefresh className="w-4 h-4" /> Xáo thẻ
          </button>
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {currentIndex + 1} / {vocabs.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${vocabs.length > 0 ? Math.round(((currentIndex + 1) / vocabs.length) * 100) : 0}%` }}
        />
      </div>

      {/* 3D Flip Flashcard */}
      {current ? (
        <div
          className="perspective-1000 min-h-[480px] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`w-full min-h-[480px] rounded-3xl shadow-xl border p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between select-none ${
              isFlipped
                ? 'bg-slate-50 border-blue-300 shadow-blue-500/10'
                : 'bg-white border-slate-200/90 hover:border-blue-400 shadow-slate-900/5'
            }`}
          >
            {/* Header of card */}
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              <span>{isFlipped ? 'MẶT SAU • GIẢI NGHĨA & DI SẢN' : 'MẶT TRƯỚC • TÁC PHẨM & THUẬT NGỮ'}</span>
              <div className="flex items-center gap-2">
                {current.source_ref && (
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md font-semibold">
                    {current.source_ref}
                  </span>
                )}
                <span className="badge bg-blue-50 text-blue-700 font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-200/60">
                  {current.part_of_speech}
                </span>
              </div>
            </div>

            {/* Content Front vs Back */}
            {!isFlipped ? (
              <div className="text-center py-6 flex flex-col items-center justify-center flex-1">
                {/* Visual Image - Contemporary Framing */}
                <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-5 rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 p-2">
                  <VocabImage
                    src={current.image_url}
                    alt={current.image_alt || current.word}
                    enableZoom={false}
                    className="w-full h-full rounded-2xl"
                  />
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 mb-2 tracking-tight">
                  {current.word}
                </h2>
                <p className="text-sm font-mono text-slate-500 mb-5">{current.pronunciation}</p>
                <button
                  onClick={(e) => handleSpeak(current.word, e)}
                  className="btn btn-secondary text-xs gap-2 mx-auto rounded-xl shadow-xs hover:bg-slate-200"
                >
                  <HiVolumeUp className="w-4 h-4 text-blue-600" /> Nghe phát âm chuẩn
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-4 flex flex-col justify-center flex-1">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-1.5 shadow-md shrink-0">
                    <VocabImage
                      src={current.image_url}
                      alt={current.image_alt || current.word}
                      className="w-full h-full rounded-xl"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{current.meaning_vi}</p>
                    <p className="text-xs font-mono text-slate-500 mt-1">{current.word} • {current.pronunciation}</p>
                  </div>
                </div>

                {/* Example sentence */}
                {current.example_sentence && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left space-y-1 shadow-2xs">
                    <p className="text-sm font-bold text-slate-800">"{current.example_sentence}"</p>
                    <p className="text-xs text-slate-500 italic">"{current.example_translation}"</p>
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
            <div className="flex justify-between items-center pt-5 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <HiLightBulb className="w-4 h-4 text-amber-500" /> [Phím Cách] để lật thẻ
              </span>
              <button
                onClick={handleMarkLearned}
                className="btn btn-primary text-xs py-2 px-4 gap-1.5 rounded-xl shadow-sm"
              >
                <HiCheck className="w-4 h-4" /> Đã nhớ từ này
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 rounded-3xl">
          <p className="text-slate-500">Chưa có từ vựng nào trong chủ đề này.</p>
        </div>
      )}

      {/* Navigation buttons */}
      {vocabs.length > 0 && (
        <div className="flex justify-between items-center pt-2">
          <Button variant="secondary" onClick={handlePrev} className="gap-2 rounded-xl text-xs py-2.5 px-4">
            <HiArrowLeft /> Từ trước
          </Button>
          <Button onClick={handleNext} className="gap-2 rounded-xl text-xs py-2.5 px-4 btn-primary">
            Từ tiếp theo <HiArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}
