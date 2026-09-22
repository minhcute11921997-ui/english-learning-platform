import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { topicApi } from '../../api/services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiBookOpen,
  HiUser,
  HiUserGroup,
  HiAcademicCap,
  HiSparkles,
  HiHeart,
  HiGlobe,
  HiClock,
  HiArrowRight,
  HiLightningBolt,
  HiViewGrid
} from 'react-icons/hi';

const iconMap = {
  HiUser: HiUser,
  HiUserGroup: HiUserGroup,
  HiAcademicCap: HiAcademicCap,
  HiSparkles: HiSparkles,
  HiHeart: HiHeart,
  HiGlobe: HiGlobe,
  HiClock: HiClock
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Học Từ Vựng Theo Chủ Đề</h1>
        <p className="text-gray-600">Khám phá 7 chủ đề thông dụng với hơn 200 từ vựng căn bản, flashcards và bài tập</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((t) => {
          const IconComponent = iconMap[t.icon] || HiBookOpen;
          return (
            <div key={t.id} className="card hover:shadow-md transition-all flex flex-col justify-between p-6">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3.5 rounded-xl bg-primary-50 text-primary-600">
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <span className="badge bg-gray-100 text-gray-700 font-medium">
                    {t.vocab_count} từ vựng
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-1">{t.name_vi}</h2>
                <p className="text-sm font-semibold text-primary-600 mb-2">{t.name}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{t.description}</p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                    <span>Tiến độ: {t.learned_count} / {t.vocab_count} từ</span>
                    <span>{t.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${t.progress_percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t flex items-center justify-between gap-2">
                <Link
                  to={`/topics/${t.id}`}
                  className="btn btn-primary text-xs flex-1 text-center py-2"
                >
                  Học từ
                </Link>
                <Link
                  to={`/topics/${t.id}/flashcards`}
                  className="btn btn-secondary text-xs flex-1 text-center py-2"
                >
                  Flashcards
                </Link>
                <Link
                  to={`/topics/${t.id}/exercise`}
                  className="btn btn-outline text-xs flex-1 text-center py-2"
                >
                  Bài tập
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
