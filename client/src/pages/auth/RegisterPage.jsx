import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
      const { confirmPassword, ...data } = formData;
      await register(data);
      toast.success('Đăng ký thành công!');
      navigate('/assessment', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-center mb-6">Tạo tài khoản</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Họ và tên" name="full_name" placeholder="Nguyễn Văn A" value={formData.full_name} onChange={handleChange} error={errors.full_name} />
        <Input label="Username" name="username" placeholder="nguyenvana" value={formData.username} onChange={handleChange} error={errors.username} />
        <Input label="Email" type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} error={errors.email} />
        <Input label="Mật khẩu" type="password" name="password" placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={handleChange} error={errors.password} />
        <Input label="Xác nhận mật khẩu" type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary-600 hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
