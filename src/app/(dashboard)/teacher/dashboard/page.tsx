"use client";

import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TeacherDashboardPage() {
  const { data } = useSWR('/api/stats', fetcher);
  const stats = (data as any) || { studentsCount: 156, pendingGrading: 12, examsCreated: 28, aiPending: '05' };

  return (
    <>
      <div className="mb-10">
        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Tổng quan</h2>
        <p className="text-outline mt-2 font-body italic">"Văn chương luyện cho ta những tình cảm ta không có, luyện cho ta những mối dây liên lạc ta chưa hề biết." — Hoài Thanh</p>
      </div>
      
      {/* ROW 1: Stat Cards (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* Stat Card 1 */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-white/90 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style={{ animation: "fadeIn 0.5s ease-out 0.1s both" }}>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] block mb-4">Sĩ số</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-primary">{stats.studentsCount}</span>
              <span className="text-outline text-sm">học sinh</span>
            </div>
            <p className="text-xs text-outline mt-2">Tổng số 4 lớp đang dạy</p>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">groups</span>
        </div>
        {/* Stat Card 2 */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-white/90 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style={{ animation: "fadeIn 0.5s ease-out 0.2s both" }}>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Bài chờ chấm</span>
              <span className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-1 rounded-full">{stats.pendingGrading > 0 ? `${stats.pendingGrading} MỚI` : 'HOÀN THÀNH'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-primary">{stats.pendingGrading}</span>
              <span className="text-outline text-sm">bài nộp</span>
            </div>
            <p className="text-xs text-outline mt-2">Hạn chót còn 2 ngày</p>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">history_edu</span>
        </div>
        {/* Stat Card 3 */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-white/90 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style={{ animation: "fadeIn 0.5s ease-out 0.3s both" }}>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] block mb-4">Đề đã tạo</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-primary">{stats.examsCreated}</span>
              <span className="text-outline text-sm">đề thi</span>
            </div>
            <p className="text-xs text-outline mt-2">18 bài tập · 10 bài thi</p>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">quiz</span>
        </div>
        {/* Stat Card 4 */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-white/90 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style={{ animation: "fadeIn 0.5s ease-out 0.4s both" }}>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] block mb-4">AI chờ duyệt</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-primary">{String(stats.aiPending).padStart(2, '0')}</span>
              <span className="text-outline text-sm">nội dung</span>
            </div>
            <p className="text-xs text-outline mt-2">Phân tích tác phẩm tự động</p>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">psychology</span>
        </div>
      </div>
      
      {/* ROW 2: Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
        {/* Left: Recent Activity (60%) */}
        <div className="lg:col-span-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-headline font-bold text-primary">Hoạt động gần đây</h3>
            <button className="text-xs font-bold text-secondary tracking-widest uppercase hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {/* Activity Item */}
            <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Đã chấm xong bài: "Phân tích Vợ Chồng A Phủ"</p>
                <p className="text-xs text-outline">Lớp 12C1 · 32 bài nộp</p>
              </div>
              <span className="text-[10px] text-outline font-medium">10 phút trước</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">AI gợi ý đề minh họa mới</p>
                <p className="text-xs text-outline">Chủ đề: Tự do và Trách nhiệm</p>
              </div>
              <span className="text-[10px] text-outline font-medium">1 giờ trước</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Học sinh mới tham gia hệ thống</p>
                <p className="text-xs text-outline">Trần Hoàng M. · Lớp 10A2</p>
              </div>
              <span className="text-[10px] text-outline font-medium">3 giờ trước</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">rate_review</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Yêu cầu phúc khảo bài thi học kỳ</p>
                <p className="text-xs text-outline">Lê Thúy H. · Lớp 11B3</p>
              </div>
              <span className="text-[10px] text-outline font-medium">Hôm qua</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">article</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Đã xuất bản giáo án tuần 12</p>
                <p className="text-xs text-outline">Chủ đề: Văn học hiện thực 1930-1945</p>
              </div>
              <span className="text-[10px] text-outline font-medium">Hôm qua</span>
            </div>
          </div>
        </div>
        
        {/* Right: AI Alerts (40%) */}
        <div className="lg:col-span-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-headline font-bold text-tertiary">Cảnh báo AI</h3>
            <span className="material-symbols-outlined text-tertiary/40">emergency_home</span>
          </div>
          <div className="space-y-4">
            {/* Alert Card 1 */}
            <div className="p-5 bg-white border-l-4 border-l-tertiary rounded-xl shadow-sm hover:translate-x-1 transition-transform">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-tertiary text-sm">trending_down</span>
                <span className="text-[10px] font-bold text-tertiary tracking-widest uppercase">Giảm sút phong độ</span>
              </div>
              <p className="text-sm font-bold text-on-surface mb-1">Nguyễn Văn A - Lớp 9A</p>
              <p className="text-xs text-outline leading-relaxed">Điểm giảm liên tục 3 bài gần nhất. AI dự đoán hổng kiến thức phần "Nghị luận xã hội".</p>
              <button className="mt-4 text-[10px] font-bold text-primary hover:text-secondary uppercase tracking-wider flex items-center gap-1 transition-colors">
                Gửi tài liệu ôn tập <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
            {/* Alert Card 2 */}
            <div className="p-5 bg-white border-l-4 border-l-tertiary rounded-xl shadow-sm hover:translate-x-1 transition-transform">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-tertiary text-sm">report_problem</span>
                <span className="text-[10px] font-bold text-tertiary tracking-widest uppercase">Phát hiện sao chép</span>
              </div>
              <p className="text-sm font-bold text-on-surface mb-1">Trần Thị B - Lớp 12C1</p>
              <p className="text-xs text-outline leading-relaxed">Độ tương đồng 85% với bài làm năm 2022. Cần kiểm tra lại nội dung bài "Vợ nhặt".</p>
              <div className="flex gap-2 mt-4">
                <button className="px-3 py-1.5 bg-tertiary text-white text-[10px] font-bold rounded uppercase tracking-wider">Xem báo cáo</button>
                <button className="px-3 py-1.5 border border-outline-variant text-outline text-[10px] font-bold rounded uppercase tracking-wider">Bỏ qua</button>
              </div>
            </div>
            {/* Alert Card 3 */}
            <div className="p-5 bg-white border-l-4 border-l-secondary rounded-xl shadow-sm hover:translate-x-1 transition-transform border-l-secondary">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary text-sm">lightbulb</span>
                <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">Tài năng mới</span>
              </div>
              <p className="text-sm font-bold text-on-surface mb-1">Hoàng Thu C - Lớp 11B</p>
              <p className="text-xs text-outline leading-relaxed">Sử dụng ngôn ngữ thơ ca đặc sắc trong bài văn xuôi. Đề xuất bồi dưỡng đội tuyển HSG.</p>
            </div>
          </div>
          

        </div>
      </div>
    </>
  );
}
