import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher, authFetch } from '../../lib/fetcher';
import type { Exam } from '../../types/api';
import AiPreviewModal from '../../components/ai/AiPreviewModal';
import ExamPreviewContent, { type EditableQuestion } from '../../components/ai/ExamPreviewContent';

type Tab = "exercise" | "exam";
type CreateMode = 'ai' | 'manual';

// ─── Exam structure state ────────────────────────────────────────────────────

interface ExamStructure {
  part1Name: string;
  part1Points: number;
  part2Name: string;
  part2Points: number;
}

const DEFAULT_STRUCTURE: ExamStructure = {
  part1Name: 'Đọc hiểu',
  part1Points: 3,
  part2Name: 'Làm văn',
  part2Points: 7,
};

// ─── Exercise AI Form ───────────────────────────────────────────────────────────

interface ExerciseAiFormProps {
  works: { id: string; title: string }[];
  onApprove: (title: string, workId?: string) => void;
  onClose: () => void;
  loading: boolean;
}

function ExerciseAiForm({ works, onApprove, onClose, loading }: ExerciseAiFormProps) {
  const [title, setTitle] = useState('');
  const [workId, setWorkId] = useState('');
  return (
    <div className="mb-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-primary/20 shadow-lg animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-primary">AI tạo bài tập</h3>
            <p className="text-xs text-slate-400">Chỉ cần tên bài tập — AI gợi ý 4 câu hỏi tự động.</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên bài tập *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-white border border-primary/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="VD: Luyện phân tích nhân vật Tấm trong Tấm Cám"
            autoFocus />
        </div>
        <div className="w-64 space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm (tùy chọn)</label>
          <select value={workId} onChange={e => setWorkId(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
            <option value="">— Không chọn —</option>
            {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        </div>
        <button type="button" disabled={loading || !title.trim()} onClick={() => onApprove(title.trim(), workId || undefined)}
          className="shrink-0 flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
          <span className="material-symbols-outlined text-sm">{loading ? 'hourglass_empty' : 'auto_awesome'}</span>
          {loading ? 'Đang tạo...' : 'Tạo bằng AI'}
        </button>
      </div>
    </div>
  );
}

// ─── Exercise Manual Form ──────────────────────────────────────────────────────

interface ExerciseManualFormProps {
  works: { id: string; title: string }[];
  classes: { id: string; name: string }[];
  questions: EditableQuestion[];
  onQuestionsChange: (q: EditableQuestion[]) => void;
  onSuccess: () => void;
  onClose: () => void;
}

function ExerciseManualForm({ works, classes, questions, onQuestionsChange, onSuccess, onClose }: ExerciseManualFormProps) {
  const [title, setTitle] = useState('');
  const [workId, setWorkId] = useState('');
  const [classId, setClassId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateQ = (i: number, field: keyof EditableQuestion, val: string | number) => {
    const next = [...questions]; next[i] = { ...next[i], [field]: val }; onQuestionsChange(next);
  };
  const validQuestions = questions.filter(q => q.content.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || validQuestions.length === 0) return;
    setSaving(true); setError('');
    try {
      const res = await authFetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), workId: workId || undefined, classId: classId || undefined, type: 'exercise', deadline: deadline || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Lỗi khi tạo.');
        setSaving(false);
        return;
      }
      const data = await res.json();
      if (!data.id) { setError(data.error || 'Lỗi khi tạo.'); setSaving(false); return; }
      for (const q of validQuestions) {
        const qRes = await authFetch('/api/exams', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId: data.id, questions: [{ content: q.content.trim(), type: q.type, points: q.points, rubric: q.rubric }] }),
        });
        if (!qRes.ok) {
          setError('Một số câu hỏi chưa được lưu. Vui lòng thử lại.');
        }
      }
      onSuccess();
    } catch { setError('Lỗi mạng. Vui lòng thử lại.'); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-primary/20 shadow-lg animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-primary">Nhập tay bài tập</h3>
            <p className="text-xs text-slate-400">Tự viết câu hỏi, không dùng AI.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
      </div>
      {error && <div className="mb-4 p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-tertiary text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên bài tập *</label>
          <input required value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-white border border-primary/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="VD: Luyện phân tích nhân vật" />
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm (tùy chọn)</label>
          <select value={workId} onChange={e => setWorkId(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm outline-none">
            <option value="">— Không chọn —</option>
            {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Lớp (tùy chọn)</label>
          <select value={classId} onChange={e => setClassId(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm outline-none">
            <option value="">— Giao sau —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Hạn nộp (tùy chọn)</label>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm outline-none" />
        </div>
      </div>
      <div className="space-y-4 mb-6">
        <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Câu hỏi</label>
        {questions.map((q, i) => (
          <div key={i} className="bg-surface-container-low/50 rounded-xl border border-outline-variant/20 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-primary">Câu {i + 1}</span>
              <button type="button" onClick={() => onQuestionsChange(questions.filter((_, j) => j !== i))}
                className="text-red-300 hover:text-tertiary"><span className="material-symbols-outlined text-sm">delete</span></button>
            </div>
            <textarea value={q.content} onChange={e => updateQ(i, 'content', e.target.value)} rows={2}
              placeholder="Nội dung câu hỏi..."
              className="w-full border border-outline-variant/20 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-primary/30" />
            <div className="flex gap-3 items-center">
              <select value={q.type} onChange={e => updateQ(i, 'type', e.target.value)}
                className="text-xs border border-outline-variant/20 rounded px-2 py-1.5 bg-white outline-none">
                <option value="essay">Tự luận</option>
                <option value="short_answer">Trả lời ngắn</option>
                <option value="multiple_choice">Trắc nghiệm</option>
              </select>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Điểm:</span>
                <input type="number" min="0.5" max="10" step="0.5" value={q.points}
                  onChange={e => updateQ(i, 'points', parseFloat(e.target.value) || 1)}
                  className="w-14 text-xs border border-outline-variant/20 rounded px-2 py-1 text-center bg-white outline-none" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onQuestionsChange([...questions, { content: '', type: 'essay', points: 2, rubric: '' }])}
          className="w-full py-2.5 border border-dashed border-primary/30 text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>Thêm câu hỏi
        </button>
      </div>
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:text-primary">Hủy</button>
        <button type="submit" disabled={saving || !title.trim() || validQuestions.length === 0}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50">
          <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Đang lưu...' : 'Lưu bài tập'}
        </button>
      </div>
    </form>
  );
}

// ─── Exam AI Form ─────────────────────────────────────────────────────────────

interface ExamAiFormProps {
  works: { id: string; title: string }[];
  classes: { id: string; name: string }[];
  structure: ExamStructure;
  onApprove: (title: string, workId?: string, classId?: string, duration?: number) => void;
  onClose: () => void;
  loading: boolean;
}

function ExamAiForm({ works, classes, structure, onApprove, onClose, loading }: ExamAiFormProps) {
  const [title, setTitle] = useState('');
  const [workId, setWorkId] = useState('');
  const [classId, setClassId] = useState('');
  const [duration, setDuration] = useState(90);
  const [deadline, setDeadline] = useState('');

  return (
    <div className="mb-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl border-2 border-secondary/30 shadow-lg animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-secondary">AI tạo bài thi</h3>
            <p className="text-xs text-slate-400">
              AI tạo đề theo cấu trúc: {structure.part1Name} ({structure.part1Points}đ) + {structure.part2Name} ({structure.part2Points}đ).
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên đề *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-white border-2 border-secondary/30 rounded-lg px-4 py-3 text-sm focus:border-primary/40 outline-none"
            placeholder="VD: Kiểm tra HK1 — Ngữ văn 8" autoFocus />
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm (tùy chọn)</label>
          <select value={workId} onChange={e => setWorkId(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm outline-none">
            <option value="">— Không chọn —</option>
            {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">Lớp giao bài *</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} required
            className="w-full bg-white border-2 border-primary/40 rounded-lg px-4 py-3 text-sm focus:border-primary/50 outline-none">
            <option value="">— Chọn lớp —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">Thời lượng *</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-full bg-white border-2 border-primary/40 rounded-lg px-4 py-3 text-sm focus:border-primary/50 outline-none">
            <option value="45">45 phút</option>
            <option value="60">60 phút</option>
            <option value="90">90 phút</option>
            <option value="120">120 phút</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Hạn nộp (tùy chọn)</label>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm outline-none" />
        </div>
      </div>
      {/* Structure reminder */}
      <div className="bg-secondary/10/50 rounded-xl border border-secondary/20 p-4 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-tertiary text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
        <div className="text-xs text-secondary">
          <span className="font-bold">Cấu trúc đề thi:</span>{' '}
          <span className="font-semibold">{structure.part1Name}</span> ({structure.part1Points}đ) — 2 câu đọc hiểu +{' '}
          <span className="font-semibold">{structure.part2Name}</span> ({structure.part2Points}đ) — 2 câu vừa + 1 câu dài.
          Cấu trúc có thể chỉnh trong panel bên phải.
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:text-primary">Hủy</button>
        <button disabled={loading || !title.trim() || !classId} onClick={() => onApprove(title.trim(), workId || undefined, classId || undefined, duration)}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-secondary to-secondary text-white rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
          <span className="material-symbols-outlined text-sm">{loading ? 'hourglass_empty' : 'auto_awesome'}</span>
          {loading ? 'Đang tạo...' : 'Tạo bằng AI'}
        </button>
      </div>
    </div>
  );
}

// ─── Exam Manual Form ─────────────────────────────────────────────────────────

interface ExamManualFormFullProps {
  works: { id: string; title: string }[];
  classes: { id: string; name: string }[];
  questions: EditableQuestion[];
  onQuestionsChange: (q: EditableQuestion[]) => void;
  onSuccess: () => void;
  onClose: () => void;
}

function ExamManualFormFull({ works, classes, questions, onQuestionsChange, onSuccess, onClose }: ExamManualFormFullProps) {
  const [title, setTitle] = useState('');
  const [workId, setWorkId] = useState('');
  const [classId, setClassId] = useState('');
  const [duration, setDuration] = useState(90);
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !classId || validQuestions.length === 0) return;
    setSaving(true); setError('');
    try {
      const res = await authFetch('/api/exams', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), workId: workId || undefined, classId, type: 'exam', duration, deadline: deadline || undefined }),
      });
      const data = await res.json();
      if (!data.id) { setError(data.error || 'Lỗi khi tạo.'); setSaving(false); return; }
      for (const q of validQuestions) {
        await authFetch('/api/exams', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId: data.id, questions: [{ content: q.content.trim(), type: q.type, points: q.points, rubric: q.rubric }] }),
        });
      }
      onSuccess();
    } catch { setError('Lỗi khi tạo.'); }
    setSaving(false);
  };

  const updateQ = (i: number, field: keyof EditableQuestion, val: string | number) => {
    const next = [...questions]; next[i] = { ...next[i], [field]: val }; onQuestionsChange(next);
  };
  const validQuestions = questions.filter(q => q.content.trim());

  return (
    <form onSubmit={handleSubmit} className="mb-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl border-2 border-secondary/30 shadow-lg animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-secondary">Nhập tay bài thi</h3>
            <p className="text-xs text-slate-400">Tự viết câu hỏi + chọn lớp + thời lượng.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
      </div>
      {error && <div className="mb-4 p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-tertiary text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên đề *</label>
          <input required value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-white border-2 border-secondary/30 rounded-lg px-4 py-3 text-sm focus:border-primary/40 outline-none"
            placeholder="VD: Kiểm tra HK1 — Ngữ văn 8" />
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm (tùy chọn)</label>
          <select value={workId} onChange={e => setWorkId(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm outline-none">
            <option value="">— Không chọn —</option>
            {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">Lớp giao bài *</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} required
            className="w-full bg-white border-2 border-primary/40 rounded-lg px-4 py-3 text-sm focus:border-primary/50 outline-none">
            <option value="">— Chọn lớp —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">Thời lượng *</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-full bg-white border-2 border-primary/40 rounded-lg px-4 py-3 text-sm focus:border-primary/50 outline-none">
            <option value="45">45 phút</option>
            <option value="60">60 phút</option>
            <option value="90">90 phút</option>
            <option value="120">120 phút</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Hạn nộp (tùy chọn)</label>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm outline-none" />
        </div>
      </div>
      <div className="space-y-4 mb-6">
        <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Câu hỏi</label>
        {questions.map((q, i) => (
          <div key={i} className="bg-surface-container-low/50 rounded-xl border border-secondary/20 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-secondary">Câu {i + 1}</span>
              <button type="button" onClick={() => onQuestionsChange(questions.filter((_, j) => j !== i))}
                className="text-red-300 hover:text-tertiary"><span className="material-symbols-outlined text-sm">delete</span></button>
            </div>
            <textarea value={q.content} onChange={e => updateQ(i, 'content', e.target.value)} rows={2}
              placeholder="Nội dung câu hỏi..."
              className="w-full border border-secondary/20 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-secondary/30" />
            <div className="flex gap-3 items-center">
              <select value={q.type} onChange={e => updateQ(i, 'type', e.target.value)}
                className="text-xs border border-secondary/20 rounded px-2 py-1.5 bg-white outline-none">
                <option value="essay">Tự luận</option>
                <option value="short_answer">Trả lời ngắn</option>
                <option value="multiple_choice">Trắc nghiệm</option>
              </select>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Điểm:</span>
                <input type="number" min="0.5" max="10" step="0.5" value={q.points}
                  onChange={e => updateQ(i, 'points', parseFloat(e.target.value) || 1)}
                  className="w-14 text-xs border border-secondary/20 rounded px-2 py-1 text-center bg-white outline-none" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onQuestionsChange([...questions, { content: '', type: 'essay', points: 2, rubric: '' }])}
          className="w-full py-2.5 border border-dashed border-secondary/30 text-tertiary rounded-xl text-sm font-semibold hover:bg-secondary/10 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>Thêm câu hỏi
        </button>
      </div>
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:text-primary">Hủy</button>
        <button type="submit" disabled={saving || !title.trim() || !classId || validQuestions.length === 0}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-secondary to-secondary text-white rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50">
          <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Đang lưu...' : 'Lưu bài thi'}
        </button>
      </div>
    </form>
  );
}

// ─── Manual question editor ───────────────────────────────────────────────────

function ExamManualForm({ questions, onChange }: {
  questions: EditableQuestion[];
  onChange: (q: EditableQuestion[]) => void;
}) {
  const addQuestion = () => {
    onChange([...questions, { content: '', type: 'essay', points: 2, rubric: '' }]);
  };
  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };
  const update = (idx: number, field: keyof EditableQuestion, value: string | number) => {
    const next = [...questions];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {questions.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
      )}
      {questions.map((q, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-outline-variant/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary">Câu {idx + 1}</span>
            <button onClick={() => removeQuestion(idx)} className="text-red-300 hover:text-tertiary transition-colors">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          <textarea
            value={q.content}
            onChange={e => update(idx, 'content', e.target.value)}
            rows={2}
            placeholder="Nhập nội dung câu hỏi..."
            className="w-full border border-outline-variant/20 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/20 resize-none"
          />
          <div className="flex gap-3 items-center">
            <select value={q.type} onChange={e => update(idx, 'type', e.target.value)}
              className="text-xs border border-outline-variant/20 rounded px-2 py-1.5 bg-white">
              <option value="essay">Tự luận</option>
              <option value="short_answer">Trả lời ngắn</option>
              <option value="multiple_choice">Trắc nghiệm</option>
            </select>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Điểm:</span>
              <input type="number" min="0.5" max="10" step="0.5" value={q.points}
                onChange={e => update(idx, 'points', parseFloat(e.target.value) || 1)}
                className="w-14 text-xs border border-outline-variant/20 rounded px-2 py-1 text-center bg-white" />
            </div>
          </div>
          <input value={q.rubric} onChange={e => update(idx, 'rubric', e.target.value)}
            placeholder="Gợi ý đáp án / rubric (tùy chọn)"
            className="w-full border border-outline-variant/20 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary/20 bg-surface-container-low/30" />
        </div>
      ))}
      <button onClick={addQuestion}
        className="w-full py-2.5 border border-dashed border-primary/30 text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-sm">add</span>
        Thêm câu hỏi
      </button>
    </div>
  );
}

export default function ExamBankPage() {
  const [activeTab, setActiveTab] = useState<Tab>("exercise");
  // 'create-exercise' | 'create-exam' | false
  // 'exercise-ai' | 'exercise-manual' | 'exam-ai' | 'exam-manual' | false
  const [showCreateForm, setShowCreateForm] = useState<'exercise-ai' | 'exercise-manual' | 'exam-ai' | 'exam-manual' | false>(false);
  const [filterClass, setFilterClass] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [publishTarget, setPublishTarget] = useState<Exam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const { data: apiExamsData, isLoading, mutate } = useSWR(
    `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
    fetcher
  );
  const { data: worksData } = useSWR('/api/works', fetcher);
  const { data: classesData } = useSWR('/api/classes', fetcher);
  const apiExams = apiExamsData?.data ?? [];
  const works = worksData?.data ?? [];
  const classes = classesData?.data ?? [];

  // Filter by tab (class filter is now handled server-side via API)
  const filtered = apiExams.filter((e: Exam) => e.type === activeTab);

  // ── AI Preview state ──────────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    previewId: string;
    title: string;
    questions: EditableQuestion[];
  } | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<EditableQuestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Publish / unpublish — show confirm dialog first
  const handlePublishClick = (exam: Exam) => {
    setPublishTarget(exam);
  };

  const handlePublishConfirm = async () => {
    if (!publishTarget) return;
    setPublishingId(publishTarget.id);
    const isPublishing = publishTarget.status !== 'published';
    const newStatus = isPublishing ? 'published' : 'draft';
    const prevStatus = publishTarget.status;

    // Optimistic update — instant UI
    await mutate(
      `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
      (current: { data: Exam[] } | undefined) => ({
        ...current,
        data: (current?.data ?? []).map(e =>
          e.id === publishTarget.id ? { ...e, status: newStatus } : e
        ),
      }),
      false
    );
    setPublishTarget(null);

    try {
      await authFetch('/api/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: publishTarget.id, status: newStatus }),
      });
      showToast(isPublishing ? 'Đã đăng đề.' : 'Đã gỡ đăng.', 'success');
    } catch {
      // Rollback on failure
      await mutate(
        `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
        (current: { data: Exam[] } | undefined) => ({
          ...current,
          data: (current?.data ?? []).map(e =>
            e.id === publishTarget.id ? { ...e, status: prevStatus } : e
          ),
        }),
        false
      );
      showToast('Lỗi khi cập nhật trạng thái.', 'error');
    } finally {
      setPublishingId(null);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const deletedId = deleteTarget.id;

    // Optimistic update — instant UI
    await mutate(
      `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
      (current: { data: Exam[] } | undefined) => ({
        ...current,
        data: (current?.data ?? []).filter(e => e.id !== deletedId),
      }),
      false
    );
    setDeleteTarget(null);

    try {
      const res = await authFetch(`/api/exams?id=${deletedId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Đã xóa đề.', 'success');
      } else {
        // Rollback + show error
        await mutate(`/api/exams${filterClass ? `?classId=${filterClass}` : ''}`);
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Xóa thất bại.', 'error');
      }
    } catch {
      // Network error — rollback
      await mutate(`/api/exams${filterClass ? `?classId=${filterClass}` : ''}`);
      showToast('Lỗi mạng. Vui lòng thử lại.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Class name lookup
  const className = (id: string) => classes.find((c: { id: string; name: string }) => c.id === id)?.name || '—';
  const workTitle = (id: string) => works.find((w: { id: string; title: string }) => w.id === id)?.title || '';

  // Form state for AI generation — type is always the activeTab
  const [genForm, setGenForm] = useState({
    title: '',
    work: '',
    cls: '',
    duration: 45,
    deadline: '',
  });

  // Manual mode state
  const [createMode, setCreateMode] = useState<CreateMode>('ai');
  const [manualQuestions, setManualQuestions] = useState<EditableQuestion[]>([
    { content: '', type: 'essay', points: 2, rubric: '' },
  ]);
  const [savingManual, setSavingManual] = useState(false);

  // ── Exam structure (editable, feeds into AI prompt) ─────────────────────
  const [examStructure, setExamStructure] = useState<ExamStructure>(DEFAULT_STRUCTURE);
  const [editingStructure, setEditingStructure] = useState(false);
  const [structDraft, setStructDraft] = useState<ExamStructure>(DEFAULT_STRUCTURE);

  const saveStructure = () => {
    setExamStructure(structDraft);
    setEditingStructure(false);
  };
  const startEditStructure = () => {
    setStructDraft(examStructure);
    setEditingStructure(true);
  };

  const resetForm = () => {
    setGenForm({ title: '', work: '', cls: '', duration: 45, deadline: '' });
    setManualQuestions([{ content: '', type: 'essay', points: 2, rubric: '' }]);
    setCreateMode('ai');
    setShowCreateForm(false); // 'quick-ai' | 'full' | false
    setEditingStructure(false);
  };

  const handleAiGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAiLoading(true);
    setPreviewData(null);

    try {
      // Determine type from which form is open, not activeTab (which controls the table filter)
      const formType: Tab = showCreateForm === 'create-exam' ? 'exam'
        : showCreateForm === 'create-exercise' ? 'exercise'
        : activeTab;

      const res = await authFetch('/api/ai/exam-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: genForm.title,
          workId: genForm.work || undefined,
          classId: genForm.cls || undefined,
          type: formType,
          duration: formType === 'exam' ? genForm.duration : undefined,
          deadline: genForm.deadline || undefined,
          structure: formType === 'exam' ? examStructure : undefined,
        }),
      });
      const data = await res.json();
      if (data.previewId && data.questions?.length) {
        setPreviewData(data);
        setEditableQuestions(data.questions.map((q: { content: string; type: string; points: number; rubric: string }) => ({
          content: q.content || '',
          type: q.type || 'essay',
          points: q.points || 2,
          rubric: q.rubric || '',
        })));
        setShowPreview(true);
        setShowCreateForm(false);
      } else {
        showToast(data.error || 'AI không tạo được đề. Thử lại.', 'error');
      }
    } catch {
      showToast('Lỗi khi gọi AI. Kiểm tra kết nối.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!genForm.title.trim()) {
      showToast('Vui lòng nhập tên đề.', 'error');
      return;
    }
    const validQuestions = manualQuestions.filter(q => q.content.trim());
    if (validQuestions.length === 0) {
      showToast('Cần ít nhất 1 câu hỏi có nội dung.', 'error');
      return;
    }
    setSavingManual(true);
    try {
      // Step 1: Create exam
      const res = await authFetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: genForm.title.trim(),
          workId: genForm.work || undefined,
          classId: genForm.cls || undefined,
          type: showCreateForm === 'create-exam' ? 'exam' : 'exercise',
          duration: genForm.duration,
          deadline: genForm.deadline || undefined,
        }),
      });
      const data = await res.json();
      if (!data.id) {
        showToast(data.error || 'Lỗi khi tạo đề.', 'error');
        setSavingManual(false);
        return;
      }
      // Step 2: Add each question
      for (const q of validQuestions) {
        await authFetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: data.id,
            questions: [{ content: q.content.trim(), type: q.type, points: q.points, rubric: q.rubric }],
          }),
        });
      }
      showToast('Đề đã được tạo thủ công.', 'success');
      await mutate();
      resetForm();
    } catch {
      showToast('Lỗi khi tạo đề.', 'error');
    } finally {
      setSavingManual(false);
    }
  };

  const handleApprove = async () => {
    if (!previewData) return;
    setModalLoading(true);
    try {
      const res = await authFetch('/api/ai/exam-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewId: previewData.previewId,
          title: previewData.title,
          questions: editableQuestions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đề đã được tạo, sẵn sàng để chỉnh sửa trước khi đăng.', 'success');
        await mutate();
        setShowPreview(false);
        setPreviewData(null);
        setEditableQuestions([]);
      } else {
        showToast(data.error || 'Lỗi khi lưu đề.', 'error');
      }
    } catch {
      showToast('Lỗi khi lưu đề.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReject = async () => {
    if (!previewData) return;
    await authFetch('/api/ai/exam-reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previewId: previewData.previewId }),
    });
    setShowPreview(false);
    setPreviewData(null);
    setEditableQuestions([]);
    showToast('Đã hủy.', 'error');
  };

  return (
    <>
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-lg animate-[fadeIn_0.2s_ease-out] ${
          toastType === 'success' ? 'bg-secondary text-white' : 'bg-secondary/100 text-white'
        }`}>
          {toastMsg}
        </div>
      )}

      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block">Quản lý học liệu</span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Ngân hàng Đề</h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateForm('exercise-ai')}
            className="flex items-center gap-2 px-6 py-3 border border-primary text-primary hover:bg-primary/5 transition-all rounded-md font-medium active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">assignment</span>
            Tạo bài tập
          </button>
          <button
            onClick={() => setShowCreateForm('exam-ai')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-md shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all font-medium"
          >
            <span className="material-symbols-outlined">quiz</span>
            Tạo bài thi
          </button>
        </div>
      </div>

      {/* ── Exercise AI: chỉ tên + tác phẩm → preview ── */}
      {showCreateForm === 'exercise-ai' && (
        <ExerciseAiForm
          works={works}
          onApprove={async (title, workId) => {
            setAiLoading(true);
            try {
              const res = await authFetch('/api/ai/exam-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, workId: workId || undefined, type: 'exercise' }),
              });
              const data = await res.json();
              if (data.previewId && data.questions?.length) {
                setPreviewData(data);
                setEditableQuestions(data.questions.map((q: { content: string; type: string; points: number; rubric: string }) => ({
                  content: q.content || '', type: q.type || 'essay', points: q.points || 2, rubric: q.rubric || '',
                })));
                setShowPreview(true);
                setShowCreateForm(false);
              } else {
                showToast(data.error || 'AI không tạo được. Thử lại.', 'error');
              }
            } catch { showToast('Lỗi khi gọi AI.', 'error');
            } finally { setAiLoading(false); }
          }}
          onClose={() => setShowCreateForm(false)}
          loading={aiLoading}
        />
      )}

      {/* ── Exercise Manual: form tùy chỉnh câu hỏi ── */}
      {showCreateForm === 'exercise-manual' && (
        <ExerciseManualForm
          works={works}
          classes={classes}
          questions={manualQuestions}
          onQuestionsChange={setManualQuestions}
          onSuccess={async () => { showToast('Đã tạo bài tập.', 'success'); await mutate(); resetForm(); }}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* ── Exam AI: tên + tác phẩm + lớp + duration → preview + structure ── */}
      {showCreateForm === 'exam-ai' && (
        <ExamAiForm
          works={works}
          classes={classes}
          structure={examStructure}
          onApprove={async (title, workId, classId, duration) => {
            setAiLoading(true);
            try {
              const res = await authFetch('/api/ai/exam-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title, workId: workId || undefined,
                  classId: classId || undefined, type: 'exam',
                  duration, structure: examStructure,
                }),
              });
              const data = await res.json();
              if (data.previewId && data.questions?.length) {
                setPreviewData(data);
                setEditableQuestions(data.questions.map((q: { content: string; type: string; points: number; rubric: string }) => ({
                  content: q.content || '', type: q.type || 'essay', points: q.points || 2, rubric: q.rubric || '',
                })));
                setShowPreview(true);
                setShowCreateForm(false);
              } else {
                showToast(data.error || 'AI không tạo được. Thử lại.', 'error');
              }
            } catch { showToast('Lỗi khi gọi AI.', 'error');
            } finally { setAiLoading(false); }
          }}
          onClose={() => setShowCreateForm(false)}
          loading={aiLoading}
        />
      )}

      {/* ── Exam Manual: form tùy chỉnh câu hỏi + class + duration ── */}
      {showCreateForm === 'exam-manual' && (
        <ExamManualFormFull
          works={works}
          classes={classes}
          questions={manualQuestions}
          onQuestionsChange={setManualQuestions}
          onSuccess={async () => { showToast('Đã tạo bài thi.', 'success'); await mutate(); resetForm(); }}
          onClose={() => setShowCreateForm(false)}
        />
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
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/20 text-on-surface cursor-pointer"
                >
                  <option value="">Tất cả lớp</option>
                  {classes.map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
              </div>
            </div>
          </div>

          {/* Exam Table */}
          <div className="bg-surface-container-lowest shadow-sm rounded-2xl overflow-hidden border border-outline-variant/15">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đề</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tác phẩm</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Đang tải...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chưa có đề nào.</td></tr>
                ) : (
                  filtered.map((e: Exam) => (
                    <tr key={e.id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-headline font-bold text-primary group-hover:text-secondary transition-colors">{e.title}</div>
                        <div className="text-xs text-slate-400 font-body mt-0.5 italic">
                          {e.duration ? `${e.duration} phút` : ''} {e.workTitle ? `• ${e.workTitle}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface font-medium">{e.workTitle || '—'}</td>
                      <td className="px-6 py-5 text-sm text-on-surface font-medium">{e.className || '—'}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          e.status === 'published'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {e.status === 'published' ? 'Đã đăng' : 'Nháp'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 text-sm font-medium">
                          <button
                            className="px-3 py-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => handlePublishClick(e)}
                            disabled={publishingId === e.id}
                            className={`px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              e.status === 'published'
                                ? 'text-slate-400 hover:bg-slate-100'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {publishingId === e.id ? '...' : e.status === 'published' ? 'Gỡ đăng' : 'Đăng'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            disabled={deletingId === e.id}
                            className="px-3 py-1.5 text-tertiary hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === e.id ? '...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
              onClick={() => setDeleteTarget(null)}>
              <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                  <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <div>
                    <h3 className="text-xl font-headline font-bold text-error">Xác nhận xóa</h3>
                    <p className="text-sm text-outline">Hành động không thể hoàn tác.</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface px-6 pb-2 mt-1">
                  Xóa đề <strong>"{deleteTarget.title}"</strong>?
                </p>
                <div className="flex gap-3 px-6 pb-6 mt-4">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
                    Hủy
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 bg-error text-on-error py-2.5 rounded-xl font-semibold hover:bg-error/90 transition-colors">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Publish Confirm Modal */}
          {publishTarget && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
              onClick={() => setPublishTarget(null)}>
              <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                {publishTarget.status === 'published' ? (
                  <>
                    <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                      <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>unpublished</span>
                      <div>
                        <h3 className="text-xl font-headline font-bold text-primary">Gỡ đăng đề</h3>
                        <p className="text-sm text-outline">Học sinh sẽ không thấy bài thi này.</p>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface px-6 pb-2 mt-1">
                      Bỏ đăng đề <strong>"{publishTarget.title}"</strong>? Học sinh đã nộp sẽ giữ bài nhưng không thấy kết quả.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                      <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                      <div>
                        <h3 className="text-xl font-headline font-bold text-primary">Xuất bản đề thi</h3>
                        <p className="text-sm text-outline">Học sinh sẽ thấy ngay bài thi này.</p>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface px-6 pb-2 mt-1">
                      Đăng đề <strong>"{publishTarget.title}"</strong>? Bài thi sẽ hiển thị ngay cho học sinh trong lớp.
                    </p>
                  </>
                )}
                <div className="flex gap-3 px-6 pb-6 mt-4">
                  <button onClick={() => setPublishTarget(null)}
                    className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
                    Hủy
                  </button>
                  <button onClick={handlePublishConfirm}
                    className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-xl font-semibold hover:bg-secondary/90 transition-colors">
                    {publishTarget.status === 'published' ? 'Gỡ đăng' : 'Đăng'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel — Cấu trúc Đề thi (editable, feeds into AI prompt) */}
        <div className="col-span-12 lg:col-span-4 sticky top-28">
          <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl p-8 border border-outline-variant/15 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-headline font-bold text-primary">Cấu trúc Đề thi</h3>
              {!editingStructure ? (
                <button
                  onClick={startEditStructure}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Chỉnh sửa
                </button>
              ) : (
                <span className="text-[10px] font-bold bg-tertiary/10 text-tertiary px-2 py-1 rounded">ĐANG SỬA</span>
              )}
            </div>

            {!editingStructure ? (
              /* Read-only display */
              <div className="space-y-6">
                <div className="relative pl-5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-secondary/40 rounded-full">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-headline font-bold text-secondary text-sm">Phần I — {examStructure.part1Name}</h4>
                    <span className="text-xs font-bold text-secondary">{examStructure.part1Points} điểm</span>
                  </div>
                  <p className="text-xs text-slate-400">Đọc hiểu văn bản, nhận biết, thông hiểu, vận dụng.</p>
                </div>
                <div className="relative pl-5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary/40 rounded-full">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-headline font-bold text-primary text-sm">Phần II — {examStructure.part2Name}</h4>
                    <span className="text-xs font-bold text-primary">{examStructure.part2Points} điểm</span>
                  </div>
                  <p className="text-xs text-slate-400">Nghị luận văn học, viết bài văn hoàn chỉnh.</p>
                </div>
                <div className="pt-2 border-t border-outline-variant/20">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    Cấu trúc này được truyền vào prompt AI khi tạo đề thi.
                  </p>
                </div>
              </div>
            ) : (
              /* Editable form */
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phần 1 — Tên</label>
                  <input
                    value={structDraft.part1Name}
                    onChange={e => setStructDraft({ ...structDraft, part1Name: e.target.value })}
                    className="w-full border border-secondary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
                    placeholder="VD: Đọc hiểu"
                  />
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phần 1 — Điểm</label>
                  <input
                    type="number" min="1" max="10" step="0.5"
                    value={structDraft.part1Points}
                    onChange={e => setStructDraft({ ...structDraft, part1Points: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-secondary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phần 2 — Tên</label>
                  <input
                    value={structDraft.part2Name}
                    onChange={e => setStructDraft({ ...structDraft, part2Name: e.target.value })}
                    className="w-full border border-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="VD: Làm văn"
                  />
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phần 2 — Điểm</label>
                  <input
                    type="number" min="1" max="10" step="0.5"
                    value={structDraft.part2Points}
                    onChange={e => setStructDraft({ ...structDraft, part2Points: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-primary/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingStructure(false)}
                    className="flex-1 border border-outline-variant py-2 rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={saveStructure}
                    className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prompt preview — shows current AI prompt snippet */}
          <div className="mt-4 bg-surface-container-low/60 rounded-xl p-4 border border-outline-variant/10">
            <p className="text-[10px] font-bold text-outline uppercase mb-2">AI Prompt Preview</p>
            <div className="text-[10px] text-slate-500 font-mono leading-relaxed space-y-1">
              <p><span className="text-secondary font-bold">Phần I:</span> {examStructure.part1Name} ({examStructure.part1Points}đ) — 2 câu ngắn (trắc nghiệm/ngắn)</p>
              <p><span className="text-primary font-bold">Phần II:</span> {examStructure.part2Name} ({examStructure.part2Points}đ) — 1 câu dài (nghị luận)</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Preview Modal */}
      {previewData && (
        <AiPreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title={`Xem trước: ${previewData.title}`}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={modalLoading}
          loadingLabel="Đang lưu..."
          footerNote="Bạn có thể chỉnh sửa bất kỳ câu hỏi nào trước khi duyệt."
        >
          <ExamPreviewContent
            title={previewData.title}
            questions={editableQuestions}
            onChange={setEditableQuestions}
          />
        </AiPreviewModal>
      )}
    </>
  );
}
