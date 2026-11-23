import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import Brand from './Brand';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-shell">
      <div className="auth-entry">
        <Brand />
        <section className="auth-form" aria-label="Tài khoản EngLearn">
          <Outlet />
        </section>
      </div>
      <aside className="auth-art" aria-label="Tác phẩm giới thiệu">
        <div className="auth-art-inner">
          <figure>
            <img src="/images/vocab/printmaking.jpg" alt="Sóng lừng ngoài khơi Kanagawa, tranh in khắc gỗ của Katsushika Hokusai" />
            <figcaption>Sóng lừng ngoài khơi Kanagawa <span>· Katsushika Hokusai</span></figcaption>
          </figure>
          <p>Học tiếng Anh<br />qua từng nét tranh.</p>
        </div>
      </aside>
    </div>
  );
}
