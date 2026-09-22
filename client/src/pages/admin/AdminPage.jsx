import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminApi, statsApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiUsers,
  HiShieldCheck,
  HiChartBar,
  HiCheck,
  HiX,
  HiLockClosed,
  HiLockOpen,
  HiSearch
} from 'react-icons/hi';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'users') {
        const res = await adminApi.getUsers({ search: searchUser || undefined });
        setUsers(res.data || []);
      } else if (activeTab === 'community') {
        const res = await adminApi.getPendingPosts();
        setPendingPosts(res.data || []);
      } else if (activeTab === 'stats') {
        const res = await statsApi.getOverview();
        setStats(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu quản trị');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await adminApi.toggleStatus(userId);
      toast.success(res.message || 'Đã cập nhật trạng thái');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateRole(userId, newRole);
      toast.success('Đã cập nhật vai trò người dùng!');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Đổi vai trò thất bại');
    }
  };

  const handleReviewPost = async (postId, status) => {
    const note = window.prompt(`Nhập ghi chú của admin khi ${status === 'approved' ? 'phê duyệt' : 'từ chối'}:`);
    if (note === null) return;

    try {
      await adminApi.reviewPost(postId, { status, admin_note: note });
      toast.success(`Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} bài viết!`);
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      toast.error(err.message || 'Duyệt bài thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bảng Điều Khiển Quản Trị Hệ Thống</h1>
        <p className="text-gray-600">Quản lý người dùng, duyệt nội dung đóng góp cộng đồng và giám sát số liệu</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 text-sm font-semibold gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
          }`}
        >
          <HiUsers /> Quản lý người dùng
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'community' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
          }`}
        >
          <HiShieldCheck /> Duyệt bài cộng đồng ({pendingPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stats' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
          }`}
        >
          <HiChartBar /> Thống kê tổng quan
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Tab 1: Users */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-72">
                  <HiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    className="input pl-10 py-2 text-sm"
                    placeholder="Tìm username hoặc email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  />
                </div>
                <Button onClick={loadData} variant="secondary" size="sm">
                  Làm mới
                </Button>
              </div>

              <div className="card overflow-x-auto p-0 border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b">
                    <tr>
                      <th className="p-4">Người dùng</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-4 font-semibold text-gray-900">
                          <div>
                            <p>{u.full_name}</p>
                            <p className="text-xs text-gray-400 font-normal">@{u.username}</p>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono">{u.email}</td>
                        <td className="p-4">
                          <select
                            className="input py-1 text-xs"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="learner">Học viên (learner)</option>
                            <option value="group_owner">Chủ nhóm (group_owner)</option>
                            <option value="admin">Quản trị viên (admin)</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <span
                            className={`badge text-xs font-semibold ${
                              u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`btn py-1 px-3 text-xs gap-1 ${
                              u.is_active ? 'btn-danger' : 'btn-success'
                            }`}
                          >
                            {u.is_active ? (
                              <>
                                <HiLockClosed /> Khóa
                              </>
                            ) : (
                              <>
                                <HiLockOpen /> Mở khóa
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Community review */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <div key={post.id} className="card p-6 border space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge bg-purple-100 text-purple-700 text-xs font-semibold uppercase mb-1">
                        {post.content_type === 'vocab_set' ? 'Bộ từ vựng' : 'Bài đọc'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
                      <p className="text-xs text-gray-400">
                        Đăng bởi: {post.author?.full_name} ({post.author?.email}) • {new Date(post.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleReviewPost(post.id, 'approved')}
                        className="gap-1"
                      >
                        <HiCheck /> Duyệt bài
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReviewPost(post.id, 'rejected')}
                        className="gap-1"
                      >
                        <HiX /> Từ chối
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border text-xs text-gray-700 whitespace-pre-line font-mono">
                    {post.description}
                  </div>
                </div>
              ))}

              {pendingPosts.length === 0 && (
                <div className="card text-center p-12 max-w-md mx-auto space-y-3">
                  <HiShieldCheck className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-bold">Không có bài viết chờ duyệt</h3>
                  <p className="text-sm text-gray-500">Mọi đóng góp từ cộng đồng đã được xử lý xong.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Overview stats */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="card text-center p-6 bg-blue-50/50 border-blue-200">
                <p className="text-xs uppercase font-bold text-blue-700">Tổng người dùng</p>
                <p className="text-4xl font-extrabold text-blue-600 mt-2">{stats.totalUsers}</p>
              </div>

              <div className="card text-center p-6 bg-green-50/50 border-green-200">
                <p className="text-xs uppercase font-bold text-green-700">Tổng từ vựng</p>
                <p className="text-4xl font-extrabold text-green-600 mt-2">{stats.totalVocab}</p>
              </div>

              <div className="card text-center p-6 bg-purple-50/50 border-purple-200">
                <p className="text-xs uppercase font-bold text-purple-700">Tổng bài đọc</p>
                <p className="text-4xl font-extrabold text-purple-600 mt-2">{stats.totalReadings}</p>
              </div>

              <div className="card text-center p-6 bg-yellow-50/50 border-yellow-200">
                <p className="text-xs uppercase font-bold text-yellow-700">Nhóm học hoạt động</p>
                <p className="text-4xl font-extrabold text-yellow-600 mt-2">{stats.totalGroups}</p>
              </div>

              <div className="card text-center p-6 bg-pink-50/50 border-pink-200">
                <p className="text-xs uppercase font-bold text-pink-700">Bài cộng đồng duyệt</p>
                <p className="text-4xl font-extrabold text-pink-600 mt-2">{stats.totalCommunityPosts}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
