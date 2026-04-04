import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens, getToken } from '../lib/fetcher';

export interface User {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'admin';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearTokens();
        setUser(null);
      } else if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // Network error = keep current state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    const token = getToken();
    if (token) {
      try {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) { /* best-effort */ }
    }
    clearTokens();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'teacher' | 'student' | 'admin' }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin block mb-3">progress_activity</span>
          <p className="text-primary font-headline">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface flex-col gap-4">
        <span className="material-symbols-outlined text-5xl text-error/60" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        <h1 className="text-xl font-headline text-error">Phiên đăng nhập đã hết hạn</h1>
        <a href="/" className="text-primary hover:underline">Quay lại trang chủ</a>
      </div>
    );
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface flex-col gap-4">
        <span className="material-symbols-outlined text-5xl text-error/60" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_bad</span>
        <h1 className="text-xl font-headline text-error">Bạn không có quyền truy cập trang này</h1>
        <a href="/" className="text-primary hover:underline">Quay lại trang chủ</a>
      </div>
    );
  }

  return <>{children}</>;
}
