import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiUser, HiLogout, HiMenu, HiX } from 'react-icons/hi';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';

/**
 * Header navigation component - Editorial Scholar Studio Design
 */
export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
      isActive
        ? 'text-[#195646] bg-[#EBE7DF] font-semibold'
        : 'text-[#4A504C] hover:text-[#195646] hover:bg-[#F2EFE8]'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-all ${
      isActive
        ? 'text-[#195646] bg-[#EBE7DF] font-semibold'
        : 'text-[#4A504C] hover:text-[#195646] hover:bg-[#F2EFE8]'
    }`;

  return (
    <header className="bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E4DC] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#195646] text-white flex items-center justify-center font-serif text-lg font-bold shadow-[0_2px_6px_rgba(25,86,70,0.3)] transition-transform group-hover:scale-105">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-[#16201B] leading-none">
                EngLearn
              </span>
              <span className="text-[9.5px] font-semibold tracking-widest text-[#7E7A71] uppercase mt-0.5">
                Study Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/topics" className={navLinkClass}>Từ vựng</NavLink>
              <NavLink to="/readings" className={navLinkClass}>Đọc hiểu</NavLink>
              <NavLink to="/review" className={navLinkClass}>Ôn tập SRS</NavLink>
              <NavLink to="/groups" className={navLinkClass}>Nhóm học</NavLink>
              <NavLink to="/community" className={navLinkClass}>Cộng đồng</NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      isActive
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    }`
                  }
                >
                  Quản trị
                </NavLink>
              )}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#EFECE5] text-[#2C332F] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#E5DFD3] text-[#195646] font-bold text-xs flex items-center justify-center border border-[#D5CEC0]">
                    {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate">
                    {user?.full_name || user?.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-[#7E7A71] hover:text-[#BE123C] hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <HiLogout className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn btn-secondary text-xs px-3.5 py-2">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary text-xs px-3.5 py-2">
                  Bắt đầu học
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-[#4A504C] hover:bg-[#EFECE5] rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && isAuthenticated && (
          <nav className="md:hidden py-3 border-t border-[#E8E4DC] flex flex-col gap-1">
            <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
            <NavLink to="/topics" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Từ vựng</NavLink>
            <NavLink to="/readings" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Đọc hiểu</NavLink>
            <NavLink to="/review" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Ôn tập SRS</NavLink>
            <NavLink to="/groups" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Nhóm học</NavLink>
            <NavLink to="/community" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Cộng đồng</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Quản trị hệ thống</NavLink>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
