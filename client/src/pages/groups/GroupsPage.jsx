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
  HiCheck
} from 'react-icons/hi';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '' });
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
    try {
      setIsSubmitting(true);
      await groupApi.create(createData);
      toast.success('Tạo nhóm học tập thành công!');
      setShowCreateModal(false);
      setCreateData({ name: '', description: '' });
      loadGroups();
    } catch (err) {
      toast.error(err.message || 'Tạo nhóm thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await groupApi.join(inviteCode);
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

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Nhóm Học Tập Của Tôi</h1>
          <p className="text-gray-600">
            Học tập cùng lớp, chia sẻ bộ từ vựng và theo dõi tiến độ hoàn thành của các thành viên
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowJoinModal(true)} className="gap-2">
            <HiKey /> Nhập mã mời
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <HiPlus /> Tạo nhóm mới
          </Button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const isOwner = group.member_role === 'owner';
          return (
            <div
              key={group.id}
              className="card hover:shadow-md transition-all flex flex-col justify-between p-6 border"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <HiUserGroup className="w-6 h-6" />
                  </div>

                  <span
                    className={`badge text-xs ${
                      isOwner
                        ? 'bg-purple-100 text-purple-800 font-bold'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isOwner ? 'Chủ nhóm' : 'Thành viên'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-1">{group.name}</h2>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                  {group.description || 'Chưa có mô tả cho nhóm này.'}
                </p>

                {/* Invite code box */}
                <div className="p-3 rounded-xl bg-gray-50 border flex items-center justify-between text-xs text-gray-600 mb-4">
                  <span>Mã mời: <strong className="text-primary-700 font-mono text-sm tracking-wider">{group.invite_code}</strong></span>
                  <button
                    onClick={(e) => copyInviteCode(group.invite_code, e)}
                    className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Sao chép mã mời"
                  >
                    {copiedCode === group.invite_code ? (
                      <HiCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <HiClipboardCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Chủ nhóm: {group.owner?.full_name || group.owner?.username}
                </span>

                <Link
                  to={`/groups/${group.id}`}
                  className="btn btn-primary text-xs py-1.5 px-3 gap-1"
                >
                  Vào lớp <HiArrowRight />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="card text-center p-12 max-w-md mx-auto space-y-4">
          <HiUserGroup className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">Bạn chưa tham gia nhóm nào</h3>
          <p className="text-sm text-gray-500">
            Hãy nhập mã mời từ bạn bè/thầy cô hoặc tự tạo nhóm học tập của riêng bạn!
          </p>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">Tạo Nhóm Học Tập Mới</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Tên nhóm học"
                placeholder="Ví dụ: Nhóm Luyện Thi Tiếng Anh A2"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                required
              />

              <div>
                <label className="label">Mô tả nhóm</label>
                <textarea
                  className="input h-24 resize-none"
                  placeholder="Mô tả mục tiêu, lịch học, nội dung nhóm..."
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Tạo nhóm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">Tham Gia Nhóm Bằng Mã Mời</h2>
            <p className="text-sm text-gray-600">Nhập mã mời 8 ký tự được chia sẻ từ chủ nhóm</p>

            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="Mã mời nhóm"
                placeholder="Ví dụ: ENG101A1"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowJoinModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Tham gia
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
