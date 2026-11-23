import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="studio-shell">
      <a href="#studio-content" className="studio-skip-link">Chuyển đến nội dung</a>
      <Header />
      <main id="studio-content" className="studio-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
