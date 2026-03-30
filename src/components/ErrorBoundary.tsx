import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; message?: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(e: Error): State {
    return { hasError: true, message: e.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-surface flex-col gap-4 p-8 text-center">
          <span className="material-symbols-outlined text-error text-5xl">error</span>
          <h1 className="text-xl font-headline text-error">Đã xảy ra lỗi</h1>
          <p className="text-sm text-on-surface-variant max-w-md">
            {this.state.message || 'Không thể tải trang này. Vui lòng tải lại trang.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-bold font-headline hover:opacity-90 transition-opacity"
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}