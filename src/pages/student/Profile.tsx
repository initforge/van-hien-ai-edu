import React from 'react';

export default function StudentProfilePage() {
  return (
    <div className="pt-28 px-12 pb-20 max-w-7xl mx-auto page-enter">
      {/* Profile Header */}
      <section className="mb-16 flex items-end gap-10">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-full blur-sm opacity-20"></div>
          <img 
            className="relative w-40 h-40 rounded-full object-cover border-4 border-surface shadow-xl" 
            src="/images/student_portrait.png" 
            alt="Nguyễn Thị Mai" 
          />
        </div>
        <div className="pb-2">
          <span className="font-label text-secondary text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Học viên xuất sắc</span>
          <h1 className="font-headline text-5xl font-bold text-primary tracking-tight mb-3">Nguyễn Thị Mai</h1>
          <div className="flex items-center gap-6 text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">school</span>
              <span className="font-body text-lg font-medium">Lớp 8A</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_city</span>
              <span className="font-body text-lg font-medium">Trường THCS Nguyễn Du</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Analysis Row */}
      <div className="grid grid-cols-12 gap-8 mb-16">
        {/* Section 1: Bản đồ Kỹ năng */}
        <section className="col-span-12 lg:col-span-6 bg-white/80 backdrop-blur-md p-10 rounded-2xl border-[0.5px] border-outline-variant/30 shadow-[0_4px_20px_-5px_rgba(26,28,27,0.06)] relative overflow-hidden group">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
              <h3 className="font-headline text-2xl text-primary font-bold">Bản đồ Kỹ năng</h3>
              <p className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest mt-1 font-bold">Cập nhật sau 12 bài làm</p>
            </div>
            <span className="material-symbols-outlined text-secondary/30 group-hover:text-secondary/60 transition-colors text-5xl">radar</span>
          </div>
          
          <div className="flex justify-center items-center py-4 relative z-10">
            {/* Radar Chart SVG Visualization */}
            <svg className="w-full max-w-sm h-auto transform -rotate-18 drop-shadow-sm" viewBox="0 0 400 400">
              {/* Grid Lines */}
              <circle className="text-outline-variant/20" cx="200" cy="200" fill="none" r="160" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"></circle>
              <circle className="text-outline-variant/20" cx="200" cy="200" fill="none" r="120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"></circle>
              <circle className="text-outline-variant/20" cx="200" cy="200" fill="none" r="80" stroke="currentColor" strokeWidth="1"></circle>
              <circle className="text-outline-variant/20" cx="200" cy="200" fill="none" r="40" stroke="currentColor" strokeWidth="1"></circle>
              
              {/* Axes */}
              <line className="text-outline-variant/30" stroke="currentColor" x1="200" x2="200" y1="200" y2="40"></line>
              <line className="text-outline-variant/30" stroke="currentColor" x1="200" x2="352" y1="200" y2="151"></line>
              <line className="text-outline-variant/30" stroke="currentColor" x1="200" x2="294" y1="200" y2="330"></line>
              <line className="text-outline-variant/30" stroke="currentColor" x1="200" x2="106" y1="200" y2="330"></line>
              <line className="text-outline-variant/30" stroke="currentColor" x1="200" x2="48" y1="200" y2="151"></line>
              
              {/* Skill Polygon (The Data) */}
              {/* Points roughly mapped: Đọc hiểu 7.5, Nghị luận 6.0, Phân tích 8.0, Cảm thụ 7.0, Diễn đạt 8.5 */}
              <polygon className="fill-secondary/10 stroke-primary stroke-2 hover:fill-secondary/20 transition-all duration-500 cursor-pointer" points="200,80 291,170 275,304 125,291 71,158"></polygon>
              
              {/* Dots at vertices */}
              <circle className="fill-primary" cx="200" cy="80" r="4"></circle>
              <circle className="fill-primary" cx="291" cy="170" r="4"></circle>
              <circle className="fill-primary" cx="275" cy="304" r="4"></circle>
              <circle className="fill-primary" cx="125" cy="291" r="4"></circle>
              <circle className="fill-primary" cx="71" cy="158" r="4"></circle>
            </svg>
          </div>
          
          {/* Labels Overlay */}
          <div className="grid grid-cols-5 gap-2 mt-8 text-center text-[10px] font-label font-bold uppercase tracking-tighter text-on-surface-variant relative z-10">
            <div className="flex flex-col gap-0.5"><span className="opacity-70">Đọc hiểu</span><span className="text-primary text-sm font-bold">7.5</span></div>
            <div className="flex flex-col gap-0.5"><span className="opacity-70">Nghị luận</span><span className="text-primary text-sm font-bold">6.0</span></div>
            <div className="flex flex-col gap-0.5"><span className="opacity-70">Phân tích</span><span className="text-primary text-sm font-bold">8.0</span></div>
            <div className="flex flex-col gap-0.5"><span className="opacity-70">Cảm thụ</span><span className="text-primary text-sm font-bold">7.0</span></div>
            <div className="flex flex-col gap-0.5"><span className="opacity-70">Diễn đạt</span><span className="text-primary text-sm font-bold">8.5</span></div>
          </div>
          
          {/* Decorative motif */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        </section>

        {/* Section 2: Phân tích AI */}
        <section className="col-span-12 lg:col-span-6 bg-white/80 backdrop-blur-md p-10 rounded-2xl border-[0.5px] border-outline-variant/30 flex flex-col justify-between shadow-[0_4px_20px_-5px_rgba(26,28,27,0.06)]">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <h3 className="font-headline text-2xl text-primary font-bold">Phân tích AI</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 group cursor-default">
                <div className="w-1 bg-secondary/80 rounded-full group-hover:w-1.5 transition-all group-hover:bg-secondary"></div>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Thiên hướng viết</p>
                  <p className="text-on-surface text-lg leading-relaxed font-medium">Giàu cảm xúc, ngôn ngữ sáng tạo</p>
                </div>
              </div>
              
              <div className="flex gap-4 group cursor-default">
                <div className="w-1 bg-secondary/80 rounded-full group-hover:w-1.5 transition-all group-hover:bg-secondary"></div>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Điểm mạnh</p>
                  <p className="text-on-surface text-lg leading-relaxed font-medium">Diễn đạt mạch lạc, cảm thụ tốt</p>
                </div>
              </div>
              
              <div className="flex gap-4 group cursor-default">
                <div className="w-1 bg-tertiary/60 rounded-full group-hover:w-1.5 transition-all group-hover:bg-tertiary"></div>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">Cần cải thiện</p>
                  <p className="text-on-surface text-lg leading-relaxed font-medium">Bổ sung dẫn chứng, lập luận logic hơn</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 p-6 bg-gradient-to-r from-secondary/10 to-transparent rounded-xl border-l-4 border-secondary shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary text-sm">auto_awesome</span>
              <p className="font-label text-[10px] uppercase tracking-widest font-bold text-secondary">Gợi ý lộ trình</p>
            </div>
            <p className="text-primary italic font-headline leading-relaxed">
              "Tập trung luyện dạng Nghị luận xã hội trong 2 tuần tới để tối ưu hóa khả năng lập luận."
            </p>
          </div>
        </section>
      </div>

      {/* Section 3: Lịch sử Điểm (Full Width) */}
      <section className="w-full bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-[0_12px_40px_-10px_rgba(26,28,27,0.06)] border-[0.5px] border-outline-variant/30">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h3 className="font-headline text-2xl text-primary font-bold">Lịch sử Điểm số</h3>
            <p className="text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-widest mt-1">Học kỳ 1 • 2023-2024</p>
          </div>
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-secondary shadow-sm"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Bài tập</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary shadow-sm"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Bài thi</span>
            </div>
          </div>
        </div>

        <div className="relative h-72 w-full pt-4 pr-4">
          {/* Simple Vector-based line chart simulation */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Grid */}
            <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.5" x1="0" x2="1000" y1="0" y2="0"></line>
            <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.5" x1="0" x2="1000" y1="50" y2="50"></line>
            <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.5" x1="0" x2="1000" y1="100" y2="100"></line>
            <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.5" x1="0" x2="1000" y1="150" y2="150"></line>
            <line className="text-outline-variant/60" stroke="currentColor" strokeWidth="1" x1="0" x2="1000" y1="200" y2="200"></line>
            
            {/* Background gradient under the primary line */}
            <path d="M 0,200 L 0,100 L 200,90 L 400,95 L 600,60 L 800,70 L 1000,40 L 1000,200 Z" fill="url(#blue-gradient)" opacity="0.1"></path>
            
            <defs>
              <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#003857"></stop>
                <stop offset="100%" stopColor="#003857" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            
            {/* Bài thi (Primary) - Steadier line */}
            <path d="M 0,100 L 200,90 L 400,95 L 600,60 L 800,70 L 1000,40" fill="none" stroke="#003857" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" className="drop-shadow-sm"></path>
            
            {/* Bài tập (Secondary) - More volatile */}
            <path d="M 0,150 L 100,120 L 200,130 L 300,80 L 400,100 L 500,60 L 600,75 L 700,50 L 800,90 L 900,45 L 1000,30" fill="none" stroke="#006b58" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" className="opacity-70"></path>
            
            {/* Data Points */}
            <circle className="fill-primary stroke-white stroke-2 shadow-sm" cx="600" cy="60" r="5"></circle>
            <circle className="fill-primary stroke-white stroke-2 shadow-sm" cx="1000" cy="40" r="5"></circle>
            <circle className="fill-secondary stroke-white stroke-2 shadow-sm" cx="700" cy="50" r="4"></circle>
          </svg>
          
          {/* X-Axis Labels */}
          <div className="flex justify-between mt-6 text-[10px] font-label font-bold text-outline uppercase tracking-widest pl-2">
            <span>Tháng 9</span>
            <span>Tháng 10</span>
            <span>Tháng 11</span>
            <span>Tháng 12</span>
          </div>
        </div>
      </section>

      {/* Academic Footer Accent */}
      <footer className="mt-20 pt-10 border-t border-outline-variant/20 flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all">
        <div className="flex items-center gap-4">
          <span className="font-headline font-bold text-primary">Văn Học AI</span>
          <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-[0.2em] border-l border-primary/20 pl-4">Hệ thống phân tích ngôn ngữ</span>
        </div>
        <p className="text-[10px] font-label font-bold tracking-widest uppercase">© 2024 Digital Scholar</p>
      </footer>
    </div>
  );
}
