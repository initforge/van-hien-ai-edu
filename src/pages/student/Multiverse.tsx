import React, { useState } from "react";
import useSWR from "swr";
import { fetcher, authFetch } from "../../lib/fetcher";

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
  if (!dateStr) return '';
  try {
    const ms = new Date(dateStr).getTime();
    if (!ms || isNaN(ms)) return '';
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}p trước`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}g trước`;
    return `${Math.floor(h / 24)}d trước`;
  } catch { return ''; }
}

// ── Tree structure ─────────────────────────────────────────────────────────────
interface TreeNode {
  story: MultiverseStory;
  children: TreeNode[];
}

function buildTree(stories: MultiverseStory[]): Map<string, TreeNode[]> {
  const nodeMap = new Map<string, TreeNode>();
  for (const s of stories) nodeMap.set(s.id, { story: s, children: [] });
  const roots: TreeNode[] = [];
  for (const s of stories) {
    const node = nodeMap.get(s.id)!;
    if (s.parent_id && nodeMap.has(s.parent_id)) {
      nodeMap.get(s.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const byWork = new Map<string, TreeNode[]>();
  for (const root of roots) {
    const wt = root.story.workTitle || '';
    if (!byWork.has(wt)) byWork.set(wt, []);
    byWork.get(wt)!.push(root);
  }
  return byWork;
}

// ── Story Card (recursive for tree) ───────────────────────────────────────────
interface StoryCardProps {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (s: MultiverseStory) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onCreateBranch: (s: MultiverseStory) => void;
}

function StoryCard({ node, depth, selectedId, onSelect, expandedIds, onToggleExpand, onCreateBranch }: StoryCardProps) {
  const s = node.story;
  const isSelected = selectedId === s.id;
  const isExpanded = expandedIds.has(s.id);
  const hasChildren = node.children.length > 0;
  const indent = depth * 24;

  return (
    <div>
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
          isSelected
            ? 'bg-primary text-white border-primary shadow-lg'
            : 'bg-white border-outline-variant/20 hover:border-primary/40 hover:shadow-md'
        }`}
        style={{ marginLeft: indent }}
        onClick={() => onSelect(s)}
      >
        {/* Expand / leaf icon */}
        <div className="flex-shrink-0 mt-0.5">
          {hasChildren ? (
            <button
              onClick={e => { e.stopPropagation(); onToggleExpand(s.id); }}
              className={`w-5 h-5 rounded flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                isSelected ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          ) : (
            <div className={`w-5 h-5 flex items-center justify-center ${isSelected ? 'text-white/30' : 'text-slate-200'}`}>
              <span className="material-symbols-outlined text-base">radio_button_checked</span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="flex-1 min-w-0">
          {/* Meta badges */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isSelected ? 'bg-white/20 text-white/80' :
              s.generation_method === 'ai_full' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {s.generation_method === 'ai_full' ? 'AI tạo' : 'Tự viết'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isSelected ? 'bg-white/10 text-white/60' : 'bg-blue-50 text-blue-500'
            }`}>
              {s.depth === 0 ? 'Nhánh gốc' : `Nhánh ${s.depth}`}
            </span>
            {hasChildren ? (
              <span className={`text-[10px] ${isSelected ? 'text-white/50' : 'text-slate-300'}`}>
                · {node.children.length} nhánh con
              </span>
            ) : null}
          </div>

          {/* Branch point */}
          <p className={`font-headline font-bold leading-snug text-sm mb-1.5 ${isSelected ? 'text-white' : 'text-primary'}`}>
            {(s.branch_point || '').length > 70 ? (s.branch_point || '').slice(0, 70) + '…' : s.branch_point}
          </p>

          {/* Content preview */}
          {s.content ? (
            <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
              {s.content.slice(0, 100)}{s.content.length > 100 ? '…' : ''}
            </p>
          ) : (
            <p className={`text-xs italic mb-2 ${isSelected ? 'text-white/40' : 'text-slate-300'}`}>
              Chưa có nội dung
            </p>
          )}

          {/* Moral */}
          {s.moral ? (
            <div className={`flex items-start gap-1.5 mb-2 p-2 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-amber-50'}`}>
              <span className={`material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0 ${isSelected ? 'text-white/60' : 'text-amber-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              <p className={`text-[11px] leading-snug italic ${isSelected ? 'text-white/70' : 'text-amber-700'}`}>
                {s.moral.length > 60 ? s.moral.slice(0, 60) + '…' : s.moral}
              </p>
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-medium ${isSelected ? 'text-white/50' : 'text-slate-300'}`}>
              {formatTimeAgo(s.created_at) || 'Vừa xong'}
            </span>
            {isSelected && (
              <button
                onClick={e => { e.stopPropagation(); onCreateBranch(s); }}
                className="flex items-center gap-1 text-[10px] font-bold text-white/70 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">alt_route</span>
                Tạo nhánh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {isExpanded && node.children.map(child => (
        <StoryCard
          key={child.story.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          onCreateBranch={onCreateBranch}
        />
      ))}
    </div>
  );
}

// ── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ story, onClose, onSave }: {
  story: MultiverseStory;
  onClose: () => void;
  onSave: (updated: MultiverseStory, deleted?: boolean) => void;
}) {
  const [editMode, setEditMode] = useState<'manual' | 'ai'>('manual');
  const [branchPoint, setBranchPoint] = useState(story.branch_point || '');
  const [content, setContent] = useState(story.content || '');
  const [moral, setMoral] = useState(story.moral || '');
  const [aiInstruction, setAiInstruction] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiEditing, setAiEditing] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleManualSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await authFetch('/api/multiverse', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: story.id,
          branch_point: branchPoint,
          content: content || undefined,
          moral: moral || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Lỗi khi lưu.'); return; }
      onSave({ ...story, branch_point: branchPoint, content: content || null, moral: moral || null });
      onClose();
    } catch {
      setError('Lỗi kết nối.');
    } finally {
      setSaving(false);
    }
  };

  const handleAiEdit = async () => {
    if (!aiInstruction.trim()) return;
    setAiEditing(true);
    setError('');
    try {
      const res = await authFetch('/api/multiverse', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: story.id,
          generationMethod: 'ai_edit',
          instruction: aiInstruction.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Lỗi khi sửa bằng AI.'); return; }
      onSave({ ...story, content: data.content || null, moral: data.moral || null });
      onClose();
    } catch {
      setError('Lỗi kết nối.');
    } finally {
      setAiEditing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await authFetch(`/api/multiverse?id=${story.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Lỗi khi xóa.'); setDeleting(false); setConfirmDelete(false); return; }
      onSave(story, true); // signal parent to remove from list
    } catch {
      setError('Lỗi kết nối.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative z-10 bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-headline text-xl font-bold text-primary">Sửa storyline</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!confirmDelete ? (
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['manual', 'ai'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setEditMode(m); setError(''); }}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                    editMode === m
                      ? 'bg-white text-primary shadow-sm font-bold'
                      : 'text-slate-500 hover:text-primary'
                  }`}
                >
                  {m === 'manual' ? '✏️ Nhập tay' : '🤖 Sửa bằng AI'}
                </button>
              ))}
            </div>

            {editMode === 'manual' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Điểm rẽ *</label>
                  <input
                    value={branchPoint}
                    onChange={e => setBranchPoint(e.target.value)}
                    className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nội dung</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={5}
                    className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none"
                    placeholder="Nội dung đoạn truyện..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Bài học</label>
                  <input
                    value={moral}
                    onChange={e => setMoral(e.target.value)}
                    className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                    placeholder="Bài học rút ra..."
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-xs">auto_awesome</span>
                    Yêu cầu chỉnh sửa cho AI
                  </label>
                  <textarea
                    value={aiInstruction}
                    onChange={e => setAiInstruction(e.target.value)}
                    rows={4}
                    className="w-full border border-secondary/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-secondary/30 outline-none resize-none"
                    placeholder="VD: Viết lại đoạn kết thúc thành cô đơn hơn, thêm mô tả cảnh vật buồn..."
                  />
                  <p className="text-[10px] text-outline mt-1">
                    AI sẽ viết lại đoạn truyện dựa trên yêu cầu và giữ đúng nguyên tác.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Điểm rẽ (tuỳ chọn)</label>
                  <input
                    value={branchPoint}
                    onChange={e => setBranchPoint(e.target.value)}
                    className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                    placeholder="Thay đổi điểm rẽ nếu cần..."
                  />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2.5 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-base align-middle mr-1">delete</span>
                Xóa
              </button>
              <div className="flex-1" />
              <button onClick={onClose} className="px-4 py-2.5 border border-outline-variant/30 rounded-xl font-semibold text-sm">Hủy</button>
              {editMode === 'manual' ? (
                <button
                  onClick={handleManualSave}
                  disabled={saving || !branchPoint.trim()}
                  className="px-6 py-2.5 bg-tertiary text-white rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu…' : 'Lưu'}
                </button>
              ) : (
                <button
                  onClick={handleAiEdit}
                  disabled={aiEditing || !aiInstruction.trim()}
                  className="px-6 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  {aiEditing ? 'AI đang viết…' : 'Sửa bằng AI'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-red-400 text-5xl">warning</span>
            <p className="font-headline font-bold text-primary">Xóa storyline này?</p>
            <p className="text-sm text-slate-500">Tất cả nhánh con (nếu có) cũng sẽ bị xóa. Hành động này không thể hoàn tác.</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border border-outline-variant/30 rounded-xl font-semibold text-sm">Hủy</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa…' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────
function StoryDetail({ story, onClose, onCreateBranch, onEdit }: {
  story: MultiverseStory;
  onClose: () => void;
  onCreateBranch: (s: MultiverseStory) => void;
  onEdit: (s: MultiverseStory) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">{story.workTitle}</span>
          <h3 className="font-headline font-bold text-xl text-primary mt-1">{story.branch_point}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {story.content ? (
        <div className="bg-surface-container-low rounded-xl p-6 mb-4">
          <p className="font-headline text-base leading-relaxed whitespace-pre-wrap">{story.content}</p>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 italic">Chưa có nội dung.</div>
      )}

      {story.moral && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">lightbulb</span>
            Bài học rút ra
          </p>
          <p className="font-headline text-primary italic">{story.moral}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onEdit(story)}
          className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 transition-colors text-sm border border-amber-200"
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">edit</span>
          Sửa
        </button>
        <button
          onClick={() => onCreateBranch(story)}
          className="flex-1 py-3 bg-tertiary/5 text-tertiary rounded-xl font-bold hover:bg-tertiary/10 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">alt_route</span>
          Tạo nhánh tiếp
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-primary/5 text-primary rounded-xl font-bold hover:bg-primary/10 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">close</span>
          Đóng
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MultiversePage() {
  const [selected, setSelected] = useState<MultiverseStory | null>(null);
  const [editingStory, setEditingStory] = useState<MultiverseStory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [genMethod, setGenMethod] = useState<'manual' | 'ai_full'>('ai_full');
  const [branchPoint, setBranchPoint] = useState('');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // parentId for when creating a child branch
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);

  const { data: mvData, mutate: mutateMv } = useSWR<{ data: MultiverseStory[] }>(
    '/api/multiverse', fetcher
  );
  const { data: worksData } = useSWR<{ data: Work[] }>('/api/works?analysisStatus=done', fetcher);

  const storylines: MultiverseStory[] = (
    mvData &&
    typeof mvData === 'object' &&
    !Array.isArray(mvData) &&
    !('error' in mvData) &&
    Array.isArray((mvData as any).data)
  ) ? (mvData as any).data : [];

  const works: Work[] = (
    worksData &&
    typeof worksData === 'object' &&
    !Array.isArray(worksData) &&
    !('error' in worksData) &&
    Array.isArray((worksData as any).data)
  ) ? (worksData as any).data : [];

  // Build tree map
  const treeMap = React.useMemo(() => buildTree(storylines), [storylines]);

  // Work lookup by title
  const workByTitle = React.useMemo(() => {
    const m = new Map<string, Work>();
    for (const w of works) m.set(w.title, w);
    return m;
  }, [works]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (s: MultiverseStory) => {
    setSelected(prev => prev?.id === s.id ? null : s);
  };

  // Open create modal pre-filled for a branch
  const handleCreateBranch = (s: MultiverseStory) => {
    const work = workByTitle.get(s.workTitle) || null;
    setSelectedWork(work);
    setPendingParentId(s.id);
    setBranchPoint(s.branch_point + ' — ');
    setShowCreate(true);
  };

  const handleCreateRoot = () => {
    setSelectedWork(null);
    setPendingParentId(null);
    setBranchPoint('');
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWork || !branchPoint.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await authFetch('/api/multiverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId: selectedWork.id,
          branchPoint: branchPoint.trim(),
          generationMethod: genMethod,
          parentId: pendingParentId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Lỗi.'); return; }
      setShowCreate(false);
      setBranchPoint('');
      setSelectedWork(null);
      setPendingParentId(null);
      await mutateMv();
    } catch {
      setCreateError('Lỗi kết nối.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pt-8 px-8 pb-20 max-w-5xl mx-auto page-enter">
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
          onClick={handleCreateRoot}
          className="flex items-center gap-2 bg-tertiary text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-tertiary/20"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo storyline mới
        </button>
      </div>

      {/* Empty state */}
      {storylines.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">hub</span>
          <p className="font-medium">Chưa có storyline nào.</p>
          <p className="text-sm mt-1">Nhấn "Tạo storyline mới" để bắt đầu.</p>
        </div>
      )}

      {/* Tree view by work */}
      <div className="space-y-8">
        {Array.from(treeMap.entries()).map(([workTitle, roots]) => (
          <div key={workTitle}>
            {/* Work header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-primary text-lg">{workTitle}</h3>
                <span className="text-xs text-slate-400">
                  {storylines.filter(s => s.workTitle === workTitle).length} storyline
                </span>
              </div>
            </div>

            {/* Tree */}
            <div className="space-y-2 border-l-2 border-outline-variant/10 pl-4">
              {roots.map(root => (
                <StoryCard
                  key={root.story.id}
                  node={root}
                  depth={0}
                  selectedId={selected?.id ?? null}
                  onSelect={handleSelect}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onCreateBranch={handleCreateBranch}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && !editingStory && (
        <div className="mt-6">
          <StoryDetail
            story={selected}
            onClose={() => setSelected(null)}
            onCreateBranch={handleCreateBranch}
            onEdit={setEditingStory}
          />
        </div>
      )}

      {/* Edit modal */}
      {editingStory && (
        <EditModal
          story={editingStory}
          onClose={() => { setEditingStory(null); setSelected(null); }}
          onSave={(updated, deleted) => {
            if (deleted) {
              mutateMv();
              setSelected(null);
              setEditingStory(null);
            } else {
              setSelected(updated);
              setEditingStory(null);
            }
          }}
        />
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
            <h3 className="font-headline text-xl font-bold text-primary mb-2">
              {pendingParentId ? 'Tạo nhánh mới' : 'Tạo storyline mới'}
            </h3>
            {pendingParentId && (
              <p className="text-xs text-slate-400 mb-4 italic">
                Đang tạo nhánh từ storyline đã chọn.
              </p>
            )}
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
                <p className="text-[10px] text-outline mt-1">
                  {genMethod === 'ai_full'
                    ? 'AI sẽ tự sinh truyện ngắn hoàn chỉnh từ điểm rẽ của bạn.'
                    : 'Bạn tự viết nội dung truyện sau khi tạo nhánh.'}
                </p>
              </div>
              {createError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{createError}</p>
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
    </div>
  );
}
