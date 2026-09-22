import { Link, useNavigate } from 'react-router-dom';
import { HiBookOpen, HiUser, HiLogout, HiMenu } from 'react-icons/hi';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';

/**
 * Header navigation component
 */
export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <HiBookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-primary-600">EngLearn</span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">Dashboard</Link>
              <Link to="/topics" className="text-gray-600 hover:text-primary-600 transition-colors">Từ vựng</Link>
              <Link to="/readings" className="text-gray-600 hover:text-primary-600 transition-colors">Đọc hiểu</Link>
              <Link to="/review" className="text-gray-600 hover:text-primary-600 transition-colors">Ôn tập</Link>
              <Link to="/groups" className="text-gray-600 hover:text-primary-600 transition-colors">Nhóm học</Link>
              <Link to="/community" className="text-gray-600 hover:text-primary-600 transition-colors">Cộng đồng</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-purple-600 hover:text-purple-800 font-semibold transition-colors">Quản trị</Link>
              )}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                  <HiUser className="h-5 w-5" />
                  <span className="hidden sm:inline">{user?.full_name || user?.username}</span>
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-danger-500 transition-colors">
                  <HiLogout className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary text-sm">Đăng nhập</Link>
                <Link to="/register" className="btn-primary text-sm">Đăng ký</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <HiMenu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && isAuthenticated && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/topics" className="text-gray-600 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>Từ vựng</Link>
              <Link to="/readings" className="text-gray-600 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>Đọc hiểu</Link>
              <Link to="/review" className="text-gray-600 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>Ôn tập</Link>
              <Link to="/groups" className="text-gray-600 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>Nhóm học</Link>
              <Link to="/community" className="text-gray-600 hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>Cộng đồng</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-purple-600 font-semibold hover:text-purple-800" onClick={() => setMobileMenuOpen(false)}>Quản trị hệ thống</Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
