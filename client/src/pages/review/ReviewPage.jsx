import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { reviewApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiVolumeUp,
  HiClock,
  HiCheckCircle,
  HiCalendar
} from 'react-icons/hi';

export default function ReviewPage() {
  const [stats, setStats] = useState(null);
  const [dueWords, setDueWords] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
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
      const [sRes, dRes, uRes] = await Promise.all([
        reviewApi.getStats(),
        reviewApi.getDue(50),
        reviewApi.getUpcoming(7)
      ]);
      setStats(sRes.data);
      setDueWords(dRes.data || []);
      setUpcoming(uRes.data || []);
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

  const handleAnswer = async (quality) => {
    const current = dueWords[currentIndex];
    if (!current?.vocabulary) return;

    try {
      setIsSubmitting(true);
      await reviewApi.answerReview(current.vocabulary.id, { quality });

      const qualityLabels = {
        1: 'Chưa nhớ - Sẽ ôn lại sớm!',
        3: 'Khó nhớ - Đã cập nhật lịch ôn!',
        4: 'Nhớ tốt - Tiến độ tăng!',
        5: 'Rất dễ - Xuất sắc!'
      };
      toast.success(qualityLabels[quality] || 'Đã ghi nhận kết quả ôn tập!');

      setShowAnswer(false);
      if (currentIndex < dueWords.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Hoàn thành hết hàng đợi
        await loadReviewData();
      }
    } catch (err) {
      toast.error(err.message || 'Ghi nhận thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentItem = dueWords[currentIndex];
  const vocab = currentItem?.vocabulary;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ôn Tập Ngắt Quãng (SRS - SM-2)</h1>
        <p className="text-gray-600">
          Thuật toán SuperMemo 2 tự động tối ưu hóa lịch ôn tập từ vựng dựa trên trí nhớ của bạn
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center p-4 bg-orange-50/50 border-orange-200">
          <p className="text-xs text-orange-700 font-bold uppercase tracking-wider">Cần ôn hôm nay</p>
          <p className="text-3xl font-extrabold text-orange-600 mt-1">{stats?.dueCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-blue-50/50 border-blue-200">
          <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Đang học</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">{stats?.learningCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-green-50/50 border-green-200">
          <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Đã thuần thục</p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">{stats?.masteredCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-purple-50/50 border-purple-200">
          <p className="text-xs text-purple-700 font-bold uppercase tracking-wider">Độ chính xác</p>
          <p className="text-3xl font-extrabold text-purple-600 mt-1">{stats?.accuracyRate || 0}%</p>
        </div>
      </div>

      {/* Review Queue Interactive Card */}
      {dueWords.length > 0 && vocab ? (
        <div className="card p-8 border-2 border-primary-200 bg-white max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 pb-3 border-b">
            <span className="flex items-center gap-1.5 text-primary-600">
              <HiClock className="w-4 h-4" /> Đang ôn: {currentIndex + 1} / {dueWords.length}
            </span>
            <span className="badge bg-primary-50 text-primary-700">
              {vocab.topic?.name_vi || 'Từ vựng'}
            </span>
          </div>

          <div className="text-center py-6">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
              {vocab.word}
            </h2>
            <p className="text-sm text-gray-500 font-mono mb-4">{vocab.pronunciation}</p>
            <button
              onClick={() => handleSpeak(vocab.word)}
              className="btn btn-secondary text-xs gap-1.5"
            >
              <HiVolumeUp className="w-4 h-4 text-primary-600" /> Nghe phát âm
            </button>
          </div>

          {/* Answer section */}
          {showAnswer ? (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700 mb-1">{vocab.meaning_vi}</p>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  ({vocab.part_of_speech})
                </span>
                {vocab.example_sentence && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 border text-left text-sm space-y-1">
                    <p className="font-semibold text-gray-800">"{vocab.example_sentence}"</p>
                    <p className="text-gray-500 italic">"{vocab.example_translation}"</p>
                  </div>
                )}
              </div>

              {/* 4 SM-2 Assessment Buttons */}
              <div>
                <p className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wider mb-3">
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
                    className="p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-800 text-center transition-all cursor-pointer"
                  >
                    <p className="text-sm font-bold">Rất dễ</p>
                    <p className="text-[11px] text-green-600 mt-0.5">&gt; 7 ngày</p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center pt-4">
              <Button onClick={() => setShowAnswer(true)} size="lg" className="w-full sm:w-auto px-8">
                Hiện đáp án & Nghĩa
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center p-12 max-w-xl mx-auto space-y-4">
          <div className="inline-flex p-4 rounded-full bg-green-50 text-green-600">
            <HiCheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold">Tuyệt Vời! Không Còn Từ Nào Cần Ôn</h2>
          <p className="text-gray-600">
            Bạn đã hoàn thành tất cả các mục ôn tập đến hạn hôm nay. Hãy học thêm từ vựng mới hoặc luyện đọc hiểu!
          </p>
        </div>
      )}

      {/* Upcoming Schedule Calendar view */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <HiCalendar className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-bold">Lịch ôn tập sắp tới (7 ngày tới)</h2>
        </div>

        {upcoming.length > 0 ? (
          <div className="divide-y text-sm">
            {upcoming.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 mr-2">{item.vocabulary?.word}</span>
                  <span className="text-gray-500">({item.vocabulary?.meaning_vi})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="badge bg-gray-100">
                    {new Date(item.scheduled_at).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      month: 'numeric',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Chưa có lịch ôn tập nào được lên lịch cho tuần tới.</p>
        )}
      </div>
    </div>
  );
}
