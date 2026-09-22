import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { readingApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiTranslate,
  HiClock,
  HiBookOpen,
  HiSparkles
} from 'react-icons/hi';

export default function ReadingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reading, setReading] = useState(null);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadReading();
  }, [id]);

  const loadReading = async () => {
    try {
      setIsLoading(true);
      const res = await readingApi.getById(id);
      setReading(res.data);
      setAnswers({});
      setResults(null);
    } catch (err) {
      toast.error(err.message || 'Không thể tải bài đọc');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (qId, optIdx) => {
    setAnswers({
      ...answers,
      [qId]: optIdx
    });
  };

  const handleSubmit = async () => {
    const questions = reading.questions || [];
    const formattedAnswers = Object.entries(answers).map(([qId, selected_option]) => ({
      question_id: parseInt(qId),
      selected_option
    }));

    if (formattedAnswers.length < questions.length) {
      if (!window.confirm(`Bạn mới trả lời ${formattedAnswers.length}/${questions.length} câu. Bạn có muốn nộp bài ngay?`)) {
        return;
      }
    }

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      setIsSubmitting(true);
      const res = await readingApi.submitAttempt(id, {
        answers: formattedAnswers,
        time_spent_seconds: timeSpent
      });
      setResults(res.data);
      toast.success('Đã nộp bài làm thành công!');
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

  if (!reading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/readings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600"
        >
          <HiArrowLeft /> Quay lại danh sách bài đọc
        </Link>
        <button
          onClick={() => setShowVietnamese(!showVietnamese)}
          className={`btn py-1.5 px-3 text-xs gap-1.5 ${
            showVietnamese ? 'btn-primary' : 'btn-outline'
          }`}
        >
          <HiTranslate className="w-4 h-4" />
          {showVietnamese ? 'Ẩn bản dịch tiếng Việt' : 'Hiện bản dịch tiếng Việt'}
        </button>
      </div>

      {/* Reading Passage Card */}
      <div className="card p-6 sm:p-8 space-y-4 border">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b">
          <div>
            <span className="badge bg-blue-100 text-blue-800 text-xs mr-2">
              {reading.topic?.name_vi}
            </span>
            <span className="badge bg-yellow-100 text-yellow-800 text-xs capitalize">
              Độ khó: {reading.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <HiBookOpen className="w-4 h-4" /> {reading.word_count} từ
            </span>
            <span className="flex items-center gap-1">
              <HiClock className="w-4 h-4" /> ~{reading.estimated_time_minutes} phút
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{reading.title}</h1>
        {reading.title_vi && <p className="text-sm text-gray-500 italic">{reading.title_vi}</p>}

        {/* English Content */}
        <div className="text-base text-gray-800 leading-relaxed font-serif whitespace-pre-line bg-gray-50/50 p-6 rounded-xl border border-gray-100">
          {reading.content}
        </div>

        {/* Optional Vietnamese Translation */}
        {showVietnamese && reading.content_vi && (
          <div className="text-sm text-gray-600 leading-relaxed p-6 rounded-xl bg-blue-50/50 border border-blue-100 whitespace-pre-line">
            <p className="font-bold text-blue-900 mb-2">Bản dịch tiếng Việt:</p>
            {reading.content_vi}
          </div>
        )}
      </div>

      {/* Score Result Banner */}
      {results && (
        <div className="card p-6 border-2 border-primary-300 bg-gradient-to-br from-blue-50 to-indigo-50 text-center space-y-3">
          <p className="text-xs uppercase font-bold tracking-wider text-primary-600">Kết quả đọc hiểu</p>
          <p className="text-4xl font-extrabold text-primary-700">
            {results.score} / {results.total_questions} điểm ({results.percentage}%)
          </p>
          <p className="text-sm text-gray-600">
            Thời gian hoàn thành: {results.time_spent_seconds} giây
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button onClick={loadReading} variant="secondary">
              Làm lại bài này
            </Button>
            <Button onClick={() => navigate('/readings')}>
              Chọn bài đọc khác
            </Button>
          </div>
        </div>
      )}

      {/* Comprehension Questions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">
          Câu hỏi trắc nghiệm đọc hiểu ({reading.questions?.length || 0} câu)
        </h2>

        {results ? (
          // Review Mode with Explanations
          <div className="space-y-6">
            {results.results?.map((q, idx) => (
              <div key={q.question_id} className="card p-6 border space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      Câu {idx + 1}: {q.question_text}
                    </p>
                    {q.question_text_vi && (
                      <p className="text-xs text-gray-500 italic mt-0.5">{q.question_text_vi}</p>
                    )}
                  </div>

                  {q.is_correct ? (
                    <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                      <HiCheckCircle className="w-5 h-5" /> Đúng
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-semibold text-red-500">
                      <HiXCircle className="w-5 h-5" /> Sai
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {q.options?.map((opt, oIdx) => {
                    let cls = 'border-gray-200 bg-gray-50';
                    if (oIdx === q.correct_option) {
                      cls = 'border-green-500 bg-green-50 text-green-800 font-semibold';
                    } else if (oIdx === q.selected_option && !q.is_correct) {
                      cls = 'border-red-400 bg-red-50 text-red-700';
                    }
                    return (
                      <div key={oIdx} className={`p-3 rounded-lg border ${cls}`}>
                        <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                      </div>
                    );
                  })}
                </div>

                {q.explanation_vi && (
                  <p className="p-3 rounded-lg bg-blue-50 text-xs text-blue-900 border border-blue-100">
                    💡 <strong>Giải thích chi tiết:</strong> {q.explanation_vi}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Answering Mode
          <div className="space-y-6">
            {reading.questions?.map((q, idx) => (
              <div key={q.id} className="card p-6 border space-y-4">
                <div>
                  <p className="font-bold text-gray-900">
                    Câu {idx + 1}: {q.question_text}
                  </p>
                  {q.question_text_vi && (
                    <p className="text-xs text-gray-500 italic mt-0.5">{q.question_text_vi}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {q.options?.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 text-primary-900 font-semibold'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-sm">{opt}</span>
                        </div>
                        {isSelected && <HiCheckCircle className="w-5 h-5 text-primary-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="text-center pt-4">
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                size="lg"
                className="w-full sm:w-auto px-10"
              >
                Nộp bài đọc hiểu
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
