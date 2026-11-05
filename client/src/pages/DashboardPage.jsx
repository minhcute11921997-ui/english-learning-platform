import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineBookmark,
  HiOutlinePaintBrush,
  HiOutlineLightBulb
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

      // Lấy ngẫu nhiên một từ tiêu điểm mỹ thuật
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
    <div className="space-y-6 pb-12">
      {/* Header gọn gàng, đậm chất mỹ thuật */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
            <HiOutlinePaintBrush className="w-4 h-4 text-amber-600" />
            Không gian học thuật ngữ Mỹ thuật &amp; Mỹ nghệ
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-0.5">
            Xin chào, {user?.full_name || user?.username}!
          </h1>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200">
            Học viên Mỹ thuật
          </span>
        </div>
      </div>

      {/* Dải thống kê từ vựng mỹ thuật & tiến độ SM-2 */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
          <div className="p-4 sm:p-5 text-center sm:text-left">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Thuật ngữ đã học</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              {stats?.learnedCount || 0}
            </p>
          </div>

          <div className="p-4 sm:p-5 text-center sm:text-left">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Đã thuần thục</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">
              {stats?.masteredCount || 0}
            </p>
          </div>

          <div className="p-4 sm:p-5 text-center sm:text-left bg-amber-50/40">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Cần ôn hôm nay</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-700 mt-1">
              {reviewStats?.dueCount || 0}
            </p>
          </div>

          <div className="p-4 sm:p-5 text-center sm:text-left">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Độ chính xác</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              {stats?.accuracyRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* 2 Danh mục chủ đề mỹ thuật chính */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <HiOutlineBookOpen className="w-5 h-5 text-amber-700" />
            Chuyên đề học tập
          </h2>
          <Link to="/topics" className="text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline">
            Tất cả chủ đề →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((t) => (
            <Link
              key={t.id}
              to={`/topics/${t.id}`}
              className="card card-hover p-5 border-stone-200 group flex items-start justify-between rounded-2xl bg-white shadow-2xs"
            >
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Chủ đề {t.id}
                </span>
                <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                  {t.name_vi}
                </h3>
                <p className="text-xs text-stone-500 font-mono">({t.name})</p>
                <p className="text-xs text-stone-600 line-clamp-2 mt-1">{t.description}</p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <HiOutlineArrowRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Khu vực trọng tâm: SRS Ôn Tập & Thuật ngữ tiêu điểm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Cột trái: Lịch ôn tập ngắt quãng (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {reviewStats && reviewStats.dueCount > 0 ? (
            <div className="card p-6 bg-gradient-to-br from-amber-50/80 to-stone-50 border-amber-200/90 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                  <HiOutlineClock className="w-4 h-4 text-amber-700" />
                  Chu kỳ ôn tập SM-2 đến hạn
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {reviewStats.dueCount} thuật ngữ cần ôn hôm nay
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                  Ôn lại ngay trước khi não bộ suy giảm ghi nhớ để đưa thuật ngữ vào trí nhớ dài hạn.
                </p>
              </div>
              <div className="mt-5">
                <Link to="/review" className="btn btn-primary text-xs py-2.5 px-5 rounded-xl shadow-xs inline-flex items-center gap-2">
                  <HiOutlineSparkles className="w-4 h-4" /> Bắt đầu ôn ngay
                </Link>
              </div>
            </div>
          ) : (
            <div className="card p-6 bg-stone-50 border-stone-200 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <HiOutlineCheckBadge className="w-4 h-4" />
                  Tiến độ tối ưu
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Đã hoàn thành các lượt ôn tập hôm nay!
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Bạn có thể vào Khám phá Chủ đề để nạp thêm các thuật ngữ mỹ nghệ mới.
                </p>
              </div>
              <div className="mt-4">
                <Link to="/topics" className="btn btn-secondary text-xs py-2 px-4 rounded-xl">
                  Học từ mới →
                </Link>
              </div>
            </div>
          )}

          {/* Quick link tới sổ từ cá nhân */}
          <div className="card p-5 border-stone-200 rounded-2xl bg-white shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <HiOutlineBookmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Sổ từ vựng cá nhân</h4>
                <p className="text-xs text-stone-500">Quản lý các danh sách thuật ngữ tự phân loại</p>
              </div>
            </div>
            <Link to="/review" className="text-xs font-semibold text-amber-800 hover:underline">
              Vào ôn tập →
            </Link>
          </div>
        </div>

        {/* Cột phải: Thuật ngữ mỹ thuật tiêu điểm hôm nay (6 cols) */}
        <div className="lg:col-span-6">
          <div className="card p-6 border-stone-200 rounded-2xl bg-white shadow-xs h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  <HiOutlineLightBulb className="w-4 h-4 text-amber-600" />
                  Thuật ngữ tiêu điểm trong ngày
                </div>
                {featuredVocab?.source_ref && (
                  <span className="text-[10px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
                    {featuredVocab.source_ref}
                  </span>
                )}
              </div>

              {featuredVocab ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-1 shrink-0 shadow-2xs">
                      <VocabImage
                        src={featuredVocab.image_url}
                        alt={featuredVocab.word}
                        className="w-full h-full rounded-xl"
                      />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-stone-900">
                        {featuredVocab.word}
                      </h3>
                      <p className="text-xs text-stone-500 font-mono mt-0.5">{featuredVocab.pronunciation}</p>
                      <p className="text-base font-bold text-amber-900 mt-1">{featuredVocab.meaning_vi}</p>
                    </div>
                  </div>

                  {/* Cultural note */}
                  <VocabSidebarInfo
                    culturalNote={featuredVocab.cultural_note}
                    relatedArtist={featuredVocab.related_artist}
                    imageCredit={featuredVocab.image_credit}
                  />
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-6 text-center">Đang tải thuật ngữ tiêu điểm...</p>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Đắm mình trong di sản nghệ thuật mỗi ngày</span>
              <Link to="/topics/1/flashcards" className="font-semibold text-amber-800 hover:underline">
                Mở Flashcards →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
