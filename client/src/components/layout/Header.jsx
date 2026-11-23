import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import Brand from './Brand';

const sections = [
  { to: '/dashboard', label: 'Hôm nay' },
  { to: '/topics', label: 'Chủ đề' },
  { to: '/review', label: 'Ôn tập' },
  { to: '/ai-chat', label: 'Tra ảnh' }
];

function navClass({ isActive }) {
  return isActive ? 'studio-nav-link is-current' : 'studio-nav-link';
}

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { key } = useLocation();
  const [openForLocation, setOpenForLocation] = useState(null);
  const menuOpen = openForLocation === key;
  const name = user?.full_name || user?.username || 'Học viên';
  const links = user?.role === 'admin' ? [...sections, { to: '/admin', label: 'Quản trị' }] : sections;
  const activeLink = (link, close) => (
    <NavLink
      key={link.to}
      to={link.to}
      className={navClass}
      onClick={close}
      end={link.to === '/dashboard'}
    >
      {link.label}
    </NavLink>
  );

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="studio-header">
      <div className="studio-header-inner">
        <Brand />
        <nav className="studio-nav" aria-label="Điều hướng chính">
          {links.map(link => activeLink(link))}
        </nav>
        <div className="studio-account">
          <NavLink to="/profile" className="studio-profile" aria-label={`Hồ sơ của ${name}`}>
            <span className="studio-avatar" aria-hidden="true">{name[0].toUpperCase()}</span>
            <span className="studio-profile-name">{name}</span>
          </NavLink>
          <button type="button" className="studio-icon-button" onClick={handleLogout} aria-label="Đăng xuất" title="Đăng xuất">
            <HiOutlineArrowRightOnRectangle aria-hidden="true" />
          </button>
          <button
            type="button"
            className="studio-icon-button studio-menu-toggle"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? 'studio-mobile-menu' : undefined}
            onClick={() => setOpenForLocation(menuOpen ? null : key)}
          >
            {menuOpen ? <HiOutlineXMark aria-hidden="true" /> : <HiOutlineBars3 aria-hidden="true" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="studio-mobile-menu" className="studio-mobile-menu" aria-label="Điều hướng chính">
          {links.map(link => activeLink(link, () => setOpenForLocation(null)))}
        </nav>
      )}
    </header>
  );
}
