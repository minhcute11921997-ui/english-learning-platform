import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminApi, statsApi } from '../../api/services';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiUsers,
  HiChartBar,
  HiLockClosed,
  HiLockOpen,
  HiSearch
} from 'react-icons/hi';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold font-serif text-stone-900">Bảng Điều Khiển Quản Trị Hệ Thống</h1>
        <p className="text-sm text-stone-600 mt-1">Quản lý người dùng học thuật ngữ Mỹ thuật &amp; giám sát thống kê toàn sàn</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 text-sm font-semibold gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-amber-700 text-amber-900 font-bold' : 'border-transparent text-stone-500'
          }`}
        >
          <HiUsers /> Quản lý người dùng
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stats' ? 'border-amber-700 text-amber-900 font-bold' : 'border-transparent text-stone-500'
          }`}
        >
          <HiChartBar /> Thống kê tổng quan
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Đang tải dữ liệu quản trị..." />
        </div>
      ) : (
        <>
          {/* Tab 1: Users */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-72">
                  <HiSearch className="absolute left-3.5 top-3 text-stone-400 w-4 h-4" />
                  <input
                    type="text"
                    className="input pl-10 py-2 text-sm rounded-xl"
                    placeholder="Tìm username hoặc email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  />
                </div>
                <Button onClick={loadData} variant="secondary" size="sm" className="rounded-xl">
                  Làm mới
                </Button>
              </div>

              <div className="card overflow-x-auto p-0 border border-stone-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-4">Người dùng</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/60">
                        <td className="p-4 font-semibold text-stone-900">
                          <div>
                            <p>{u.full_name}</p>
                            <p className="text-xs text-stone-400 font-normal">@{u.username}</p>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono">{u.email}</td>
                        <td className="p-4">
                          <select
                            className="input py-1 text-xs rounded-lg"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="learner">Học viên (learner)</option>
                            <option value="admin">Quản trị viên (admin)</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <span
                            className={`badge text-xs font-semibold ${
                              u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`btn py-1 px-3 text-xs gap-1 rounded-lg ${
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

          {/* Tab 2: Overview stats */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card text-center p-6 bg-stone-50 border border-stone-200 rounded-2xl">
                <p className="text-xs uppercase font-bold text-stone-500">Tổng người dùng</p>
                <p className="text-4xl font-extrabold text-stone-900 font-serif mt-2">{stats.totalUsers}</p>
              </div>

              <div className="card text-center p-6 bg-amber-50/60 border border-amber-200 rounded-2xl">
                <p className="text-xs uppercase font-bold text-amber-800">Thuật ngữ mỹ thuật &amp; mỹ nghệ</p>
                <p className="text-4xl font-extrabold text-amber-900 font-serif mt-2">{stats.totalVocab}</p>
              </div>

              <div className="card text-center p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <p className="text-xs uppercase font-bold text-emerald-800">Chuyên đề mỹ thuật</p>
                <p className="text-4xl font-extrabold text-emerald-900 font-serif mt-2">{stats.totalTopics}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
