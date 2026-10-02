import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { topicApi } from '../../api/services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiOutlineBookOpen,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineHeart,
  HiOutlineGlobeAmericas,
  HiOutlineClock,
  HiOutlineArrowRight
} from 'react-icons/hi2';

const iconMap = {
  HiUser: HiOutlineUser,
  HiUserGroup: HiOutlineUserGroup,
  HiAcademicCap: HiOutlineAcademicCap,
  HiSparkles: HiOutlineSparkles,
  HiHeart: HiOutlineHeart,
  HiGlobe: HiOutlineGlobeAmericas,
  HiClock: HiOutlineClock
};

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setIsLoading(true);
      const res = await topicApi.getAll();
      setTopics(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách chủ đề');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header tối giản */}
      <div className="border-b border-[#E8E4DC] pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16201B]">
          Chủ đề từ vựng
        </h1>
        <p className="text-xs sm:text-sm text-[#6C726E] mt-0.5">
          Chọn chủ đề để học từ mới, ôn flashcards hoặc làm bài tập kiểm tra.
        </p>
      </div>

      {/* Grid thẻ chủ đề: Ít chữ, thoáng mắt, trực quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {topics.map((t) => {
          const IconComponent = iconMap[t.icon] || HiOutlineBookOpen;
          return (
            <div
              key={t.id}
              className="card card-hover p-5 border-[#E8E4DC] flex flex-col justify-between group"
            >
              <div>
                {/* Header thẻ: Icon & Số lượng từ */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F7F4] text-[#195646] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F4F1EA] text-[#69706C]">
                    {t.vocab_count} từ
                  </span>
                </div>

                {/* Tên chủ đề (Bỏ đoạn văn mô tả dài dòng) */}
                <h2 className="font-serif text-lg font-bold text-[#16201B] group-hover:text-[#195646] transition-colors leading-snug">
                  {t.name_vi}
                </h2>
                <p className="text-xs font-medium text-[#7C827E] mt-0.5">
                  {t.name}
                </p>

                {/* Thanh tiến độ học gọn gàng */}
                <div className="mt-4 pt-3 border-t border-[#F2EEE6]">
                  <div className="flex justify-between text-[11px] font-semibold text-[#7C827E] mb-1.5">
                    <span>Tiến độ: {t.learned_count}/{t.vocab_count}</span>
                    <span>{t.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-[#EBE7DF] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#195646] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${t.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Nút hành động chính và phụ */}
              <div className="pt-4 mt-3 border-t border-[#F2EEE6] flex items-center gap-2">
                <Link
                  to={`/topics/${t.id}`}
                  className="btn btn-primary text-xs flex-1 py-2 text-center"
                >
                  Học từ
                </Link>
                <Link
                  to={`/topics/${t.id}/flashcards`}
                  className="btn btn-secondary text-xs px-3 py-2 text-center"
                  title="Ôn Flashcards"
                >
                  Flashcard
                </Link>
                <Link
                  to={`/topics/${t.id}/exercise`}
                  className="btn btn-secondary text-xs px-3 py-2 text-center"
                  title="Làm bài tập"
                >
                  Luyện tập
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
