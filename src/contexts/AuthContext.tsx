import { createContext, useContext, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  name: string;
  email: string;
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
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (_) { /* best-effort */ }
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
    return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="animate-pulse-soft text-primary font-headline">Đang xác thực...</div></div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-surface flex-col gap-4">
      <h1 className="text-xl font-headline text-error">Phiên đăng nhập đã hết hạn</h1>
      <a href="/" className="text-primary hover:underline">Quay lại trang chủ</a>
    </div>;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <div className="min-h-screen flex items-center justify-center bg-surface flex-col gap-4">
      <h1 className="text-xl font-headline text-error">Bạn không có quyền truy cập trang này</h1>
      <a href="/" className="text-primary hover:underline">Quay lại trang chủ</a>
    </div>;
  }

  return <>{children}</>;
}
