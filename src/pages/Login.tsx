import { useNavigate, Link } from "react-router-dom";
import React, { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | false>(false);

  const handleLogin = async (role: "teacher" | "student") => {
    setIsLoading(role);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json() as { redirect?: string };
      if (data.redirect) {
        // Correct routing for SPA
        const target = data.redirect === "/teacher" ? "/dashboard" : "/dashboard"; 
        navigate(target);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f9f9f6] font-sans text-[#1a1c1b] antialiased min-h-screen relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-[#006a6a]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-[15%] w-48 h-48 bg-[#C9A84C]/5 rounded-full blur-3xl"></div>
      </div>

      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f6]/80 backdrop-blur-xl border-b border-[#003857]/10 shadow-sm">
        <div className="flex justify-between items-center h-20 px-8 max-w-[1440px] mx-auto">
          <Link to="/" className="group">
            <div className="text-2xl font-serif font-bold text-[#003857] tracking-tight hover:text-[#006a6a] transition-colors">Văn Học AI</div>
          </Link>
          <button className="bg-[#003857] text-white px-6 py-2.5 rounded-full font-serif text-sm hover:opacity-90 transition-all">
            Trang chủ
          </button>
        </div>
      </header>

      <main className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6 relative z-10">
        {/* Auth Container */}
        <div className="max-w-5xl w-full bg-white rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-xl border border-[#003857]/5">
          {/* Left Side: Visual/Art */}
          <div className="md:w-1/2 relative min-h-[400px] bg-[#d1e4ff] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#d1e4ff] to-[#003857] opacity-90"></div>
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl">
                <img 
                  alt="Traditional Vietnamese motifs" 
                  className="w-full h-full object-cover" 
                  src="/images/login_background.png" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003857]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h2 className="font-serif text-3xl mb-2">Gìn giữ nét Việt</h2>
                  <p className="text-white/70 text-sm leading-relaxed">Kết nối tinh hoa văn học truyền thống với trí tuệ nhân tạo hiện đại.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="md:w-1/2 p-8 md:p-14 flex flex-col">
            <div className="mb-10">
              <span className="text-[#006a6a] text-[10px] tracking-[0.2em] uppercase font-bold mb-2 block">Chào mừng bạn</span>
              <h1 className="text-4xl text-[#003857] font-bold">Văn Học AI</h1>
            </div>

            {/* Login Form */}
            <div className="flex-grow space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-[#72787e] ml-1">Email học giả</label>
                <input 
                  className="w-full bg-[#f9f9f6] border-b border-[#72787e]/30 focus:border-[#003857] px-4 py-3 text-sm outline-none rounded-t-lg transition-all" 
                  placeholder="scholar@vanhoc.ai" 
                  type="email" 
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold uppercase text-[#72787e] ml-1">Mật khẩu</label>
                  <span className="text-[11px] font-semibold text-[#9c4146] hover:underline cursor-pointer">Quên mật khẩu?</span>
                </div>
                <input 
                  className="w-full bg-[#f9f9f6] border-b border-[#72787e]/30 focus:border-[#003857] px-4 py-3 text-sm outline-none rounded-t-lg transition-all" 
                  placeholder="••••••••" 
                  type="password" 
                />
              </div>
              <div>
                <button 
                  onClick={() => handleLogin("teacher")} 
                  disabled={!!isLoading}
                  className="block w-full text-center py-4 bg-[#003857] text-white font-serif font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all mb-3 disabled:opacity-50"
                >
                  {isLoading === "teacher" ? "Đang xử lý..." : "Đăng nhập Giáo viên"}
                </button>
              </div>
              <div>
                <button 
                  onClick={() => handleLogin("student")} 
                  disabled={!!isLoading}
                  className="block w-full text-center py-4 bg-[#006a6a] text-white font-serif font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                  {isLoading === "student" ? "Đang xử lý..." : "Đăng nhập Học sinh"}
                </button>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-[12px] text-[#72787e] leading-relaxed">
                Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f9f9f6] w-full py-12 px-8">
        <div className="flex flex-col items-center gap-4 max-w-[1440px] mx-auto pt-8 border-t border-[#72787e]/10">
          <div className="font-serif font-semibold text-[#003857]">Văn Học AI</div>
          <p className="text-xs tracking-wide text-[#72787e]/60 text-center">© 2026 Văn Học AI. Kiến tạo tương lai văn học Việt qua nét bút AI.</p>
        </div>
      </footer>
    </div>
  );
}
