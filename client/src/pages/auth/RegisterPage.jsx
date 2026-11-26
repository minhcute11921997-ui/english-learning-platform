import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GoogleSignInButton from '../../components/common/GoogleSignInButton';

/**
 * Trang đăng ký tài khoản
 */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', full_name: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username || formData.username.length < 3) newErrors.username = 'Username tối thiểu 3 ký tự';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';
    if (!formData.full_name) newErrors.full_name = 'Vui lòng nhập họ tên';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...data } = formData;
      await register(data);
      toast.success('Đăng ký thành công!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Tạo tài khoản</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Họ và tên" name="full_name" autoComplete="name" placeholder="Nguyễn Văn A" value={formData.full_name} onChange={handleChange} error={errors.full_name} />
        <Input label="Tên đăng nhập" name="username" autoComplete="username" placeholder="nguyenvana" value={formData.username} onChange={handleChange} error={errors.username} />
        <Input label="Email" type="email" name="email" autoComplete="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} error={errors.email} />
        <Input label="Mật khẩu" type="password" name="password" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={handleChange} error={errors.password} />
        <Input label="Xác nhận mật khẩu" type="password" name="confirmPassword" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

        <Button type="submit" className="w-full rounded-xl btn-primary py-2.5" isLoading={isLoading}>
          Tạo tài khoản
        </Button>
      </form>

      <GoogleSignInButton redirectTo="/dashboard" />

      <p className="text-sm text-slate-600 mt-6">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-blue-600 font-bold hover:underline">
          Đăng nhập
        </Link>
      </p>

      <p className="mt-4 text-xs text-slate-500">
        Bằng việc đăng ký, bạn đồng ý với{' '}
        <Link to="/terms" className="underline hover:text-slate-700">Điều khoản sử dụng</Link>
        {' '}và{' '}
        <Link to="/privacy" className="underline hover:text-slate-700">Chính sách bảo mật</Link>.
      </p>
    </div>
  );
}
