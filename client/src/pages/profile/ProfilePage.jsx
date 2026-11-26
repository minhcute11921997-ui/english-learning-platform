import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { authApi } from '../../api/auth.api';
import { userApi, statsApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { HiUser, HiKey, HiFlag, HiDownload, HiTrash, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({ full_name: user?.full_name || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [goal, setGoal] = useState(user?.learning_goal || '');
  const [stats, setStats] = useState(null);
  const [prevUser, setPrevUser] = useState(user);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResendingVerify, setIsResendingVerify] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setProfileData({ full_name: user.full_name || '' });
      setGoal(user.learning_goal || '');
    }
  }

  useEffect(() => {
    let active = true;
    statsApi
      .getMyProgress()
      .then((res) => {
        if (active) setStats(res.data);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      active = false;
    };
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      const res = await userApi.updateProfile(profileData);
      updateUser(res.data);
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    try {
      setIsUpdatingPassword(true);
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Đổi mật khẩu thành công!');
    } catch (err) {
      toast.error(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingGoal(true);
      const res = await userApi.setLearningGoal(goal);
      updateUser(res.data);
      toast.success('Đã lưu mục tiêu học tập!');
    } catch (err) {
      toast.error(err.message || 'Lưu mục tiêu thất bại');
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsResendingVerify(true);
      const res = await authApi.resendVerification();
      toast.success(res?.message || 'Đã gửi email xác minh!');
    } catch (err) {
      toast.error(err.message || 'Không thể gửi email xác minh');
    } finally {
      setIsResendingVerify(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await userApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `englearn-data-${user?.username || 'user'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống dữ liệu cá nhân!');
    } catch (err) {
      toast.error(err.message || 'Không thể xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error('Vui lòng nhập mật khẩu để xác nhận');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản và toàn bộ tiến độ học tập? Thao tác này không thể hoàn tác.')) {
      return;
    }
    try {
      setIsDeletingAccount(true);
      await userApi.deleteAccount(deletePassword);
      await logout();
      toast.success('Tài khoản đã được xóa vĩnh viễn');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Không thể xóa tài khoản');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-14">
      <div>
        <h1 className="page-title">
          Hồ sơ học tập
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cập nhật tài khoản và mục tiêu học của bạn.
        </p>
      </div>

      <div className="studio-metrics" aria-label="Tiến độ học tập">
        <div className="studio-metric">
          <span>Thuật ngữ đã học</span>
          <strong>{stats?.learnedCount || 0}</strong>
        </div>
        <div className="studio-metric">
          <span>Đã thuần thục</span>
          <strong>{stats?.masteredCount || 0}</strong>
        </div>
        <div className="studio-metric">
          <span>Cần ôn hôm nay</span>
          <strong>{stats?.dueTodayCount || 0}</strong>
        </div>
        <div className="studio-metric">
          <span>Độ chính xác SM-2</span>
          <strong>{stats?.accuracyRate || 0}%</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* Profile Info */}
        <div className="card space-y-5 rounded-3xl border border-slate-200/90 p-7 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <HiUser className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Thông tin tài khoản</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="label">Tên đăng nhập</label>
              <input
                className="input bg-slate-100 cursor-not-allowed text-slate-500"
                value={user?.username || ''}
                disabled
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input bg-slate-100 cursor-not-allowed text-slate-500"
                value={user?.email || ''}
                disabled
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {user?.email_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <HiCheckCircle className="w-3.5 h-3.5" />
                    Đã xác minh email
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <HiExclamationCircle className="w-3.5 h-3.5" />
                      Chưa xác minh email
                    </span>
                    <button
                      type="button"
                      disabled={isResendingVerify}
                      onClick={handleResendVerification}
                      className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {isResendingVerify ? 'Đang gửi...' : 'Gửi email xác minh'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <Input
              label="Họ và tên"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              required
            />

            <div>
              <label className="label">Vai trò</label>
              <span className="badge bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs uppercase font-bold">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên Mỹ thuật'}
              </span>
            </div>

            <Button type="submit" isLoading={isUpdatingProfile} className="rounded-xl text-xs py-2.5 px-5 btn-primary">
              Lưu thay đổi
            </Button>
          </form>
        </div>

        {/* Learning Goal & Password */}
        <div className="card space-y-6 rounded-3xl border border-slate-200/90 p-7 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <HiFlag className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Mục tiêu học tập</h2>
          </div>

          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div>
              <label className="label">
                Mục tiêu của bạn
              </label>
              <textarea
                className="input h-28 rounded-xl text-xs"
                placeholder="Ví dụ: Nghiên cứu tranh phục hưng, giao tiếp triển lãm mỹ nghệ, đọc hiểu tài liệu mỹ thuật Tate & MoMA..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <Button type="submit" variant="secondary" isLoading={isUpdatingGoal} className="rounded-xl text-xs py-2 px-4">
              Lưu mục tiêu
            </Button>
          </form>

          {/* Change Password */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <HiKey className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Đổi mật khẩu</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <Input
                label="Mật khẩu hiện tại"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
              <Input
                label="Mật khẩu mới"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
              <Input
                label="Xác nhận mật khẩu mới"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
              <Button type="submit" variant="secondary" isLoading={isUpdatingPassword} className="rounded-xl text-xs py-2 px-4">
                Cập nhật mật khẩu
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Privacy & Data Management (GDPR) */}
      <div className="card rounded-3xl border border-slate-200/90 p-7 bg-white shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Quyền riêng tư & Dữ liệu cá nhân</h2>
            <p className="text-xs text-slate-500 mt-1">
              Xem{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">Chính sách bảo mật</Link>
              {' '}và{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">Điều khoản sử dụng</Link>.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            isLoading={isExporting}
            onClick={handleExportData}
            className="rounded-xl text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <HiDownload className="w-4 h-4" />
            Tải xuống dữ liệu (.json)
          </Button>
        </div>

        <form onSubmit={handleDeleteAccount} className="rounded-2xl border border-red-200 bg-red-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-800">
            <HiTrash className="w-5 h-5" />
            <h3 className="font-bold text-sm">Xóa vĩnh viễn tài khoản</h3>
          </div>
          <p className="text-xs text-red-700">
            Toàn bộ danh sách từ vựng cá nhân, tiến độ ôn tập SM-2 và thông tin hồ sơ sẽ bị xóa vĩnh viễn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <Input
                label="Nhập mật khẩu để xác nhận"
                type="password"
                placeholder="••••••••"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              isLoading={isDeletingAccount}
              className="rounded-xl text-xs py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white"
            >
              Xóa tài khoản
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
