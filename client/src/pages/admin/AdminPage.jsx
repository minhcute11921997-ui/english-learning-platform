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
    <div className="space-y-7 max-w-5xl mx-auto pb-14">
      <div>
        <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
          System Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bảng Điều Khiển Quản Trị Hệ Thống
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý người dùng học thuật ngữ Mỹ thuật &amp; giám sát thống kê toàn sàn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold gap-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiUsers className="w-4 h-4" /> Quản lý người dùng
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'stats' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiChartBar className="w-4 h-4" /> Thống kê tổng quan
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" text="Đang tải dữ liệu quản trị..." />
        </div>
      ) : (
        <>
          {/* Tab 1: Users */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-80">
                  <HiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    className="input pl-10 py-2 text-xs rounded-xl"
                    placeholder="Tìm username hoặc email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  />
                </div>
                <Button onClick={loadData} variant="secondary" size="sm" className="rounded-xl text-xs py-2 px-4">
                  Làm mới
                </Button>
              </div>

              <div className="card overflow-x-auto p-0 border border-slate-200/90 rounded-3xl shadow-sm bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Người dùng</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="p-4 font-bold text-slate-900">
                          <div>
                            <p>{u.full_name}</p>
                            <p className="text-xs text-slate-400 font-mono font-normal">@{u.username}</p>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-600">{u.email}</td>
                        <td className="p-4">
                          <select
                            className="input py-1 text-xs rounded-xl w-auto"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="learner">Học viên (learner)</option>
                            <option value="admin">Quản trị viên (admin)</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <span
                            className={`badge text-[10px] uppercase font-mono font-bold px-2 py-0.5 ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`btn py-1 px-3 text-xs gap-1 rounded-xl cursor-pointer ${
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
              <div className="card text-center p-7 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
                <p className="font-mono text-xs uppercase font-bold text-slate-500">Tổng người dùng</p>
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight mt-2">{stats.totalUsers}</p>
              </div>

              <div className="card text-center p-7 bg-white border border-blue-200/80 bg-blue-50/20 rounded-3xl shadow-sm">
                <p className="font-mono text-xs uppercase font-bold text-blue-700">Thuật ngữ mỹ thuật</p>
                <p className="text-4xl font-extrabold text-blue-600 tracking-tight mt-2">{stats.totalVocab}</p>
              </div>

              <div className="card text-center p-7 bg-white border border-emerald-200/80 bg-emerald-50/20 rounded-3xl shadow-sm">
                <p className="font-mono text-xs uppercase font-bold text-emerald-700">Chuyên đề mỹ thuật</p>
                <p className="text-4xl font-extrabold text-emerald-600 tracking-tight mt-2">{stats.totalTopics}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
