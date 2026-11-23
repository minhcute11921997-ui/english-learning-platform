import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Router from './Router';
import useAuthStore from './stores/authStore';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <Router />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '6px',
            background: '#263d33',
            color: '#fffcf6'
          }
        }}
      />
    </ErrorBoundary>
  );
}
