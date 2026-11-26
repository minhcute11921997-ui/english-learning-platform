import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';

export default function GoogleSignInButton({ redirectTo = '/dashboard' }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const buttonRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    const handleCredentialResponse = async (response) => {
      if (!response?.credential || cancelled) return;
      setIsSubmitting(true);
      try {
        await loginWithGoogle(response.credential);
        toast.success('Đăng nhập và xác minh bằng Google thành công!');
        navigate(redirectTo, { replace: true });
      } catch (err) {
        toast.error(err.message || 'Đăng nhập bằng Google thất bại');
      } finally {
        if (!cancelled) setIsSubmitting(false);
      }
    };

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse
      });
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 340,
        locale: 'vi'
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    let script = document.querySelector(`script[src="${GOOGLE_GSI_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GOOGLE_GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', renderGoogleButton);
    return () => {
      cancelled = true;
      script.removeEventListener('load', renderGoogleButton);
    };
  }, [clientId, loginWithGoogle, navigate, redirectTo]);

  return (
    <div className="mt-5">
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-200" />
        <span className="mx-3 flex-shrink text-xs text-slate-400">Hoặc tiếp tục với</span>
        <div className="flex-grow border-t border-slate-200" />
      </div>

      {clientId ? (
        <div className="mt-3 flex flex-col items-center">
          <div ref={buttonRef} className={isSubmitting ? 'opacity-60 pointer-events-none' : ''} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            toast(
              'Chưa cấu hình VITE_GOOGLE_CLIENT_ID & GOOGLE_CLIENT_ID trong .env để kích hoạt Google Sign-In.'
            )
          }
          className="mt-3 w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.2-.2-1.7H12z"
            />
            <path
              fill="#34A853"
              d="M3.3 7.3l3.2 2.3C7.4 7.7 9.5 6.2 12 6.2c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2c-3.8 0-7.1 2.1-8.7 5.1z"
            />
            <path
              fill="#FBBC05"
              d="M12 21.8c2.6 0 4.9-.9 6.5-2.4l-3-2.5c-.8.6-1.9 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2l-3.2 2.5c1.6 3.3 5 5.6 8.9 5.6z"
            />
            <path
              fill="#4285F4"
              d="M21.4 12.2c0-.6-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.2-1 2.2-2 2.9l3 2.5c1.8-1.6 2.9-4.1 2.9-7.6z"
            />
          </svg>
          Tiếp tục với Google
        </button>
      )}
    </div>
  );
}
