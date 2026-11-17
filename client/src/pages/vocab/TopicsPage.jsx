import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { topicApi, vocabListApi } from '../../api/services';
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
  HiOutlineArrowRight,
  HiOutlineFolder,
  HiOutlinePlus,
  HiOutlineFolderPlus,
  HiOutlinePaintBrush
} from 'react-icons/hi2';

const iconMap = {
  HiPaintBrush: HiOutlinePaintBrush,
  HiSparkles: HiOutlineSparkles,
  HiUser: HiOutlineUser,
  HiUserGroup: HiOutlineUserGroup,
  HiAcademicCap: HiOutlineAcademicCap,
  HiHeart: HiOutlineHeart,
  HiGlobe: HiOutlineGlobeAmericas,
  HiClock: HiOutlineClock
};

export default function TopicsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'my-lists' ? 'my-lists' : 'topics';
  const [topics, setTopics] = useState([]);
  const [myLists, setMyLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleTabChange = (tab) => {
    setSearchParams(tab === 'my-lists' ? { tab: 'my-lists' } : {});
  };

  useEffect(() => {
    let active = true;
    const fetchInitialData = async () => {
      try {
        const [tRes, lRes] = await Promise.all([
          topicApi.getAll(),
          vocabListApi.getAll().catch(() => ({ data: [] }))
        ]);
        if (!active) return;
        setTopics(tRes.data || []);
        setMyLists(lRes.data || []);
      } catch (err) {
        if (active) toast.error(err.message || 'Không thể tải dữ liệu');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchInitialData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!showCreateModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      setIsCreating(true);
      const res = await vocabListApi.create({
        name: newListName.trim(),
        description: newListDesc.trim()
      });
      setMyLists((prev) => [res.data, ...prev]);
      setNewListName('');
      setNewListDesc('');
      setShowCreateModal(false);
      toast.success(`Đã tạo bộ từ "${res.data.name}" thành công!`);
    } catch (err) {
      toast.error(err.message || 'Tạo danh sách thất bại');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Đang chuẩn bị không gian triển lãm..." />
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-14">
      {/* Header & Contemporary Tab Switcher */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Chuyên đề Mỹ thuật
        </h1>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleTabChange('topics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'topics'
                ? 'bg-white text-blue-600 shadow-sm shadow-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chủ đề Hệ thống
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('my-lists')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-lists'
                ? 'bg-white text-blue-600 shadow-sm shadow-slate-900/5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sổ từ Cá nhân ({myLists.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CHỦ ĐỀ HỆ THỐNG */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((t) => {
            const IconComponent = iconMap[t.icon] || HiOutlineBookOpen;
            return (
              <div
                key={t.id}
                className="card card-hover p-6 border-slate-200/90 rounded-3xl flex flex-col justify-between group bg-white shadow-sm"
              >
                <div>
                  {/* Header thẻ: Icon & Số lượng từ */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100 shadow-xs">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {t.vocab_count} từ
                    </span>
                  </div>

                  {/* Tên chủ đề */}
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug tracking-tight">
                    {t.name_vi}
                  </h2>

                  {/* Thanh tiến độ học */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                      <span>{t.learned_count} / {t.vocab_count} từ</span>
                      <span className="font-mono text-blue-600">{t.progress_percent}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${t.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/topics/${t.id}/flashcards`}
                    className="text-xs font-bold text-slate-700 hover:text-blue-600 hover:underline flex items-center gap-1.5"
                  >
                    <HiOutlineSparkles className="w-4 h-4 text-blue-600" />
                    Thẻ Flashcard 3D
                  </Link>

                  <Link
                    to={`/topics/${t.id}`}
                    className="btn btn-primary py-2 px-4 text-xs gap-1.5 flex items-center rounded-xl shadow-xs"
                  >
                    <span>Vào phòng triển lãm</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SỔ TỪ CỦA TÔI (BỘ TỪ TỰ TẠO) */}
      {activeTab === 'my-lists' && (
        <div className="space-y-6">
          {/* Action bar for My Lists */}
          <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Bộ sưu tập cá nhân
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary py-2.5 px-4 text-xs gap-2 flex items-center cursor-pointer rounded-xl"
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>Tạo bộ từ mới</span>
            </button>
          </div>

          {/* Grid danh sách bộ từ cá nhân */}
          {myLists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myLists.map((list) => {
                const count = parseInt(list.vocab_count || 0);
                return (
                  <div
                    key={list.id}
                    className="card card-hover p-6 border-slate-200/90 rounded-3xl flex flex-col justify-between group bg-white shadow-sm"
                  >
                    <div>
                      {/* Top icon and count */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100">
                          <HiOutlineFolder className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {count} từ
                        </span>
                      </div>

                      {/* Title */}
                      <Link to={`/vocab-lists/${list.id}`}>
                        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {list.name}
                        </h3>
                      </Link>
                      {list.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{list.description}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      {count > 0 && (
                        <Link
                          to={`/vocab-lists/${list.id}/flashcards`}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5"
                        >
                          <HiOutlineBookOpen className="w-4 h-4" />
                          <span>Flashcard</span>
                        </Link>
                      )}

                      <Link
                        to={`/vocab-lists/${list.id}`}
                        className="btn btn-secondary py-1.5 px-3.5 text-xs gap-1.5 flex items-center rounded-xl ml-auto"
                      >
                        <span>Chi tiết</span>
                        <HiOutlineArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state for custom lists */
            <div className="card p-12 text-center border-dashed border-slate-300 bg-slate-50 rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                <HiOutlineFolderPlus className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Bạn chưa có bộ sưu tập từ nào
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tạo danh sách đầu tiên (ví dụ: &ldquo;Sơn dầu Phục hưng&rdquo;, &ldquo;Gốm sứ Cổ truyền&rdquo;...) để lưu và ôn tập theo ý muốn.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary text-xs py-2.5 px-5 rounded-xl cursor-pointer"
                >
                  + Tạo bộ từ đầu tiên
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL TẠO BỘ TỪ MỚI */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-extrabold text-slate-900">
                Tạo bộ sưu tập từ mới
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Đặt tên danh sách theo mục đích hoặc trường phái nghệ thuật.
              </p>
            </div>

            <form onSubmit={handleCreateList} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Tên bộ sưu tập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ví dụ: Hội họa Trừu tượng, Kỹ nghệ Đúc đồng..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="input py-2.5 px-3.5 text-xs w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  rows="3"
                  placeholder="Ghi chú về nhóm từ vựng này..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="input py-2.5 px-3.5 text-xs w-full"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary py-2 px-4 text-xs cursor-pointer rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newListName.trim()}
                  className="btn btn-primary py-2 px-5 text-xs cursor-pointer disabled:opacity-50 rounded-xl"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo bộ từ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
