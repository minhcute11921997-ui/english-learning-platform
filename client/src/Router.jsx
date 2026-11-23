import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Link } from 'react-router-dom';
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
const AiChatPage = lazy(() => import('./pages/ai/AiChatPage'));
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

      // Local AI Image Recognition Chatbox
      { path: '/ai-chat', element: <AiChatPage /> },

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
      <main className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-md border-t-4 border-blue-600 pt-6">
          <p className="font-display text-5xl text-slate-500">404</p>
          <h1 className="page-title mt-2">Không tìm thấy trang</h1>
          <p className="page-description">Đường dẫn có thể đã đổi hoặc không còn tồn tại.</p>
          <Link to="/" className="btn btn-primary mt-6">Về trang chủ</Link>
        </div>
      </main>
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
