import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "list" | "history";

interface TeacherCharacter {
  id: number;
  name: string;
  initials: string;
  role: string;
  description: string;
  personality: string;
  systemPrompt: string;
  active: boolean;
  workId: number;
  workTitle: string;
  chatCount: number;
  createdAt: string;
}

interface ChatThread {
  id: number;
  character_name: string;
  created_at: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CharactersPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // ── API data ────────────────────────────────────────────────────────────────
  const { data: characters = [], isLoading, mutate } = useSWR<TeacherCharacter[]>('/api/characters', fetcher);
  const { data: chatThreads = [] } = useSWR<ChatThread[]>('/api/chat', fetcher);
  const { data: works = [] } = useSWR('/api/works', fetcher);

  const selectedChar = characters.find(c => c.id === selectedCharId) ?? null;

  // ── Config panel form state ─────────────────────────────────────────────────
  const [editForm, setEditForm] = useState<Partial<TeacherCharacter>>({});
  React.useEffect(() => {
    if (selectedChar) setEditForm(selectedChar);
    else setEditForm({});
  }, [selectedChar]);

  // ── Toggle active ───────────────────────────────────────────────────────────
  const handleToggleActive = async (char: TeacherCharacter) => {
    await fetch('/api/characters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: char.id, active: !char.active }),
    });
    mutate();
  };

  // ── Save config ─────────────────────────────────────────────────────────────
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChar) return;
    await fetch('/api/characters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedChar.id,
        name: editForm.name,
        initials: editForm.initials,
        role: editForm.role,
        description: editForm.description,
        personality: editForm.personality,
        systemPrompt: editForm.systemPrompt,
        active: editForm.active,
      }),
    });
    mutate();
  };

  // ── Add character ───────────────────────────────────────────────────────────
  const handleAddCharacter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        initials: formData.get('initials'),
        role: formData.get('role'),
        workId: formData.get('workId'),
        personality: formData.get('personality'),
        systemPrompt: formData.get('systemPrompt'),
      }),
    });
    mutate();
    setShowAddForm(false);
  };

  // ── Format timestamp ────────────────────────────────────────────────────────
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs} giờ trước`;
      return d.toLocaleDateString('vi-VN');
    } catch {
      return iso;
    }
  };

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
          <form className="grid grid-cols-2 gap-6" onSubmit={handleAddCharacter}>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên nhân vật *</label>
              <input name="name" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: Chí Phèo" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Chữ viết tắt (max 3) *</label>
              <input name="initials" required maxLength={3} className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: CP" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Vai trò *</label>
              <input name="role" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: Nhân vật chính" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm *</label>
              <select name="workId" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">-- Chọn tác phẩm --</option>
                {(works as any[]).map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tính cách</label>
              <textarea name="personality" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" rows={3} placeholder="Mô tả tính cách, giọng điệu, ngôn ngữ đặc trưng..."></textarea>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Ranh giới (System Prompt)</label>
              <textarea name="systemPrompt" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" rows={3} placeholder="Quy định ranh giới trả lời cho nhân vật..."></textarea>
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
          <span className="ml-2 bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold">{chatThreads.length}</span>
          {tab === "history" && <span className="absolute -bottom-[1px] left-0 w-full h-[2px] bg-primary"></span>}
        </button>
      </div>

      {/* ═══ TAB: Danh sách nhân vật ═══ */}
      {tab === "list" && (
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden border-[0.5px] border-outline-variant/30">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
                  <p className="mt-2 text-sm">Đang tải...</p>
                </div>
              ) : (
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
                    {characters.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCharId(c.id)}
                        className={`hover:bg-primary/5 transition-colors group cursor-pointer ${!c.active ? "opacity-70" : ""} ${selectedCharId === c.id ? "bg-primary/5" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-headline text-primary font-bold">{c.initials}</div>
                            <span className="font-semibold text-primary">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 italic">{c.workTitle ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${c.active ? "bg-emerald-500" : "bg-red-500"}`}></span>
                            {c.active ? "Bật" : "Tắt"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-mono">{c.chatCount ?? 0}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs space-x-3 font-medium">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedCharId(c.id); }}
                              className="text-primary hover:underline"
                            >Sửa</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleActive(c); }}
                              className={`${c.active ? "text-slate-400 hover:text-tertiary" : "text-emerald-600 hover:underline"}`}
                            >{c.active ? "Tắt" : "Bật"}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {characters.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chưa có nhân vật nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
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
            {selectedChar && (
              <div className="bg-white/80 backdrop-blur-md shadow-sm border-[0.5px] border-outline-variant/30 rounded-2xl p-8 sticky top-28 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-bold text-xl text-primary-container">Cấu hình {selectedChar.name}</h3>
                  <span className="material-symbols-outlined text-slate-400">auto_fix_high</span>
                </div>
                <form className="space-y-6" onSubmit={handleSaveConfig}>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên nhân vật</label>
                    <input
                      className="w-full bg-white/50 border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 transition-all font-body text-primary font-medium px-0 pb-2"
                      type="text"
                      value={editForm.name ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm</label>
                    <input
                      className="w-full bg-white/50 border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 transition-all font-body text-slate-600 px-0 pb-2 italic"
                      type="text"
                      value={selectedChar.workTitle ?? ''}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tính cách</label>
                    <textarea
                      className="w-full bg-white/50 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/10 rounded-lg p-3 text-sm text-slate-700 leading-relaxed font-body"
                      rows={4}
                      value={editForm.personality ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, personality: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Ranh giới (System Prompt)</label>
                    <textarea
                      className="w-full bg-white/50 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/10 rounded-lg p-3 text-sm text-slate-700 leading-relaxed font-body"
                      rows={4}
                      value={editForm.systemPrompt ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, systemPrompt: e.target.value }))}
                    />
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
            {!selectedChar && (
              <div className="bg-white/80 backdrop-blur-md shadow-sm border-[0.5px] border-outline-variant/30 rounded-2xl p-8 sticky top-28 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 block">person_search</span>
                <p className="text-sm">Chọn một nhân vật để cấu hình</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: Lịch sử chat HS ═══ */}
      {tab === "history" && (
        <div className="space-y-4">
          {chatThreads.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 block">chat_bubble_outline</span>
              <p>Chưa có lịch sử chat nào.</p>
            </div>
          )}
          {chatThreads.map(thread => (
            <div key={thread.id} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border-[0.5px] border-outline-variant/30 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {thread.character_name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-primary">{thread.character_name}</h4>
                      <span className="text-xs text-outline">•</span>
                      <span className="text-xs text-slate-500 italic">Cuộc trò chuyện</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">Nhấn để xem chi tiết cuộc trò chuyện...</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-slate-400">{formatTime(thread.created_at)}</span>
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
