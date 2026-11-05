import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineBookmark,
  HiOutlinePaintBrush,
  HiOutlineLightBulb,
  HiOutlineArrowTrendingUp,
  HiOutlineFire
} from 'react-icons/hi2';
import useAuthStore from '../stores/authStore';
import { statsApi, reviewApi, topicApi, vocabApi } from '../api/services';
import VocabImage from '../components/vocab/VocabImage';
import VocabSidebarInfo from '../components/vocab/VocabSidebarInfo';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [featuredVocab, setFeaturedVocab] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sRes, revRes, topRes] = await Promise.all([
        statsApi.getMyProgress(),
        reviewApi.getStats(),
        topicApi.getAll()
      ]);
      setStats(sRes.data);
      setReviewStats(revRes.data);
      const loadedTopics = topRes.data || [];
      setTopics(loadedTopics);

      // Lấy tác phẩm tiêu điểm
      if (loadedTopics.length > 0) {
        const vRes = await vocabApi.getByTopic(loadedTopics[0].id, { limit: 10 });
        const list = vRes.data || [];
        if (list.length > 0) {
          setFeaturedVocab(list[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-7 pb-14">
      {/* Hero Welcome Banner - Contemporary Atelier */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white border-0 shadow-xl shadow-slate-900/10 rounded-3xl relative overflow-hidden">
        {/* Subtle background ambient mesh */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-64 h-64 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-mono font-bold tracking-wider uppercase">
              <HiOutlinePaintBrush className="w-4 h-4 text-blue-300" />
              Contemporary Fine Arts Atelier
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Chào mừng, {user?.full_name || user?.username}!
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Nền tảng học thuật ngữ tiếng Anh chuyên ngành Mỹ thuật &amp; Kỹ nghệ thủ công truyền thống qua tác phẩm trực quan.
            </p>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <Link
              to="/review"
              className="btn bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-lg shadow-blue-600/30 inline-flex items-center gap-2"
            >
              <HiOutlineClock className="w-4 h-4" />
              Ôn tập SM-2 {reviewStats?.dueCount > 0 && `(${reviewStats.dueCount})`}
            </Link>
          </div>
        </div>
      </div>

      {/* Dải Telemetry Thống kê Hiện Đại */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Đã học</span>
            <HiOutlineSparkles className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats?.learnedCount || 0}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">/ 60 thuật ngữ tiêu chuẩn</span>
        </div>

        <div className="card p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Đã thuần thục</span>
            <HiOutlineCheckBadge className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            {stats?.masteredCount || 0}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Khoảng cách SM-2 &gt; 21 ngày</span>
        </div>

        <div className="card p-5 bg-white border border-blue-200/80 bg-blue-50/30 rounded-2xl shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700">Cần ôn hôm nay</span>
            <HiOutlineClock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-700 tracking-tight">
            {reviewStats?.dueCount || 0}
          </p>
          <span className="text-xs text-blue-600/80 mt-1 block">Lập lịch theo chu kỳ trí nhớ</span>
        </div>

        <div className="card p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">Độ chính xác</span>
            <HiOutlineArrowTrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats?.accuracyRate || 0}%
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Tỷ lệ trả lời đúng câu hỏi</span>
        </div>
      </div>

      {/* 2 Chuyên đề Nghệ thuật Chính */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Không gian Trưng bày Chuyên đề
            </h2>
            <p className="text-xs text-slate-500">
              Khám phá hệ thống thuật ngữ chuyên sâu theo 2 ngành hội họa &amp; mỹ nghệ
            </p>
          </div>
          <Link to="/topics" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
            Tất cả chủ đề →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {topics.map((t, idx) => (
            <Link
              key={t.id}
              to={`/topics/${t.id}`}
              className="card card-hover p-6 border-slate-200/90 group flex items-start justify-between rounded-3xl bg-white shadow-sm relative overflow-hidden"
            >
              <div className="space-y-2 relative z-10">
                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60 uppercase tracking-wider">
                  Exhibition Room 0{idx + 1}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {t.name_vi}
                </h3>
                <p className="font-mono text-xs text-slate-400">{t.name}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">{t.description}</p>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                <HiOutlineArrowRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tác phẩm Tiêu điểm Hôm nay & SRS Study Pod */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Tác phẩm tiêu điểm (7 cols) */}
        <div className="lg:col-span-7">
          <div className="card p-6 sm:p-7 border-slate-200/90 rounded-3xl bg-white shadow-sm h-full flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  <HiOutlineLightBulb className="w-4 h-4 text-blue-600" />
                  Spotlight Artwork of the Day
                </div>
                {featuredVocab?.source_ref && (
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md font-semibold">
                    {featuredVocab.source_ref}
                  </span>
                )}
              </div>

              {featuredVocab ? (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-1.5 shrink-0 shadow-md">
                      <VocabImage
                        src={featuredVocab.image_url}
                        alt={featuredVocab.word}
                        className="w-full h-full rounded-xl"
                        enableZoom={true}
                      />
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left">
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {featuredVocab.part_of_speech}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {featuredVocab.word}
                      </h3>
                      <p className="text-xs font-mono text-slate-500">{featuredVocab.pronunciation}</p>
                      <p className="text-base font-bold text-slate-800 pt-1">{featuredVocab.meaning_vi}</p>
                    </div>
                  </div>

                  {/* Sidebar / Cultural Info */}
                  <VocabSidebarInfo
                    culturalNote={featuredVocab.cultural_note}
                    relatedArtist={featuredVocab.related_artist}
                    imageCredit={featuredVocab.image_credit}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Đang tải tác phẩm nghệ thuật tiêu điểm...
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">Daily Gallery Spotlight</span>
              <Link to="/topics/1" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Xem phòng tranh →
              </Link>
            </div>
          </div>
        </div>

        {/* Lịch ôn tập & Sổ từ vựng (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Lịch ôn tập SM-2 */}
          <div className="card p-6 border-slate-200/90 rounded-3xl bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                <HiOutlineClock className="w-4 h-4 text-blue-600" />
                Spaced Repetition (SM-2)
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {reviewStats && reviewStats.dueCount > 0
                  ? `${reviewStats.dueCount} thuật ngữ đến hạn ôn tập`
                  : 'Hôm nay bạn đã hoàn thành ôn tập!'}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {reviewStats && reviewStats.dueCount > 0
                  ? 'Thuật toán SM-2 tính toán chu kỳ ôn tập ngắt quãng để kích hoạt vùng nhớ dài hạn trước khi xảy ra hiện tượng quên lãng.'
                  : 'Trí nhớ dài hạn của bạn đang ở trạng thái tối ưu. Hãy tiếp tục khám phá các tác phẩm mới.'}
              </p>
            </div>
            <div className="mt-5">
              {reviewStats && reviewStats.dueCount > 0 ? (
                <Link to="/review" className="btn btn-primary text-xs w-full py-2.5 rounded-xl gap-2">
                  <HiOutlineClock className="w-4 h-4" /> Bắt đầu phiên ôn tập ngay
                </Link>
              ) : (
                <Link to="/topics" className="btn btn-secondary text-xs w-full py-2.5 rounded-xl">
                  Khám phá từ vựng mới →
                </Link>
              )}
            </div>
          </div>

          {/* Sổ từ vựng cá nhân */}
          <div className="card p-6 border-slate-200/90 rounded-3xl bg-white shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <HiOutlineBookmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Sổ từ cá nhân</h4>
                <p className="text-xs text-slate-500">Bộ sưu tập thuật ngữ tự lưu</p>
              </div>
            </div>
            <Link to="/review" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Mở sổ →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
