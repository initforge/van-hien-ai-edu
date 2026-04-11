import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { fetcher, authFetch } from '../../lib/fetcher';
import { formatTimeAgo } from '../../lib/utils';
import { FILL_SETTINGS } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TeacherCharacter {
  id: string;
  name: string;
  initials: string;
  role: string;
  description: string;
  personality: string;
  systemPrompt: string;
  active?: boolean;
  workId: string;
  workTitle: string;
  chatCount?: number;
  createdAt: string;
}

// ─── Test Chat Modal ───────────────────────────────────────────────────────────
function TestChatModal({
  characterId,
  characterName,
  systemPrompt,
  onClose,
}: {
  characterId: string;
  characterName: string;
  systemPrompt: string;
  systemPromptOverride?: string; // teacher's custom prompt from edit form
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<{ role: string; text: string }[]>([]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setLoading(true);
    setMessages(prev => {
      const next = [...prev, { role: 'user', text: userText }];
      messagesRef.current = next;
      return next;
    });

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messagesRef.current, { role: 'user', text: userText }],
          characterId,
          systemPrompt: systemPromptOverride || undefined, // send custom prompt if teacher edited it
        }),
      });

      if (res.headers.get('content-type')?.includes('text/plain')) {
        const text = await res.text();
        setMessages(prev => {
          const next = [...prev, { role: 'assistant', text }];
          messagesRef.current = next;
          return next;
        });
      } else {
        const data = await res.json();
        setMessages(prev => {
          const next = [...prev, { role: 'assistant', text: data.error ? `[Lỗi: ${data.error}]` : '[Không có phản hồi.]' }];
          messagesRef.current = next;
          return next;
        });
      }
    } catch {
      setMessages(prev => {
        const next = [...prev, { role: 'assistant', text: '[Lỗi kết nối.]' }];
        messagesRef.current = next;
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-[fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={FILL_SETTINGS}>chat</span>
            <div>
              <p className="font-headline font-bold text-primary">Test nhân vật</p>
              <p className="text-xs text-outline">{characterName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-xl text-outline">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">chat</span>
              <p className="text-sm">Gửi tin nhắn để thử nhân vật này.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-secondary/10 text-secondary rounded-bl-md'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-container-high rounded-2xl px-4 py-3 text-sm text-slate-400 rounded-bl-md">
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/20 shrink-0 space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-white border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base" style={FILL_SETTINGS}>send</span>
            </button>
          </div>
          <p className="text-[10px] text-outline text-center">Phản hồi từ AI thật — preview chính xác trải nghiệm học sinh.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt Guide ──────────────────────────────────────────────────────────────
function PromptGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-10 max-w-2xl w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="font-headline text-2xl font-bold text-primary mb-2">Hướng dẫn soạn Prompt</h3>
            <p className="text-sm text-slate-500">Mẹo tạo nhân vật AI hấp dẫn và chính xác</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="space-y-8">
          {[
            {
              n: 1, title: 'Xác định tính cách cốt lõi',
              body: 'Mô tả chi tiết tính cách, giọng điệu, và cách nói chuyện đặc trưng của nhân vật. VD: "Lão Hạc nói chuyện chậm rãi, giọng buồn bã, dùng nhiều câu cảm thán. Luôn gọi con trai là thằng nhỏ."',
            },
            {
              n: 2, title: 'Cung cấp bối cảnh lịch sử',
              body: 'Nhân vật nên hiểu rõ bối cảnh thời đại. VD: "Lão Hạc sống trong xã hội nông thôn Việt Nam trước 1945, nơi nạn đói và sưu thuế hoành hành."',
            },
            {
              n: 3, title: 'Thiết lập ranh giới rõ ràng',
              body: 'Quy định rõ những gì nhân vật KHÔNG được trả lời: câu hỏi ngoài tác phẩm, vấn đề nhạy cảm, thông tin sai lệch. VD: "Không trả lời câu hỏi về chính trị hiện đại."',
            },
            {
              n: 4, title: 'Thêm mẫu hội thoại',
              body: 'Cung cấp 2-3 đoạn hội thoại mẫu để AI học được giọng điệu. Điều này giúp nhân vật trở nên tự nhiên và nhất quán hơn.',
            },
          ].map(({ n, title, body }) => (
            <div key={n}>
              <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
                {title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed pl-8">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-secondary/5 rounded-xl border border-secondary/20">
          <p className="text-sm text-secondary font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={FILL_SETTINGS}>tips_and_updates</span>
            <strong>Mẹo:</strong> Prompt càng chi tiết, nhân vật AI càng chính xác và hấp dẫn!
          </p>
        </div>

        <button onClick={onClose} className="mt-8 w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-all active:scale-[0.98]">
          Đã hiểu
        </button>
      </div>
    </div>
  );
}

// ─── Main CharactersPage ───────────────────────────────────────────────────────
export default function CharactersPage() {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testChar, setTestChar] = useState<{ id: string; name: string; prompt: string } | null>(null);

  // ── API data ────────────────────────────────────────────────────────────────
  const { data: charactersData, isLoading, mutate } = useSWR('/api/characters', fetcher);
  const { data: worksData } = useSWR('/api/works', fetcher);

  const characters: TeacherCharacter[] = charactersData?.data ?? [];
  const works = worksData?.data ?? [];
  const selectedChar = characters.find(c => c.id === selectedCharId) ?? null;

  // ── Config panel form state ─────────────────────────────────────────────────
  const [editForm, setEditForm] = useState<Partial<TeacherCharacter>>({});

  // Sync editForm when selectedChar changes — useEffect to avoid React render-phase violation
  useEffect(() => {
    if (selectedChar && editForm.id !== selectedChar.id) {
      setEditForm(selectedChar);
    } else if (!selectedCharId && Object.keys(editForm).length > 0) {
      setEditForm({});
    }
  }, [selectedCharId, selectedChar?.id, editForm.id]);

  // ── Auto initials from name ─────────────────────────────────────────────────
  const getInitials = (name: string) =>
    name.trim().split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 3).toUpperCase();

  // ── Add character ───────────────────────────────────────────────────────────
  const handleAddCharacter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const workId = String(formData.get('workId') || '');
    const name = String(formData.get('name') || '').trim();
    const role = String(formData.get('role') || '').trim();

    if (!name || !workId) return;

    const newChar = {
      name,
      initials: getInitials(name),
      role,
      workId,
      personality: '',
      systemPrompt: '',
    };

    const tempId = `temp-${Date.now()}`;
    await mutate(
      '/api/characters',
      (current: { data: TeacherCharacter[] } | undefined) => ({
        ...current,
        data: [...(current?.data ?? []), { ...newChar, id: tempId, active: true } as TeacherCharacter],
      }),
      false
    );
    try {
      const res = await authFetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChar),
      });
      if (res.ok) {
        setShowAddForm(false);
      }
      await mutate('/api/characters');
    } catch {
      await mutate('/api/characters');
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────
  const handleToggleActive = async (char: TeacherCharacter) => {
    const newActive = !char.active;
    await mutate(
      '/api/characters',
      (current: { data: TeacherCharacter[] } | undefined) => ({
        ...current,
        data: (current?.data ?? []).map(c => c.id === char.id ? { ...c, active: newActive } : c),
      }),
      false
    );
    try {
      const res = await authFetch('/api/characters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: char.id, active: newActive }),
      });
      if (!res.ok) { await mutate('/api/characters'); return; }
      await mutate('/api/characters');
    } catch {
      await mutate('/api/characters');
    }
  };

  // ── Save config ─────────────────────────────────────────────────────────────
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChar) return;
    await mutate(
      '/api/characters',
      (current: { data: TeacherCharacter[] } | undefined) => ({
        ...current,
        data: (current?.data ?? []).map(c => c.id === selectedChar.id ? { ...c, ...editForm } : c),
      }),
      false
    );
    try {
      const res = await authFetch('/api/characters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedChar.id,
          name: editForm.name,
          initials: getInitials(editForm.name ?? selectedChar.name),
          role: editForm.role,
          description: editForm.description,
          personality: editForm.personality,
          systemPrompt: editForm.systemPrompt,
          active: editForm.active,
        }),
      });
      if (!res.ok) { await mutate('/api/characters'); return; }
      await mutate('/api/characters');
    } catch {
      await mutate('/api/characters');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 page-enter">

      {/* Modals */}
      {testChar && (
        <TestChatModal
          characterId={testChar.id}
          characterName={testChar.name}
          systemPrompt={testChar.prompt}
          systemPromptOverride={testChar.prompt}
          onClose={() => setTestChar(null)}
        />
      )}
      {showPromptGuide && (
        <PromptGuideModal onClose={() => setShowPromptGuide(false)} />
      )}

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

      {/* Add Character Form — simplified */}
      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-primary/20 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <h3 className="font-headline text-xl font-bold text-primary mb-6">Thêm nhân vật mới</h3>
          <form className="grid grid-cols-2 gap-6" onSubmit={handleAddCharacter}>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên nhân vật *</label>
              <input name="name" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: Chí Phèo" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Vai trò</label>
              <input name="role" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="VD: Nhân vật chính" type="text" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm *</label>
              <select name="workId" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">— Chọn tác phẩm —</option>
                {(worksData?.data ?? []).map((w: { id: string; title: string }) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
              <p className="text-xs text-secondary flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-xs" style={FILL_SETTINGS}>auto_awesome</span>
                System prompt sẽ được tự động sinh từ phân tích tác phẩm. Có thể chỉnh sửa sau khi tạo.
              </p>
            </div>
            <div className="col-span-2 flex justify-end gap-4">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-primary">Hủy</button>
              <button type="submit" className="px-8 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all">Tạo nhân vật</button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ Nhân vật ═══ */}
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
                            <div>
                              <span className="font-semibold text-primary">{c.name}</span>
                              {c.role && <p className="text-xs text-slate-400">{c.role}</p>}
                            </div>
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
                className="text-primary font-semibold text-sm hover:underline shrink-0 ml-4"
              >
                Xem hướng dẫn soạn prompt
              </button>
            </div>
          </div>

          {/* Config Panel */}
          <div className="col-span-12 lg:col-span-4">
            {selectedChar ? (
              <div className="bg-white/80 backdrop-blur-md shadow-sm border-[0.5px] border-outline-variant/30 rounded-2xl p-8 sticky top-28 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-bold text-xl text-primary-container">Cấu hình</h3>
                  <span className="material-symbols-outlined text-slate-400" style={FILL_SETTINGS}>auto_fix_high</span>
                </div>

                {/* Char name + initials display */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-headline text-primary font-bold text-xl">
                    {editForm.initials ?? selectedChar.initials}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-primary text-lg">{selectedChar.name}</p>
                    <p className="text-xs text-outline italic">{selectedChar.workTitle || '—'}</p>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handleSaveConfig}>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên nhân vật</label>
                    <input
                      className="w-full bg-white/50 border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 transition-all font-body text-primary font-medium px-0 pb-2"
                      type="text"
                      value={editForm.name ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value, initials: getInitials(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Vai trò</label>
                    <input
                      className="w-full bg-white/50 border-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 transition-all font-body text-slate-600 px-0 pb-2"
                      type="text"
                      value={editForm.role ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tính cách</label>
                    <textarea
                      className="w-full bg-white/50 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/10 rounded-lg p-3 text-sm text-slate-700 leading-relaxed font-body"
                      rows={3}
                      value={editForm.personality ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, personality: e.target.value }))}
                      placeholder="VD: nói chuyện chậm rãi, hay dùng câu cảm thán..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">
                      System Prompt
                      <span className="ml-1 font-normal text-outline normal-case tracking-normal normal-weight">(tự động từ tác phẩm)</span>
                    </label>
                    <textarea
                      className="w-full bg-white/50 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary/10 rounded-lg p-3 text-sm text-slate-700 leading-relaxed font-body"
                      rows={4}
                      value={editForm.systemPrompt ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, systemPrompt: e.target.value }))}
                      placeholder="Để trống = tự động sinh từ work_analysis..."
                    />
                  </div>

                  <div className="pt-6 flex flex-col space-y-3">
                    <button
                      type="button"
                      onClick={() => setTestChar({
                        id: selectedChar.id,
                        name: selectedChar.name,
                        prompt: editForm.systemPrompt ?? selectedChar.systemPrompt ?? '',
                      })}
                      className="w-full py-3 border border-secondary text-secondary rounded-lg font-bold flex items-center justify-center space-x-2 hover:bg-secondary/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg" style={FILL_SETTINGS}>chat_bubble</span>
                      <span>Test thử</span>
                    </button>
                    <button className="w-full py-4 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-container transition-all text-lg font-headline tracking-wide active:scale-[0.98]" type="submit">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-md shadow-sm border-[0.5px] border-outline-variant/30 rounded-2xl p-8 sticky top-28 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 block">person_search</span>
                <p className="text-sm">Chọn một nhân vật để cấu hình</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
