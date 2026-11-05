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
    } catch (err) {
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold font-serif text-stone-900">Hồ Sơ Cá Nhân &amp; Mục Tiêu Học Tập</h1>
        <p className="text-sm text-stone-600 mt-1">Quản lý tài khoản, thiết lập mục tiêu và theo dõi tiến độ thuật ngữ Mỹ thuật</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <p className="text-xs text-stone-500 uppercase font-semibold">Thuật ngữ đã học</p>
          <p className="text-3xl font-bold font-serif text-stone-900 mt-1">{stats?.learnedCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
          <p className="text-xs text-emerald-800 uppercase font-semibold">Đã thuần thục</p>
          <p className="text-3xl font-bold font-serif text-emerald-700 mt-1">{stats?.masteredCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
          <p className="text-xs text-amber-800 uppercase font-semibold">Cần ôn hôm nay</p>
          <p className="text-3xl font-bold font-serif text-amber-700 mt-1">{stats?.dueTodayCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <p className="text-xs text-stone-500 uppercase font-semibold">Độ chính xác SM-2</p>
          <p className="text-3xl font-bold font-serif text-stone-900 mt-1">{stats?.accuracyRate || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info */}
        <div className="card space-y-4 rounded-2xl border border-stone-200 p-6 bg-white">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
            <HiUser className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-bold font-serif text-stone-900">Thông tin tài khoản</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="label text-xs font-semibold text-stone-600">Tên đăng nhập</label>
              <input
                className="input bg-stone-100 cursor-not-allowed rounded-xl text-stone-600 text-sm"
                value={user?.username || ''}
                disabled
              />
            </div>

            <div>
              <label className="label text-xs font-semibold text-stone-600">Email</label>
              <input
                className="input bg-stone-100 cursor-not-allowed rounded-xl text-stone-600 text-sm"
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
              <label className="label text-xs font-semibold text-stone-600">Vai trò</label>
              <span className="badge bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs capitalize">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên Mỹ thuật'}
              </span>
            </div>

            <Button type="submit" isLoading={isUpdatingProfile} className="rounded-xl">
              Lưu thay đổi
            </Button>
          </form>
        </div>

        {/* Learning Goal */}
        <div className="card space-y-4 rounded-2xl border border-stone-200 p-6 bg-white">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
            <HiFlag className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-bold font-serif text-stone-900">Mục tiêu học tập mỹ thuật</h2>
          </div>

          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div>
              <label className="label text-xs font-semibold text-stone-600">
                Mục tiêu của bạn (ví dụ: Nghiên cứu tranh phục hưng, giao tiếp triển lãm mỹ nghệ...)
              </label>
              <textarea
                className="input h-32 rounded-xl text-sm"
                placeholder="Nhập mục tiêu học tập cá nhân..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <Button type="submit" variant="secondary" isLoading={isUpdatingGoal} className="rounded-xl">
              Lưu mục tiêu
            </Button>
          </form>

          {/* Change Password */}
          <div className="pt-6 border-t border-stone-200 space-y-4">
            <div className="flex items-center gap-2">
              <HiKey className="w-5 h-5 text-amber-700" />
              <h3 className="font-bold font-serif text-stone-900 text-base">Đổi mật khẩu</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
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
              <Button type="submit" variant="secondary" isLoading={isUpdatingPassword} className="rounded-xl">
                Cập nhật mật khẩu
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
