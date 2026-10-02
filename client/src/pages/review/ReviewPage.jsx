import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { reviewApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiVolumeUp,
  HiClock,
  HiCheckCircle,
  HiCalendar,
  HiBookOpen,
  HiSparkles,
  HiArrowRight,
  HiLightningBolt
} from 'react-icons/hi';

export default function ReviewPage() {
  const [stats, setStats] = useState(null);
  const [dueWords, setDueWords] = useState([]);
  const [learningWords, setLearningWords] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [reviewMode, setReviewMode] = useState('due'); // 'due' | 'learning'
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'learning_list' | 'upcoming'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setIsLoading(true);
      const [sRes, dRes, lRes, uRes] = await Promise.all([
        reviewApi.getStats(),
        reviewApi.getDue(50),
        reviewApi.getLearning(100),
        reviewApi.getUpcoming(7)
      ]);
      setStats(sRes.data);
      const due = dRes.data || [];
      const learning = lRes.data || [];
      setDueWords(due);
      setLearningWords(learning);
      setUpcoming(uRes.data || []);

      // Nếu không có từ đến hạn mà có từ đang học -> tự động đề xuất hoặc giữ mode
      if (due.length === 0 && learning.length > 0) {
        setReviewMode('learning');
      } else {
        setReviewMode('due');
      }
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (err) {
      toast.error(err.message || 'Không thể tải lịch ôn tập');
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

  const currentQueue = reviewMode === 'due' ? dueWords : learningWords;
  const currentItem = currentQueue[currentIndex];
  const vocab = currentItem?.vocabulary;

  const handleAnswer = async (quality) => {
    if (!vocab) return;

    try {
      setIsSubmitting(true);
      await reviewApi.answerReview(vocab.id, { quality });

      const qualityLabels = {
        1: 'Chưa nhớ - Sẽ ôn lại sớm!',
        3: 'Khó nhớ - Đã cập nhật lịch ôn!',
        4: 'Nhớ tốt - Tiến độ tăng!',
        5: 'Rất dễ - Xuất sắc!'
      };
      toast.success(qualityLabels[quality] || 'Đã ghi nhận kết quả ôn tập!');

      setShowAnswer(false);
      if (currentIndex < currentQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        toast.success('Bạn đã hoàn thành phiên ôn tập này!');
        await loadReviewData();
      }
    } catch (err) {
      toast.error(err.message || 'Ghi nhận thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToMode = (mode) => {
    setReviewMode(mode);
    setActiveTab('queue');
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-stone-500 font-medium">Đang tải lịch ôn tập...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Ôn Tập Hôm Nay
          </h1>
        </div>

        {/* Chế độ ôn tập switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => switchToMode('due')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewMode === 'due' && activeTab === 'queue'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Cần ôn hôm nay</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
              dueWords.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-stone-200 text-stone-600'
            }`}>
              {dueWords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchToMode('learning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewMode === 'learning' && activeTab === 'queue'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Ôn từ đang học</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
              {learningWords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Có thể click để chọn ôn */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => switchToMode('due')}
          className={`card text-center p-4 cursor-pointer transition-all border ${
            reviewMode === 'due' && activeTab === 'queue'
              ? 'ring-2 ring-orange-500 bg-orange-50/70 border-orange-300 shadow-sm'
              : 'bg-white hover:bg-orange-50/30 border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Cần ôn hôm nay</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-orange-600 mt-1">
            {stats?.dueCount || 0}
          </p>
        </div>

        <div
          onClick={() => switchToMode('learning')}
          className={`card text-center p-4 cursor-pointer transition-all border ${
            reviewMode === 'learning' && activeTab === 'queue'
              ? 'ring-2 ring-emerald-600 bg-emerald-50/70 border-emerald-300 shadow-sm'
              : 'bg-white hover:bg-emerald-50/30 border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Đang học</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-800 mt-1">
            {stats?.learningCount || 0}
          </p>
        </div>

        <div className="card text-center p-4 bg-white border border-stone-200">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Đã thuần thục</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-800 mt-1">
            {stats?.masteredCount || 0}
          </p>
        </div>

        <div className="card text-center p-4 bg-white border border-stone-200">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Độ chính xác</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-800 mt-1">
            {stats?.accuracyRate || 0}%
          </p>
        </div>
      </div>

      {/* Tabs Phụ: Thẻ ôn tập | Danh sách từ đang học | Lịch sắp tới */}
      <div className="flex border-b border-stone-200 text-xs sm:text-sm font-semibold gap-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'border-emerald-800 text-emerald-800 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiSparkles className="w-4 h-4" />
          <span>
            {reviewMode === 'due' ? 'Ôn tập theo hạn' : 'Ôn tất cả từ đang học'} ({currentQueue.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('learning_list')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'learning_list'
              ? 'border-emerald-800 text-emerald-800 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiBookOpen className="w-4 h-4" />
          <span>Danh sách từ đang học ({learningWords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'upcoming'
              ? 'border-emerald-800 text-emerald-800 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiCalendar className="w-4 h-4" />
          <span>Lịch 7 ngày tới ({upcoming.length})</span>
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE INTERACTIVE CARD */}
      {activeTab === 'queue' && (
        <>
          {currentQueue.length > 0 && vocab ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm max-w-2xl mx-auto space-y-6">
              {/* Badge & Mode Header */}
              <div className="flex justify-between items-center text-xs font-semibold text-stone-500 pb-3 border-b border-stone-100">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <HiClock className="w-4 h-4" />
                  {reviewMode === 'due' ? 'Đang ôn theo hạn:' : 'Ôn từ đang học:'} {currentIndex + 1} / {currentQueue.length}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-medium">
                  {vocab.topic?.name_vi || 'Từ vựng'}
                </span>
              </div>

              {/* Front side of card */}
              <div className="text-center py-6">
                <h2 className="text-4xl sm:text-5xl font-extrabold font-serif text-stone-900 tracking-tight mb-2">
                  {vocab.word}
                </h2>
                <p className="text-sm text-stone-500 font-mono mb-4">{vocab.pronunciation}</p>
                <button
                  type="button"
                  onClick={() => handleSpeak(vocab.word)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                >
                  <HiVolumeUp className="w-4 h-4 text-emerald-800" /> Nghe phát âm
                </button>
              </div>

              {/* Back side / Answer section */}
              {showAnswer ? (
                <div className="space-y-6 pt-4 border-t border-stone-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-serif text-emerald-800 mb-1">
                      {vocab.meaning_vi}
                    </p>
                    <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                      ({vocab.part_of_speech})
                    </span>
                    {vocab.example_sentence && (
                      <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-sm space-y-1">
                        <p className="font-semibold text-stone-800">"{vocab.example_sentence}"</p>
                        <p className="text-stone-500 italic">"{vocab.example_translation}"</p>
                      </div>
                    )}
                  </div>

                  {/* 4 Assessment Buttons */}
                  <div>
                    <p className="text-xs font-semibold text-stone-500 text-center uppercase tracking-wider mb-3">
                      Đánh giá mức độ nhớ của bạn:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(1)}
                        className="p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-center transition-all cursor-pointer"
                      >
                        <p className="text-sm font-bold">Chưa nhớ</p>
                        <p className="text-[11px] text-red-500 mt-0.5">&lt; 1 ngày</p>
                      </button>

                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(3)}
                        className="p-3 rounded-xl border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-center transition-all cursor-pointer"
                      >
                        <p className="text-sm font-bold">Khó nhớ</p>
                        <p className="text-[11px] text-yellow-600 mt-0.5">~ 2 ngày</p>
                      </button>

                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(4)}
                        className="p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-center transition-all cursor-pointer"
                      >
                        <p className="text-sm font-bold">Nhớ tốt</p>
                        <p className="text-[11px] text-blue-600 mt-0.5">~ 4-6 ngày</p>
                      </button>

                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(5)}
                        className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-center transition-all cursor-pointer"
                      >
                        <p className="text-sm font-bold">Rất dễ</p>
                        <p className="text-[11px] text-emerald-600 mt-0.5">&gt; 7 ngày</p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-2">
                  <Button
                    onClick={() => setShowAnswer(true)}
                    size="lg"
                    className="w-full sm:w-auto px-8 bg-emerald-800 hover:bg-emerald-900 text-white"
                  >
                    Hiện đáp án & Nghĩa
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Khi không có từ trong hàng đợi hiện tại */
            <div className="bg-white rounded-2xl border border-stone-200 text-center p-10 max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-700">
                <HiCheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-900">
                {reviewMode === 'due'
                  ? 'Hôm nay chưa có từ nào đến hạn ôn'
                  : 'Bạn chưa có từ nào trong danh sách đang học'}
              </h2>

              {reviewMode === 'due' && learningWords.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Hệ thống sẽ tự động nhắc bạn khi não bộ chuẩn bị quên. Tuy nhiên, bạn đang có{' '}
                    <strong className="text-emerald-800 font-bold">{learningWords.length} từ đang học</strong>{' '}
                    và có thể chủ động ôn tập ngay bây giờ!
                  </p>
                  <Button
                    onClick={() => switchToMode('learning')}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white gap-2"
                  >
                    <HiLightningBolt className="w-4 h-4" /> Ôn tập ngay các từ đang học ({learningWords.length})
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-stone-500 leading-relaxed">
                  Hãy vào mục <strong>Từ vựng</strong> để thêm các từ mới vào sổ học của bạn!
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: DANH SÁCH TOÀN BỘ TỪ ĐANG HỌC */}
      {activeTab === 'learning_list' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
            <div>
              <h2 className="font-serif text-base font-bold text-stone-900">
                Toàn bộ từ vựng đang học ({learningWords.length})
              </h2>
            </div>

            {learningWords.length > 0 && (
              <Button
                size="sm"
                onClick={() => switchToMode('learning')}
                className="bg-emerald-800 hover:bg-emerald-900 text-white gap-1.5 text-xs"
              >
                <HiLightningBolt className="w-3.5 h-3.5" /> Bắt đầu ôn tập ({learningWords.length} từ)
              </Button>
            )}
          </div>

          {learningWords.length > 0 ? (
            <div className="divide-y divide-stone-100 text-sm">
              {learningWords.map((item, idx) => {
                const v = item.vocabulary;
                if (!v) return null;
                const nextDate = item.next_review_at ? new Date(item.next_review_at) : null;
                return (
                  <div key={item.id || idx} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSpeak(v.word)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-800 hover:bg-stone-50 transition-colors"
                        title="Nghe phát âm"
                      >
                        <HiVolumeUp className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-base">{v.word}</span>
                          <span className="text-xs text-stone-400 font-mono">{v.pronunciation}</span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">{v.meaning_vi}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                        Lịch ôn: {nextDate ? nextDate.toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'numeric'
                        }) : 'Chưa xếp'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-stone-400 italic">
              Bạn chưa có từ nào trong danh sách đang học.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UPCOMING REVIEWS (LỊCH 7 NGÀY TỚI) */}
      {activeTab === 'upcoming' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <HiCalendar className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold font-serif text-stone-900">
              Lịch ôn tập sắp tới (7 ngày tới)
            </h2>
          </div>

          {upcoming.length > 0 ? (
            <div className="divide-y divide-stone-100 text-sm">
              {upcoming.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-stone-900">{item.vocabulary?.word}</span>
                    <span className="text-stone-500 text-xs">({item.vocabulary?.meaning_vi})</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                    {new Date(item.scheduled_at).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      month: 'numeric',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic text-center py-6">
              Chưa có lịch ôn tập nào được lên lịch cho tuần tới.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
