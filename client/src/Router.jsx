import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Main Pages
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';

// Fine Arts Vocab Pages
import TopicsPage from './pages/vocab/TopicsPage';
import TopicDetailPage from './pages/vocab/TopicDetailPage';
import FlashcardPage from './pages/vocab/FlashcardPage';
import ExercisePage from './pages/vocab/ExercisePage';
import UserVocabListDetailPage from './pages/vocab/UserVocabListDetailPage';

// Review SRS (SM-2) Page
import ReviewPage from './pages/review/ReviewPage';

// Admin Page
import AdminPage from './pages/admin/AdminPage';

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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="text-center card max-w-md p-8 shadow-sm rounded-3xl border-stone-200">
          <h1 className="text-7xl font-extrabold text-amber-700 font-serif">404</h1>
          <p className="text-lg font-bold text-stone-800 mt-4">Không tìm thấy trang</p>
          <p className="text-sm text-stone-500 mt-2 mb-6">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được tinh giản trong phiên bản chuyên ngành Mỹ thuật.
          </p>
          <a href="/dashboard" className="btn btn-primary rounded-xl">
            Quay về bảng điều khiển
          </a>
        </div>
      </div>
    )
  }
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
