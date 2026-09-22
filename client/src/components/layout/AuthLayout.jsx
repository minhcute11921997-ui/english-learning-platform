import { Outlet, Link } from 'react-router-dom';
import { HiBookOpen } from 'react-icons/hi';

/**
 * Layout cho trang đăng nhập/đăng ký
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <HiBookOpen className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-primary-600">EngLearn</span>
          </Link>
          <p className="mt-2 text-gray-600">Học tiếng Anh hiệu quả mỗi ngày</p>
        </div>

        {/* Content */}
        <div className="card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
