import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState(token ? 'verifying' : 'error');
  const [message, setMessage] = useState(
    token ? 'Đang xác minh địa chỉ email...' : 'Thiếu mã xác minh email.'
  );

  useEffect(() => {
    if (!token) return;
    let active = true;
    authApi
      .verifyEmail(token)
      .then((res) => {
        if (!active) return;
        setStatus('success');
        setMessage(res?.message || 'Xác minh email thành công!');
      })
      .catch((err) => {
        if (!active) return;
        setStatus('error');
        setMessage(err.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="space-y-4">
      <h1 className="page-title">Xác minh email</h1>
      {status === 'verifying' && (
        <div className="flex items-center gap-3 text-slate-600 text-sm">
          <LoadingSpinner size="sm" />
          <span>{message}</span>
        </div>
      )}
      {status === 'success' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {message}
        </div>
      )}
      <Link to="/login" className="btn btn-primary w-full justify-center py-2.5 rounded-xl">
        Về trang đăng nhập
      </Link>
    </div>
  );
}
