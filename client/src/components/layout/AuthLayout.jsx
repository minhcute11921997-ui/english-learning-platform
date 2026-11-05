import { Outlet, Link } from 'react-router-dom';
import { HiSparkles } from 'react-icons/hi2';

/**
 * Layout cho trang đăng nhập/đăng ký - Chuyên đề Mỹ thuật & Mỹ nghệ
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-stone-100/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-50 flex items-center justify-center shadow-xs">
              <HiSparkles className="w-5 h-5 text-amber-200" />
            </div>
            <span className="text-2xl font-bold font-serif tracking-tight text-stone-900">EngLearn Art</span>
          </Link>
          <p className="mt-2 text-sm text-stone-600 font-medium">
            Thuật ngữ Tiếng Anh Chuyên ngành Mỹ thuật &amp; Mỹ nghệ
          </p>
        </div>

        {/* Content */}
        <div className="card shadow-md border border-stone-200/80 rounded-2xl p-6 sm:p-8 bg-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
