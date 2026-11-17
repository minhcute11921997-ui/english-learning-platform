import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiLogout, HiMenu, HiX } from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';

/**
 * Header navigation component - Contemporary Art Studio Architecture
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
    `text-sm font-semibold px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
      isActive
        ? 'text-white bg-blue-600 shadow-sm shadow-blue-600/30'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 ${
      isActive
        ? 'text-white bg-blue-600'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/90 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo - Modern Gallery Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/30 transition-transform group-hover:scale-105">
              <HiSparkles className="w-5 h-5 text-blue-200" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-950 leading-tight">
              EngLearn<span className="text-blue-600">.art</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/dashboard" className={navLinkClass}>Bảng điều khiển</NavLink>
              <NavLink to="/topics" className={navLinkClass}>Chủ đề Mỹ thuật</NavLink>
              <NavLink to="/review" className={navLinkClass}>Ôn tập</NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
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
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                    {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {user?.full_name || user?.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <HiLogout className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn btn-secondary text-xs px-4 py-2 rounded-xl">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary text-xs px-4 py-2 rounded-xl">
                  Bắt đầu học
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 px-4 pt-3 pb-4 space-y-1.5">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Bảng điều khiển
              </NavLink>
              <NavLink to="/topics" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Chủ đề Mỹ thuật
              </NavLink>
              <NavLink to="/review" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                Ôn tập
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  Quản trị hệ thống
                </NavLink>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary text-center text-xs">
                Đăng nhập
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary text-center text-xs">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
