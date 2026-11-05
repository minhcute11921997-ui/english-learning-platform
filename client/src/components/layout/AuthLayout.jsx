import { Outlet, Link } from 'react-router-dom';
import { HiSparkles } from 'react-icons/hi2';

/**
 * Layout cho trang đăng nhập/đăng ký - Contemporary Fine Arts & Crafts
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 bg-modern-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <HiSparkles className="w-6 h-6 text-blue-200" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-extrabold tracking-tight text-slate-950 block">
                EngLearn<span className="text-blue-600">.art</span>
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500 -mt-1 block">
                Contemporary Atelier
              </span>
            </div>
          </Link>
          <p className="mt-3 text-sm text-slate-600 font-medium">
            Thuật ngữ Tiếng Anh Chuyên ngành Mỹ thuật &amp; Mỹ nghệ
          </p>
        </div>

        {/* Content Card */}
        <div className="card shadow-xl shadow-slate-900/5 border border-slate-200/90 rounded-3xl p-7 sm:p-9 bg-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
