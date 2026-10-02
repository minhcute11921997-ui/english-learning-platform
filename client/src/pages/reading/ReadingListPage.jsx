import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { readingApi, topicApi } from '../../api/services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiMagnifyingGlass,
  HiOutlineBookmark,
  HiOutlineArrowRight
} from 'react-icons/hi2';

export default function ReadingListPage() {
  const [readings, setReadings] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedTopic, selectedDifficulty]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rRes, recRes, tRes] = await Promise.all([
        readingApi.getAll({
          topic_id: selectedTopic || undefined,
          difficulty: selectedDifficulty || undefined,
          limit: 50
        }),
        readingApi.getRecommended(),
        topicApi.getAll()
      ]);
      setReadings(rRes.data || []);
      setRecommended(recRes.data || []);
      setTopics(tRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách bài đọc');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReadings = readings.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.title_vi && r.title_vi.toLowerCase().includes(q))
    );
  });

  if (isLoading && readings.length === 0) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header gọn gàng */}
      <div className="border-b border-[#E8E4DC] pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16201B]">
          Luyện đọc hiểu
        </h1>
        <p className="text-xs sm:text-sm text-[#6C726E] mt-0.5">
          21 bài đọc phân cấp độ kèm câu hỏi trắc nghiệm và giải thích từ khóa.
        </p>
      </div>

      {/* Recommended Section (Gọn gàng, loại bỏ gradient xanh AI) */}
      {recommended.length > 0 && (
        <div className="card p-5 bg-[#FAF7F2] border-[#E8DCCB]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#195646]">
              <HiOutlineBookmark className="w-4 h-4 text-[#195646]" />
              Bài đọc đề xuất hôm nay
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recommended.slice(0, 2).map((rec) => (
              <div
                key={rec.id}
                className="bg-white p-4 rounded-xl border border-[#E8E0D5] flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF4F0] text-[#195646]">
                      {rec.topic?.name_vi}
                    </span>
                    <span className="text-[10px] text-[#8C928E]">
                      ~{rec.estimated_time_minutes || 4} phút
                    </span>
                  </div>
                  <h3 className="font-serif text-sm font-bold text-[#16201B] truncate">{rec.title}</h3>
                  <p className="text-xs text-[#7A807C] italic truncate">{rec.title_vi}</p>
                </div>
                <Link
                  to={`/readings/${rec.id}`}
                  className="btn btn-primary text-xs py-1.5 px-3 flex-shrink-0"
                >
                  Đọc ngay
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C928E]" />
          <input
            type="text"
            className="input pl-10 py-2 text-xs sm:text-sm"
            placeholder="Tìm theo tiêu đề bài đọc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input py-2 text-xs sm:text-sm bg-white"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="">Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_vi}
              </option>
            ))}
          </select>

          <select
            className="input py-2 text-xs sm:text-sm bg-white"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="">Tất cả cấp độ</option>
            <option value="easy">Dễ (Easy)</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Nâng cao</option>
          </select>
        </div>
      </div>

      {/* Reading Passages Grid: Thẻ tinh gọn, không nhồi nhét đoạn văn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReadings.map((reading) => {
          const isDone = reading.is_completed;
          return (
            <div
              key={reading.id}
              className={`card card-hover p-4 sm:p-5 border-[#E8E4DC] flex flex-col justify-between group ${
                isDone ? 'bg-[#FAFDFB]' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F1EA] text-[#69706C]">
                    {reading.topic?.name_vi}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      reading.difficulty === 'easy'
                        ? 'bg-[#EBF4F0] text-[#195646]'
                        : reading.difficulty === 'medium'
                        ? 'bg-[#FDF6E9] text-[#B88728]'
                        : 'bg-[#FDF2F0] text-[#D96237]'
                    }`}
                  >
                    {reading.difficulty}
                  </span>
                </div>

                <h2 className="font-serif text-base font-bold text-[#16201B] group-hover:text-[#195646] transition-colors leading-snug">
                  {reading.title}
                </h2>
                <p className="text-xs text-[#7A807C] italic mt-0.5 mb-3 line-clamp-1">
                  {reading.title_vi}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-[#8C928E]">
                  <span className="flex items-center gap-1">
                    <HiOutlineBookOpen className="w-3.5 h-3.5" /> ~{reading.word_count} từ
                  </span>
                  <span className="flex items-center gap-1">
                    <HiOutlineClock className="w-3.5 h-3.5" /> ~{reading.estimated_time_minutes} phút
                  </span>
                </div>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#F2EEE6] flex items-center justify-between">
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#195646] font-semibold">
                    <HiOutlineCheckCircle className="w-4 h-4" /> Điểm: {reading.best_attempt?.score}/{reading.best_attempt?.total_questions}
                  </span>
                ) : (
                  <span className="text-xs text-[#9FA6A2]">Chưa làm</span>
                )}

                <Link
                  to={`/readings/${reading.id}`}
                  className="btn btn-primary text-xs py-1.5 px-3"
                >
                  {isDone ? 'Làm lại' : 'Luyện đọc'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
