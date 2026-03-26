"use client";

import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<any[]>);

const CRITERIA = ["content", "logic", "expression", "format"] as const;
const CRITERIA_LABELS: Record<string, string> = { content: "Nội dung", logic: "Lập luận", expression: "Diễn đạt", format: "Hình thức" };

export default function StudentResultsPage() {
  const [tab, setTab] = useState<"exercise" | "exam">("exercise");
  const [expanded, setExpanded] = useState<number | null>(0);

  const { data: RESULTS = [], isLoading } = useSWR('/api/submissions', fetcher);

  const filtered = RESULTS.filter((r) => (r.type || "exercise") === tab);

  return (
    <div className="pt-12 px-12 pb-20 max-w-7xl mx-auto page-enter">
      {/* Page Header */}
      <header className="py-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="max-w-2xl">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-bold mb-3 block">Thống kê học tập</span>
          <h1 className="font-headline text-5xl font-bold text-primary tracking-tight mb-4">Kết quả của em</h1>
          <p className="text-on-surface-variant font-medium leading-relaxed font-body text-lg">
            Theo dõi sự tiến bộ qua từng bài viết. Hệ thống AI và Giáo viên luôn đồng hành để hoàn thiện kỹ năng phân tích văn học của em.
          </p>
        </div>
      </header>

      {/* Filter Bar */}
      <section className="flex flex-wrap gap-4 mb-12 items-center">
        <div className="flex p-1 bg-surface-container-highest/50 rounded-full border border-outline-variant/20">
          <button
            onClick={() => { setTab("exercise"); setExpanded(null); }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${tab === "exercise" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary"}`}
          >Bài tập</button>
          <button
            onClick={() => { setTab("exam"); setExpanded(null); }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${tab === "exam" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary"}`}
          >Bài thi</button>
        </div>
        <div className="relative">
          <button className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-xl border border-outline-variant/30 hover:bg-surface-container-low transition-all shadow-sm">
            <span className="text-sm font-medium text-on-surface">Tác phẩm: Tất cả</span>
            <span className="material-symbols-outlined text-outline text-xl">expand_more</span>
          </button>
        </div>
        <div className="relative">
          <button className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-xl border border-outline-variant/30 hover:bg-surface-container-low transition-all shadow-sm">
            <span className="material-symbols-outlined text-outline text-lg">calendar_today</span>
            <span className="text-sm font-medium text-on-surface">Khoảng thời gian</span>
            <span className="material-symbols-outlined text-outline text-xl">expand_more</span>
          </button>
        </div>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} kết quả</span>
      </section>

      {/* Result List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-10 text-on-surface-variant font-medium">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant font-medium">Chưa có kết quả nào.</div>
        ) : filtered.map((r, i) => {
          const ai = r.aiScore || r.ai || {};
          const teacher = r.teacherScore || r.teacher || {};
          const trend = r.trend || "";
          const type = r.type || "exercise";
          const score = r.score ?? 0;
          const title = r.title || "Không có tiêu đề";
          const date = r.date || "--/--/----";

          return (
          <div
            key={r.id || i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className={`bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border-[0.5px] border-outline-variant/30 transition-all duration-300 cursor-pointer ${expanded === i ? "shadow-lg" : "shadow-[0_4px_20px_-5px_rgba(26,28,27,0.06)] hover:shadow-md"}`}
          >
            {/* Header Row */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center font-bold text-xl ${type === "exam" ? "border-tertiary/30 text-tertiary" : "border-secondary/30 text-secondary"}`}>
                  {score}
                </div>
                <div>
                  <h4 className="font-headline font-bold text-on-surface text-lg">{title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${type === "exam" ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"}`}>
                      {type === "exam" ? "Bài thi" : "Bài tập"}
                    </span>
                    <span className="text-xs text-outline">{date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!!trend && (
                  <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full ${trend.startsWith("+") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    <span className="material-symbols-outlined text-[14px]">{trend.startsWith("+") ? "trending_up" : "trending_down"}</span>
                    {trend}
                  </span>
                )}
                <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${expanded === i ? "rotate-180" : ""}`}>expand_more</span>
              </div>
            </div>

            {/* Expanded Detail */}
            {expanded === i && (
              <div className="border-t border-outline-variant/10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative">
                  <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px bg-outline-variant/20"></div>

                  {/* AI Column */}
                  <div className="p-8 bg-gradient-to-br from-surface-container-lowest to-surface/50">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <h5 className="font-headline font-bold text-primary">Đánh giá AI</h5>
                      <span className="ml-auto text-2xl font-bold text-secondary">{ai.total || 0}</span>
                    </div>
                    <div className="space-y-3 mb-6">
                      {CRITERIA.map((c) => (
                        <div key={c} className="flex justify-between items-center text-sm">
                          <span className="text-on-surface-variant font-medium">{CRITERIA_LABELS[c]}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div className="h-full bg-secondary rounded-full" style={{ width: `${((ai[c] as number) || 0) * 10}%` }}></div>
                            </div>
                            <span className="font-bold text-primary w-6 text-right">{(ai[c] as number) || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-outline-variant/20 text-sm italic text-slate-600 font-serif leading-relaxed">
                      {ai.comment || "Không có nhận xét."}
                    </div>
                  </div>

                  {/* Teacher Column */}
                  <div className="p-8 bg-white">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
                      <h5 className="font-headline font-bold text-primary">Đánh giá Giáo viên</h5>
                      <span className="ml-auto text-2xl font-bold text-primary">{teacher.total || 0}</span>
                    </div>
                    <div className="space-y-3 mb-6">
                      {CRITERIA.map((c) => (
                        <div key={c} className="flex justify-between items-center text-sm">
                          <span className="text-on-surface-variant font-medium">{CRITERIA_LABELS[c]}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden opacity-40">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${((teacher[c] as number) || 0) * 10}%` }}></div>
                            </div>
                            <span className="font-bold text-primary w-6 text-right">{(teacher[c] as number) || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-sm italic text-slate-700 font-serif leading-relaxed">
                      {teacher.comment || "Không có nhận xét."}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
