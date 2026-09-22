import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { readingApi, topicApi } from '../../api/services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiBookOpen,
  HiClock,
  HiCheckCircle,
  HiFilter,
  HiSearch,
  HiSparkles,
  HiArrowRight
} from 'react-icons/hi';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Luyện Đọc Hiểu Tiếng Anh</h1>
        <p className="text-gray-600">
          Nâng cao khả năng đọc hiểu với các đoạn văn ngắn, câu hỏi trắc nghiệm kèm giải thích chi tiết
        </p>
      </div>

      {/* Recommended Section */}
      {recommended.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 space-y-4">
          <div className="flex items-center gap-2 text-primary-700">
            <HiSparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Bài đọc gợi ý riêng cho bạn</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommended.slice(0, 2).map((rec) => (
              <div key={rec.id} className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge bg-primary-100 text-primary-700 text-xs">
                      {rec.topic?.name_vi}
                    </span>
                    <span className="badge bg-yellow-100 text-yellow-800 text-xs capitalize">
                      {rec.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{rec.title}</h3>
                  <p className="text-xs text-gray-500 italic mb-3">{rec.title_vi}</p>
                </div>
                <Link
                  to={`/readings/${rec.id}`}
                  className="btn btn-primary text-xs w-full text-center py-2 gap-1"
                >
                  Đọc ngay <HiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <HiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            className="input pl-10 py-2 text-sm"
            placeholder="Tìm theo tiêu đề tiếng Anh hoặc tiếng Việt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            className="input py-2 text-sm"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="">Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_vi} ({t.name})
              </option>
            ))}
          </select>

          <select
            className="input py-2 text-sm"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="">Tất cả độ khó</option>
            <option value="easy">Dễ (Easy)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="hard">Nâng cao (Hard)</option>
          </select>
        </div>
      </div>

      {/* Reading Passages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReadings.map((reading) => {
          const isDone = reading.is_completed;
          return (
            <div
              key={reading.id}
              className={`card hover:shadow-md transition-all flex flex-col justify-between p-6 border ${
                isDone ? 'bg-green-50/20 border-green-200' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="badge bg-blue-100 text-blue-700 text-xs">
                    {reading.topic?.name_vi}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className={`badge text-xs ${
                        reading.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : reading.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {reading.difficulty}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-1">{reading.title}</h2>
                <p className="text-xs text-gray-500 italic mb-3">{reading.title_vi}</p>

                <p className="text-xs text-gray-600 line-clamp-3 mb-4">
                  {reading.content}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <HiBookOpen className="w-4 h-4" /> ~{reading.word_count} từ
                  </span>
                  <span className="flex items-center gap-1">
                    <HiClock className="w-4 h-4" /> ~{reading.estimated_time_minutes} phút
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <HiCheckCircle className="w-4 h-4" /> Điểm: {reading.best_attempt?.score}/{reading.best_attempt?.total_questions}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Chưa làm</span>
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
