import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBookOpen,
  HiAcademicCap,
  HiRefresh,
  HiUserGroup,
  HiGlobe,
  HiChartBar,
  HiSparkles,
  HiArrowRight,
  HiClock
} from 'react-icons/hi';
import useAuthStore from '../stores/authStore';
import { statsApi, readingApi, reviewApi } from '../api/services';

const features = [
  { title: 'Học từ vựng', desc: '7 chủ đề quen thuộc với 200+ từ vựng', icon: HiBookOpen, to: '/topics', color: 'bg-blue-500' },
  { title: 'Đọc hiểu', desc: '21 bài đọc kèm câu hỏi và giải thích', icon: HiAcademicCap, to: '/readings', color: 'bg-green-500' },
  { title: 'Ôn tập SRS', desc: 'Thuật toán SM-2 điều chỉnh lịch ôn', icon: HiRefresh, to: '/review', color: 'bg-orange-500' },
  { title: 'Nhóm học', desc: 'Học cùng lớp và chia sẻ bộ từ', icon: HiUserGroup, to: '/groups', color: 'bg-purple-500' },
  { title: 'Cộng đồng', desc: 'Đóng góp và khám phá bài học hay', icon: HiGlobe, to: '/community', color: 'bg-pink-500' },
  { title: 'Hồ sơ & Mục tiêu', desc: 'Quản lý tài khoản và thiết lập mục tiêu', icon: HiChartBar, to: '/profile', color: 'bg-indigo-500' }
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sRes, rRes, revRes] = await Promise.all([
        statsApi.getMyProgress(),
        readingApi.getRecommended(),
        reviewApi.getStats()
      ]);
      setStats(sRes.data);
      setRecommended(rRes.data || []);
      setReviewStats(revRes.data);
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Xin chào, {user?.full_name || user?.username}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.learning_goal ? (
              <span>🎯 <strong>Mục tiêu:</strong> {user.learning_goal}</span>
            ) : (
              <span>Hôm nay bạn muốn học từ vựng hay luyện đọc hiểu?</span>
            )}
          </p>
        </div>

        {/* Assessment prompt if not completed */}
        {user?.initial_level === null || user?.initial_level === undefined ? (
          <Link
            to="/assessment"
            className="btn btn-primary text-sm gap-2 whitespace-nowrap shadow-sm"
          >
            <HiSparkles /> Làm bài đánh giá đầu vào
          </Link>
        ) : (
          <span className="badge bg-primary-100 text-primary-800 text-xs py-1.5 px-3">
            Trình độ: {user.initial_level >= 75 ? 'Pre-Intermediate' : user.initial_level >= 50 ? 'Elementary' : 'Beginner'} ({user.initial_level}%)
          </span>
        )}
      </div>

      {/* Review reminder alert if words are due */}
      {reviewStats && reviewStats.dueCount > 0 && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <HiClock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-orange-900 text-sm">
                Bạn có {reviewStats.dueCount} từ vựng cần ôn tập hôm nay!
              </p>
              <p className="text-xs text-orange-700">
                Thuật toán SM-2 đã lên lịch ôn để giúp bạn không quên kiến thức.
              </p>
            </div>
          </div>
          <Link to="/review" className="btn btn-primary text-xs py-2 px-4 whitespace-nowrap">
            Ôn tập ngay
          </Link>
        </div>
      )}

      {/* Quick Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center p-5 border">
          <p className="text-3xl font-extrabold text-primary-600">{stats?.learnedCount || 0}</p>
          <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Từ đã học</p>
        </div>
        <div className="card text-center p-5 border">
          <p className="text-3xl font-extrabold text-green-600">{stats?.masteredCount || 0}</p>
          <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Từ thuần thục (SM-2)</p>
        </div>
        <div className="card text-center p-5 border">
          <p className="text-3xl font-extrabold text-orange-500">{reviewStats?.dueCount || 0}</p>
          <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Cần ôn hôm nay</p>
        </div>
        <div className="card text-center p-5 border">
          <p className="text-3xl font-extrabold text-indigo-600">{stats?.completedReadingsCount || 0}</p>
          <p className="text-xs text-gray-500 font-semibold uppercase mt-1">Bài đọc hoàn thành</p>
        </div>
      </div>

      {/* Recommended Reading for user */}
      {recommended.length > 0 && (
        <div className="card p-6 border bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary-800">
              <HiSparkles className="text-amber-500" /> Bài đọc đề xuất cho bạn
            </h2>
            <Link to="/readings" className="text-xs font-semibold text-primary-600 hover:underline">
              Xem tất cả bài đọc
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommended.slice(0, 2).map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-blue-100 flex justify-between items-center gap-3 shadow-sm">
                <div>
                  <span className="badge bg-blue-100 text-blue-700 text-xs mb-1">
                    {item.topic?.name_vi}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 italic">{item.title_vi}</p>
                </div>
                <Link to={`/readings/${item.id}`} className="btn btn-primary text-xs py-1.5 px-3 flex-shrink-0">
                  Đọc ngay
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">Tính năng hệ thống</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Link key={f.to} to={f.to} className="card hover:shadow-md transition-shadow group p-5 border">
              <div className="flex items-center gap-4">
                <div className={`${f.color} text-white p-3.5 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
