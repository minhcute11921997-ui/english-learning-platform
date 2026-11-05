import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { exerciseApi, topicApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VocabImage from '../../components/vocab/VocabImage';
import VocabSidebarInfo from '../../components/vocab/VocabSidebarInfo';
import {
  HiCheckCircle,
  HiXCircle,
  HiArrowRight,
  HiArrowLeft,
  HiLightningBolt,
  HiRefresh
} from 'react-icons/hi';
import { HiOutlineSparkles } from 'react-icons/hi2';

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
      const explanations = res.data?.explanations || [];
      const expMap = {};
      explanations.forEach((e) => {
        expMap[e.vocabulary_id] = e;
      });

      setResults({
        ...res.data,
        detail: exercises.map((ex, idx) => {
          const exp = expMap[ex.vocabulary_id] || {};
          return {
            ...ex,
            ...exp,
            selected_option: answers[idx],
            is_correct: answers[idx] === ex.correct_option
          };
        })
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
        <LoadingSpinner size="lg" text="Đang chuẩn bị đề luyện tập mỹ thuật & mỹ nghệ..." />
      </div>
    );
  }

  // Kết quả sau khi nộp
  if (results) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-6 pb-12">
        <div className="card text-center p-8 border border-stone-200 shadow-sm rounded-3xl bg-white">
          <div className="inline-flex p-4 rounded-full bg-amber-50 text-amber-700 mb-4 border border-amber-200">
            <HiLightningBolt className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 font-serif text-stone-900">
            Hoàn Thành Bài Luyện Tập Mỹ Thuật!
          </h1>
          <p className="text-stone-600 mb-6">Chủ đề: {topic?.name_vi} ({topic?.name})</p>

          <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/80 inline-block mx-auto mb-6 text-center">
            <p className="text-4xl font-extrabold text-amber-800 mb-1">{results.percentage}%</p>
            <p className="text-sm font-semibold text-stone-700">
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
              className="gap-2 rounded-xl"
            >
              <HiRefresh /> Luyện tập đề mới
            </Button>
            <Button onClick={() => navigate(`/topics/${id}`)} className="rounded-xl">
              Về danh mục thuật ngữ
            </Button>
          </div>
        </div>

        <h2 className="text-lg font-bold text-stone-900 font-serif">Giải thích chi tiết &amp; Bối cảnh văn hóa</h2>
        <div className="space-y-5">
          {results.detail?.map((item, idx) => (
            <div key={idx} className="card p-5 border border-stone-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700">
                    {idx + 1}
                  </span>
                  <p className="font-semibold text-stone-900 text-sm sm:text-base">
                    {item.question}
                  </p>
                </div>
                {item.is_correct ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 shrink-0">
                    <HiCheckCircle className="w-5 h-5" /> Đúng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-semibold text-rose-500 shrink-0">
                    <HiXCircle className="w-5 h-5" /> Sai
                  </span>
                )}
              </div>

              {/* Artwork thumbnail if question had an image */}
              {item.image_url && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-1 shadow-2xs">
                  <VocabImage src={item.image_url} alt="Minh họa" className="w-full h-full rounded-lg" />
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {item.options.map((opt, oIdx) => {
                  let cls = 'border-stone-200 bg-stone-50/60 text-stone-700';
                  if (oIdx === item.correct_option) {
                    cls = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                  } else if (oIdx === item.selected_option && !item.is_correct) {
                    cls = 'border-rose-400 bg-rose-50 text-rose-800 line-through';
                  }
                  return (
                    <div key={oIdx} className={`p-2.5 rounded-xl border ${cls}`}>
                      <span className="font-semibold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                    </div>
                  );
                })}
              </div>

              {/* Cultural Context Note */}
              {(item.cultural_note || item.related_artist) && (
                <VocabSidebarInfo
                  culturalNote={item.cultural_note}
                  relatedArtist={item.related_artist}
                  className="mt-2 text-xs"
                />
              )}
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
      <div className="max-w-2xl mx-auto py-12 text-center card space-y-4 rounded-2xl border-stone-200">
        <p className="text-stone-600">Chưa có bài tập nào cho chủ đề này.</p>
        <Link to={`/topics/${id}`} className="btn btn-primary inline-flex items-center gap-1.5 rounded-xl">
          <HiArrowLeft /> Quay lại chủ đề
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/topics/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-amber-800 transition-colors"
        >
          <HiArrowLeft /> Thoát bài tập
        </Link>
        <span className="text-sm font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
          Câu {currentIndex + 1} / {exercises.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone-200 rounded-full h-2">
        <div
          className="bg-amber-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="card p-6 sm:p-8 space-y-5 rounded-3xl border border-stone-200 shadow-sm bg-white">
          <div>
            <span className="badge bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold uppercase mb-2">
              {currentQ.type === 'image_to_word'
                ? '🖼️ Nhìn tranh đoán thuật ngữ'
                : currentQ.type === 'en_to_vi'
                ? 'Tiếng Anh sang Tiếng Việt'
                : currentQ.type === 'vi_to_en'
                ? 'Tiếng Việt sang Tiếng Anh'
                : 'Điền từ vào ngữ cảnh'}
            </span>
            <h2 className="text-xl font-bold text-stone-900 mt-2 whitespace-pre-line font-serif">
              {currentQ.question}
            </h2>
            {currentQ.translation && (
              <p className="text-xs sm:text-sm text-stone-500 italic mt-1 font-serif">"{currentQ.translation}"</p>
            )}
          </div>

          {/* Visual Artwork Box for image questions or questions with an image */}
          {currentQ.image_url && (
            <div className="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-2 shadow-xs">
              <VocabImage
                src={currentQ.image_url}
                alt="Minh họa câu hỏi"
                enableZoom={true}
                className="w-full h-full rounded-xl"
              />
            </div>
          )}

          {/* Answer choices */}
          <div className="space-y-3">
            {currentQ.options.map((option, oIdx) => {
              const isSelected = answers[currentIndex] === oIdx;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(oIdx)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50 text-amber-950 font-semibold shadow-xs'
                      : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-sm sm:text-base">{option}</span>
                  </div>
                  {isSelected && <HiCheckCircle className="w-6 h-6 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0} className="rounded-xl">
          Câu trước
        </Button>

        {currentIndex < exercises.length - 1 ? (
          <Button onClick={handleNext} className="rounded-xl">
            Câu tiếp theo
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="rounded-xl shadow-xs"
          >
            Nộp bài ({Object.keys(answers).length}/{exercises.length} câu)
          </Button>
        )}
      </div>
    </div>
  );
}
