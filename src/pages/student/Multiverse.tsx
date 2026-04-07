import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "../../lib/fetcher";

interface MultiverseStory {
  id: string;
  title: string | null;
  workTitle: string;
  branch_point: string;
  content: string | null;
  moral: string | null;
  generation_method: string;
  depth: number;
  parent_id: string | null;
  created_at: string;
}

interface Work {
  id: string;
  title: string;
  author: string;
}

function formatTimeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}p trước`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}g trước`;
    return `${Math.floor(h / 24)}d trước`;
  } catch { return ''; }
}

export default function MultiversePage() {
  const [selected, setSelected] = useState<MultiverseStory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [genMethod, setGenMethod] = useState<'manual' | 'ai_full'>('ai_full');
  const [branchPoint, setBranchPoint] = useState('');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data: mvData, mutate: mutateMv } = useSWR<{ data: MultiverseStory[] }>(
    '/api/multiverse', fetcher
  );
  const { data: worksData } = useSWR<{ data: Work[] }>('/api/works?analysisStatus=done', fetcher);

  const storylines: MultiverseStory[] = mvData?.data ?? [];
  const works: Work[] = worksData?.data ?? [];

  const grouped = storylines.reduce<Record<string, MultiverseStory[]>>((acc, s) => {
    (acc[s.workTitle] = acc[s.workTitle] || []).push(s);
    return acc;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWork || !branchPoint.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/multiverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId: selectedWork.id,
          branchPoint: branchPoint.trim(),
          generationMethod: genMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Lỗi.'); return; }
      setShowCreate(false);
      setBranchPoint('');
      setSelectedWork(null);
      await mutateMv();
    } catch {
      setCreateError('Lỗi kết nối.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pt-8 px-8 pb-20 max-w-6xl mx-auto page-enter">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">
            Đa Vũ Trụ Văn học
          </span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Khám phá các kết thúc khác
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-lg">
            Nếu nhân vật chọn con đường khác, câu chuyện sẽ đi về đâu?
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-tertiary text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-tertiary/20"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo storyline mới
        </button>
      </div>

      {/* Storyline selector — by work */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">hub</span>
          <p className="font-medium">Chưa có storyline nào.</p>
          <p className="text-sm mt-1">Nhấn "Tạo storyline mới" để bắt đầu.</p>
        </div>
      )}

      {Object.entries(grouped).map(([workTitle, items]) => (
        <div key={workTitle} className="mb-12">
          <h3 className="font-headline font-bold text-primary text-lg mb-4">{workTitle}</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {items.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
                className={`flex-shrink-0 min-w-[260px] text-left p-5 rounded-2xl border transition-all ${
                  selected?.id === s.id
                    ? 'bg-primary text-white border-primary shadow-lg'
                    : 'bg-white border-outline-variant/20 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                  selected?.id === s.id ? 'text-white/70' : 'text-secondary'
                }`}>
                  {s.generation_method === 'ai_full' ? 'AI tạo' : 'Tự viết'}
                </p>
                <p className={`font-headline font-bold leading-snug mb-2 text-sm ${
                  selected?.id === s.id ? 'text-white' : 'text-primary'
                }`}>
                  {s.branch_point.length > 50 ? s.branch_point.slice(0, 50) + '…' : s.branch_point}
                </p>
                <div className={`flex items-center justify-between text-xs mt-3 ${
                  selected?.id === s.id ? 'text-white/60' : 'text-slate-400'
                }`}>
                  <span>{formatTimeAgo(s.created_at)}</span>
                  <span>{s.depth === 0 ? 'Nhánh gốc' : `Độ sâu ${s.depth}`}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Selected storyline detail */}
      {selected && (
        <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">{selected.workTitle}</span>
              <h3 className="font-headline font-bold text-xl text-primary mt-1">{selected.branch_point}</h3>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {selected.content ? (
            <div className="bg-surface-container-low rounded-xl p-6 mb-4">
              <p className="font-headline text-base leading-relaxed whitespace-pre-wrap">{selected.content}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 italic">Chưa có nội dung.</div>
          )}

          {selected.moral && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Bài học</p>
              <p className="font-headline text-primary italic">{selected.moral}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowCompare(true)}
              className="flex-1 py-3 bg-primary/5 text-primary rounded-xl font-bold hover:bg-primary/10 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base align-middle mr-1">compare_arrows</span>
              So sánh
            </button>
            <button
              onClick={() => { setShowCreate(true); setBranchPoint(selected.branch_point + ' — '); }}
              className="flex-1 py-3 bg-tertiary/5 text-tertiary rounded-xl font-bold hover:bg-tertiary/10 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base align-middle mr-1">alt_route</span>
              Tạo nhánh tiếp
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="relative z-10 bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-headline text-xl font-bold text-primary mb-6">Tạo storyline mới</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tác phẩm *</label>
                <select
                  value={selectedWork?.id || ''}
                  onChange={e => setSelectedWork(works.find(w => w.id === e.target.value) || null)}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/30 outline-none"
                  required
                >
                  <option value="">— Chọn tác phẩm —</option>
                  {works.map(w => (
                    <option key={w.id} value={w.id}>{w.title} — {w.author}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Điểm rẽ (Nếu...) *
                </label>
                <input
                  value={branchPoint}
                  onChange={e => setBranchPoint(e.target.value)}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  placeholder="VD: Nếu Lão Hạc không bán con Vàng..."
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Phương thức</label>
                <div className="flex gap-3">
                  {(['ai_full', 'manual'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGenMethod(m)}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                        genMethod === m
                          ? 'bg-primary text-white border-primary'
                          : 'border-outline-variant/30 text-slate-600 hover:border-primary/40'
                      }`}
                    >
                      {m === 'ai_full' ? 'AI tạo tự động' : 'Tự viết'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-outline">AI tạo: sinh truyện ngắn hoàn chỉnh từ điểm rẽ của bạn.</p>
              </div>
              {createError && (
                <p className="text-xs text-red-500">{createError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-outline-variant/30 rounded-xl font-semibold hover:bg-surface-container-low text-sm">
                  Hủy
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-tertiary text-white rounded-xl font-semibold hover:brightness-110 disabled:opacity-50 text-sm">
                  {creating ? 'Đang tạo…' : 'Tạo storyline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCompare(false)}
        >
          <div
            className="relative z-10 bg-white rounded-2xl p-8 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl font-bold text-primary">So sánh các nhánh</h3>
              <button onClick={() => setShowCompare(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              {storylines
                .filter(s => s.workTitle === selected.workTitle)
                .map((s, i) => (
                  <div key={s.id} className="bg-surface-container-low rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Nhánh {i + 1} · {s.branch_point.length > 40 ? s.branch_point.slice(0, 40) + '…' : s.branch_point}
                      </span>
                    </div>
                    {s.content ? (
                      <p className="text-sm leading-relaxed text-slate-600">
                        {s.content.slice(0, 200)}{s.content.length > 200 ? '…' : ''}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Chưa có nội dung.</p>
                    )}
                    {s.moral && (
                      <p className="text-xs text-amber-600 italic mt-1">→ {s.moral}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
