import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Vui lòng nhập username và mật khẩu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json() as { redirect?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      if (data.redirect) {
        await refreshUser();
        navigate(data.redirect);
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi kết nối đến máy chủ.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-[15%] w-48 h-48 bg-[#C9A84C]/5 rounded-full blur-3xl animate-float-gentle"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-soft"></div>
      </div>

      {/* Dot Grid Background */}
      <div className="fixed inset-0 bg-pattern opacity-40 pointer-events-none z-0"></div>

      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f6]/80 backdrop-blur-xl border-b border-[#326286]/10 shadow-[0_12px_40px_-10px_rgba(26,28,27,0.06)]">
        <div className="flex justify-between items-center h-20 px-8 max-w-[1440px] mx-auto">
          <Link to="/" className="group">
            <div className="text-2xl font-headline font-bold text-[#003857] tracking-tight group-hover:text-secondary transition-colors duration-300">Văn Học AI</div>
          </Link>
          <Link to="/">
            <button className="bg-primary-container text-white px-6 py-2.5 rounded-full font-headline text-sm hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300">
              Trang chủ
            </button>
          </Link>
        </div>
      </header>

      <main className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6 relative z-10">
        {/* Auth Container */}
        <div className="max-w-5xl w-full bg-surface-container-lowest/80 backdrop-blur-2xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-[0_32px_64px_-16px_rgba(0,56,87,0.08)] border border-surface-tint/10"
          style={{ animation: "scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          {/* Left Side: Visual/Art */}
          <div className="md:w-1/2 relative min-h-[400px] bg-primary-container overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-primary opacity-90"></div>
            {/* Animated circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -left-20 w-40 h-40 border border-white/10 rounded-full animate-pulse-soft"></div>
              <div className="absolute top-1/3 -right-10 w-32 h-32 border border-white/5 rounded-full animate-float-slow"></div>
              <div className="absolute -bottom-10 left-1/3 w-24 h-24 border border-white/10 rounded-full animate-float-gentle"></div>
            </div>
            {/* Abstract Motif Watermark */}
            <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none scale-150">
              <svg className="w-full h-full fill-white" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="0.5"></circle>
                <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="0.2"></path>
              </svg>
            </div>
            {/* Foreground Art */}
            <div className="absolute inset-0 flex items-center justify-center p-12"
              style={{ animation: "fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both" }}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-shadow duration-700 bg-gradient-to-br from-primary/60 to-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-white/30 text-[100px]">menu_book</span>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white"
                  style={{ animation: "slideUp 0.6s ease-out 0.5s both" }}
                >
                  <h2 className="font-headline text-3xl mb-2">Gìn giữ nét Việt</h2>
                  <p className="font-body text-white/70 text-sm leading-relaxed">Kết nối tinh hoa văn học truyền thống với trí tuệ nhân tạo hiện đại.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="md:w-1/2 p-8 md:p-14 bg-surface/40 backdrop-blur-sm flex flex-col">
            <div className="mb-10 text-center md:text-left"
              style={{ animation: "fadeIn 0.5s ease-out 0.3s both" }}
            >
              <span className="text-secondary font-label text-[10px] tracking-[0.2em] uppercase font-bold mb-2 block">Chào mừng bạn</span>
              <h1 className="font-headline text-4xl text-primary font-bold">Văn Học AI</h1>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-8 border-b border-outline-variant/30 mb-8"
              style={{ animation: "fadeIn 0.5s ease-out 0.4s both" }}
            >
              <button className="pb-4 text-sm font-label font-semibold tracking-wide text-primary border-b-2 border-primary transition-all">ĐĂNG NHẬP</button>
            </div>

            {/* Login Form */}
            <div className="flex-grow space-y-6">
              {errorMsg && (
                <div className="bg-error/10 text-error p-3 rounded-xl text-sm font-semibold border border-error/20 flex items-center gap-2" style={{ animation: "fadeIn 0.3s ease-out both" }}>
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username */}
                <div className="space-y-1.5" style={{ animation: "fadeIn 0.5s ease-out 0.5s both" }}>
                  <label className="text-[11px] font-label font-bold uppercase text-on-surface-variant/70 ml-1">Username</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/50">account_circle</span>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-surface-container-low/50 border-0 border-b border-outline-variant/50 focus:border-primary focus:ring-0 px-4 pl-11 py-3 text-sm transition-all outline-none rounded-t-lg hover:bg-surface-container-low/70 focus:bg-white"
                      placeholder="an hoặc mai"
                      type="text"
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}>
                  <label className="text-[11px] font-label font-bold uppercase text-on-surface-variant/70 ml-1">Mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/50">lock</span>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low/50 border-0 border-b border-outline-variant/50 focus:border-primary focus:ring-0 px-4 pl-11 pr-12 py-3 text-sm transition-all outline-none rounded-t-lg hover:bg-surface-container-low/70 focus:bg-white"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline/50 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div style={{ animation: "fadeIn 0.5s ease-out 0.7s both" }}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-center py-4 bg-primary text-white font-headline font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Đang xử lý...</>
                    ) : (
                      <><span className="material-symbols-outlined text-lg">login</span> Đăng nhập</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Admin link */}
            <div className="mt-8 text-center" style={{ animation: "fadeIn 0.5s ease-out 0.9s both" }}>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-sm text-[#C9A84C] hover:text-[#b8973d] font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                Đăng nhập Quản trị
              </Link>
              <p className="text-[12px] text-on-surface-variant/60 leading-relaxed mt-4">
                Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f9f9f6] w-full py-12 px-8 relative z-10">
        <div className="bg-[#f2f2ed] h-[1px] w-full mb-8"></div>
        <div className="flex flex-col items-center gap-4 max-w-[1440px] mx-auto pt-8">
          <div className="font-headline font-semibold text-[#003857]">Văn Học AI</div>
          <p className="font-sans text-xs tracking-wide text-[#1a1c1b]/60 text-center">© 2026 Văn Học AI. Kiến tạo tương lai văn học Việt qua nét bút AI.</p>
        </div>
      </footer>
    </div>
  );
}
