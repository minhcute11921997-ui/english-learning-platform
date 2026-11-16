import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { reviewApi, vocabListApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import VocabImage from '../../components/vocab/VocabImage';
import VocabSidebarInfo from '../../components/vocab/VocabSidebarInfo';
import {
  HiVolumeUp,
  HiClock,
  HiCheckCircle,
  HiCalendar,
  HiBookOpen,
  HiSparkles,
  HiLightningBolt,
  HiChevronDown
} from 'react-icons/hi';

export default function ReviewPage() {
  const [stats, setStats] = useState(null);
  const [dueWords, setDueWords] = useState([]);
  const [learningWords, setLearningWords] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [myLists, setMyLists] = useState([]);
  const [listWordsMap, setListWordsMap] = useState({});
  const [selectedSource, setSelectedSource] = useState('all_learning'); // 'all_learning' | 'due_today' | 'list_${id}'
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'learning_list' | 'upcoming'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setIsLoading(true);
      const [sRes, dRes, lRes, uRes, listsRes] = await Promise.all([
        reviewApi.getStats(),
        reviewApi.getDue(50),
        reviewApi.getLearning(100),
        reviewApi.getUpcoming(7),
        vocabListApi.getAll().catch(() => ({ data: [] }))
      ]);
      setStats(sRes.data);
      const due = dRes.data || [];
      const learning = lRes.data || [];
      setDueWords(due);
      setLearningWords(learning);
      setUpcoming(uRes.data || []);
      setMyLists(listsRes.data || []);

      if (due.length > 0) {
        setSelectedSource('due_today');
      } else {
        setSelectedSource('all_learning');
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

  const handleSourceChange = async (source) => {
    setSelectedSource(source);
    setCurrentIndex(0);
    setShowAnswer(false);
    setActiveTab('queue');

    if (source.startsWith('list_')) {
      const listId = source.replace('list_', '');
      if (!listWordsMap[listId]) {
        try {
          setIsListLoading(true);
          const res = await vocabListApi.getById(listId);
          const vocabs = (res.data?.vocabularies || []).map((v) => ({
            vocabulary: v,
            user_progress: v.user_progress
          }));
          setListWordsMap((prev) => ({ ...prev, [listId]: vocabs }));
        } catch {
          toast.error('Không thể tải từ trong sổ từ này');
        } finally {
          setIsListLoading(false);
        }
      }
    }
  };

  const getCurrentQueue = () => {
    if (selectedSource === 'due_today') return dueWords;
    if (selectedSource === 'all_learning') return learningWords;
    if (selectedSource.startsWith('list_')) {
      const listId = selectedSource.replace('list_', '');
      return listWordsMap[listId] || [];
    }
    return learningWords;
  };

  const currentQueue = getCurrentQueue();
  const currentItem = currentQueue[currentIndex];
  const vocab = currentItem?.vocabulary;

  const getSourceTitle = () => {
    if (selectedSource === 'due_today') return 'Cần ôn hôm nay';
    if (selectedSource === 'all_learning') return 'Toàn bộ từ đang học';
    if (selectedSource.startsWith('list_')) {
      const listId = selectedSource.replace('list_', '');
      const found = myLists.find((l) => String(l.id) === String(listId));
      return found ? `Sổ từ: ${found.name}` : 'Sổ từ cá nhân';
    }
    return 'Luyện tập';
  };

  const handleAnswer = async (quality) => {
    if (!vocab) return;

    try {
      setIsSubmitting(true);
      await reviewApi.answer(vocab.id, { quality });

      toast.success(
        quality >= 3 ? 'Đã ghi nhận! Chu kỳ ghi nhớ được củng cố.' : 'Đã ghi nhận! Hệ thống sẽ xếp lịch ôn sớm hơn.'
      );

      setShowAnswer(false);
      if (currentIndex < currentQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        loadReviewData();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật lịch ôn tập');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Đang đồng bộ thuật toán ôn tập ngắt quãng SM-2..." />
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-4xl mx-auto pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ôn tập từ vựng
        </h1>

        {/* Source selector */}
        <div className="shrink-0 flex items-center gap-2">
          <label htmlFor="source-select" className="text-xs font-mono font-bold text-slate-500 hidden sm:inline uppercase">
            Nguồn:
          </label>
          <div className="relative">
            <select
              id="source-select"
              value={selectedSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-blue-500 text-slate-800 text-xs sm:text-sm font-semibold py-2.5 pl-3.5 pr-8 rounded-xl shadow-xs focus:outline-hidden cursor-pointer"
            >
              <optgroup label="Hàng đợi hệ thống">
                <option value="due_today">⚡ Cần ôn hôm nay ({dueWords.length} từ)</option>
                <option value="all_learning">📚 Tất cả từ đang học ({learningWords.length} từ)</option>
              </optgroup>
              {myLists.length > 0 && (
                <optgroup label="Sổ từ cá nhân">
                  {myLists.map((list) => (
                    <option key={list.id} value={`list_${list.id}`}>
                      📁 {list.name} ({list.vocab_count || 0} từ)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <HiChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Contemporary Gallery Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => handleSourceChange('due_today')}
          className={`card text-center p-5 cursor-pointer transition-all border rounded-2xl ${
            selectedSource === 'due_today' && activeTab === 'queue'
              ? 'ring-2 ring-blue-600 bg-blue-50/60 border-blue-300 shadow-sm'
              : 'bg-white hover:bg-slate-50 border-slate-200/90'
          }`}
        >
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cần ôn hôm nay</span>
          <p className="text-3xl font-extrabold text-blue-600 mt-1 tracking-tight">
            {stats?.dueCount || 0}
          </p>
        </div>

        <div
          onClick={() => handleSourceChange('all_learning')}
          className={`card text-center p-5 cursor-pointer transition-all border rounded-2xl ${
            selectedSource === 'all_learning' && activeTab === 'queue'
              ? 'ring-2 ring-blue-600 bg-blue-50/60 border-blue-300 shadow-sm'
              : 'bg-white hover:bg-slate-50 border-slate-200/90'
          }`}
        >
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Đang học</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {stats?.learningCount || 0}
          </p>
        </div>

        <div className="card text-center p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Đã thuần thục</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1 tracking-tight">
            {stats?.masteredCount || 0}
          </p>
        </div>

        <div className="card text-center p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Độ chính xác</span>
          <p className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">
            {stats?.accuracyRate || 0}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold gap-4">
        <button
          onClick={() => setActiveTab('queue')}
          className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiSparkles className="w-4 h-4 text-blue-600" />
          <span>Thẻ Ôn Tập ({currentQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('learning_list')}
          className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'learning_list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiBookOpen className="w-4 h-4" />
          <span>Danh Sách Từ Đang Học ({learningWords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiCalendar className="w-4 h-4" />
          <span>Lịch 7 Ngày Tới ({upcoming.length})</span>
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE INTERACTIVE CARD */}
      {activeTab === 'queue' && (
        <>
          {isListLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <LoadingSpinner size="md" />
              <span>Đang tải các từ trong sổ từ...</span>
            </div>
          ) : currentQueue.length > 0 && vocab ? (
            <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-md max-w-2xl mx-auto space-y-6">
              {/* Badge & Mode Header */}
              <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400 pb-3.5 border-b border-slate-100 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <HiClock className="w-4 h-4 text-blue-600" />
                  {getSourceTitle()}: {currentIndex + 1} / {currentQueue.length}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {vocab.topic?.name_vi || 'Mỹ thuật'}
                </span>
              </div>

              {/* Front side of card */}
              <div className="text-center py-4 flex flex-col items-center justify-center">
                <div className="w-64 h-44 sm:w-72 sm:h-48 mx-auto mb-4 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50">
                  <VocabImage
                    src={vocab.image_url}
                    alt={vocab.image_alt || vocab.word}
                    enableZoom={true}
                    className="w-full h-full"
                  />
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-1">
                  {vocab.word}
                </h2>
                <p className="text-sm text-slate-500 font-mono mb-4">{vocab.pronunciation}</p>
                <button
                  type="button"
                  onClick={() => handleSpeak(vocab.word)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                >
                  <HiVolumeUp className="w-4 h-4 text-blue-600" /> Nghe phát âm
                </button>
              </div>

              {/* Back side / Answer section */}
              {showAnswer ? (
                <div className="space-y-6 pt-5 border-t border-slate-100">
                  <div className="text-center space-y-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-1">
                      {vocab.meaning_vi}
                    </p>
                    <span className="font-mono text-xs text-blue-600 font-bold uppercase tracking-wider">
                      ({vocab.part_of_speech})
                    </span>
                    {vocab.example_sentence && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs sm:text-sm space-y-1">
                        <p className="font-bold text-slate-800">"{vocab.example_sentence}"</p>
                        <p className="text-slate-500 italic">"{vocab.example_translation}"</p>
                      </div>
                    )}

                    {/* Cultural Info */}
                    <VocabSidebarInfo
                      culturalNote={vocab.cultural_note}
                      relatedArtist={vocab.related_artist}
                      sourceRef={vocab.source_ref}
                    />
                  </div>

                  {/* 4 Assessment Buttons */}
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(1)}
                        className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-center transition-all cursor-pointer"
                      >
                        <p className="text-xs font-extrabold uppercase">Chưa nhớ</p>
                      </button>

                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(3)}
                        className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-center transition-all cursor-pointer"
                      >
                        <p className="text-xs font-extrabold uppercase">Khó nhớ</p>
                      </button>

                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(4)}
                        className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-center transition-all cursor-pointer"
                      >
                        <p className="text-xs font-extrabold uppercase">Nhớ tốt</p>
                      </button>

                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(5)}
                        className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-center transition-all cursor-pointer"
                      >
                        <p className="text-xs font-extrabold uppercase">Rất dễ</p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-2">
                  <Button
                    onClick={() => setShowAnswer(true)}
                    size="lg"
                    className="w-full sm:w-auto px-8 rounded-xl shadow-sm text-xs py-3 btn-primary"
                  >
                    Hiện đáp án &amp; Bối cảnh văn hóa
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Khi không có từ trong hàng đợi hiện tại */
            <div className="bg-white rounded-3xl border border-slate-200/90 text-center p-12 max-w-xl mx-auto space-y-5 shadow-sm">
              <div className="inline-flex p-4 rounded-3xl bg-blue-50 text-blue-600">
                <HiCheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {selectedSource === 'due_today'
                  ? 'Hôm nay chưa có thuật ngữ nào đến hạn ôn'
                  : selectedSource.startsWith('list_')
                  ? 'Sổ từ này hiện chưa có từ vựng nào'
                  : 'Bạn chưa có từ nào trong danh sách đang học'}
              </h2>

              {selectedSource === 'due_today' && learningWords.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Hệ thống sẽ tự động kích hoạt nhắc nhở trước khi trí nhớ suy giảm theo thuật toán SM-2. Bạn đang có{' '}
                    <strong className="text-blue-600 font-bold">{learningWords.length} thuật ngữ đang học</strong>.
                  </p>
                  <Button
                    onClick={() => handleSourceChange('all_learning')}
                    className="btn-primary gap-2 rounded-xl text-xs py-2.5 px-5"
                  >
                    <HiLightningBolt className="w-4 h-4" /> Ôn tập ngay các từ đang học ({learningWords.length})
                  </Button>
                </div>
              ) : selectedSource.startsWith('list_') && learningWords.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Hãy thêm từ vào sổ từ này trong trang Chủ đề Mỹ thuật hoặc chuyển sang ôn tất cả từ đang học.
                  </p>
                  <Button
                    onClick={() => handleSourceChange('all_learning')}
                    className="btn-primary gap-2 rounded-xl text-xs py-2.5 px-5"
                  >
                    <HiLightningBolt className="w-4 h-4" /> Ôn tập tất cả từ đang học ({learningWords.length})
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hãy vào mục <strong>Chủ đề Mỹ thuật</strong> để khám phá và nạp thêm các thuật ngữ mới!
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: DANH SÁCH TOÀN BỘ TỪ ĐANG HỌC */}
      {activeTab === 'learning_list' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Toàn bộ thuật ngữ đang học ({learningWords.length})
              </h2>
            </div>

            {learningWords.length > 0 && (
              <Button
                size="sm"
                onClick={() => handleSourceChange('all_learning')}
                className="btn-primary gap-1.5 text-xs rounded-xl py-2 px-3.5"
              >
                <HiLightningBolt className="w-3.5 h-3.5" /> Bắt đầu ôn ({learningWords.length} từ)
              </Button>
            )}
          </div>

          {learningWords.length > 0 ? (
            <div className="divide-y divide-slate-100 text-sm">
              {learningWords.map((item, idx) => {
                const v = item.vocabulary;
                if (!v) return null;
                const nextDate = item.next_review_at ? new Date(item.next_review_at) : null;
                return (
                  <div key={item.id || idx} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-xs">
                        <VocabImage src={v.image_url} alt={v.word} fit="cover" className="w-full h-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{v.word}</span>
                          <span className="text-xs text-slate-400 font-mono">{v.pronunciation}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{v.meaning_vi}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
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
            <div className="p-8 text-center text-sm text-slate-400 italic">
              Bạn chưa có từ nào trong danh sách đang học.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UPCOMING REVIEWS (LỊCH 7 NGÀY TỚI) */}
      {activeTab === 'upcoming' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <HiCalendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Lịch ôn tập sắp tới (7 ngày tới)
            </h2>
          </div>

          {upcoming.length > 0 ? (
            <div className="divide-y divide-slate-100 text-sm">
              {upcoming.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {item.vocabulary?.image_url && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-xs">
                        <VocabImage src={item.vocabulary.image_url} alt="" fit="cover" className="w-full h-full" />
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-slate-900">{item.vocabulary?.word}</span>
                      <span className="text-slate-500 text-xs">({item.vocabulary?.meaning_vi})</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
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
            <p className="text-xs text-slate-400 italic text-center py-8">
              Chưa có lịch ôn tập nào được lên lịch cho tuần tới.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
