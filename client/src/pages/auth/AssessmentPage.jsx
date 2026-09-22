import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { assessmentApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { HiCheckCircle, HiXCircle, HiAcademicCap, HiArrowRight } from 'react-icons/hi';

export default function AssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const res = await assessmentApi.getQuestions();
      setQuestions(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải đề đánh giá');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optIndex) => {
    setAnswers({
      ...answers,
      [currentIndex]: optIndex
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const formatted = Object.entries(answers).map(([qId, optIdx]) => ({
      question_id: parseInt(qId),
      selected_option: optIdx
    }));

    if (formatted.length < questions.length) {
      if (!window.confirm(`Bạn mới trả lời ${formatted.length}/${questions.length} câu. Bạn có chắc chắn muốn nộp bài?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await assessmentApi.submitAssessment(formatted);
      setResult(res.data);
      toast.success('Đã hoàn thành bài kiểm tra đầu vào!');
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

  if (result) {
    const levelLabels = {
      beginner: { title: 'Người Mới Bắt Đầu (Beginner - A1)', color: 'text-blue-600', bg: 'bg-blue-50' },
      elementary: { title: 'Sơ Cấp (Elementary - A2)', color: 'text-green-600', bg: 'bg-green-50' },
      pre_intermediate: { title: 'Tiền Trung Cấp (Pre-Intermediate - B1)', color: 'text-purple-600', bg: 'bg-purple-50' }
    };
    const currentLevel = levelLabels[result.result_level] || levelLabels.beginner;

    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="card text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-primary-50 text-primary-600 mb-4">
            <HiAcademicCap className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Kết Quả Đánh Giá Năng Lực Đầu Vào</h1>
          <p className="text-gray-600 mb-6">Hệ thống đã xác định lộ trình học tập phù hợp nhất với bạn!</p>

          <div className={`p-6 rounded-xl ${currentLevel.bg} inline-block mx-auto mb-6 border`}>
            <p className="text-sm font-medium text-gray-600 mb-1">Trình độ được xếp lớp:</p>
            <p className={`text-2xl font-bold ${currentLevel.color}`}>{currentLevel.title}</p>
            <div className="mt-3 flex justify-center items-center gap-4 text-sm text-gray-700">
              <span>Điểm số: <strong>{result.score}/{result.total_questions}</strong> câu đúng</span>
              <span>•</span>
              <span>Tỷ lệ: <strong>{result.percentage}%</strong></span>
            </div>
          </div>

          <div>
            <Button onClick={() => navigate('/dashboard')} size="lg" className="gap-2">
              Bắt đầu học ngay <HiArrowRight />
            </Button>
          </div>
        </div>

        {/* Breakdown of questions */}
        <h2 className="text-xl font-bold mb-4">Xem lại đáp án chi tiết</h2>
        <div className="space-y-4">
          {result.answers_detail?.map((item, idx) => (
            <div key={idx} className="card p-5 border">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-gray-900">
                  Câu {idx + 1}: {item.question_text}
                </p>
                {item.is_correct ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    <HiCheckCircle className="w-5 h-5" /> Đúng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
                    <HiXCircle className="w-5 h-5" /> Sai
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 italic mb-3">{item.question_text_vi}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {item.options.map((opt, oIdx) => {
                  let borderCls = 'border-gray-200';
                  let bgCls = 'bg-gray-50';
                  if (oIdx === item.correct_option) {
                    borderCls = 'border-green-500 bg-green-50 text-green-800 font-medium';
                  } else if (oIdx === item.selected_option && !item.is_correct) {
                    borderCls = 'border-red-400 bg-red-50 text-red-700';
                  }
                  return (
                    <div key={oIdx} className={`p-2.5 rounded-lg border ${borderCls} ${bgCls}`}>
                      <span className="font-semibold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                    </div>
                  );
                })}
              </div>

              {item.explanation_vi && (
                <p className="mt-3 p-3 rounded-lg bg-blue-50/70 text-xs text-blue-900 border border-blue-100">
                  💡 <strong>Giải thích:</strong> {item.explanation_vi}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Top Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2">
          <span>Câu hỏi {currentIndex + 1} / {questions.length}</span>
          <span>Đã trả lời: {Object.keys(answers).length} câu</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="card p-6 sm:p-8 mb-6">
          <p className="text-xs uppercase tracking-wider font-semibold text-primary-600 mb-2">
            Đánh giá năng lực tiếng Anh
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {currentQ.question_text}
          </h2>
          {currentQ.question_text_vi && (
            <p className="text-sm text-gray-500 italic mb-6">
              {currentQ.question_text_vi}
            </p>
          )}

          <div className="space-y-3">
            {currentQ.options?.map((option, idx) => {
              const isSelected = answers[currentIndex] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-900 font-semibold shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
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

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Câu trước
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={handleNext}>
            Câu tiếp theo
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Nộp bài đánh giá
          </Button>
        )}
      </div>

      {/* Question palette */}
      <div className="card mt-8 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Mục lục câu hỏi</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => {
            const isAnswered = answers[idx] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-primary-500 ring-offset-1 bg-primary-600 text-white'
                    : isAnswered
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
