import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineArrowPath,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineBookmark,
  HiOutlineLightBulb
} from 'react-icons/hi2';
import useAuthStore from '../stores/authStore';
import { statsApi, readingApi, reviewApi } from '../api/services';

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
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header gọn gàng, thoáng mắt */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-[#E8E4DC]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16201B]">
            Xin chào, {user?.full_name || user?.username}!
          </h1>
          <p className="text-xs sm:text-sm text-[#6C726E] mt-0.5">
            {user?.learning_goal ? `Mục tiêu: ${user.learning_goal}` : 'Học tập đều đặn mỗi ngày.'}
          </p>
        </div>

        {/* Level badge */}
        <div>
          {user?.initial_level === null || user?.initial_level === undefined ? (
            <Link
              to="/assessment"
              className="btn btn-primary text-xs gap-1.5 py-2 px-3.5"
            >
              <HiOutlineSparkles className="w-4 h-4 text-emerald-200" />
              Đánh giá đầu vào
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F4F1EA] text-[#195646] text-xs font-semibold border border-[#E5DECD]">
              Trình độ:{' '}
              {user.initial_level >= 75
                ? 'Pre-Intermediate'
                : user.initial_level >= 50
                ? 'Elementary'
                : 'Beginner'}
            </span>
          )}
        </div>
      </div>

      {/* Dải thống kê tối giản (Gọn gàng, không thừa chữ) */}
      <div className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFECE5]">
          <div className="p-4 text-center sm:text-left">
            <span className="text-[11px] font-semibold text-[#828884] uppercase">Từ đã học</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#16201B] mt-1">
              {stats?.learnedCount || 0}
            </p>
          </div>

          <div className="p-4 text-center sm:text-left">
            <span className="text-[11px] font-semibold text-[#828884] uppercase">Thuần thục</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#195646] mt-1">
              {stats?.masteredCount || 0}
            </p>
          </div>

          <div className="p-4 text-center sm:text-left bg-[#FEFAF6]">
            <span className="text-[11px] font-semibold text-[#9C5A35] uppercase">Cần ôn hôm nay</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#D96237] mt-1">
              {reviewStats?.dueCount || 0}
            </p>
          </div>

          <div className="p-4 text-center sm:text-left">
            <span className="text-[11px] font-semibold text-[#828884] uppercase">Bài đọc xong</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#16201B] mt-1">
              {stats?.completedReadingsCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Danh mục học tập chính - Rất ít chữ, thoáng và dễ bấm */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          to="/topics"
          className="card card-hover p-4 sm:p-5 border-[#E8E4DC] group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0F7F4] text-[#195646] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HiOutlineBookOpen className="w-5 h-5" />
            </div>
            <HiOutlineArrowRight className="w-4 h-4 text-[#A0A6A2] group-hover:text-[#195646] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#16201B] group-hover:text-[#195646] transition-colors">
              Từ vựng
            </h3>
            <p className="text-xs text-[#7B827E] mt-0.5">7 chủ đề · 200+ từ</p>
          </div>
        </Link>

        <Link
          to="/readings"
          className="card card-hover p-4 sm:p-5 border-[#E8E4DC] group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF5F2] text-[#D96237] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HiOutlineAcademicCap className="w-5 h-5" />
            </div>
            <HiOutlineArrowRight className="w-4 h-4 text-[#A0A6A2] group-hover:text-[#D96237] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#16201B] group-hover:text-[#D96237] transition-colors">
              Đọc hiểu
            </h3>
            <p className="text-xs text-[#7B827E] mt-0.5">21 bài đọc & câu hỏi</p>
          </div>
        </Link>

        <Link
          to="/review"
          className="card card-hover p-4 sm:p-5 border-[#E8E4DC] group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBF6EA] text-[#B88728] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HiOutlineArrowPath className="w-5 h-5" />
            </div>
            <HiOutlineArrowRight className="w-4 h-4 text-[#A0A6A2] group-hover:text-[#B88728] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#16201B] group-hover:text-[#B88728] transition-colors">
              Ôn tập hôm nay
            </h3>
            <p className="text-xs text-[#7B827E] mt-0.5">Nhắc nhở từ sắp quên</p>
          </div>
        </Link>

        <Link
          to="/groups"
          className="card card-hover p-4 sm:p-5 border-[#E8E4DC] group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F2FA] text-[#6952A3] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HiOutlineUserGroup className="w-5 h-5" />
            </div>
            <HiOutlineArrowRight className="w-4 h-4 text-[#A0A6A2] group-hover:text-[#6952A3] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#16201B] group-hover:text-[#6952A3] transition-colors">
              Nhóm học
            </h3>
            <p className="text-xs text-[#7B827E] mt-0.5">Lớp học & Chia sẻ bộ từ</p>
          </div>
        </Link>
      </div>

      {/* Khu vực trọng tâm: SRS Ôn Tập & Bài Đọc Đề Xuất */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Cột trái: Lịch ôn tập hoặc Trạng thái ôn (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {reviewStats && reviewStats.dueCount > 0 ? (
            <div className="card p-5 bg-[#FDF9F4] border-[#E8D9C5] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#B84E26] mb-1">
                  <HiOutlineClock className="w-4 h-4" />
                  LỊCH ÔN ĐẾN HẠN
                </div>
                <h3 className="font-serif text-lg font-bold text-[#2A1E14]">
                  {reviewStats.dueCount} từ vựng cần ôn hôm nay
                </h3>
                <p className="text-xs text-[#6C5B4E] mt-0.5">
                  Ôn đúng chu kỳ để giữ từ trong trí nhớ dài hạn.
                </p>
              </div>
              <Link to="/review" className="btn btn-accent text-xs whitespace-nowrap self-start sm:self-auto py-2 px-4">
                Ôn ngay
              </Link>
            </div>
          ) : (
            <div className="card p-5 bg-[#F4F9F6] border-[#D1E6DC] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-[#195646] text-xs font-bold mb-1">
                  <HiOutlineCheckBadge className="w-4 h-4" />
                  TIẾN ĐỘ TỐT
                </div>
                <h3 className="font-serif text-base font-bold text-[#11382E]">
                  Đã hoàn thành mọi lượt ôn tập hôm nay
                </h3>
              </div>
              <Link to="/topics" className="btn btn-primary text-xs whitespace-nowrap self-start sm:self-auto py-2 px-3.5">
                Học từ mới
              </Link>
            </div>
          )}

          {/* Từ vựng tiêu điểm hôm nay - Ngắn gọn, súc tích */}
          <div className="card p-5 border-[#E8E4DC]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8A8478]">
                <HiOutlineLightBulb className="w-4 h-4 text-[#C98A2C]" />
                Từ vựng hôm nay
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF5ED] text-[#9A7332] border border-[#EBDDC7]">
                B2
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-serif text-xl font-bold text-[#16201B]">Perseverance</span>
              <span className="text-xs font-mono text-[#737A75]">/ˌpɜː.sɪˈvɪə.rəns/</span>
              <span className="text-xs text-[#8A8478]">(n)</span>
            </div>
            <p className="text-xs sm:text-sm text-[#4A504C] mt-1.5">
              Sự kiên trì, bền bỉ để đạt được mục tiêu lâu dài.
            </p>
          </div>
        </div>

        {/* Cột phải: Bài đọc đề xuất (5 cols) */}
        <div className="lg:col-span-5">
          <div className="card p-5 border-[#E8E4DC] h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F0ECE4]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7E8581]">
                  <HiOutlineBookmark className="w-4 h-4 text-[#195646]" />
                  Bài đọc đề xuất
                </div>
                <Link to="/readings" className="text-xs font-semibold text-[#195646] hover:underline">
                  Xem tất cả
                </Link>
              </div>

              {recommended.length > 0 ? (
                <div className="space-y-2.5">
                  {recommended.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      to={`/readings/${item.id}`}
                      className="block p-3 rounded-xl border border-[#ECE7DC] bg-[#FCFBF8] hover:bg-white hover:border-[#D5CEC0] transition-all group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#8E9490] mb-1">
                        <span className="font-medium text-[#195646] bg-[#EBF4F0] px-2 py-0.5 rounded-full">
                          {item.topic?.name_vi || 'Bài đọc'}
                        </span>
                        <span>~4 phút</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-[#1A211D] group-hover:text-[#195646] transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#727874] mt-0.5 line-clamp-1 italic">
                        {item.title_vi}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E9490] py-6 text-center">
                  Chưa có bài đọc đề xuất.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0ECE4] text-[11px] text-[#767D79] flex items-center justify-between">
              <span>Đọc đều đặn để tăng phản xạ ngữ cảnh</span>
              <Link to="/readings" className="font-semibold text-[#195646] hover:underline">
                Vào thư viện →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
