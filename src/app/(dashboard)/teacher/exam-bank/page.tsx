"use client";

import React, { useState } from 'react';
import useSWR from 'swr';

type Tab = "exercise" | "exam";

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<any[]>);

export default function ExamBankPage() {
  const [activeTab, setActiveTab] = useState<Tab>("exercise");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: apiExams = [], isLoading, mutate } = useSWR('/api/exams', fetcher);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.get('title') || 'Đề thi mới',
        workId: formData.get('work'),
        classId: formData.get('cls'),
        type: activeTab,
        duration: activeTab === 'exam' ? 90 : 0
      })
    });
    
    await mutate();
    setIsSubmitting(false);
    setShowCreateForm(false);
  };

  return (
    <>
      <div className="flex justify-between items-end mb-12 stagger-item stagger-1">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block">Quản lý học liệu</span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Ngân hàng Đề</h2>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 border border-primary text-primary hover:bg-primary/5 transition-all rounded-md font-medium active:scale-[0.98]">
            <span className="material-symbols-outlined">auto_awesome</span>
            AI gợi ý đề
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-md shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all font-medium"
          >
            <span className="material-symbols-outlined">{showCreateForm ? "close" : "add"}</span>
            {showCreateForm ? "Đóng" : "Tạo đề mới"}
          </button>
        </div>
      </div>

      {/* Create Exam Form */}
      {showCreateForm && (
        <div className="mb-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-primary/20 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <h3 className="font-headline text-xl font-bold text-primary mb-6">Tạo đề {activeTab === "exam" ? "thi" : "bài tập"} mới</h3>
          <form className="grid grid-cols-2 gap-6" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên đề *</label>
              <input name="title" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: Phân tích nhân vật..." type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm liên quan</label>
              <select name="work" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20">
                <option value="lao-hac">Lão Hạc</option>
                <option value="tat-den">Tắt đèn</option>
                <option value="truyen-kieu">Truyện Kiều</option>
                <option value="dong-chi">Đồng chí</option>
                <option value="chiec-luoc-nga">Chiếc lược ngà</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Lớp</label>
              <select name="cls" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20">
                <option value="class-1">Lớp 8A</option>
                <option value="class-2">Lớp 9B</option>
                <option value="class-3">Lớp 9C</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Loại đề</label>
              <select name="genre" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20">
                <option>Nghị luận</option>
                <option>Cảm thụ</option>
                <option>Tự luận ngắn</option>
                <option>Trắc nghiệm + Tự luận</option>
              </select>
            </div>
            {activeTab === "exam" && (
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Thời lượng</label>
                <select className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20">
                  <option>15 phút</option>
                  <option>45 phút</option>
                  <option>90 phút</option>
                  <option>120 phút</option>
                </select>
              </div>
            )}
            <div className={`${activeTab === "exam" ? "" : "col-span-2"} space-y-2`}>
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Yêu cầu đề bài</label>
              <textarea className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" rows={3} placeholder="Mô tả chi tiết yêu cầu đề bài..."></textarea>
            </div>
            <div className="col-span-2 flex justify-end gap-4">
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-primary">Hủy</button>
              <button disabled={isSubmitting} type="submit" className="px-8 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50">
                {isSubmitting ? 'Đang tạo...' : 'Tạo đề'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("exercise")}
                className={`relative pb-4 font-bold group ${activeTab === "exercise" ? "text-primary" : "text-slate-400 hover:text-primary"}`}
              >
                <span>Bài tập</span>
                {activeTab === "exercise" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
              </button>
              <button
                onClick={() => setActiveTab("exam")}
                className={`relative pb-4 font-bold group ${activeTab === "exam" ? "text-primary" : "text-slate-400 hover:text-primary"}`}
              >
                <span>Bài thi</span>
                {activeTab === "exam" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <select className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/20 text-on-surface">
                  <option>Tất cả lớp</option>
                  <option>Lớp 8</option>
                  <option>Lớp 9</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
              </div>
            </div>
          </div>

          {/* Exercise Table */}
          {activeTab === "exercise" && (
            <div className="bg-surface-container-lowest shadow-sm rounded-2xl overflow-hidden border border-outline-variant/15">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đề</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {apiExams.filter(e => e.type === 'exercise').map(e => (
                    <tr key={e.id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-headline font-bold text-primary group-hover:text-secondary transition-colors">{e.title}</div>
                        <div className="text-xs text-slate-400 font-body mt-0.5 italic">Tác phẩm: {e.work}</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface font-medium">{e.cls}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${e.genre === "Nghị luận" ? "bg-blue-50 text-blue-700" : e.genre === "Cảm thụ" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{e.genre}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`flex items-center gap-1.5 text-sm font-medium ${e.status === "approved" ? "text-secondary" : "text-amber-600"}`}>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{e.status === "approved" ? "check_circle" : "pending"}</span>
                          {e.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-3 text-sm font-medium">
                          <button className="text-primary hover:text-secondary transition-colors underline decoration-outline-variant/50 underline-offset-4">Xem</button>
                          <button className="text-primary hover:text-secondary transition-colors underline decoration-outline-variant/50 underline-offset-4">{e.status === "pending" ? "Duyệt" : "Sửa"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 bg-surface-container-low/20 flex justify-between items-center border-t border-outline-variant/10">
                <span className="text-xs text-slate-500 font-medium">Hiển thị {apiExams.filter(e => e.type === 'exercise').length} / 128 bài tập</span>
                <div className="flex gap-2">
                  <button className="p-1 rounded hover:bg-white transition-colors text-slate-400"><span className="material-symbols-outlined">chevron_left</span></button>
                  <button className="p-1 rounded hover:bg-white transition-colors text-slate-700"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
            </div>
          )}

          {/* Exam Table */}
          {activeTab === "exam" && (
            <div className="bg-surface-container-lowest shadow-sm rounded-2xl overflow-hidden border border-outline-variant/15">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đề thi</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời lượng</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Số câu</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {apiExams.filter(e => e.type === 'exam').map(e => (
                    <tr key={e.id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-headline font-bold text-primary group-hover:text-secondary transition-colors">{e.title}</div>
                        <div className="text-xs text-slate-400 font-body mt-0.5 italic">Tác phẩm: {e.work}</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface font-medium">{e.cls}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{e.duration}</td>
                      <td className="px-6 py-5 text-center text-sm font-mono font-bold text-primary">{e.questions}</td>
                      <td className="px-6 py-5">
                        <div className={`flex items-center gap-1.5 text-sm font-medium ${e.status === "approved" ? "text-secondary" : "text-amber-600"}`}>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{e.status === "approved" ? "check_circle" : "pending"}</span>
                          {e.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-3 text-sm font-medium">
                          <button className="text-primary hover:text-secondary transition-colors underline decoration-outline-variant/50 underline-offset-4">Xem</button>
                          <button className="text-primary hover:text-secondary transition-colors underline decoration-outline-variant/50 underline-offset-4">{e.status === "pending" ? "Duyệt" : "Sửa"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 bg-surface-container-low/20 flex justify-between items-center border-t border-outline-variant/10">
                <span className="text-xs text-slate-500 font-medium">Hiển thị {apiExams.filter(e => e.type === 'exam').length} / 45 đề thi</span>
                <div className="flex gap-2">
                  <button className="p-1 rounded hover:bg-white transition-colors text-slate-400"><span className="material-symbols-outlined">chevron_left</span></button>
                  <button className="p-1 rounded hover:bg-white transition-colors text-slate-700"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="col-span-12 lg:col-span-4 sticky top-28">
          <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl p-8 border border-outline-variant/15 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-headline font-bold text-primary">Cấu trúc Đề thi</h3>
                <span className="text-[10px] font-bold bg-primary/5 text-primary px-2 py-1 rounded">MẪU CHUẨN</span>
              </div>
              <div className="space-y-8">
                <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-secondary/20">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-headline font-bold text-secondary text-sm uppercase tracking-wider">Phần I — Đọc hiểu</h4>
                    <span className="text-xs font-bold text-slate-500">3-4 điểm</span>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
                    <li className="flex gap-3"><span className="text-primary font-bold">•</span>Văn bản ngoài SGK hoặc đoạn trích tiêu biểu.</li>
                    <li className="flex gap-3"><span className="text-primary font-bold">•</span>4 câu hỏi nhận biết, thông hiểu, vận dụng.</li>
                  </ul>
                </div>
                <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-primary/20">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-headline font-bold text-primary text-sm uppercase tracking-wider">Phần II — Làm văn</h4>
                    <span className="text-xs font-bold text-slate-500">6-7 điểm</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-surface-container-low rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-primary">Câu 1: NL Xã hội</span>
                        <span className="text-xs font-medium text-slate-500">2 điểm</span>
                      </div>
                      <p className="text-[13px] text-slate-500 italic leading-relaxed">Nghị luận về tư tưởng đạo lý hoặc hiện tượng đời sống.</p>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-primary">Câu 2: NL Văn học</span>
                        <span className="text-xs font-medium text-slate-500">5 điểm</span>
                      </div>
                      <p className="text-[13px] text-slate-500 italic leading-relaxed">Phân tích tác phẩm, nhân vật hoặc so sánh văn học trọng tâm.</p>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-10 py-4 border border-dashed border-outline-variant hover:border-primary hover:text-primary transition-all rounded-xl text-sm font-bold text-slate-400 flex items-center justify-center gap-2 active:scale-[0.98]">
                <span className="material-symbols-outlined text-sm">settings_suggest</span>
                Tùy chỉnh cấu trúc
              </button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-primary-container text-on-primary-container rounded-2xl shadow-sm flex gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <div>
              <p className="text-sm font-medium opacity-90 leading-relaxed">Bạn có thể dùng AI để tự động sinh ma trận đề thi dựa trên các bài tập đã chọn.</p>
              <button className="mt-3 text-xs font-bold uppercase tracking-wider text-secondary-fixed hover:underline">Thử ngay</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
