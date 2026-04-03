import React from "react";
import { Link } from "react-router-dom";
import { AnimateOnScroll } from "../components/AnimateOnScroll";

export default function Homepage() {
  return (
    <div className="bg-background text-on-surface font-body selection:bg-secondary-container min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#f9f9f6]/80 backdrop-blur-md dark:bg-slate-900/80 shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center w-full px-8 py-5 max-w-7xl mx-auto">
          <div className="text-2xl font-headline font-bold text-[#003857] dark:text-blue-100">
            Văn Học AI
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden md:block text-slate-600 font-medium hover:text-primary transition-colors">
              Tìm hiểu thêm
            </a>
            <Link to="/login">
              <button className="bg-primary text-on-primary px-6 py-2 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-[1px] active:scale-[0.97] transition-all duration-300">
                Đăng nhập
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex items-center px-8 bg-[radial-gradient(circle_at_2px_2px,rgba(50,98,134,0.05)_1px,transparent_0)] bg-[size:40px_40px]">
          {/* Decorative Elements */}
          <div className="absolute top-20 right-[-5%] w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-20 left-[-5%] w-72 h-72 bg-[#C9A84C]/5 rounded-full blur-3xl animate-float-gentle"></div>
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <AnimateOnScroll animation="fade-up" delay={0} duration={800}>
                <div className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase">
                  Kỷ nguyên học tập mới
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={150} duration={900}>
                <h1 className="text-6xl md:text-7xl font-headline font-bold text-primary leading-[1.1] tracking-tight">
                  AI thông minh — <br /><span className="text-secondary italic">Văn học sống động</span>
                </h1>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={300} duration={900}>
                <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed">
                  Nền tảng hỗ trợ dạy &amp; học Ngữ Văn THCS bằng trí tuệ nhân tạo, giúp học sinh khơi nguồn cảm hứng và làm chủ kỹ năng nghị luận.
                </p>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={450} duration={900}>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link to="/login">
                    <button className="bg-tertiary text-white px-8 py-4 rounded-xl font-headline font-bold text-lg hover:brightness-110 hover:-translate-y-[2px] hover:shadow-xl hover:shadow-tertiary/20 active:scale-[0.97] transition-all duration-300">
                      Đăng nhập
                    </button>
                  </Link>
                  <a href="#features">
                    <button className="border border-primary text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/5 hover:-translate-y-[1px] active:scale-[0.97] transition-all duration-300">
                      Tìm hiểu thêm
                    </button>
                  </a>
                </div>
              </AnimateOnScroll>
            </div>
            <AnimateOnScroll animation="fade-left" delay={200} duration={1000}>
              <div className="relative">
                <div className="bg-white/70 backdrop-blur-md border border-[#326286]/15 p-4 rounded-3xl rotate-2 relative z-20 hover:rotate-0 transition-transform duration-700">
                  <div className="rounded-2xl w-full h-[500px] bg-gradient-to-br from-primary/10 via-secondary/5 to-[#C9A84C]/10 flex items-center justify-center overflow-hidden">
                    <img src="/images/hero.png" alt="Hero Illustration" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 bg-white/70 backdrop-blur-md border border-[#326286]/15 p-6 rounded-2xl shadow-xl max-w-xs animate-float-gentle">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <span className="font-bold text-primary">Phân tích AI</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">&quot;Hình ảnh &apos;vầng trăng&apos; trong thơ Chính Hữu mang vẻ đẹp của tình đồng chí...&quot;</p>
                  </div>
                </div>
                {/* Abstract Motif */}
                <div className="absolute -top-10 -right-10 w-40 h-40 opacity-10 text-[#C9A84C] animate-float-slow">
                  <svg fill="currentColor" viewBox="0 0 100 100">
                    <path d="M50 0 C60 30 90 40 100 50 C90 60 60 70 50 100 C40 70 100 60 0 50 C10 40 40 30 50 0"></path>
                  </svg>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-32 px-8 bg-surface-container-low relative">
          <div className="max-w-7xl mx-auto">
            <AnimateOnScroll animation="fade-up" duration={800}>
              <div className="mb-16 text-center">
                <h2 className="text-4xl font-headline font-bold text-primary mb-4">Khám phá công nghệ học thuật</h2>
                <div className="w-24 h-1 bg-[#C9A84C] mx-auto rounded-full"></div>
              </div>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
              {/* Large Card: AI Chấm bài */}
              <AnimateOnScroll animation="fade-up" delay={0} className="md:col-span-4">
                <div className="bg-white/70 backdrop-blur-md border border-[#326286]/15 p-8 rounded-[2rem] flex flex-col justify-between group hover:bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-500 h-full">
                  <div>
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <span className="material-symbols-outlined text-primary text-3xl">description</span>
                    </div>
                    <h3 className="text-2xl font-headline font-bold mb-4">AI Chấm bài tự luận</h3>
                    <p className="text-on-surface-variant leading-relaxed">Phản hồi chi tiết từng luận điểm, cấu trúc bài viết và gợi ý từ vựng chuyên sâu ngay lập tức.</p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all duration-300">
                    Thử ngay <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </div>
              </AnimateOnScroll>
              {/* Medium Card: Chatbot */}
              <AnimateOnScroll animation="fade-up" delay={120} className="md:col-span-5">
                <div className="bg-white/70 backdrop-blur-md border border-[#326286]/15 p-8 rounded-[2rem] flex flex-col group hover:bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                    <span className="material-symbols-outlined text-secondary text-3xl">forum</span>
                  </div>
                  <h3 className="text-2xl font-headline font-bold mb-4">Chatbot Nhân vật</h3>
                  <p className="text-on-surface-variant leading-relaxed">Trò chuyện trực tiếp với Lão Hạc, ông Hai hay anh thanh niên để thấu hiểu nội tâm và bối cảnh tác phẩm qua góc nhìn thứ nhất.</p>
                  <div className="mt-auto pt-6">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400">person</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-bold">+12k</div>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
              {/* Small Card: Radar */}
              <AnimateOnScroll animation="zoom-in" delay={240} className="md:col-span-3">
                <div className="bg-primary text-on-primary border-none shadow-xl shadow-primary/20 p-8 rounded-[2rem] flex flex-col justify-center text-center hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 h-full">
                  <span className="material-symbols-outlined text-5xl mb-6 text-primary-fixed-dim">analytics</span>
                  <h3 className="text-xl font-headline font-bold mb-2">Phân tích Kỹ năng</h3>
                  <p className="text-on-primary/70 text-sm">Theo dõi biểu đồ tiến bộ về tư duy phản biện và diễn đạt.</p>
                </div>
              </AnimateOnScroll>
              {/* Long Card: Đa Vũ Trụ */}
              <AnimateOnScroll animation="fade-right" delay={100} className="md:col-span-7">
                <div className="bg-white/70 backdrop-blur-md border border-[#326286]/15 p-8 rounded-[2rem] flex items-center gap-8 group hover:bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-500 overflow-hidden relative h-full">
                  <div className="max-w-[60%]">
                    <h3 className="text-2xl font-headline font-bold mb-4">Đa Vũ Trụ Văn học</h3>
                    <p className="text-on-surface-variant leading-relaxed">Khám phá các kết thúc khác nhau của tác phẩm hoặc đặt nhân vật vào những tình huống giả định hiện đại.</p>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                    <span className="material-symbols-outlined text-[150px] translate-y-10 translate-x-10">account_tree</span>
                  </div>
                </div>
              </AnimateOnScroll>
              {/* Last Card: Ngân hàng đề */}
              <AnimateOnScroll animation="fade-left" delay={200} className="md:col-span-5">
                <div className="bg-white/70 backdrop-blur-md border border-[#326286]/15 border-l-4 border-l-[#C9A84C] p-8 rounded-[2rem] flex flex-col justify-between group hover:bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-500 h-full">
                  <div>
                    <h3 className="text-2xl font-headline font-bold mb-2">Ngân hàng Đề thi</h3>
                    <p className="text-on-surface-variant">Hơn 5000+ đề thi bám sát chương trình GDPT 2018.</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[#C9A84C] font-bold">Lớp 6 - Lớp 9</span>
                    <span className="material-symbols-outlined text-[#C9A84C] group-hover:rotate-12 transition-transform duration-500">inventory_2</span>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section id="demo" className="py-32 px-8 overflow-hidden relative">
          <div className="max-w-5xl mx-auto relative">
            <AnimateOnScroll animation="fade-down" duration={800}>
              <div className="text-center mb-16">
                <span className="text-secondary font-label uppercase tracking-widest text-sm font-bold">Trải nghiệm trực tiếp</span>
                <h2 className="text-4xl font-headline font-bold text-primary mt-4">Hỏi đáp cùng Trợ lý Văn học</h2>
              </div>
            </AnimateOnScroll>
            <div className="space-y-6 max-w-3xl mx-auto relative z-10">
              {/* Input Area */}
              <AnimateOnScroll animation="fade-up" delay={100}>
                <div className="relative group">
                  <input className="w-full bg-surface-container-high border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 py-6 px-8 rounded-2xl text-lg transition-all placeholder:text-on-surface-variant/50 group-hover:shadow-lg" placeholder="Hỏi AI về tác phẩm..." type="text" />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-container hover:scale-110 active:scale-95 transition-all duration-300">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </AnimateOnScroll>
              {/* Response Area */}
              <AnimateOnScroll animation="blur-in" delay={300} duration={1000}>
                <div className="bg-white/70 backdrop-blur-md border border-[#C9A84C]/20 p-10 rounded-[2.5rem] relative hover:shadow-xl transition-shadow duration-500">
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse-soft"></div>
                    <span className="text-xs font-bold uppercase tracking-tighter text-secondary">Hệ thống đang phản hồi</span>
                  </div>
                  <div className="mt-8 space-y-4">
                    <p className="text-lg leading-relaxed font-headline text-primary">
                      &quot;Trong đoạn trích &apos;Chiếc lược ngà&apos;, tình cha con của ông Sáu và bé Thu không chỉ là tình cảm gia đình đơn thuần, mà còn là biểu tượng cho sự hy sinh và sức mạnh tâm hồn của con người Việt Nam trong khói lửa chiến tranh...&quot;
                    </p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-surface-container rounded-full text-xs text-on-surface-variant italic">#Phân_tích_nhân_vật</span>
                      <span className="px-3 py-1 bg-surface-container rounded-full text-xs text-on-surface-variant italic">#Chiếc_lược_ngà</span>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
            {/* Abstract Background Motif */}
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0 animate-float-slow">
              <svg height="400" viewBox="0 0 100 100" width="400" fill="currentColor">
                <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="0.5"></circle>
                <circle cx="50" cy="50" fill="none" r="35" stroke="currentColor" strokeWidth="0.5"></circle>
                <circle cx="50" cy="50" fill="none" r="25" stroke="currentColor" strokeWidth="0.5"></circle>
              </svg>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-8 relative overflow-hidden bg-[#f9f9f6] dark:bg-slate-950 before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#326286]/20 before:to-transparent">
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center">
            <div className="text-xl font-headline italic text-[#003857] dark:text-blue-200 mb-2">Văn Học AI</div>
            <p className="font-sans text-sm tracking-tight text-slate-500 dark:text-slate-400 text-center">
              © 2026 Văn Học AI. Kiến tạo tương lai văn học Việt qua nét bút AI.
            </p>
          </div>
        </div>
        {/* Dong Son Border Element */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent"></div>
      </footer>
    </div>
  );
}
