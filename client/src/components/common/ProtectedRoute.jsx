import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Component bảo vệ route - yêu cầu đăng nhập
 * @param {string[]} allowedRoles - Roles được phép truy cập (optional)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
