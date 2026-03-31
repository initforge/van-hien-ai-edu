import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
        navigate(data.redirect);
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Lỗi kết nối đến máy chủ.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0D1B2A] min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#326286]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#C9A84C]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C9A84C] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-headline font-bold text-white tracking-tight">Văn Học AI</h1>
              <p className="text-xs text-blue-100/40 tracking-widest uppercase">Quản trị Hệ thống</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-headline font-bold text-white mb-1">Đăng nhập Quản trị</h2>
            <p className="text-sm text-blue-100/40">Truy cập bảng điều khiển quản trị</p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-blue-100/60 uppercase tracking-widest mb-2 ml-1">
                Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/30">account_circle</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-blue-100/30 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
                  placeholder="admin"
                  type="text"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-blue-100/60 uppercase tracking-widest mb-2 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/30">lock</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder-blue-100/30 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-100/30 hover:text-[#C9A84C] transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C9A84C] hover:bg-[#b8973d] disabled:opacity-50 text-white font-headline font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-[#C9A84C]/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Đang xác thực...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-100/40 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Quay lại đăng nhập thường
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-blue-100/20 mt-6">
          © 2026 Văn Học AI. Chỉ dành cho Quản trị viên.
        </p>
      </div>
    </div>
  );
}
