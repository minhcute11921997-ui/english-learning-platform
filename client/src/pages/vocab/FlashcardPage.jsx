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
  HiCheck
} from 'react-icons/hi';

const readFlashcardIndex = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = parseInt(raw, 10);
    return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
};

export default function FlashcardPage() {
  const { id } = useParams();
  const location = useLocation();
  const isCustomList = location.pathname.includes('/vocab-lists/');
  const storageKey = `flashcard_idx_${isCustomList ? 'list' : 'topic'}_${id}`;

  const [prevKey, setPrevKey] = useState(storageKey);
  const [topic, setTopic] = useState(null);
  const [vocabs, setVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(() => readFlashcardIndex(storageKey));
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (storageKey !== prevKey) {
    setPrevKey(storageKey);
    setTopic(null);
    setVocabs([]);
    setCurrentIndex(readFlashcardIndex(storageKey));
    setIsFlipped(false);
    setIsLoading(true);
  }

  useEffect(() => {
    let active = true;
    const fetchFlashcards = async () => {
      try {
        if (isCustomList) {
          const res = await vocabListApi.getById(id);
          if (!active) return;
          const listData = res.data;
          const loaded = listData.vocabularies || [];
          setTopic({ name_vi: listData.name, name: 'Sổ từ cá nhân' });
          setVocabs(loaded);
          setCurrentIndex((prev) => (loaded.length > 0 ? Math.min(prev, loaded.length - 1) : 0));
        } else {
          const [tRes, vRes] = await Promise.all([
            topicApi.getById(id),
            vocabApi.getByTopic(id, { limit: 100 })
          ]);
          if (!active) return;
          const loaded = vRes.data || [];
          setTopic(tRes.data);
          setVocabs(loaded);
          setCurrentIndex((prev) => (loaded.length > 0 ? Math.min(prev, loaded.length - 1) : 0));
        }
      } catch (err) {
        if (active) toast.error(err.message || 'Không thể tải từ vựng');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchFlashcards();
    return () => {
      active = false;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id, isCustomList]);

  useEffect(() => {
    if (!isLoading && vocabs.length > 0) {
      sessionStorage.setItem(storageKey, String(currentIndex));
    }
  }, [storageKey, currentIndex, isLoading, vocabs.length]);

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
    sessionStorage.setItem(storageKey, '0');
    toast.success('Đã xáo trộn danh sách flashcard!');
  };

  const handleMarkLearned = async (e) => {
    e.stopPropagation();
    const current = vocabs[currentIndex];
    if (!current) return;
    try {
      await vocabApi.markAsLearned(current.id);
      setVocabs((prev) =>
        prev.map((v) =>
          v.id === current.id
            ? { ...v, user_progress: v.user_progress || { status: 'learning' } }
            : v
        )
      );
      toast.success(`Đã lưu "${current.word}" vào lịch ôn tập SM-2!`);
      handleNext();
    } catch (err) {
      toast.error(err.message || 'Không thể lưu tiến độ');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (vocabs.length === 0) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, vocabs.length]);

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
      <div className="flex items-center justify-between gap-3">
        <Link
          to={isCustomList ? `/vocab-lists/${id}` : `/topics/${id}`}
          className="btn btn-secondary text-xs gap-2 py-2 px-3.5 rounded-xl shrink-0"
        >
          <HiArrowLeft /> Quay lại danh mục
        </Link>
        {topic?.name_vi && (
          <h1 className="hidden sm:block text-sm font-extrabold text-slate-700 truncate">
            {topic.name_vi}
          </h1>
        )}
        <div className="flex items-center gap-2 shrink-0">
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
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span>{isFlipped ? 'Mặt sau' : 'Mặt trước'}</span>
              <span className="badge bg-blue-50 text-blue-700 font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-200/60">
                {current.part_of_speech}
              </span>
            </div>

            {/* Content Front vs Back */}
            {!isFlipped ? (
              <div className="text-center py-4 flex flex-col items-center justify-center flex-1">
                {/* Visual Image */}
                <div className="w-full max-w-sm h-56 mx-auto mb-5 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50">
                  <VocabImage
                    src={current.image_url}
                    alt={current.image_alt || current.word}
                    enableZoom={false}
                    className="w-full h-full"
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
                  <HiVolumeUp className="w-4 h-4 text-blue-600" /> Nghe phát âm
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-4 flex flex-col justify-center flex-1">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm shrink-0">
                    <VocabImage
                      src={current.image_url}
                      alt={current.image_alt || current.word}
                      fit="cover"
                      className="w-full h-full"
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

                {/* Cultural Info */}
                <VocabSidebarInfo
                  culturalNote={current.cultural_note}
                  relatedArtist={current.related_artist}
                  sourceRef={current.source_ref}
                />
              </div>
            )}

            {/* Footer action */}
            <div className="flex justify-between items-center pt-5 border-t border-slate-100 gap-3">
              <div>
                {current.user_progress && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <HiCheck className="w-3.5 h-3.5" /> Đã lưu SM-2
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleMarkLearned}
                className="btn btn-primary text-xs py-2 px-4 gap-1.5 rounded-xl shadow-sm ml-auto"
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
