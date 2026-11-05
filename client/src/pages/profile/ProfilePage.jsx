import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { userApi, statsApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { HiUser, HiKey, HiFlag } from 'react-icons/hi';
import { HiOutlineSparkles, HiOutlinePaintBrush } from 'react-icons/hi2';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileData, setProfileData] = useState({ full_name: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [goal, setGoal] = useState('');
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({ full_name: user.full_name || '' });
      setGoal(user.learning_goal || '');
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await statsApi.getMyProgress();
      setStats(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoadingStats(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-14">
      <div>
        <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
          Profile &amp; Learning Goals
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hồ Sơ Học Viên &amp; Thiết Lập Mục Tiêu
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý tài khoản, tiến độ ghi nhớ thuật ngữ và chu kỳ ôn tập ngắt quãng SM-2
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <p className="font-mono text-[11px] text-slate-500 uppercase font-bold">Thuật ngữ đã học</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{stats?.learnedCount || 0}</p>
        </div>
        <div className="card text-center p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <p className="font-mono text-[11px] text-emerald-600 uppercase font-bold">Đã thuần thục</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1 tracking-tight">{stats?.masteredCount || 0}</p>
        </div>
        <div className="card text-center p-5 bg-white border border-blue-200/80 bg-blue-50/20 rounded-2xl shadow-xs">
          <p className="font-mono text-[11px] text-blue-700 uppercase font-bold">Cần ôn hôm nay</p>
          <p className="text-3xl font-extrabold text-blue-700 mt-1 tracking-tight">{stats?.dueTodayCount || 0}</p>
        </div>
        <div className="card text-center p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <p className="font-mono text-[11px] text-slate-500 uppercase font-bold">Độ chính xác SM-2</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{stats?.accuracyRate || 0}%</p>
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
    </div>
  );
}
