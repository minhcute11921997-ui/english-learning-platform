import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineArrowPath,
  HiOutlineUserGroup,
  HiOutlineGlobeAmericas,
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

  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Masthead / Header */}
      <div className="border-b border-[#E8E4DC] pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#857F74] bg-[#EFECE5] px-2.5 py-0.5 rounded-md">
                Phiên học hôm nay
              </span>
              <span className="text-xs text-[#857F74] font-medium capitalize">
                {todayFormatted}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#16201B]">
              Xin chào, {user?.full_name || user?.username}!
            </h1>
            <p className="text-sm text-[#5D635F] mt-1.5 max-w-2xl">
              {user?.learning_goal ? (
                <span>
                  <strong className="text-[#195646]">Mục tiêu:</strong> {user.learning_goal}
                </span>
              ) : (
                'Duy trì thói quen học tập đều đặn mỗi ngày với phương pháp ngắt quãng khoa học.'
              )}
            </p>
          </div>

          {/* User Assessment Status */}
          <div className="flex items-center gap-3">
            {user?.initial_level === null || user?.initial_level === undefined ? (
              <Link
                to="/assessment"
                className="btn btn-primary text-xs gap-2 whitespace-nowrap shadow-sm"
              >
                <HiOutlineSparkles className="w-4 h-4 text-emerald-200" />
                Làm bài đánh giá trình độ
              </Link>
            ) : (
              <div className="bg-[#FAF6ED] border border-[#E5DECD] px-3.5 py-2 rounded-xl text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A7A57]">
                  Trình độ hiện tại
                </p>
                <p className="text-xs font-bold text-[#195646] mt-0.5">
                  {user.initial_level >= 75
                    ? 'Pre-Intermediate'
                    : user.initial_level >= 50
                    ? 'Elementary'
                    : 'Beginner'}{' '}
                  <span className="text-[#68706B] font-normal">({user.initial_level}%)</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Metrics Strip (Replaces 4 generic AI cards) */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] shadow-[0_1px_3px_rgba(20,28,24,0.02)] overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#EFECE5]">
          <div className="p-5 sm:p-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#797F7B]">
              Từ vựng đã học
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#16201B]">
                {stats?.learnedCount || 0}
              </span>
              <span className="text-xs text-[#797F7B]">từ</span>
            </div>
            <p className="text-[11px] text-[#8C938E] mt-1">Đã thêm vào bộ nhớ</p>
          </div>

          <div className="p-5 sm:p-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#797F7B]">
              Thuần thục (SM-2)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#195646]">
                {stats?.masteredCount || 0}
              </span>
              <span className="text-xs text-[#195646] font-medium">đạt chuẩn</span>
            </div>
            <p className="text-[11px] text-[#8C938E] mt-1">Ghi nhớ dài hạn</p>
          </div>

          <div className="p-5 sm:p-6 bg-[#FEFBF7]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9C5A35]">
              Cần ôn hôm nay
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#D96237]">
                {reviewStats?.dueCount || 0}
              </span>
              <span className="text-xs text-[#D96237] font-medium">từ đến hạn</span>
            </div>
            <p className="text-[11px] text-[#A66C4C] mt-1">Thuật toán nhắc lại</p>
          </div>

          <div className="p-5 sm:p-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#797F7B]">
              Bài đọc hoàn thành
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#16201B]">
                {stats?.completedReadingsCount || 0}
              </span>
              <span className="text-xs text-[#797F7B]">bài</span>
            </div>
            <p className="text-[11px] text-[#8C938E] mt-1">Đọc hiểu & bài tập</p>
          </div>
        </div>
      </div>

      {/* Main Focus Area: Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Action & Flashcard Highlight (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SRS Action Card */}
          {reviewStats && reviewStats.dueCount > 0 ? (
            <div className="card bg-gradient-to-br from-[#FDF9F3] via-white to-[#F9EFE4] border-[#E8D9C5] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAECE0] text-[#B84E26] text-[11px] font-bold tracking-wide uppercase">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    Lịch ôn tập đến hạn
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2A1E14]">
                    Bạn có {reviewStats.dueCount} từ cần củng cố hôm nay
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6C5B4E] leading-relaxed max-w-lg">
                    Bộ não có xu hướng quên từ sau 24-48 giờ. Hãy ôn tập ngay để đưa từ vựng vào vùng trí nhớ vĩnh viễn.
                  </p>
                </div>
                <Link
                  to="/review"
                  className="btn btn-accent whitespace-nowrap self-stretch sm:self-auto gap-2"
                >
                  Ôn tập ngay
                  <HiOutlineArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="card bg-[#F4F9F6] border-[#D1E6DC] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[#195646] text-xs font-bold">
                  <HiOutlineCheckBadge className="w-4 h-4" />
                  Trạng thái học tập xuất sắc
                </div>
                <h3 className="font-serif text-lg font-bold text-[#11382E]">
                  Không có từ vựng nào bị trễ hạn hôm nay!
                </h3>
                <p className="text-xs text-[#486B60]">
                  Bạn đã hoàn thành các lượt ôn tập đúng hạn. Hãy khám phá thêm bài học mới.
                </p>
              </div>
              <Link to="/topics" className="btn btn-primary text-xs whitespace-nowrap">
                Học thêm từ mới
              </Link>
            </div>
          )}

          {/* Study Journal: Word of the Day (Bespoke tactile educational card) */}
          <div className="card p-6 border-[#E8E4DC] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-2">
                <HiOutlineLightBulb className="w-4 h-4 text-[#C98A2C]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8478]">
                  Từ vựng tiêu điểm hôm nay
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FAF5ED] text-[#9A7332] border border-[#EBDDC7]">
                ADVANCED B2
              </span>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-serif text-2xl font-bold text-[#16201B]">Perseverance</h3>
                <span className="text-xs font-mono text-[#737A75]">/ˌpɜː.sɪˈvɪə.rəns/</span>
                <span className="text-xs italic text-[#8A8478]">(noun)</span>
              </div>
              <p className="text-sm font-medium text-[#2C332F] mt-2">
                Sự kiên trì, bền bỉ vượt qua khó khăn để đạt mục tiêu dài hạn.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE7DC] text-xs text-[#4D534F] italic leading-relaxed">
                &ldquo;Mastering a new language requires patience and steady perseverance rather than occasional bursts of effort.&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Reading Spotlight (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 border-[#E8E4DC] h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
                <div className="flex items-center gap-2">
                  <HiOutlineBookmark className="w-4 h-4 text-[#195646]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E8581]">
                    Bài đọc đề xuất
                  </span>
                </div>
                <Link
                  to="/readings"
                  className="text-xs font-semibold text-[#195646] hover:underline flex items-center gap-1"
                >
                  Xem tất cả
                  <HiOutlineArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {recommended.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {recommended.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-[#ECE7DC] bg-[#FCFBF8] hover:bg-white hover:border-[#D5CEC0] transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF4F0] text-[#195646]">
                          {item.topic?.name_vi || 'Bài đọc'}
                        </span>
                        <span className="text-[11px] text-[#8E9490] flex items-center gap-1">
                          <HiOutlineClock className="w-3 h-3" /> ~4 phút
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-[#1A211D] group-hover:text-[#195646] transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#6F7571] mt-1 line-clamp-1 italic">
                        {item.title_vi}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-[#F2EEE6] flex justify-end">
                        <Link
                          to={`/readings/${item.id}`}
                          className="text-xs font-semibold text-[#195646] hover:text-[#134437] flex items-center gap-1"
                        >
                          Đọc bài này <HiOutlineArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#7B827E]">
                  Chưa có bài đọc đề xuất. Hãy khám phá thư viện để bắt đầu!
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#F0ECE4] bg-[#FAF8F5] p-3 rounded-xl">
              <p className="text-[11px] text-[#636A66] leading-relaxed">
                💡 <strong>Mẹo đọc hiểu:</strong> Đừng dừng lại tra từ điển ngay khi gặp từ mới; hãy cố gắng đoán nghĩa qua ngữ cảnh trước.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Tracks (Replaces generic 3x2 colored icon matrix) */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-5 gap-2">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#16201B]">
              Lộ trình & Không gian học tập
            </h2>
            <p className="text-xs text-[#686F6B] mt-0.5">
              Chọn phương thức học phù hợp với quỹ thời gian và mục tiêu của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Track 1: Từ vựng */}
          <Link
            to="/topics"
            className="card card-hover p-5 border-[#E8E4DC] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F0F7F4] text-[#195646] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <HiOutlineBookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#888E8A]">
                CHỦ ĐỀ & TỪ VỰNG
              </span>
              <h3 className="font-serif text-base font-bold text-[#16201B] mt-1 group-hover:text-[#195646] transition-colors">
                Học từ vựng
              </h3>
              <p className="text-xs text-[#5D635F] mt-1.5 leading-relaxed">
                Hơn 200+ từ vựng cốt lõi phân loại theo 7 chủ đề thông dụng, kèm bài tập tương tác.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-semibold text-[#195646]">
              <span>7 chủ đề</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Track 2: Đọc hiểu */}
          <Link
            to="/readings"
            className="card card-hover p-5 border-[#E8E4DC] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FDF5F2] text-[#D96237] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <HiOutlineAcademicCap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#888E8A]">
                NGỮ CẢNH THỰC TẾ
              </span>
              <h3 className="font-serif text-base font-bold text-[#16201B] mt-1 group-hover:text-[#D96237] transition-colors">
                Luyện đọc hiểu
              </h3>
              <p className="text-xs text-[#5D635F] mt-1.5 leading-relaxed">
                21 bài đọc phân cấp độ kèm câu hỏi trắc nghiệm, giải thích ngữ pháp và từ khóa.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-semibold text-[#D96237]">
              <span>21 bài đọc</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Track 3: Ôn tập SRS */}
          <Link
            to="/review"
            className="card card-hover p-5 border-[#E8E4DC] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FBF6EA] text-[#B88728] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <HiOutlineArrowPath className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#888E8A]">
                KHOA HỌC TRÍ NHỚ
              </span>
              <h3 className="font-serif text-base font-bold text-[#16201B] mt-1 group-hover:text-[#B88728] transition-colors">
                Ôn tập SRS
              </h3>
              <p className="text-xs text-[#5D635F] mt-1.5 leading-relaxed">
                Thuật toán SuperMemo SM-2 tự động phân tích độ khó để xếp lịch ôn chuẩn xác.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-semibold text-[#B88728]">
              <span>SM-2 Engine</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Track 4: Nhóm & Cộng đồng */}
          <Link
            to="/groups"
            className="card card-hover p-5 border-[#E8E4DC] flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F4F2FA] text-[#6952A3] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <HiOutlineUserGroup className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#888E8A]">
                CỘNG TÁC HỌC TẬP
              </span>
              <h3 className="font-serif text-base font-bold text-[#16201B] mt-1 group-hover:text-[#6952A3] transition-colors">
                Nhóm & Cộng đồng
              </h3>
              <p className="text-xs text-[#5D635F] mt-1.5 leading-relaxed">
                Học chung theo lớp, chia sẻ bộ flashcard tự tạo và thi đua tiến độ cùng bạn bè.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-semibold text-[#6952A3]">
              <span>Kết nối lớp học</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
