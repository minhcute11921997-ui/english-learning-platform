import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { groupApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiUserGroup,
  HiPlus,
  HiKey,
  HiArrowRight,
  HiClipboardCopy,
  HiCheck,
  HiTrash,
  HiPencil,
  HiLogout,
  HiSparkles
} from 'react-icons/hi';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState(null);
  const [leaveConfirmGroup, setLeaveConfirmGroup] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const res = await groupApi.getMyGroups();
      setGroups(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách nhóm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên nhóm học');
      return;
    }
    try {
      setIsSubmitting(true);
      await groupApi.create(formData);
      toast.success('Tạo nhóm học tập thành công!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      loadGroups();
    } catch (err) {
      toast.error(err.message || 'Tạo nhóm thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editGroup) return;
    try {
      setIsSubmitting(true);
      await groupApi.update(editGroup.id, {
        name: formData.name,
        description: formData.description
      });
      toast.success('Cập nhật thông tin nhóm thành công!');
      setEditGroup(null);
      setFormData({ name: '', description: '' });
      loadGroups();
    } catch (err) {
      toast.error(err.message || 'Cập nhật nhóm thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmGroup) return;
    try {
      setIsSubmitting(true);
      await groupApi.delete(deleteConfirmGroup.id);
      toast.success(`Đã xóa nhóm "${deleteConfirmGroup.name}" thành công`);
      setDeleteConfirmGroup(null);
      loadGroups();
    } catch (err) {
      toast.error(err.message || 'Xóa nhóm thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!leaveConfirmGroup) return;
    try {
      setIsSubmitting(true);
      await groupApi.leave(leaveConfirmGroup.id);
      toast.success(`Đã rời khỏi nhóm "${leaveConfirmGroup.name}"`);
      setLeaveConfirmGroup(null);
      loadGroups();
    } catch (err) {
      toast.error(err.message || 'Rời nhóm thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Vui lòng nhập mã mời');
      return;
    }
    try {
      setIsSubmitting(true);
      await groupApi.join(inviteCode.trim());
      toast.success('Đã tham gia nhóm thành công!');
      setShowJoinModal(false);
      setInviteCode('');
      loadGroups();
    } catch (err) {
      toast.error(err.message || 'Tham gia nhóm thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = (code, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã mời: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openEditModal = (group, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditGroup(group);
    setFormData({ name: group.name, description: group.description || '' });
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-stone-500 font-medium">Đang tải danh sách nhóm học...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            Nhóm Học Tập Của Tôi
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            variant="secondary"
            onClick={() => {
              setInviteCode('');
              setShowJoinModal(true);
            }}
            className="gap-2 text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 shadow-sm"
          >
            <HiKey className="w-4 h-4 text-emerald-700" /> Nhập mã mời
          </Button>
          <Button
            onClick={() => {
              setFormData({ name: '', description: '' });
              setShowCreateModal(true);
            }}
            className="gap-2 bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm"
          >
            <HiPlus className="w-4 h-4" /> Tạo nhóm mới
          </Button>
        </div>
      </div>

      {/* Groups Grid */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isOwner = group.member_role === 'owner';
            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-6 relative group"
              >
                <div>
                  {/* Top card bar: Role Badge & Quick Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100/70">
                      <HiUserGroup className="w-6 h-6 text-emerald-700" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          isOwner
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {isOwner ? 'Chủ nhóm' : 'Thành viên'}
                      </span>

                      {/* Action buttons on card */}
                      {isOwner ? (
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={(e) => openEditModal(group, e)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                            title="Chỉnh sửa thông tin nhóm"
                          >
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteConfirmGroup(group);
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Xóa nhóm"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLeaveConfirmGroup(group);
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Rời khỏi nhóm"
                        >
                          <HiLogout className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold font-serif text-stone-900 mb-4 line-clamp-1">
                    {group.name}
                  </h2>

                  {/* Invite Code Box */}
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs text-stone-600 mb-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      Mã mời:
                      <strong className="text-emerald-800 font-mono text-sm tracking-wider bg-white px-2 py-0.5 rounded border border-stone-200">
                        {group.invite_code}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => copyInviteCode(group.invite_code, e)}
                      className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-white rounded transition-colors"
                      title="Sao chép mã mời"
                    >
                      {copiedCode === group.invite_code ? (
                        <HiCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <HiClipboardCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
                  <Link
                    to={`/groups/${group.id}`}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white transition-colors shadow-sm w-full text-center"
                  >
                    Vào lớp <HiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 text-center p-12 max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto">
            <HiUserGroup className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold font-serif text-stone-900">
            Bạn chưa tham gia nhóm nào
          </h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            Học nhóm giúp bạn tăng 40% hiệu suất duy trì ôn từ vựng. Bạn có thể tự tạo nhóm mới hoặc nhập mã mời từ giảng viên/bạn học!
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowJoinModal(true)}
              className="gap-2 text-stone-700"
            >
              <HiKey /> Nhập mã mời
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 bg-emerald-800 hover:bg-emerald-900 text-white"
            >
              <HiPlus /> Tạo nhóm mới
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Tạo nhóm mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                <HiPlus className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Tạo Nhóm Học Tập Mới</h2>
                <p className="text-xs text-stone-500">Mở không gian học chung với bạn bè hoặc lớp học</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Tên nhóm học"
                placeholder="Ví dụ: Lớp IELTS Intensive Speaking & Vocab"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="label text-xs font-semibold text-stone-700 mb-1.5 block">
                  Mô tả nhóm
                </label>
                <textarea
                  className="input h-24 resize-none text-sm w-full"
                  placeholder="Mô tả mục tiêu, lịch học, nội dung nhóm..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  Tạo nhóm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa nhóm */}
      {editGroup && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-stone-100 text-stone-800">
                <HiPencil className="w-5 h-5 text-stone-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Chỉnh Sửa Thông Tin Nhóm</h2>
                <p className="text-xs text-stone-500">Cập nhật tên hoặc mô tả nhóm học</p>
              </div>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <Input
                label="Tên nhóm học"
                placeholder="Tên nhóm..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="label text-xs font-semibold text-stone-700 mb-1.5 block">
                  Mô tả nhóm
                </label>
                <textarea
                  className="input h-24 resize-none text-sm w-full"
                  placeholder="Mô tả mục tiêu, lịch học..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditGroup(null)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tham gia nhóm bằng mã mời */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                <HiKey className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Tham Gia Bằng Mã Mời</h2>
                <p className="text-xs text-stone-500">Nhập mã mời 8 ký tự được chia sẻ từ chủ nhóm</p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="Mã mời nhóm"
                placeholder="Ví dụ: ENG101A1"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                autoFocus
                required
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowJoinModal(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  Tham gia
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa nhóm (Chủ nhóm) */}
      {deleteConfirmGroup && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200">
                <HiTrash className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Xóa Nhóm Học Tập</h2>
                <p className="text-xs text-red-600 font-medium">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa nhóm{' '}
              <strong className="text-stone-900">"{deleteConfirmGroup.name}"</strong>? Toàn bộ danh sách bộ từ vựng, bài đọc được chia sẻ và thành viên trong nhóm sẽ bị xóa khỏi hệ thống.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteConfirmGroup(null)}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                isLoading={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận rời nhóm (Thành viên) */}
      {leaveConfirmGroup && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <HiLogout className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">Rời Khỏi Nhóm</h2>
                <p className="text-xs text-stone-500">Xác nhận rời khỏi nhóm học tập này</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              Bạn có chắc chắn muốn rời khỏi nhóm{' '}
              <strong className="text-stone-900">"{leaveConfirmGroup.name}"</strong>? Bạn sẽ không còn quyền truy cập nội dung bài tập chung của nhóm này trừ khi được mời lại.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLeaveConfirmGroup(null)}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleLeave}
                isLoading={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white border-transparent"
              >
                Rời nhóm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
