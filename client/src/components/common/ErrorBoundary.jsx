import React from 'react';
import { HiExclamationCircle, HiRefresh, HiHome } from 'react-icons/hi';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full text-center p-8 space-y-4 shadow-lg border border-red-100">
            <div className="inline-flex p-4 rounded-full bg-red-50 text-red-500 mb-2">
              <HiExclamationCircle className="w-12 h-12" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Đã có sự cố bất ngờ xảy ra
            </h1>

            <p className="text-sm text-gray-600 leading-relaxed">
              Giao diện gặp lỗi trong quá trình hiển thị. Dữ liệu của bạn không bị ảnh hưởng. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
            </p>

            {this.state.error && (
              <div className="text-left p-3 rounded-lg bg-red-50 text-xs font-mono text-red-800 overflow-x-auto max-h-36 border border-red-200">
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</p>
                )}
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="btn btn-primary text-sm gap-2"
              >
                <HiRefresh className="w-4 h-4" /> Tải lại trang
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary text-sm gap-2"
              >
                <HiHome className="w-4 h-4" /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
