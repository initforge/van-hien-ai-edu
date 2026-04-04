import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { Work, WorkAnalysis, WorkChunk, WorkAnalysisSection } from '../../types/api';

const GRADES = [6, 7, 8, 9] as const;

const GENRES = ['Văn bản', 'Thơ'];

const ANALYSIS_TABS: { key: WorkAnalysisSection | 'chunks'; label: string }[] = [
  { key: 'summary', label: 'Tóm tắt' },
  { key: 'characters', label: 'Nhân vật' },
  { key: 'art_features', label: 'Đặc sắc' },
  { key: 'content_value', label: 'Giá trị' },
  { key: 'themes', label: 'Chủ đề' },
  { key: 'context', label: 'Bối cảnh' },
  { key: 'chunks', label: 'Chunks' },
];

const STATUS_META = {
  none: { label: 'Chưa phân tích', color: '#d97706', bg: 'bg-amber-100' },
  processing: { label: 'Đang xử lý', color: '#2563eb', bg: 'bg-blue-100' },
  done: { label: 'Đã xong', color: '#16a34a', bg: 'bg-green-100' },
};

function buildWorksUrl(grade: number | null, genre: string) {
  const params = new URLSearchParams();
  if (grade !== null) params.set('grade', String(grade));
  if (genre) params.set('genre', genre);
  return `/api/works${params.toString() ? '?' + params : ''}`;
}

export default function LibraryPage() {
  const [filterGrade, setFilterGrade] = useState<number | null>(null);
  const [filterGenre, setFilterGenre] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: worksData, mutate: mutateWorks } = useSWR<{ data: Work[]; total: number }>(
    buildWorksUrl(filterGrade, filterGenre), fetcher
  );
  const works: Work[] = worksData?.data ?? [];

  const selectedWork = works.find(w => w.id === selectedId) ?? null;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Thư viện Tác phẩm</h2>
          <p className="text-outline mt-1 text-sm">{worksData?.total ?? works.length} tác phẩm</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all hover:shadow-md active:scale-[0.98]">
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm tác phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Grade */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">Khối:</span>
          <button onClick={() => setFilterGrade(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterGrade === null ? 'bg-primary text-white' : 'bg-white border border-[#326286]/15 text-outline hover:bg-[#326286]/5'}`}>
            Tất cả
          </button>
          {GRADES.map(g => (
            <button key={g} onClick={() => setFilterGrade(filterGrade === g ? null : g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterGrade === g ? 'bg-primary text-white' : 'bg-white border border-[#326286]/15 text-outline hover:bg-[#326286]/5'}`}>
              {g}
            </button>
          ))}
        </div>

        {/* Genre */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">Thể loại:</span>
          <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)}
            className="border border-[#326286]/15 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#326286]/30 outline-none cursor-pointer">
            <option value="">Tất cả</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

      </div>

      {/* Cards + Detail Panel */}
      <div className="flex gap-6 items-start">
        {/* Cards Grid */}
        <div className="flex-1">
          {works.length === 0 ? (
            <div className="text-center text-outline py-20 bg-white/60 rounded-2xl border border-[#326286]/20">
              <span className="material-symbols-outlined text-5xl mb-3 block">library_books</span>
              <p className="font-medium">Chưa có tác phẩm nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {works.map(w => (
                <WorkCard
                  key={w.id}
                  work={w}
                  isSelected={selectedId === w.id}
                  onClick={() => setSelectedId(selectedId === w.id ? null : w.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Detail Panel */}
        {selectedWork && (
          <WorkDetailPanel
            work={selectedWork}
            onMutate={() => mutateWorks()}
          />
        )}
      </div>

      {/* Add Work Modal */}
      {showModal && (
        <AddWorkModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); mutateWorks(); }}
        />
      )}
    </div>
  );
}

// ─── Work Card ─────────────────────────────────────────────────────────────────

function WorkCard({ work, isSelected, onClick }: {
  work: Work;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusMeta = STATUS_META[work.analysisStatus ?? 'none'];

  return (
    <div
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-md rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary shadow-md' : 'border border-[#326286]/15'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="bg-[#326286]/10 text-primary px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
          {work.grade ? `Lớp ${work.grade}` : '—'}
        </span>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.bg}`}
          style={{ color: statusMeta.color }}>
          {work.analysisStatus === 'processing' && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusMeta.color }} />
          )}
          {statusMeta.label}
        </span>
      </div>
      <h3 className="text-base font-headline font-bold text-primary mb-1 leading-tight">{work.title}</h3>
      <p className="text-xs text-outline italic mb-3">{work.author}</p>
      <div className="flex flex-wrap gap-1.5">
        {work.genre && (
          <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-medium">
            {work.genre}
          </span>
        )}
        {work.wordCount && (
          <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
            {work.wordCount.toLocaleString('vi')} từ
          </span>
        )}
        {work.chunkCount != null && work.chunkCount > 0 && (
          <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
            {work.chunkCount} chunks
          </span>
        )}
      </div>
      {isSelected && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-l-full" />
      )}
    </div>
  );
}

// ─── Work Detail Panel ─────────────────────────────────────────────────────────

function WorkDetailPanel({ work, onMutate }: { work: Work; onMutate: () => void }) {
  const [activeTab, setActiveTab] = useState<(typeof ANALYSIS_TABS)[number]['key']>('summary');
  const [analysis, setAnalysis] = useState<WorkAnalysis[]>([]);
  const [chunks, setChunks] = useState<WorkChunk[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [editingContent, setEditingContent] = useState('');

  // Load analysis when panel opens
  useSWR(
    `/api/works/${work.id}/analysis`,
    fetcher,
    {
      onSuccess(data: { id: string; analysis: WorkAnalysis[] }) {
        setAnalysis(data?.analysis ?? []);
        setIsLoadingDetail(false);
        const currentSec = data?.analysis?.find((a: WorkAnalysis) => a.section === activeTab);
        if (currentSec) setEditingContent(currentSec.content);
      },
    }
  );

  // Load chunks when chunks tab is active
  useSWR(
    activeTab === 'chunks' ? `/api/works/${work.id}/chunks` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess(data: { id: string; chunks: WorkChunk[] }) {
        setChunks(data?.chunks ?? []);
      },
    }
  );

  const currentSection = analysis.find(a => a.section === activeTab);

  const handleAnalyze = async () => {
    if (!work.content || work.content.trim().length < 50) {
      setAnalyzeError('Cần nhập nội dung tác phẩm trước (ít nhất 50 từ).');
      return;
    }
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const res = await fetch(`/api/works/${work.id}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAnalyzing(false);
        onMutate();
        // Reload analysis
        const ar = await fetch(`/api/works/${work.id}/analysis`).then(r => r.json());
        setAnalysis(ar?.analysis ?? []);
      } else {
        setAnalyzeError(data.error || 'Lỗi khi phân tích.');
        setAnalyzing(false);
      }
    } catch {
      setAnalyzeError('Lỗi kết nối.');
      setAnalyzing(false);
    }
  };

  const handleSaveSection = async (content: string) => {
    if (activeTab === 'chunks') return;
    setSaving(true);
    setSavedMsg('');
    try {
      const res = await fetch(`/api/works/${work.id}/analysis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: activeTab, content }),
      });
      if (res.ok) {
        setSavedMsg('Đã lưu');
        setTimeout(() => setSavedMsg(''), 2000);
        const ar = await fetch(`/api/works/${work.id}/analysis`).then(r => r.json());
        setAnalysis(ar?.analysis ?? []);
      }
    } finally {
      setSaving(false);
    }
  };

  const statusMeta = STATUS_META[work.analysisStatus ?? 'none'];

  return (
    <aside className="w-[440px] shrink-0 bg-white/90 backdrop-blur-md border border-[#326286]/20 rounded-2xl shadow-lg overflow-hidden sticky top-6 max-h-[calc(100vh-3rem)]">
      {/* Panel Header */}
      <div className="p-5 border-b border-[#326286]/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#326286]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">library_books</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-headline font-bold text-primary leading-tight">{work.title}</h3>
            <p className="text-xs text-outline italic">{work.author}</p>
          </div>
          <button onClick={() => setActiveTab('chunks')}
            className="shrink-0 text-outline hover:text-primary transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2 mt-3">
          {work.grade && <span className="text-[10px] bg-[#326286]/10 text-primary px-2 py-0.5 rounded font-bold">Lớp {work.grade}</span>}
          {work.genre && <span className="text-[10px] bg-[#326286]/10 text-primary px-2 py-0.5 rounded">{work.genre}</span>}
          {work.wordCount && <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded">{work.wordCount.toLocaleString('vi')} từ</span>}
          {work.chunkCount != null && work.chunkCount > 0 && <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded">{work.chunkCount} chunks</span>}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusMeta.bg}`} style={{ color: statusMeta.color }}>
            {statusMeta.label}
          </span>
        </div>

        {/* Progress bar */}
        {work.analysisStatus === 'processing' && (
          <div className="mt-3">
            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden animate-pulse">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
            </div>
            <p className="text-[10px] text-blue-600 mt-1">AI đang phân tích...</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 px-4 pt-4 border-b border-[#326286]/10">
        {ANALYSIS_TABS.map(tab => (
          <button key={tab.key} onClick={() => {
            setActiveTab(tab.key);
            if (tab.key !== 'chunks') {
              const sec = analysis.find(a => a.section === tab.key);
              setEditingContent(sec?.content ?? '');
            }
          }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all mb-2 ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-outline hover:bg-[#326286]/5'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '420px' }}>
        {activeTab === 'chunks' ? (
          <ChunksTab workId={work.id} chunks={chunks} onMutate={() => {
            fetch(`/api/works/${work.id}/chunks`).then(r => r.json()).then(d => setChunks(d?.chunks ?? []));
          }} />
        ) : isLoadingDetail ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#326286]/5 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-outline uppercase">Nội dung</span>
                {currentSection?.isAiGenerated && (
                  <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                )}
              </div>
              {savedMsg && <span className="text-[10px] text-green-600 font-semibold">{savedMsg}</span>}
            </div>
            <textarea
              key={activeTab}
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              className="w-full border border-[#326286]/15 rounded-xl px-4 py-3 text-sm leading-relaxed focus:ring-2 focus:ring-[#326286]/30 focus:border-[#326286] outline-none resize-y min-h-[200px]"
              placeholder="Chưa có nội dung. Nhập tay hoặc nhấn 'Phân tích AI'."
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleSaveSection(editingContent)}
                disabled={saving}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              {work.analysisStatus !== 'processing' && (
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="flex-1 bg-[#C9A84C] text-white py-2.5 rounded-xl font-semibold hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-50 text-sm">
                  {analyzing ? 'Đang phân tích...' : 'Phân tích AI'}
                </button>
              )}
            </div>
            {analyzeError && (
              <p className="text-xs text-red-500 mt-2">{analyzeError}</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Chunks Tab ───────────────────────────────────────────────────────────────

function ChunksTab({ workId, chunks, onMutate }: {
  workId: string;
  chunks: WorkChunk[];
  onMutate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ heading: '', content: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/works/${workId}/chunks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading: form.heading, content: form.content }),
      });
      setForm({ heading: '', content: '' });
      setShowForm(false);
      onMutate();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chunkId: string) => {
    await fetch(`/api/works/${workId}/chunks?chunkId=${chunkId}`, { method: 'DELETE' });
    onMutate();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold text-outline uppercase">{chunks.length} chunks</span>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:bg-[#326286]/5 px-3 py-1.5 rounded-xl transition-all">
          <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
          Thêm chunk
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-surface-container rounded-xl space-y-3">
          <input value={form.heading} onChange={e => setForm(f => ({ ...f, heading: e.target.value }))}
            className="w-full border border-[#326286]/15 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#326286]/30 outline-none"
            placeholder="Tiêu đề chunk (VD: Chương 1, Phần 2...)" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className="w-full border border-[#326286]/15 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#326286]/30 outline-none min-h-[100px]"
            placeholder="Nội dung chunk..." required />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[#326286]/15 hover:bg-[#326286]/5">Hủy</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
              {saving ? '...' : 'Thêm'}
            </button>
          </div>
        </form>
      )}

      {chunks.length === 0 ? (
        <div className="text-center text-outline text-xs py-8">
          Chưa có chunk nào
        </div>
      ) : (
        <div className="space-y-3">
          {chunks.map(c => (
            <div key={c.id} className="p-4 bg-surface-container rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-secondary uppercase">
                  #{c.sequence} {c.heading || ''}
                </span>
                <button onClick={() => handleDelete(c.id)}
                  className="text-red-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
              <p className="text-xs text-on-surface leading-relaxed line-clamp-4">{c.content}</p>
              {c.summary && (
                <p className="text-[10px] text-outline italic mt-1.5">{c.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Work Modal ───────────────────────────────────────────────────────────

function AddWorkModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [tab, setTab] = useState<'manual' | 'upload'>('manual');
  const [form, setForm] = useState({ title: '', author: '', grade: '', genre: '', content: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileContent, setFileContent] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    // Read file as text
    const text = await file.text();
    setFileContent(text);
    // Auto-fill title from filename if empty
    if (!form.title) {
      const name = file.name.replace(/\.(pdf|docx?|txt)$/i, '');
      setForm(f => ({ ...f, title: name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.author.trim()) {
      setError('Vui lòng nhập tiêu đề và tác giả.');
      return;
    }

    setUploading(true);
    try {
      const content = tab === 'upload' ? fileContent : form.content;
      const res = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          author: form.author.trim(),
          grade: form.grade ? parseInt(form.grade) : null,
          genre: form.genre || null,
          content: content || null,
          fileName: uploadFile?.name || null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Thao tác thất bại.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="relative z-[10000] bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-headline font-bold text-primary mb-6">Thêm tác phẩm mới</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'manual' ? 'bg-primary text-white' : 'bg-[#326286]/5 text-primary hover:bg-[#326286]/10'}`}>
            <span className="material-symbols-outlined text-base">edit_note</span>
            Nhập tay
          </button>
          <button onClick={() => setTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === 'upload' ? 'bg-primary text-white' : 'bg-[#326286]/5 text-primary hover:bg-[#326286]/10'}`}>
            <span className="material-symbols-outlined text-base">upload_file</span>
            Upload file
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-1">Tên tác phẩm *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#326286]/30 outline-none text-sm"
                placeholder="VD: Lão Hạc" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-1">Tác giả *</label>
              <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#326286]/30 outline-none text-sm"
                placeholder="VD: Nam Cao" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-1">Khối</label>
              <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#326286]/30 outline-none bg-white text-sm">
                <option value="">— Chọn khối —</option>
                {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-1">Thể loại</label>
              <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#326286]/30 outline-none bg-white text-sm">
                <option value="">— Chọn thể loại —</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {tab === 'manual' ? (
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-1">Nội dung tác phẩm</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="w-full border border-[#326286]/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#326286]/30 outline-none text-sm leading-relaxed min-h-[200px]"
                placeholder="Dán nội dung tác phẩm vào đây. Càng đầy đủ, AI phân tích càng chính xác..." />
              {form.content && (
                <p className="text-[10px] text-outline mt-1">{form.content.trim().split(/\s+/).filter(Boolean).length.toLocaleString('vi')} từ</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-1">File (PDF, DOCX, TXT)</label>
              <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-[#326286]/20 rounded-xl cursor-pointer hover:border-[#326286]/40 transition-colors bg-surface-container/50">
                <span className="material-symbols-outlined text-4xl text-outline">upload_file</span>
                {uploadFile ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-primary">{uploadFile.name}</p>
                    <p className="text-[10px] text-outline">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                    {fileContent && <p className="text-[10px] text-green-600 mt-1">{fileContent.trim().split(/\s+/).filter(Boolean).length.toLocaleString('vi')} từ đã trích xuất</p>}
                  </div>
                ) : (
                  <p className="text-sm text-outline">Kéo thả file hoặc bấm để chọn</p>
                )}
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
              </label>
              {fileContent && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700 font-semibold">Đã đọc được {fileContent.trim().split(/\s+/).filter(Boolean).length.toLocaleString('vi')} từ từ file.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[#326286]/20 py-2.5 rounded-xl font-semibold hover:bg-[#326286]/5 transition-colors text-sm">
              Hủy
            </button>
            <button type="submit" disabled={uploading}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
              {uploading ? 'Đang lưu...' : 'Thêm tác phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
