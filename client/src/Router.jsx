import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Main & Feature Pages (Route-based code splitting)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const TopicsPage = lazy(() => import('./pages/vocab/TopicsPage'));
const TopicDetailPage = lazy(() => import('./pages/vocab/TopicDetailPage'));
const FlashcardPage = lazy(() => import('./pages/vocab/FlashcardPage'));
const ExercisePage = lazy(() => import('./pages/vocab/ExercisePage'));
const UserVocabListDetailPage = lazy(() => import('./pages/vocab/UserVocabListDetailPage'));
const ReviewPage = lazy(() => import('./pages/review/ReviewPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

const router = createBrowserRouter([
  // Public auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> }
    ]
  },
  // Protected routes for authenticated users
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/profile', element: <ProfilePage /> },

      // Fine Arts Vocab module
      { path: '/topics', element: <TopicsPage /> },
      { path: '/topics/:id', element: <TopicDetailPage /> },
      { path: '/topics/:id/flashcards', element: <FlashcardPage /> },
      { path: '/topics/:id/exercise', element: <ExercisePage /> },
      { path: '/vocab-lists/:id', element: <UserVocabListDetailPage /> },
      { path: '/vocab-lists/:id/flashcards', element: <FlashcardPage /> },

      // Spaced Repetition Review (SM-2)
      { path: '/review', element: <ReviewPage /> },

      // Admin panel (role restricted)
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        )
      }
    ]
  },
  // Default redirect
  {
    path: '/',
    element: <RootRedirect />
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 bg-modern-grid p-4">
        <div className="text-center card max-w-md p-9 shadow-lg rounded-3xl border-slate-200">
          <h1 className="text-7xl font-black text-blue-600 tracking-tight">404</h1>
          <p className="text-lg font-bold text-slate-900 mt-4">Không tìm thấy trang</p>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được tinh giản trong phiên bản chuyên ngành Mỹ thuật.
          </p>
          <a href="/dashboard" className="btn btn-primary rounded-xl text-xs py-2.5 px-5">
            Quay về bảng điều khiển
          </a>
        </div>
      </div>
    )
  }
]);

export default function Router() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
