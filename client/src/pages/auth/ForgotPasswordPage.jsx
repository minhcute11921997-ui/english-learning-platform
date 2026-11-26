import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetToken, setDevResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập email của bạn');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSubmitted(true);
      if (res?.data?.resetToken) {
        setDevResetToken(res.data.resetToken);
      }
      toast.success('Đã xử lý yêu cầu khôi phục mật khẩu');
    } catch (error) {
      toast.error(error.message || 'Không thể gửi yêu cầu khôi phục');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Quên mật khẩu</h1>
      <p className="text-sm text-slate-600 mb-5">
        Nhập địa chỉ email đã đăng ký để nhận liên kết đặt lại mật khẩu.
      </p>

      {submitted ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
          </div>

          {devResetToken && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
              <p className="font-bold">Chế độ Development (chưa cấu hình SMTP):</p>
              <Link
                to={`/reset-password?token=${encodeURIComponent(devResetToken)}`}
                className="inline-block font-semibold text-blue-700 underline break-all"
              >
                Mở trực tiếp liên kết đặt lại mật khẩu →
              </Link>
            </div>
          )}

          <Link to="/login" className="btn btn-primary w-full justify-center py-2.5 rounded-xl">
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full btn-primary py-2.5 rounded-xl">
            Gửi liên kết khôi phục
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Đã nhớ lại mật khẩu?{' '}
        <Link to="/login" className="text-blue-600 hover:underline font-bold">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
