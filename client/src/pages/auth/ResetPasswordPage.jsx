import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error('Thiếu mã xác thực đặt lại mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token: token.trim(), newPassword });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Đặt lại mật khẩu</h1>
      <p className="text-sm text-slate-600 mb-5">
        Tạo mật khẩu mới cho tài khoản EngLearn của bạn.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialToken && (
          <Input
            label="Mã khôi phục"
            name="token"
            placeholder="Dán mã từ email của bạn"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        )}

        <Input
          label="Mật khẩu mới"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Tối thiểu 6 ký tự"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <Input
          label="Xác nhận mật khẩu mới"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full btn-primary py-2.5 rounded-xl">
          Cập nhật mật khẩu
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        <Link to="/login" className="text-blue-600 hover:underline font-bold">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
