import React, { useState } from "react";

const STORYLINES = [
  {
    id: "lao-hac-khong-ban",
    title: "Lão Hạc — Nếu không bán cậu Vàng",
    work: "Lão Hạc",
    author: "Nam Cao",
    timeAgo: "Hôm qua",
    rootText: "Lão Hạc bán cậu Vàng → dằn vặt → tự tử bằng bả chó",
    branchPoint: "Lão Hạc KHÔNG bán cậu Vàng",
    nodes: [
      { id: "n1", text: "Lão Hạc giữ cậu Vàng, cả hai chết đói dần vì kiệt quệ — bi kịch vẫn không tránh khỏi", tag: "Bi kịch", tagColor: "tertiary", detail: "Trong nhánh này, Lão Hạc quyết giữ cậu Vàng vì lời hứa với con. Nhưng nạn đói tàn khốc vẫn cướp đi mạng sống của cả hai. Cái chết chậm rãi, đau đớn hơn — nhưng lão giữ được lương tâm trong sạch." },
      { id: "n2", text: "Con trai bất ngờ trở về với số bạc lớn, cha con đoàn tụ trong nước mắt", tag: "Kết có hậu", tagColor: "primary", detail: "Người con trai trở về từ đồn điền cao su với số tiền dành dụm. Lão Hạc khóc ngất khi thấy con. Cậu Vàng mừng rỡ quấn quýt. Gia đình ba nhân khẩu ấm áp trở lại." },
      { id: "n3", text: "Gia đình đoàn tụ nhưng vẫn đối mặt sưu thuế nặng nề — bi kịch chưa kết thúc", tag: "Kết mở", tagColor: "slate", detail: "Con trai về, mảnh vườn vẫn còn. Nhưng sưu thuế đè nặng. Liệu gia đình có trụ vững? Câu trả lời để ngỏ — phản ánh thực trạng xã hội Việt Nam trước 1945." },
    ],
  },
  {
    id: "tat-den-co-tien",
    title: "Tắt đèn — Chị Dậu có tiền sưu",
    work: "Tắt đèn",
    author: "Ngô Tất Tố",
    timeAgo: "3 ngày trước",
    rootText: "Chị Dậu bán con, bán chó → nộp sưu → bị hành hạ",
    branchPoint: "Chị Dậu kiếm được tiền từ phiên chợ",
    nodes: [
      { id: "n1", text: "Chị Dậu giữ được con, gia đình cùng nhau vượt qua mùa sưu tàn khốc", tag: "Kết có hậu", tagColor: "primary", detail: "Nhờ bán được vựa khoai, Chị Dậu nộp đủ sưu. Cái Tí không bị bán, gia đình đoàn tụ dưới mái nhà rách nát nhưng ấm áp tình thương." },
      { id: "n2", text: "Tiền không đủ, Chị Dậu đứng lên đối đầu tên cai lệ ngay tại nhà mình", tag: "Phản kháng", tagColor: "tertiary", detail: "Chị Dậu phản kháng — không phải vì sức mạnh, mà vì tình mẫu tử. Cú tát vào mặt cai lệ là tiếng nói của cả tầng lớp bị áp bức." },
    ],
  },
  {
    id: "truyen-kieu-khong-ban",
    title: "Truyện Kiều — Kiều không bán mình",
    work: "Truyện Kiều",
    author: "Nguyễn Du",
    timeAgo: "1 tuần trước",
    rootText: "Kiều bán mình chuộc cha → 15 năm lưu lạc → đoàn tụ Kim Trọng",
    branchPoint: "Thuý Vân đứng ra thay Kiều chuộc cha",
    nodes: [
      { id: "n1", text: "Kiều ở với Kim Trọng, Thuý Vân chịu kiếp lưu lạc thay chị", tag: "Đảo vai", tagColor: "primary", detail: "Vân thay Kiều gánh chịu số phận. Kim Trọng được Kiều nhưng mang nỗi day dứt vì Vân. Bi kịch vẫn tồn tại — chỉ đổi chủ nhân." },
    ],
  },
];

export default function MultiversePage() {
  const [selectedStoryline, setSelectedStoryline] = useState(STORYLINES[0].id);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showWritePrompt, setShowWritePrompt] = useState(false);

  const storyline = STORYLINES.find((s) => s.id === selectedStoryline)!;
  const expandedNodeData = storyline.nodes.find((n) => n.id === expandedNode);

  return (
    <div className="min-h-screen pb-32 page-enter">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <span className="text-xs font-label tracking-widest text-secondary font-bold uppercase mb-2 block">
            Đa Vũ Trụ Văn học
          </span>
          <h2 className="text-4xl font-headline font-bold text-primary-container leading-tight">
            Khám phá các kết thúc khác
          </h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
            Nếu nhân vật chọn con đường khác, câu chuyện sẽ đi về đâu? Hãy tạo và khám phá những vũ trụ song song của văn học.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-tertiary hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-tertiary/20 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          <span className="font-headline font-bold text-sm tracking-wide">Tạo storyline mới</span>
        </button>
      </div>

      {/* Storyline Selector — Horizontal Cards */}
      <div className="flex gap-4 mb-12 overflow-x-auto pb-2">
        {STORYLINES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedStoryline(s.id); setExpandedNode(null); setShowCompare(false); }}
            className={`flex-shrink-0 min-w-[280px] p-5 rounded-2xl text-left transition-all duration-300 ${
              selectedStoryline === s.id
                ? "bg-primary-container text-white shadow-xl shadow-primary/20 scale-[1.02]"
                : "bg-white border-[0.5px] border-outline-variant/30 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1"
            }`}
          >
            <p className={`text-[10px] font-label uppercase tracking-widest mb-2 font-bold ${selectedStoryline === s.id ? "opacity-70" : "text-secondary"}`}>
              {s.work} · {s.author}
            </p>
            <h4 className={`font-headline font-bold text-base leading-snug mb-3 ${selectedStoryline === s.id ? "" : "text-primary"}`}>
              {s.title}
            </h4>
            <div className={`flex justify-between items-center text-xs font-medium ${selectedStoryline === s.id ? "opacity-70" : "text-on-surface-variant"}`}>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>{s.timeAgo}
              </span>
              <span className={`px-2.5 py-1 rounded-full font-bold ${selectedStoryline === s.id ? "bg-white/20" : "bg-surface-container-low"}`}>
                {s.nodes.length} nhánh
              </span>
            </div>
          </button>
        ))}
        {/* Add placeholder */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 min-w-[200px] border-2 border-dashed border-outline-variant/40 rounded-2xl flex flex-col items-center justify-center text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <span className="material-symbols-outlined text-3xl text-outline group-hover:text-primary transition-colors mb-2">add_circle</span>
          <span className="text-sm font-medium text-outline group-hover:text-primary transition-colors">Storyline mới</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════ */}
      {/* MAIN: Visual Timeline Tree — Full Width      */}
      {/* ═════════════════════════════════════════════ */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-[#C9A84C] to-outline-variant/30 -translate-x-1/2 z-0"></div>

        {/* ─── STEP 1: Original Story (Root) ─── */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="w-full max-w-2xl">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                  <span className="text-[10px] font-label tracking-widest uppercase font-bold opacity-80">Cốt truyện nguyên tác</span>
                </div>
                <h3 className="font-headline font-bold text-2xl leading-snug mb-2">{storyline.work}</h3>
                <p className="text-white/80 font-body leading-relaxed">{storyline.rootText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── STEP 2: Branch Point (Diamond) ─── */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white border-4 border-[#C9A84C] rotate-45 flex items-center justify-center shadow-xl">
              <span className="material-symbols-outlined -rotate-45 text-[#C9A84C] font-bold text-3xl">alt_route</span>
            </div>
            <div className="bg-[#fdf8e6] border border-[#C9A84C]/30 p-5 rounded-2xl shadow-lg max-w-md">
              <span className="text-[10px] font-label font-black text-[#C9A84C] block mb-1 uppercase tracking-widest">
                Điểm rẽ vũ trụ — Nếu...
              </span>
              <p className="font-headline font-bold text-primary-container text-lg leading-snug">
                {storyline.branchPoint}
              </p>
            </div>
          </div>
        </div>

        {/* ─── STEP 3: Branch Nodes ─── */}
        <div className="relative z-10 flex justify-center mb-6">
          {/* Horizontal connector */}
          <div className="absolute top-12 left-[15%] right-[15%] h-0.5 bg-[#C9A84C]/30 z-0"></div>
        </div>

        <div className={`grid gap-6 px-4 max-w-6xl mx-auto relative z-10 mb-12 ${
          storyline.nodes.length === 1 ? "grid-cols-1 max-w-2xl" :
          storyline.nodes.length === 2 ? "grid-cols-2" :
          "grid-cols-3"
        }`}>
          {storyline.nodes.map((n, i) => (
            <div key={n.id} className="flex flex-col">
              {/* Connector dot */}
              <div className="flex justify-center mb-4">
                <div className={`w-4 h-4 rounded-full border-4 ${
                  n.tagColor === "tertiary" ? "border-tertiary bg-white" :
                  n.tagColor === "primary" ? "border-primary bg-white" :
                  "border-slate-400 bg-white"
                } shadow-md`}></div>
              </div>

              {/* Node Card */}
              <div
                onClick={() => setExpandedNode(expandedNode === n.id ? null : n.id)}
                className={`flex-1 p-6 bg-white rounded-2xl shadow-md border transition-all duration-300 cursor-pointer group ${
                  expandedNode === n.id
                    ? "ring-2 ring-primary shadow-xl -translate-y-2 border-primary/30"
                    : "border-outline-variant/30 hover:shadow-xl hover:-translate-y-1"
                }`}
              >
                {/* Tag */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-full ${
                    n.tagColor === "tertiary" ? "text-tertiary bg-tertiary/10" :
                    n.tagColor === "primary" ? "text-primary bg-primary/10" :
                    "text-slate-500 bg-slate-100"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      n.tagColor === "tertiary" ? "bg-tertiary" : n.tagColor === "primary" ? "bg-primary" : "bg-slate-400"
                    }`}></span>
                    {n.tag}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Nhánh {i + 1}</span>
                </div>

                {/* Content */}
                <p className="font-headline font-bold text-primary-container text-base leading-snug mb-4">{n.text}</p>

                {/* Expand indicator */}
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                  <span className="text-xs text-slate-400 group-hover:text-primary transition-colors font-medium">
                    {expandedNode === n.id ? "Thu gọn" : "Xem chi tiết"}
                  </span>
                  <span className={`material-symbols-outlined text-slate-400 group-hover:text-primary transition-all duration-300 ${expandedNode === n.id ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </div>

                {/* Expanded Detail */}
                {expandedNode === n.id && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-4 animate-[fadeIn_0.3s_ease-out]">
                    <p className="text-sm text-on-surface-variant leading-relaxed italic font-serif">
                      &quot;{n.detail}&quot;
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowWritePrompt(true); }}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container transition-colors active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">history_edu</span>
                        Viết bài phân tích
                      </button>
                      <button className="px-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-bold text-primary hover:bg-primary/5 transition-colors">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">add</span>
                        Tạo nhánh con
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action Bar —— Sticky at bottom */}
        <div className="flex justify-center">
          <div className="bg-white/95 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-[0_-8px_40px_-10px_rgba(26,28,27,0.1)] flex items-center gap-2 py-3 px-4">
            <button
              onClick={() => setShowCompare(!showCompare)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-bold ${
                showCompare ? "bg-primary text-white" : "hover:bg-surface-container-low text-slate-600 hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
              So sánh nhánh
            </button>
            <div className="h-6 w-px bg-outline-variant/30"></div>
            <button
              onClick={() => setShowWritePrompt(!showWritePrompt)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-md transition-all text-sm font-bold active:scale-[0.98] ${
                showWritePrompt ? "bg-primary text-white" : "bg-gradient-to-r from-tertiary to-tertiary-container text-white hover:shadow-lg"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
              Viết bài phân tích
            </button>
            <div className="h-6 w-px bg-outline-variant/30"></div>
            <button className="flex items-center gap-2 px-5 py-2.5 hover:bg-primary/5 rounded-xl transition-all group text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Xuất PDF
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CREATE MODAL ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline text-2xl font-bold text-primary mb-2">Tạo Storyline mới</h3>
            <p className="text-sm text-slate-500 mb-6">Chọn một tác phẩm và tạo điểm rẽ giả định</p>
            <div className="space-y-5 mb-8">
              <div>
                <label className="text-[11px] font-label font-bold uppercase text-on-surface-variant/70 ml-1 block mb-2">Tác phẩm gốc</label>
                <select className="w-full bg-surface-container-low/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  <option>Lão Hạc — Nam Cao</option>
                  <option>Tắt đèn — Ngô Tất Tố</option>
                  <option>Truyện Kiều — Nguyễn Du</option>
                  <option>Chiếc lược ngà — Nguyễn Quang Sáng</option>
                  <option>Người con gái Nam Xương — Nguyễn Dữ</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-label font-bold uppercase text-on-surface-variant/70 ml-1 block mb-2">Điểm rẽ (Nếu...)</label>
                <input className="w-full bg-surface-container-low/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="VD: Nếu Vũ Nương không nhảy xuống sông..." />
              </div>
              <div>
                <label className="text-[11px] font-label font-bold uppercase text-on-surface-variant/70 ml-1 block mb-2">Số nhánh muốn tạo</label>
                <div className="flex gap-3">
                  {[1, 2, 3].map(n => (
                    <button key={n} className="flex-1 py-3 border border-outline-variant/30 rounded-xl text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all">
                      {n} nhánh
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-3 border border-outline-variant/30 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Huỷ</button>
              <button onClick={() => setShowCreateModal(false)} className="px-8 py-3 bg-tertiary text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-tertiary/20 active:scale-[0.98]">
                AI tạo storyline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMPARE PANEL ═══ */}
      {showCompare && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-headline font-bold text-2xl text-primary">So sánh các nhánh</h4>
              <button onClick={() => setShowCompare(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <div className={`grid gap-6 ${storyline.nodes.length === 1 ? "grid-cols-1" : storyline.nodes.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {storyline.nodes.map((n, i) => (
                <div key={n.id} className="bg-surface-container-low p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 rounded-full ${n.tagColor === "tertiary" ? "bg-tertiary" : n.tagColor === "primary" ? "bg-primary" : "bg-slate-400"}`}></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Nhánh {i + 1} — {n.tag}</span>
                  </div>
                  <p className="font-headline font-bold text-primary text-sm leading-snug mb-3">{n.text}</p>
                  <p className="text-xs text-slate-500 italic leading-relaxed">{n.detail}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-slate-400 mt-6 italic">
              Phiên bản demo — Trong thực tế AI sẽ phân tích ý nghĩa và sự khác biệt giữa các kết thúc.
            </p>
          </div>
        </div>
      )}

      {/* ═══ WRITE PROMPT PANEL ═══ */}
      {showWritePrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowWritePrompt(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-headline font-bold text-2xl text-primary">Viết bài phân tích</h4>
                <p className="text-sm text-slate-500 mt-1">So sánh kết thúc gốc và kết thúc giả định</p>
              </div>
              <button onClick={() => setShowWritePrompt(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl mb-4 text-sm">
              <p className="font-bold text-primary mb-1">Gợi ý đề bài:</p>
              <p className="text-slate-600 italic">&quot;So sánh kết thúc nguyên tác và nhánh giả định. Phân tích ý nghĩa nhân văn và giá trị tư tưởng của mỗi hướng đi.&quot;</p>
            </div>
            <textarea
              className="w-full border border-outline-variant/30 rounded-2xl p-6 font-serif text-base leading-relaxed min-h-[250px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              placeholder="Viết bài phân tích của em tại đây..."
            ></textarea>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowWritePrompt(false)} className="px-6 py-3 border border-outline-variant/30 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Huỷ</button>
              <button onClick={() => setShowWritePrompt(false)} className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-container transition-all shadow-md active:scale-[0.98]">
                <span className="material-symbols-outlined text-[16px] align-middle mr-1">send</span>
                Gửi bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
