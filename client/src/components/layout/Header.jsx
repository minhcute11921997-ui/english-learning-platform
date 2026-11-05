import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiUser, HiLogout, HiMenu, HiX } from 'react-icons/hi';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';

/**
 * Header navigation component - Fine Arts & Crafts Studio Design
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
    `text-sm font-medium px-3.5 py-1.5 rounded-xl transition-all ${
      isActive
        ? 'text-amber-950 bg-amber-100/70 font-bold border border-amber-200/80 shadow-2xs'
        : 'text-stone-600 hover:text-amber-900 hover:bg-stone-100/80'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `text-sm font-medium px-3.5 py-2 rounded-xl transition-all ${
      isActive
        ? 'text-amber-950 bg-amber-100/70 font-bold border border-amber-200/80'
        : 'text-stone-600 hover:text-amber-900 hover:bg-stone-100/80'
    }`;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs transition-transform group-hover:scale-105">
              🎨
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-extrabold tracking-tight text-stone-900 leading-tight">
                EngLearn
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 -mt-0.5">
                Fine Arts &amp; Crafts
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink to="/dashboard" className={navLinkClass}>Bảng điều khiển</NavLink>
              <NavLink to="/topics" className={navLinkClass}>Chủ đề Mỹ thuật</NavLink>
              <NavLink to="/review" className={navLinkClass}>Ôn tập hôm nay (SM-2)</NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      isActive
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                        : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
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
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 text-stone-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-200">
                    {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate">
                    {user?.full_name || user?.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <HiLogout className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary text-xs px-3.5 py-2 rounded-xl">
                  Bắt đầu học
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && isAuthenticated && (
          <nav className="md:hidden py-3 border-t border-stone-200 flex flex-col gap-1">
            <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
              Bảng điều khiển
            </NavLink>
            <NavLink to="/topics" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
              Chủ đề Mỹ thuật
            </NavLink>
            <NavLink to="/review" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
              Ôn tập hôm nay (SM-2)
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                Quản trị hệ thống
              </NavLink>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
