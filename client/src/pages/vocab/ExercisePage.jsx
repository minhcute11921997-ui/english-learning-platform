import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { exerciseApi, topicApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VocabImage from '../../components/vocab/VocabImage';
import VocabSidebarInfo from '../../components/vocab/VocabSidebarInfo';
import {
  HiCheckCircle,
  HiXCircle,
  HiArrowLeft,
  HiRefresh,
  HiLightningBolt
} from 'react-icons/hi';
import { HiOutlineSparkles } from 'react-icons/hi2';

export default function ExercisePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = sessionStorage.getItem(`exercise_draft_${id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lưu tạm bài làm vào sessionStorage
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
      return {
        id: ex.id,
        vocabulary_id: ex.vocabulary_id,
        selected_option: selected !== undefined ? selected : null,
        options: ex.options
      };
    });

    try {
      setIsSubmitting(true);
      const res = await exerciseApi.submitVocabExercises(formatted);
      sessionStorage.removeItem(`exercise_draft_${id}`);
      const explanations = res.data?.explanations || [];
      const expMap = {};
      explanations.forEach((e) => {
        if (e.id) expMap[e.id] = e;
        else expMap[e.vocabulary_id] = e;
      });

      setResults({
        ...res.data,
        detail: exercises.map((ex, idx) => {
          const exp = expMap[ex.id] || expMap[ex.vocabulary_id] || {};
          return {
            ...ex,
            ...exp,
            selected_option: answers[idx] !== undefined ? answers[idx] : null,
            correct_option: exp.correct_option,
            is_correct: Boolean(exp.is_correct)
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
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Đang tạo đề luyện tập triển lãm..." />
      </div>
    );
  }

  // Kết quả sau khi nộp
  if (results) {
    return (
      <div className="max-w-2xl mx-auto space-y-7 py-6 pb-14">
        <div className="card text-center p-8 sm:p-10 border border-slate-200/90 shadow-xl rounded-3xl bg-white">
          <div className="inline-flex p-4 rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-200">
            <HiLightningBolt className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-950 tracking-tight">
            Hoàn Thành Bài Luyện Tập Mỹ Thuật!
          </h1>
          <p className="text-slate-500 mb-6 text-sm">Chủ đề: {topic?.name_vi} ({topic?.name})</p>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 inline-block mx-auto mb-6 text-center">
            <p className="text-5xl font-extrabold text-blue-600 mb-1 tracking-tight">{results.percentage}%</p>
            <p className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
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
              className="gap-2 rounded-xl text-xs py-2.5 px-4"
            >
              <HiRefresh /> Luyện tập đề mới
            </Button>
            <Button onClick={() => navigate(`/topics/${id}`)} className="rounded-xl text-xs py-2.5 px-4 btn-primary">
              Về phòng triển lãm
            </Button>
          </div>
        </div>

        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Giải thích chi tiết &amp; Bối cảnh văn hóa</h2>
        <div className="space-y-5">
          {results.detail?.map((item, idx) => (
            <div key={idx} className="card p-6 border border-slate-200/90 rounded-3xl shadow-sm space-y-4 bg-white">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center font-mono text-xs font-bold text-slate-700 shrink-0">
                    {idx + 1}
                  </span>
                  <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {item.question}
                  </p>
                </div>
                {item.is_correct ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0 border border-emerald-200">
                    <HiCheckCircle className="w-4 h-4" /> Đúng
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full shrink-0 border border-rose-200">
                    <HiXCircle className="w-4 h-4" /> Sai
                  </span>
                )}
              </div>

              {/* Artwork thumbnail if question had an image */}
              {item.image_url && (
                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-1 shadow-md">
                  <VocabImage src={item.image_url} alt="Tác phẩm" className="w-full h-full rounded-xl" />
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                {item.options.map((opt, oIdx) => {
                  let cls = 'border-slate-200 bg-slate-50 text-slate-700';
                  if (oIdx === item.correct_option) {
                    cls = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                  } else if (oIdx === item.selected_option && !item.is_correct) {
                    cls = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                  }
                  return (
                    <div key={oIdx} className={`p-3 rounded-xl border ${cls} flex items-center gap-2`}>
                      <span className="font-mono font-bold text-slate-500 text-xs">{String.fromCharCode(65 + oIdx)}.</span>
                      <span>{opt}</span>
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
      <div className="max-w-2xl mx-auto py-16 text-center card space-y-4 rounded-3xl border-slate-200">
        <p className="text-slate-500">Chưa có bài tập nào cho chủ đề này.</p>
        <Link to={`/topics/${id}`} className="btn btn-primary inline-flex items-center gap-1.5 rounded-xl text-xs py-2 px-4">
          <HiArrowLeft /> Quay lại chủ đề
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 pb-14">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/topics/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider"
        >
          <HiArrowLeft /> Thoát bài tập
        </Link>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
          Câu {currentIndex + 1} / {exercises.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="card p-6 sm:p-8 space-y-6 rounded-3xl border border-slate-200/90 shadow-md bg-white">
          <div>
            <span className="badge bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] uppercase font-bold mb-3 inline-block">
              {currentQ.type === 'image_to_word'
                ? '🖼️ Nhìn tranh đoán thuật ngữ'
                : currentQ.type === 'en_to_vi'
                ? 'Tiếng Anh sang Tiếng Việt'
                : currentQ.type === 'vi_to_en'
                ? 'Tiếng Việt sang Tiếng Anh'
                : 'Điền từ vào ngữ cảnh'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1 whitespace-pre-line tracking-tight">
              {currentQ.question}
            </h2>
            {currentQ.translation && (
              <p className="text-xs sm:text-sm text-slate-500 italic mt-1.5">"{currentQ.translation}"</p>
            )}
          </div>

          {/* Visual Artwork Box for image questions or questions with an image */}
          {currentQ.image_url && (
            <div className="w-44 h-44 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 p-2 shadow-lg">
              <VocabImage
                src={currentQ.image_url}
                alt="Minh họa câu hỏi"
                enableZoom={true}
                className="w-full h-full rounded-2xl"
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
                      ? 'border-blue-600 bg-blue-50/50 text-slate-950 font-bold shadow-sm shadow-blue-500/10'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-8 h-8 rounded-xl font-mono flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-sm sm:text-base">{option}</span>
                  </div>
                  {isSelected && <HiCheckCircle className="w-6 h-6 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0} className="rounded-xl text-xs py-2.5 px-4">
          Câu trước
        </Button>

        {currentIndex < exercises.length - 1 ? (
          <Button onClick={handleNext} className="rounded-xl text-xs py-2.5 px-4 btn-primary">
            Câu tiếp theo
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="rounded-xl shadow-sm text-xs py-2.5 px-5"
          >
            Nộp bài ({Object.keys(answers).length}/{exercises.length} câu)
          </Button>
        )}
      </div>
    </div>
  );
}
