import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { userApi, statsApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { HiUser, HiKey, HiFlag } from 'react-icons/hi';

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hồ Sơ Cá Nhân & Mục Tiêu</h1>
        <p className="text-gray-600">Quản lý tài khoản, thiết lập mục tiêu và theo dõi kết quả học tập</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center p-4 bg-blue-50/50 border-blue-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">Từ đã học</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.learnedCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-green-50/50 border-green-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">Từ thuần thục</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats?.masteredCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-purple-50/50 border-purple-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">Bài đọc xong</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{stats?.completedReadingsCount || 0}</p>
        </div>
        <div className="card text-center p-4 bg-orange-50/50 border-orange-100">
          <p className="text-xs text-gray-500 uppercase font-semibold">Độ chính xác</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{stats?.readingAccuracy || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <HiUser className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold">Thông tin tài khoản</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="label">Tên đăng nhập</label>
              <input
                className="input bg-gray-100 cursor-not-allowed"
                value={user?.username || ''}
                disabled
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input bg-gray-100 cursor-not-allowed"
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
              <span className="badge bg-primary-100 text-primary-700 capitalize">
                {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'group_owner' ? 'Chủ nhóm / Giáo viên' : 'Học viên'}
              </span>
            </div>

            <Button type="submit" isLoading={isUpdatingProfile}>
              Lưu thay đổi
            </Button>
          </form>
        </div>

        {/* Learning Goal */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <HiFlag className="w-5 h-5 text-success-600" />
            <h2 className="text-lg font-bold">Mục tiêu học tập</h2>
          </div>

          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div>
              <label className="label">Mục tiêu của bạn</label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Ví dụ: Mỗi ngày học 10 từ vựng mới, hoàn thành 2 bài đọc hiểu và ôn tập đúng lịch SM-2..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border text-sm text-gray-600 space-y-2">
              <p className="font-semibold text-gray-800">💡 Lời khuyên thiết lập mục tiêu:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
                <li>Duy trì streak học từ vựng mỗi ngày ít nhất 15 phút.</li>
                <li>Làm đầy đủ các lượt ôn tập Spaced Repetition đến hạn.</li>
                <li>Tham gia ít nhất một nhóm học để cùng bạn bè thi đua.</li>
              </ul>
            </div>

            <Button type="submit" variant="success" isLoading={isUpdatingGoal}>
              Cập nhật mục tiêu
            </Button>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="card space-y-4 max-w-md">
        <div className="flex items-center gap-2 pb-3 border-b">
          <HiKey className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold">Đổi mật khẩu</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            required
          />

          <Input
            label="Mật khẩu mới (tối thiểu 6 ký tự)"
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

          <Button type="submit" variant="outline" isLoading={isUpdatingPassword}>
            Đổi mật khẩu
          </Button>
        </form>
      </div>
    </div>
  );
}
