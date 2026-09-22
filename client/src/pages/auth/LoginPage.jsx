import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/**
 * Trang đăng nhập
 */
export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(formData);
      toast.success('Đăng nhập thành công!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-center mb-6">Đăng nhập</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="Mật khẩu"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary-600 hover:underline font-medium">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
