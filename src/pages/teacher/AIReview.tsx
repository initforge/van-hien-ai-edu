import React, { useState } from 'react';
import {
  CLASS_STATS_CARDS,
  CLASS_STATS_BARS,
  STUDENT_STATS_ROWS,
  STYLE_CARDS,
  COMMON_ERRORS,
  TOKEN_FEATURES,
  TOKEN_DETAIL_ROWS,
} from '../../constants/aiReview';

type Tab = 'class_stats' | 'student_stats' | 'style' | 'tokens' | 'rubrics';

const TAB_LABELS: Record<Tab, string> = {
  class_stats: 'Thống kê lớp',
  student_stats: 'Thống kê học sinh',
  style: 'Văn phong',
  tokens: 'Sử dụng Token',
  rubrics: 'Bảo mẫu AI',
};

export default function TeacherAIReviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>("class_stats");

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-12">
        <span className="text-xs font-bold text-secondary uppercase tracking-[0.15em] mb-2 block">Trung tâm điều hành AI</span>
        <h2 className="text-5xl font-headline text-primary leading-tight">Phân tích &amp; Duyệt AI</h2>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-8 border-b border-surface-container-highest mb-10 overflow-x-auto pb-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 transition-all whitespace-nowrap font-medium ${
              activeTab === tab
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-slate-500 hover:text-primary"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>



      {/* ═══ TAB: Thống kê lớp ═══ */}
      {activeTab === "class_stats" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {CLASS_STATS_CARDS.map((s, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border-[0.5px] border-outline-variant/30">
                <span className={`material-symbols-outlined ${s.color} text-3xl mb-3 block`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <p className="text-3xl font-headline font-bold text-primary mb-1">{s.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-outline-variant/30">
            <h3 className="font-headline text-xl font-bold text-primary mb-6">Điểm trung bình theo lớp</h3>
            <div className="space-y-4">
              {CLASS_STATS_BARS.map((cls, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-bold text-primary">{cls.name}</span>
                  <div className="flex-1 h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all" style={{ width: `${cls.avg * 10}%` }}></div>
                  </div>
                  <span className="w-10 text-right font-bold text-primary">{cls.avg}</span>
                  <span className="text-xs text-slate-400">({cls.count} hs)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: Thống kê học sinh ═══ */}
      {activeTab === "student_stats" && (
        <div className="space-y-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border-[0.5px] border-outline-variant/30 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Học sinh</th>
                  <th className="px-6 py-4">Lớp</th>
                  <th className="px-6 py-4 text-center">Bài nộp</th>
                  <th className="px-6 py-4 text-center">Điểm TB</th>
                  <th className="px-6 py-4 text-center">Xu hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {STUDENT_STATS_ROWS.map((s, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.cls}</td>
                    <td className="px-6 py-4 text-center text-sm font-mono">{s.submitted}</td>
                    <td className="px-6 py-4 text-center font-bold text-primary text-lg">{s.avg}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.trend.startsWith("+") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {s.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ TAB: Văn phong ═══ */}
      {activeTab === "style" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STYLE_CARDS.map((s, i) => (
              <div key={i} className={`p-6 rounded-2xl border-[0.5px] border-outline-variant/30 ${s.color.split(' ')[0]}`}>
                <span className={`material-symbols-outlined ${s.color.split(' ')[1]} text-3xl mb-3 block`}>{s.icon}</span>
                <p className="text-3xl font-headline font-bold text-primary mb-1">{s.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">{s.label}</p>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-outline-variant/30">
            <h3 className="font-headline text-xl font-bold text-primary mb-6">Lỗi phổ biến nhất</h3>
            <div className="space-y-3">
              {COMMON_ERRORS.map((e, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-6 text-right text-sm font-bold text-slate-400">{i + 1}</span>
                  <span className="flex-1 text-sm text-on-surface font-medium">{e.error}</span>
                  <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: `${(e.count / 50) * 100}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 w-10 text-right">{e.count} lần</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: Sử dụng Token ═══ */}
      {activeTab === "tokens" && (
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary-container text-white p-8 rounded-2xl relative overflow-hidden col-span-1">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <p className="text-xs uppercase tracking-widest opacity-80 font-bold mb-2">Hạn mức tháng</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold">45,230</span>
                <span className="text-sm opacity-70 mb-1">/ 100,000</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-fixed w-[45%] rounded-full shadow-[0_0_10px_2px_rgba(141,246,217,0.3)]"></div>
              </div>
              <button className="mt-6 w-full bg-white text-primary-container py-3 rounded-xl font-bold text-sm hover:bg-secondary-fixed transition-all active:scale-[0.98]">Nâng cấp gói</button>
            </div>
            <div className="col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-outline-variant/30">
              <h3 className="font-headline text-xl font-bold text-primary mb-6">Token theo tính năng</h3>
              <div className="space-y-4">
                {TOKEN_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-28 text-sm font-medium text-slate-600">{f.name}</span>
                    <div className="flex-1 h-3 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${i === 0 ? "bg-primary" : i === 1 ? "bg-secondary" : i === 2 ? "bg-tertiary" : "bg-amber-500"}`} style={{ width: `${f.pct}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-primary w-16 text-right">{f.tokens.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 w-10 text-right">{f.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border-[0.5px] border-outline-variant/30 overflow-hidden">
            <div className="px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline text-lg font-bold text-primary">Chi tiết sử dụng token</h3>
              <button className="text-xs font-bold text-primary uppercase tracking-wider hover:underline">Xuất CSV</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Ngày</th>
                  <th className="px-6 py-4">Tính năng</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4 text-right">Input tokens</th>
                  <th className="px-6 py-4 text-right">Output tokens</th>
                  <th className="px-6 py-4 text-right">Tổng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {TOKEN_DETAIL_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        row.feature === "Chấm bài" ? "bg-primary/10 text-primary" :
                        row.feature === "Chatbot" ? "bg-secondary/10 text-secondary" :
                        row.feature === "Ra đề" ? "bg-tertiary/10 text-tertiary" :
                        "bg-amber-100 text-amber-700"
                      }`}>{row.feature}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.desc}</td>
                    <td className="px-6 py-4 text-right text-sm font-mono text-slate-600">{row.input.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm font-mono text-slate-600">{row.output.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm font-mono font-bold text-primary">{row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-surface-container-low/20 border-t border-outline-variant/10 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Hiển thị 7 giao dịch gần nhất</span>
              <button className="text-xs font-bold text-primary hover:underline">Xem tất cả →</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: Bảo mẫu AI (AI Guardrails & Rubrics) ═══ */}
      {activeTab === "rubrics" && (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="font-headline text-2xl font-bold text-primary mb-2">Quản lý Tiêu chí chấm điểm AI</h3>
              <p className="text-outline text-sm max-w-2xl">Thiết lập các trọng số đánh giá (Rubrics) để định hướng cho AI khi tự động phân tích bài viết của học sinh, đảm bảo bám sát barem giáo dục chuẩn.</p>
            </div>
            <button className="bg-gradient-to-r from-primary to-primary-container text-white px-5 py-2.5 rounded-full font-headline font-bold hover:shadow-lg active:scale-95 transition-all text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span> Thêm tiêu chí mới
            </button>
          </div>

          {/* Progress Bar for Weights */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 text-center">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-3">
              <span className="text-primary">Đã phân bổ</span>
              <span className="text-secondary">100% / 100%</span>
            </div>
            <div className="w-full h-4 bg-surface-container-highest rounded-full flex overflow-hidden shadow-inner">
               <div className="h-full bg-primary transition-all duration-1000" style={{ width: '40%' }} title="Nội dung Focus"></div>
               <div className="h-full bg-secondary transition-all duration-1000" style={{ width: '30%' }} title="Lập luận logic"></div>
               <div className="h-full bg-tertiary transition-all duration-1000" style={{ width: '20%' }} title="Diễn đạt & Từ vựng"></div>
               <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: '10%' }} title="Sáng tạo"></div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rubric 1 */}
            <div className="bg-white/80 p-6 rounded-2xl border border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all group">
               <div className="flex justify-between items-start mb-4">
                 <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                 <span className="bg-primary/10 text-primary text-lg font-black font-mono px-3 py-1 rounded-xl">40%</span>
               </div>
               <h4 className="font-headline font-bold text-lg text-on-surface mb-2">Trọng tâm & Mở rộng</h4>
               <p className="text-sm text-outline mb-6 leading-relaxed">Đánh giá khả năng hiểu đúng yêu cầu đề bài, phân tích sâu và phân bổ lý lẽ cân đối.</p>
               
               <div className="mt-auto space-y-3 relative z-10">
                 <input type="range" min="0" max="100" defaultValue="40" className="w-full accent-primary" />
               </div>
               <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-between">
                 <button className="text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors">XÓA</button>
                 <button className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider">CẤU HÌNH PROMPT</button>
               </div>
            </div>

            {/* Rubric 2 */}
            <div className="bg-white/80 p-6 rounded-2xl border border-secondary/20 hover:shadow-xl hover:-translate-y-1 transition-all group">
               <div className="flex justify-between items-start mb-4">
                 <span className="material-symbols-outlined text-secondary text-3xl">account_tree</span>
                 <span className="bg-secondary/10 text-secondary text-lg font-black font-mono px-3 py-1 rounded-xl">30%</span>
               </div>
               <h4 className="font-headline font-bold text-lg text-on-surface mb-2">Lập luận logic</h4>
               <p className="text-sm text-outline mb-6 leading-relaxed">Kiểm tra tính mạch lạc của bố cục, lập luận thuyết phục có kèm theo minh chứng rõ ràng.</p>
               
               <div className="mt-auto space-y-3">
                 <input type="range" min="0" max="100" defaultValue="30" className="w-full accent-secondary" />
               </div>
               <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-between">
                 <button className="text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors">XÓA</button>
                 <button className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider">CẤU HÌNH PROMPT</button>
               </div>
            </div>

            {/* Rubric 3 */}
            <div className="bg-white/80 p-6 rounded-2xl border border-tertiary/20 hover:shadow-xl hover:-translate-y-1 transition-all group">
               <div className="flex justify-between items-start mb-4">
                 <span className="material-symbols-outlined text-tertiary text-3xl">edit_note</span>
                 <span className="bg-tertiary/10 text-tertiary text-lg font-black font-mono px-3 py-1 rounded-xl">20%</span>
               </div>
               <h4 className="font-headline font-bold text-lg text-on-surface mb-2">Diễn đạt & Từ vựng</h4>
               <p className="text-sm text-outline mb-6 leading-relaxed">Ưu tiên vốn từ vựng phong phú, sử dụng biểu cảm chính xác, không mắc lỗi chính tả, câu cú mượt mà.</p>
               
               <div className="mt-auto space-y-3">
                 <input type="range" min="0" max="100" defaultValue="20" className="w-full accent-tertiary" />
               </div>
               <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-between">
                 <button className="text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors">XÓA</button>
                 <button className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider">CẤU HÌNH PROMPT</button>
               </div>
            </div>

            {/* Rubric 4 */}
            <div className="bg-white/80 p-6 rounded-2xl border border-amber-500/20 hover:shadow-xl hover:-translate-y-1 transition-all group">
               <div className="flex justify-between items-start mb-4">
                 <span className="material-symbols-outlined text-amber-500 text-3xl">lightbulb</span>
                 <span className="bg-amber-500/10 text-amber-600 text-lg font-black font-mono px-3 py-1 rounded-xl">10%</span>
               </div>
               <h4 className="font-headline font-bold text-lg text-on-surface mb-2">Độ Sáng tạo</h4>
               <p className="text-sm text-outline mb-6 leading-relaxed">Khuyến khích góc nhìn mới mẻ, liên hệ thực tiễn đắt giá, hoặc sử dụng các hình tượng so sánh thú vị.</p>
               
               <div className="mt-auto space-y-3">
                 <input type="range" min="0" max="100" defaultValue="10" className="w-full accent-amber-500" />
               </div>
               <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-between">
                 <button className="text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors">XÓA</button>
                 <button className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider">CẤU HÌNH PROMPT</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
