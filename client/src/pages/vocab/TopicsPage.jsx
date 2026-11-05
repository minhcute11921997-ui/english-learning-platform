import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'my-lists'
  const [topics, setTopics] = useState([]);
  const [myLists, setMyLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tRes, lRes] = await Promise.all([
        topicApi.getAll(),
        vocabListApi.getAll().catch(() => ({ data: [] }))
      ]);
      setTopics(tRes.data || []);
      setMyLists(lRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="border-b border-[#E8E4DC] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16201B]">
            Học Từ Vựng
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F0EDE6] rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'topics'
                ? 'bg-white text-[#195646] shadow-xs'
                : 'text-[#6C726E] hover:text-[#16201B]'
            }`}
          >
            Chủ đề hệ thống
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-lists')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'my-lists'
                ? 'bg-white text-[#195646] shadow-xs'
                : 'text-[#6C726E] hover:text-[#16201B]'
            }`}
          >
            Sổ từ của tôi
          </button>
        </div>
      </div>

      {/* TAB 1: CHỦ ĐỀ HỆ THỐNG */}
      {activeTab === 'topics' && (
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

                  {/* Tên chủ đề */}
                  <h2 className="font-serif text-lg font-bold text-[#16201B] group-hover:text-[#195646] transition-colors leading-snug">
                    {t.name_vi}
                  </h2>

                  {/* Thanh tiến độ học gọn gàng */}
                  <div className="mt-4 pt-3 border-t border-[#F2EEE6]">
                    <div className="flex justify-between text-[11px] font-semibold text-[#7C827E] mb-1.5">
                      <span>Tiến độ: {t.learned_count}/{t.vocab_count}</span>
                      <span>{t.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 bg-[#EFECE5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#195646] rounded-full transition-all duration-300"
                        style={{ width: `${t.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="mt-5 pt-3 border-t border-[#F2EEE6] flex items-center justify-between gap-2">
                  <Link
                    to={`/topics/${t.id}/flashcards`}
                    className="text-xs font-semibold text-[#195646] hover:text-[#123F33] hover:underline"
                  >
                    Flashcard
                  </Link>

                  <Link
                    to={`/topics/${t.id}`}
                    className="btn btn-primary py-1.5 px-3 text-xs gap-1 flex items-center"
                  >
                    <span>Vào học</span>
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
        <div className="space-y-5">
          {/* Action bar for My Lists */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E8E4DC]">
            <div>
              <h2 className="font-serif text-base font-bold text-[#16201B]">
                Các bộ từ vựng cá nhân
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary py-2 px-3.5 text-xs gap-1.5 flex items-center flex-shrink-0 cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>+ Tạo bộ từ mới</span>
            </button>
          </div>

          {/* Grid danh sách bộ từ cá nhân */}
          {myLists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {myLists.map((list) => {
                const count = parseInt(list.vocab_count || 0);
                return (
                  <div
                    key={list.id}
                    className="card card-hover p-5 border-[#E8E4DC] flex flex-col justify-between group bg-white"
                  >
                    <div>
                      {/* Top icon and count */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] text-[#8C6D3B] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#EFE5D0]">
                          <HiOutlineFolder className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF5EC] text-[#8C6D3B] border border-[#EFE5D0]">
                          {count} từ vựng
                        </span>
                      </div>

                      {/* Title */}
                      <Link to={`/vocab-lists/${list.id}`}>
                        <h3 className="font-serif text-lg font-bold text-[#16201B] group-hover:text-[#195646] transition-colors leading-snug">
                          {list.name}
                        </h3>
                      </Link>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-3 border-t border-[#F2EEE6] flex items-center justify-between gap-2">
                      {count > 0 ? (
                        <Link
                          to={`/vocab-lists/${list.id}/flashcards`}
                          className="text-xs font-semibold text-[#195646] hover:text-[#123F33] hover:underline flex items-center gap-1"
                        >
                          <HiOutlineBookOpen className="w-3.5 h-3.5" />
                          <span>Luyện Flashcard</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-[#A0A6A2] italic">Chưa có từ</span>
                      )}

                      <Link
                        to={`/vocab-lists/${list.id}`}
                        className="btn btn-outline py-1.5 px-3 text-xs gap-1 flex items-center"
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
            <div className="card p-12 text-center border-dashed border-[#DFD9CD] bg-[#FAF8F5] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBE7DF] text-[#6C726E] flex items-center justify-center mx-auto">
                <HiOutlineFolderPlus className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#16201B]">
                Bạn chưa có bộ danh sách từ nào
              </h3>
              <p className="text-xs text-[#6C726E] max-w-md mx-auto leading-relaxed">
                Hãy tạo bộ danh sách đầu tiên (ví dụ: &ldquo;Từ vựng IELTS khó&rdquo;, &ldquo;Từ vựng hay gặp&rdquo;...) để tự gom từ và ôn tập theo cách của riêng bạn.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary text-xs py-2 px-4 cursor-pointer"
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-[#E8E4DC] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#ECE7DC] bg-[#FAF8F5]">
              <h3 className="font-serif text-lg font-bold text-[#16201B]">
                Tạo bộ danh sách từ mới
              </h3>
              <p className="text-xs text-[#6C726E] mt-0.5">
                Đặt tên danh sách theo mục đích ôn tập của bạn.
              </p>
            </div>

            <form onSubmit={handleCreateList} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#16201B] block mb-1">
                  Tên danh sách: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Ví dụ: Từ vựng IELTS Reading, Từ khó Unit 1..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="input py-2 px-3 text-xs w-full border-[#CCD5D0] focus:border-[#195646]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#16201B] block mb-1">
                  Mô tả (tùy chọn):
                </label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú mục đích của bộ từ này..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="input py-2 px-3 text-xs w-full border-[#CCD5D0] focus:border-[#195646]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ECE7DC]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline py-1.5 px-3 text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newListName.trim()}
                  className="btn btn-primary py-1.5 px-4 text-xs cursor-pointer disabled:opacity-50"
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
