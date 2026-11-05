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
  HiArrowRight,
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
        quality >= 3 ? 'Đã ghi nhận! Lịch ôn đã dời xa hơn.' : 'Đã ghi nhận! Từ sẽ được xếp ôn sớm hơn.'
      );

      setShowAnswer(false);
      if (currentIndex < currentQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Tải lại để cập nhật hàng đợi mới
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
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" text="Đang đồng bộ thuật toán ôn tập ngắt quãng SM-2..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
            Spaced Repetition System (SM-2)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900 tracking-tight mt-1">
            Không Gian Ôn Tập Thuật Ngữ
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-xl">
            Tối ưu hóa khả năng ghi nhớ dài hạn các thuật ngữ mỹ thuật, hội họa và mỹ nghệ bằng thuật toán lặp lại ngắt quãng.
          </p>
        </div>

        {/* Source selector */}
        <div className="shrink-0 flex items-center gap-2">
          <label htmlFor="source-select" className="text-xs font-semibold text-stone-500 hidden sm:inline">
            Nguồn ôn:
          </label>
          <div className="relative">
            <select
              id="source-select"
              value={selectedSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="appearance-none bg-white border border-stone-300 hover:border-amber-400 text-stone-800 text-xs sm:text-sm font-medium py-2 pl-3 pr-8 rounded-xl shadow-2xs focus:outline-hidden cursor-pointer"
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
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
              <HiChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => handleSourceChange('due_today')}
          className={`card text-center p-4 cursor-pointer transition-all border rounded-2xl ${
            selectedSource === 'due_today' && activeTab === 'queue'
              ? 'ring-2 ring-amber-600 bg-amber-50/70 border-amber-300 shadow-sm'
              : 'bg-white hover:bg-amber-50/30 border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Cần ôn hôm nay</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-700 mt-1">
            {stats?.dueCount || 0}
          </p>
        </div>

        <div
          onClick={() => handleSourceChange('all_learning')}
          className={`card text-center p-4 cursor-pointer transition-all border rounded-2xl ${
            selectedSource === 'all_learning' && activeTab === 'queue'
              ? 'ring-2 ring-amber-800 bg-stone-50 border-amber-400 shadow-sm'
              : 'bg-white hover:bg-stone-50 border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Đang học</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            {stats?.learningCount || 0}
          </p>
        </div>

        <div className="card text-center p-4 bg-white border border-stone-200 rounded-2xl">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Đã thuần thục</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">
            {stats?.masteredCount || 0}
          </p>
        </div>

        <div className="card text-center p-4 bg-white border border-stone-200 rounded-2xl">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Độ chính xác</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-800 mt-1">
            {stats?.accuracyRate || 0}%
          </p>
        </div>
      </div>

      {/* Tabs Phụ */}
      <div className="flex border-b border-stone-200 text-xs sm:text-sm font-semibold gap-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'border-amber-700 text-amber-900 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiSparkles className="w-4 h-4 text-amber-600" />
          <span>Thẻ ôn tập ({currentQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('learning_list')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'learning_list'
              ? 'border-amber-700 text-amber-900 font-bold'
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
              ? 'border-amber-700 text-amber-900 font-bold'
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
          {isListLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs">
              <LoadingSpinner size="md" />
              <span>Đang tải các từ trong sổ từ...</span>
            </div>
          ) : currentQueue.length > 0 && vocab ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm max-w-2xl mx-auto space-y-6">
              {/* Badge & Mode Header */}
              <div className="flex justify-between items-center text-xs font-semibold text-stone-500 pb-3 border-b border-stone-100">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <HiClock className="w-4 h-4" />
                  {getSourceTitle()}: {currentIndex + 1} / {currentQueue.length}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                  {vocab.topic?.name_vi || 'Mỹ thuật & Mỹ nghệ'}
                </span>
              </div>

              {/* Front side of card */}
              <div className="text-center py-4 flex flex-col items-center justify-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-3 rounded-2xl overflow-hidden shadow-2xs border border-stone-200 bg-stone-50 p-1.5">
                  <VocabImage
                    src={vocab.image_url}
                    alt={vocab.image_alt || vocab.word}
                    enableZoom={true}
                    className="w-full h-full rounded-xl"
                  />
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-stone-900 tracking-tight mb-1">
                  {vocab.word}
                </h2>
                <p className="text-sm text-stone-500 font-mono mb-3">{vocab.pronunciation}</p>
                <button
                  type="button"
                  onClick={() => handleSpeak(vocab.word)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                >
                  <HiVolumeUp className="w-4 h-4 text-amber-700" /> Nghe phát âm
                </button>
              </div>

              {/* Back side / Answer section */}
              {showAnswer ? (
                <div className="space-y-6 pt-4 border-t border-stone-100">
                  <div className="text-center space-y-3">
                    <p className="text-2xl font-bold font-serif text-amber-900 mb-1">
                      {vocab.meaning_vi}
                    </p>
                    <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                      ({vocab.part_of_speech})
                    </span>
                    {vocab.example_sentence && (
                      <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs sm:text-sm space-y-1">
                        <p className="font-semibold text-stone-800">"{vocab.example_sentence}"</p>
                        <p className="text-stone-500 italic">"{vocab.example_translation}"</p>
                      </div>
                    )}

                    {/* Cultural Side-Notes */}
                    <VocabSidebarInfo
                      culturalNote={vocab.cultural_note}
                      relatedArtist={vocab.related_artist}
                      sourceRef={vocab.source_ref}
                      imageCredit={vocab.image_credit}
                    />
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
                    className="w-full sm:w-auto px-8 bg-amber-800 hover:bg-amber-900 text-white rounded-xl shadow-xs"
                  >
                    Hiện đáp án &amp; Bối cảnh văn hóa
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Khi không có từ trong hàng đợi hiện tại */
            <div className="bg-white rounded-3xl border border-stone-200 text-center p-10 max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="inline-flex p-4 rounded-full bg-amber-50 text-amber-700">
                <HiCheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-900">
                {selectedSource === 'due_today'
                  ? 'Hôm nay chưa có thuật ngữ nào đến hạn ôn'
                  : selectedSource.startsWith('list_')
                  ? 'Sổ từ này hiện chưa có từ vựng nào'
                  : 'Bạn chưa có từ nào trong danh sách đang học'}
              </h2>

              {selectedSource === 'due_today' && learningWords.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Hệ thống sẽ tự động nhắc bạn khi não bộ chuẩn bị quên theo thuật toán SM-2. Bạn đang có{' '}
                    <strong className="text-amber-800 font-bold">{learningWords.length} thuật ngữ đang học</strong>{' '}
                    và có thể chủ động ôn tập ngay bây giờ!
                  </p>
                  <Button
                    onClick={() => handleSourceChange('all_learning')}
                    className="bg-amber-800 hover:bg-amber-900 text-white gap-2 rounded-xl"
                  >
                    <HiLightningBolt className="w-4 h-4" /> Ôn tập ngay các từ đang học ({learningWords.length})
                  </Button>
                </div>
              ) : selectedSource.startsWith('list_') && learningWords.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Hãy thêm từ vào sổ từ này trong trang Từ vựng hoặc chuyển sang ôn tất cả từ đang học.
                  </p>
                  <Button
                    onClick={() => handleSourceChange('all_learning')}
                    className="bg-amber-800 hover:bg-amber-900 text-white gap-2 rounded-xl"
                  >
                    <HiLightningBolt className="w-4 h-4" /> Ôn tập tất cả từ đang học ({learningWords.length})
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-stone-500 leading-relaxed">
                  Hãy vào mục <strong>Từ vựng</strong> để khám phá và thêm các thuật ngữ mỹ thuật mới vào lộ trình học!
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
                onClick={() => handleSourceChange('all_learning')}
                className="bg-amber-800 hover:bg-amber-900 text-white gap-1.5 text-xs rounded-xl"
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
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-200 bg-stone-50 p-1 shrink-0">
                        <VocabImage src={v.image_url} alt={v.word} className="w-full h-full rounded-lg" />
                      </div>
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
            <HiCalendar className="w-5 h-5 text-amber-800" />
            <h2 className="text-base font-bold font-serif text-stone-900">
              Lịch ôn tập sắp tới (7 ngày tới)
            </h2>
          </div>

          {upcoming.length > 0 ? (
            <div className="divide-y divide-stone-100 text-sm">
              {upcoming.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.vocabulary?.image_url && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 p-0.5 shrink-0">
                        <VocabImage src={item.vocabulary.image_url} alt="" className="w-full h-full rounded" />
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-stone-900">{item.vocabulary?.word}</span>
                      <span className="text-stone-500 text-xs">({item.vocabulary?.meaning_vi})</span>
                    </div>
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
