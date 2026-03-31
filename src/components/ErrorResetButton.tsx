import { useNavigate } from 'react-router-dom';

interface Props {
  message?: string;
}

export function ErrorResetButton({ message }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface flex-col gap-4 p-8 text-center">
      <span className="material-symbols-outlined text-error text-5xl">error</span>
      <h1 className="text-xl font-headline text-error">Đã xảy ra lỗi</h1>
      <p className="text-sm text-on-surface-variant max-w-md">
        {message || 'Không thể tải trang này. Vui lòng thử lại.'}
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-bold font-headline hover:opacity-90 transition-opacity"
      >
        Quay về trang chủ
      </button>
    </div>
  );
}
