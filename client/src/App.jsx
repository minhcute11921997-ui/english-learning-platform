import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Router from './Router';
import useAuthStore from './stores/authStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import SelectionTranslator from './components/common/SelectionTranslator';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <Router />
      <SelectionTranslator />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff'
          }
        }}
      />
    </ErrorBoundary>
  );
}
