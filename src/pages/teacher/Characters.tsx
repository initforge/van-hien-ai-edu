import React, { useState } from 'react';

type Tab = "list" | "history";

const CHARACTERS = [
  { id: 1, name: "Lão Hạc", initials: "LH", work: "Lão Hạc (Nam Cao)", active: true, chats: 234 },
  { id: 2, name: "Vũ Nương", initials: "VN", work: "Người con gái Nam Xương", active: true, chats: 187 },
  { id: 3, name: "Chị Dậu", initials: "CD", work: "Tắt đèn (Ngô Tất Tố)", active: false, chats: 56 },
  { id: 4, name: "Thúy Kiều", initials: "TK", work: "Truyện Kiều (Nguyễn Du)", active: true, chats: 312 },
  { id: 5, name: "Bé Thu", initials: "BT", work: "Chiếc lược ngà", active: true, chats: 145 },
];

const CHAT_HISTORY = [
  { id: 1, student: "Nguyễn Thị Mai", cls: "8A", character: "Lão Hạc", time: "15 phút trước", messages: 12, preview: "Em hỏi về tâm trạng của Lão Hạc khi phải bán cậu Vàng..." },
  { id: 2, student: "Trần Văn Hào", cls: "9B", character: "Thúy Kiều", time: "1 giờ trước", messages: 8, preview: "Thúy Kiều chia sẻ cảm xúc trong đêm trao duyên..." },
  { id: 3, student: "Lê Minh Anh", cls: "9B", character: "Vũ Nương", time: "2 giờ trước", messages: 15, preview: "Cuộc trò chuyện về nỗi oan khuất và lòng thủy chung..." },
  { id: 4, student: "Phạm Hương Giang", cls: "8A", character: "Lão Hạc", time: "3 giờ trước", messages: 6, preview: "Em hỏi về quan hệ giữa Lão Hạc và ông giáo..." },
  { id: 5, student: "Đỗ Quang Minh", cls: "9C", character: "Bé Thu", time: "Hôm qua", messages: 20, preview: "Bé Thu kể về ký ức với cha trong chiến tranh..." },
  { id: 6, student: "Vũ Thị Hồng", cls: "9C", character: "Chị Dậu", time: "Hôm qua", messages: 10, preview: "Chị Dậu kể về cảnh phải bán con để nộp sưu..." },
];

export default function CharactersPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [selectedChar, setSelectedChar] = useState<number>(1);
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const char = CHARACTERS.find(c => c.id === selectedChar);

  return (
    <div className="max-w-7xl mx-auto space-y-12 page-enter">
      {/* Page Header */}
      <section className="flex justify-between items-end">
        <div className="space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Hệ thống học thuật</span>
          <h2 className="font-headline font-bold text-3xl text-primary-container">Nhân vật AI</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-primary text-on-primary rounded-xl flex items-center space-x-2 shadow-md hover:translate-y-[-2px] transition-transform duration-300 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">{showAddForm ? "close" : "person_add"}</span>
          <span className="font-medium">{showAddForm ? "Đóng" : "Thêm nhân vật"}</span>
        </button>
      </section>

      {/* Add Character Form */}
      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-primary/20 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <h3 className="font-headline text-xl font-bold text-primary mb-6">Thêm nhân vật mới</h3>
          <form className="grid grid-cols-2 gap-6" onSubmit={(e) => { e.preventDefault(); setShowAddForm(false); }}>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên nhân vật *</label>
              <input className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: Chí Phèo" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm *</label>
              <input className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: Chí Phèo — Nam Cao" type="text" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tính cách</label>
              <textarea className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" rows={3} placeholder="Mô tả tính cách, giọng điệu, ngôn ngữ đặc trưng..."></textarea>
            </div>
            <div className="col-span-2 flex justify-end gap-4">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-primary">Hủy</button>
              <button type="submit" className="px-8 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all">Tạo nhân vật</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex space-x-12 border-b border-outline-variant/20">
        <button
          onClick={() => setTab("list")}
          className={`pb-4 relative transition-all ${tab === "list" ? "text-primary font-bold" : "text-slate-500 hover:text-primary"}`}
        >
          Danh sách nhân vật
          {tab === "list" && <span className="absolute -bottom-[1px] left-0 w-full h-[2px] bg-primary"></span>}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`pb-4 relative transition-all ${tab === "history" ? "text-primary font-bold" : "text-slate-500 hover:text-primary"}`}
        >
          Lịch sử chat HS
          <span className="ml-2 bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold">{CHAT_HISTORY.length}</span>
          {tab === "history" && <span className="absolute -bottom-[1px] left-0 w-full h-[2px] bg-primary"></span>}
        </button>
      </div>

      {/* ═══ TAB: Danh sách nhân vật ═══ */}
      {tab === "list" && (
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden border-[0.5px] border-outline-variant/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 font-label text-[11px] uppercase tracking-widest text-slate-500">Nhân vật</th>
                    <th className="px-6 py-4 font-label text-[11px] uppercase tracking-widest text-slate-500">Tác phẩm</th>
                    <th className="px-6 py-4 font-label text-[11px] uppercase tracking-widest text-slate-500">Trạng thái</th>
                    <th className="px-6 py-4 font-label text-[11px] uppercase tracking-widest text-slate-500 text-center">Lượt chat</th>
                    <th className="px-6 py-4 font-label text-[11px] uppercase tracking-widest text-slate-500 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {CHARACTERS.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedChar(c.id)}
                      className={`hover:bg-primary/5 transition-colors group cursor-pointer ${!c.active ? "opacity-70" : ""} ${selectedChar === c.id ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-headline text-primary font-bold">{c.initials}</div>
                          <span className="font-semibold text-primary">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 italic">{c.work}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${c.active ? "bg-emerald-500" : "bg-red-500"}`}></span>
                          {c.active ? "Bật" : "Tắt"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-mono">{c.chats}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs space-x-3 font-medium">
                          <button className="text-primary hover:underline">Sửa</button>
                          <button className={`${c.active ? "text-slate-400 hover:text-tertiary" : "text-emerald-600 hover:underline"}`}>{c.active ? "Tắt" : "Bật"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-secondary text-4xl">lightbulb</span>
                <p className="text-sm text-slate-600 max-w-md">
                  <strong className="text-primary">Mẹo học thuật:</strong> Cung cấp cho nhân vật AI càng nhiều chi tiết về bối cảnh lịch sử và tâm lý nhân vật sẽ giúp cuộc trò chuyện trở nên sâu sắc hơn.
                </p>
              </div>
              <button 
                onClick={() => setShowPromptGuide(true)}
                className="text-primary font-semibold text-sm hover:underline"
              >
                Xem hướng dẫn soạn prompt
              </button>
            </div>
          </div>

          {/* Config Panel */}
          <div className="col-span-12 lg:col-span-4">
            {char && (
              <div className="bg-white/80 backdrop-blur-md shadow-sm border-[0.5px] border-outline-variant/30 rounded-2xl p-8 sticky top-28 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-bold text-xl text-primary-container">Cấu hình {char.name}</h3>
                  <span className="material-symbols-outlined text-slate-400">auto_fix_high</span>
                </div>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên nhân vật</label>
                    <input className="w-full bg-white/50 border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 transition-all font-body text-primary font-medium px-0 pb-2" type="text" defaultValue={char.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm</label>
                    <input className="w-full bg-white/50 border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 transition-all font-body text-slate-600 px-0 pb-2 italic" type="text" defaultValue={char.work} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tính cách</label>
                    <textarea className="w-full bg-white/50 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/10 rounded-lg p-3 text-sm text-slate-700 leading-relaxed font-body" rows={4} defaultValue="Già nua, khắc khổ nhưng vô cùng thương con và giàu lòng tự trọng. Ngôn ngữ mộc mạc, chân chất của người nông dân Việt Nam trước CM Tháng Tám."></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Ranh giới (System Prompt)</label>
                    <textarea className="w-full bg-white/50 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/10 rounded-lg p-3 text-sm text-slate-700 leading-relaxed font-body" rows={4} defaultValue="Tuyệt đối không trả lời các câu hỏi nằm ngoài phạm vi tác phẩm hoặc các vấn đề nhạy cảm, chính trị. Luôn giữ thái độ nhã nhặn, đúng mực."></textarea>
                  </div>
                  <div className="pt-6 flex flex-col space-y-3">
                    <button className="w-full py-3 border border-secondary text-secondary rounded-lg font-bold flex items-center justify-center space-x-2 hover:bg-secondary/5 transition-all" type="button">
                      <span className="material-symbols-outlined text-lg">chat_bubble</span>
                      <span>Test thử</span>
                    </button>
                    <button className="w-full py-4 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-container transition-all text-lg font-headline tracking-wide active:scale-[0.98]" type="submit">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: Lịch sử chat HS ═══ */}
      {tab === "history" && (
        <div className="space-y-4">
          {CHAT_HISTORY.map(chat => (
            <div key={chat.id} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border-[0.5px] border-outline-variant/30 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {chat.student.split(' ').pop()?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-primary">{chat.student}</h4>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{chat.cls}</span>
                      <span className="text-xs text-outline">•</span>
                      <span className="text-xs text-slate-500 italic">Chat với <strong className="text-secondary">{chat.character}</strong></span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">{chat.preview}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-slate-400">{chat.time}</span>
                  <span className="bg-surface-container-high text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold">{chat.messages} tin nhắn</span>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ POPUP: Hướng dẫn soạn prompt ═══ */}
      {showPromptGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPromptGuide(false)}>
          <div className="bg-white rounded-3xl p-10 max-w-2xl w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-2">Hướng dẫn soạn Prompt</h3>
                <p className="text-sm text-slate-500">Mẹo tạo nhân vật AI hấp dẫn và chính xác</p>
              </div>
              <button onClick={() => setShowPromptGuide(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Xác định tính cách cốt lõi
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed pl-8">Mô tả chi tiết tính cách, giọng điệu, và cách nói chuyện đặc trưng của nhân vật. VD: &quot;Lão Hạc nói chuyện chậm rãi, giọng buồn bã, dùng nhiều câu cảm thán. Luôn gọi con trai là thằng nhỏ.&quot;</p>
              </div>
              <div>
                <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Cung cấp bối cảnh lịch sử
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed pl-8">Nhân vật nên hiểu rõ bối cảnh thời đại. VD: &quot;Lão Hạc sống trong xã hội nông thôn Việt Nam trước 1945, nơi nạn đói và sưu thuế hoành hành.&quot;</p>
              </div>
              <div>
                <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Thiết lập ranh giới rõ ràng
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed pl-8">Quy định rõ những gì nhân vật KHÔNG được trả lời: câu hỏi ngoài tác phẩm, vấn đề nhạy cảm, thông tin sai lệch. VD: &quot;Không trả lời câu hỏi về chính trị hiện đại.&quot;</p>
              </div>
              <div>
                <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  Thêm mẫu hội thoại
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed pl-8">Cung cấp 2-3 đoạn hội thoại mẫu để AI học được giọng điệu. Điều này giúp nhân vật trở nên tự nhiên và nhất quán hơn.</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-secondary/5 rounded-xl border border-secondary/20">
              <p className="text-sm text-secondary font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                <strong>Mẹo:</strong> Prompt càng chi tiết, nhân vật AI càng chính xác và hấp dẫn!
              </p>
            </div>

            <button onClick={() => setShowPromptGuide(false)} className="mt-8 w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-all active:scale-[0.98]">
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
