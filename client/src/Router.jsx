import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AssessmentPage from './pages/auth/AssessmentPage';

// Main Pages
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';

// Vocab Pages
import TopicsPage from './pages/vocab/TopicsPage';
import TopicDetailPage from './pages/vocab/TopicDetailPage';
import FlashcardPage from './pages/vocab/FlashcardPage';
import ExercisePage from './pages/vocab/ExercisePage';

// Review SRS Page
import ReviewPage from './pages/review/ReviewPage';

// Reading Pages
import ReadingListPage from './pages/reading/ReadingListPage';
import ReadingDetailPage from './pages/reading/ReadingDetailPage';

// Group Pages
import GroupsPage from './pages/groups/GroupsPage';
import GroupDetailPage from './pages/groups/GroupDetailPage';

// Community Pages
import CommunityPage from './pages/community/CommunityPage';
import CommunitySubmitPage from './pages/community/CommunitySubmitPage';

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
      { path: '/assessment', element: <AssessmentPage /> },
      { path: '/profile', element: <ProfilePage /> },

      // Vocab module
      { path: '/topics', element: <TopicsPage /> },
      { path: '/topics/:id', element: <TopicDetailPage /> },
      { path: '/topics/:id/flashcards', element: <FlashcardPage /> },
      { path: '/topics/:id/exercise', element: <ExercisePage /> },

      // Spaced Repetition Review (SM-2)
      { path: '/review', element: <ReviewPage /> },

      // Reading module
      { path: '/readings', element: <ReadingListPage /> },
      { path: '/readings/:id', element: <ReadingDetailPage /> },

      // Group module
      { path: '/groups', element: <GroupsPage /> },
      { path: '/groups/:id', element: <GroupDetailPage /> },

      // Community module
      { path: '/community', element: <CommunityPage /> },
      { path: '/community/submit', element: <CommunitySubmitPage /> },

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center card max-w-md p-8 shadow-sm">
          <h1 className="text-7xl font-extrabold text-primary-600">404</h1>
          <p className="text-lg font-bold text-gray-800 mt-4">Không tìm thấy trang</p>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
          </p>
          <a href="/dashboard" className="btn btn-primary">
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
