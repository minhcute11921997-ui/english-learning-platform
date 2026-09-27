import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { exerciseApi, topicApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiCheckCircle,
  HiXCircle,
  HiArrowRight,
  HiArrowLeft,
  HiLightningBolt,
  HiRefresh
} from 'react-icons/hi';

export default function ExercisePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`exercise_draft_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  // Lưu nháp câu trả lời vào sessionStorage để tránh mất bài khi reload
  useEffect(() => {
    if (!results && Object.keys(answers).length > 0) {
      sessionStorage.setItem(`exercise_draft_${id}`, JSON.stringify(answers));
    }
  }, [answers, results, id]);

  // Cảnh báo người dùng khi reload hoặc rời trang lúc đang làm bài
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!results && Object.keys(answers).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, results]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tRes, eRes] = await Promise.all([
        topicApi.getById(id),
        exerciseApi.getVocabExercises(id, 10)
      ]);
      setTopic(tRes.data);
      setExercises(eRes.data || []);
      setResults(null);
      setCurrentIndex(0);
    } catch (err) {
      toast.error(err.message || 'Không thể tạo bài tập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIdx
    }));
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const formatted = exercises.map((ex, idx) => {
      const selected = answers[idx];
      const is_correct = selected === ex.correct_option;
      return {
        vocabulary_id: ex.vocabulary_id,
        is_correct,
        quality: is_correct ? 4 : 1 // SM-2 feedback score
      };
    });

    try {
      setIsSubmitting(true);
      const res = await exerciseApi.submitVocabExercises(formatted);
      sessionStorage.removeItem(`exercise_draft_${id}`);
      setResults({
        ...res.data,
        detail: exercises.map((ex, idx) => ({
          ...ex,
          selected_option: answers[idx],
          is_correct: answers[idx] === ex.correct_option
        }))
      });
      toast.success('Đã nộp bài và cập nhật tiến độ ôn tập!');
    } catch (err) {
      toast.error(err.message || 'Nộp bài thất bại');
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

  // Kết quả sau khi nộp
  if (results) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-6">
        <div className="card text-center p-8 border">
          <div className="inline-flex p-4 rounded-full bg-primary-50 text-primary-600 mb-4">
            <HiLightningBolt className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Hoàn Thành Bài Luyện Tập!</h1>
          <p className="text-gray-600 mb-6">Chủ đề: {topic?.name_vi} ({topic?.name})</p>

          <div className="p-6 rounded-2xl bg-gray-50 border inline-block mx-auto mb-6 text-center">
            <p className="text-4xl font-extrabold text-primary-600 mb-1">{results.percentage}%</p>
            <p className="text-sm font-semibold text-gray-600">
              Đúng {results.correct} / {results.total} câu
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                sessionStorage.removeItem(`exercise_draft_${id}`);
                setAnswers({});
                loadData();
              }}
              className="gap-2"
            >
              <HiRefresh /> Làm lại bài mới
            </Button>
            <Button onClick={() => navigate(`/topics/${id}`)}>
              Về danh sách từ vựng
            </Button>
          </div>
        </div>

        <h2 className="text-lg font-bold">Chi tiết từng câu hỏi</h2>
        <div className="space-y-4">
          {results.detail?.map((item, idx) => (
            <div key={idx} className="card p-5 border">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-900">
                  Câu {idx + 1}: {item.question}
                </p>
                {item.is_correct ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <HiCheckCircle className="w-5 h-5" /> Đúng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-semibold text-red-500">
                    <HiXCircle className="w-5 h-5" /> Sai
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                {item.options.map((opt, oIdx) => {
                  let cls = 'border-gray-200 bg-gray-50';
                  if (oIdx === item.correct_option) {
                    cls = 'border-green-500 bg-green-50 text-green-800 font-medium';
                  } else if (oIdx === item.selected_option && !item.is_correct) {
                    cls = 'border-red-400 bg-red-50 text-red-700';
                  }
                  return (
                    <div key={oIdx} className={`p-2.5 rounded-lg border ${cls}`}>
                      <span className="font-semibold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentQ = exercises[currentIndex];
  const progressPercent = exercises.length > 0 ? Math.round(((currentIndex + 1) / exercises.length) * 100) : 0;

  if (exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center card space-y-4">
        <p className="text-gray-600">Chưa có bài tập nào cho chủ đề này.</p>
        <Link to={`/topics/${id}`} className="btn btn-primary inline-flex items-center gap-1.5">
          <HiArrowLeft /> Quay lại chủ đề
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/topics/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600"
        >
          <HiArrowLeft /> Thoát bài tập
        </Link>
        <span className="text-sm font-semibold text-gray-600">
          Câu {currentIndex + 1} / {exercises.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <span className="badge bg-primary-100 text-primary-700 text-xs font-semibold uppercase mb-2">
              {currentQ.type === 'en_to_vi'
                ? 'Tiếng Anh sang Tiếng Việt'
                : currentQ.type === 'vi_to_en'
                ? 'Tiếng Việt sang Tiếng Anh'
                : 'Điền từ vào chỗ trống'}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mt-2 whitespace-pre-line">
              {currentQ.question}
            </h2>
            {currentQ.translation && (
              <p className="text-sm text-gray-500 italic mt-1">"{currentQ.translation}"</p>
            )}
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option, oIdx) => {
              const isSelected = answers[currentIndex] === oIdx;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(oIdx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-900 font-semibold'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{option}</span>
                  </div>
                  {isSelected && <HiCheckCircle className="w-6 h-6 text-primary-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0}>
          Câu trước
        </Button>

        {currentIndex < exercises.length - 1 ? (
          <Button onClick={handleNext}>
            Câu tiếp theo
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Nộp bài ({Object.keys(answers).length}/{exercises.length} câu)
          </Button>
        )}
      </div>
    </div>
  );
}
