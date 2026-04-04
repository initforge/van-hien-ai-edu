import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';

type Tab = 'class_stats' | 'student_stats' | 'tokens' | 'rubrics';

const TAB_LABELS: Record<Tab, string> = {
  class_stats: 'Thống kê lớp',
  student_stats: 'Thống kê HS',
  tokens: 'Sử dụng Token',
  rubrics: 'Tiêu chí chấm điểm',
};

const FEATURE_LABELS: Record<string, string> = {
  grading: 'Chấm bài',
  chatbot: 'Chatbot',
  exam_gen: 'Ra đề thi',
  multiverse: 'Đa Vũ Trụ',
};

function fmtNum(n: number | null) {
  if (n == null) return '—';
  return n.toLocaleString('vi');
}
function fmtScore(n: number | null) {
  if (n == null) return '—';
  return n.toFixed(1);
}

interface RubricRow {
  id: string;
  name: string;
  description: string;
  weight: number;
  hintPrompt: string;
  orderIndex: number;
}
interface TokenRow {
  feature: string;
  totalInput: number;
  totalOutput: number;
  totalTokens: number;
  callCount: number;
}
interface ClassStat {
  id: string;
  name: string;
  gradeLevel: number | null;
  studentCount: number;
  pendingCount: number;
  gradedCount: number;
  avgScore: number | null;
}
interface SubmissionRow {
  studentId: string;
  studentName: string;
  className: string;
  examTitle: string;
  status: string;
  aiScore: number | null;
  teacherScore: number | null;
  submittedAt: string;
}

export default function AIReviewPage() {
  const [tab, setTab] = useState<Tab>('class_stats');
  const [filterClass, setFilterClass] = useState('');
  const [editingRubric, setEditingRubric] = useState<RubricRow | null>(null);
  const [rubricForm, setRubricForm] = useState({ name: '', description: '', weight: 25, hintPrompt: '' });
  const [saving, setSaving] = useState(false);

  const { data, mutate, isLoading } = useSWR<{
    rubrics: RubricRow[];
    tokens: TokenRow[];
    totalTokens: number;
    classStats: ClassStat[];
    recentSubmissions: SubmissionRow[];
  }>(`/api/teacher/stats-ai${filterClass ? `?classId=${filterClass}` : ''}`, fetcher);

  const rubrics: RubricRow[] = data?.rubrics ?? [];
  const tokens: TokenRow[] = data?.tokens ?? [];
  const classStats: ClassStat[] = data?.classStats ?? [];
  const submissions: SubmissionRow[] = data?.recentSubmissions ?? [];
  const totalTokens = data?.totalTokens ?? 0;

  const totalWeight = rubrics.reduce((s, r) => s + r.weight, 0);

  // Trend: compare last 2 submissions per student
  const studentTrend: Record<string, number> = {};
  const sortedSub = [...submissions].sort((a, b) =>
    new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  for (const s of sortedSub) {
    const score = s.teacherScore ?? s.aiScore;
    if (score != null) {
      const prev = studentTrend[s.studentId];
      studentTrend[s.studentId] = score - (prev ?? score);
    }
  }

  const handleSaveRubric = async () => {
    if (!editingRubric) return;
    setSaving(true);
    try {
      await fetch('/api/teacher/rubric', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRubric.id,
          name: rubricForm.name,
          description: rubricForm.description,
          weight: rubricForm.weight,
          hintPrompt: rubricForm.hintPrompt,
        }),
      });
      setEditingRubric(null);
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  const handleAddRubric = async () => {
    setEditingRubric({ id: '', name: '', description: '', weight: 25, hintPrompt: '', orderIndex: rubrics.length + 1 });
    setRubricForm({ name: '', description: '', weight: 25, hintPrompt: '' });
  };

  const handleCreateRubric = async () => {
    if (!rubricForm.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/teacher/rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rubricForm),
      });
      setEditingRubric(null);
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRubric = async (id: string) => {
    await fetch(`/api/teacher/rubric?id=${id}`, { method: 'DELETE' });
    await mutate();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">Trung tâm điều hành AI</span>
        <h2 className="text-4xl font-headline font-bold text-primary">Phân tích & Duyệt AI</h2>
      </div>

      {/* Class Filter */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs font-bold text-secondary uppercase tracking-wider">Lọc theo lớp:</span>
        <div className="relative">
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/20 text-on-surface cursor-pointer"
          >
            <option value="">Tất cả lớp</option>
            {classStats.map((c: ClassStat) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
        </div>
        {filterClass && (
          <button onClick={() => setFilterClass('')} className="text-xs text-primary hover:underline font-semibold">
            ✕ Bỏ lọc
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-outline-variant/20 mb-10 overflow-x-auto">
        {(Object.entries(TAB_LABELS) as [Tab, string][]).map(([key, label]) => (
          <button key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-bold transition-all whitespace-nowrap ${
              tab === key
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── CLASS STATS ─────────────────────────────────── */}
      {tab === 'class_stats' && (
        <div className="space-y-8">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Lớp đang quản lý', value: String(classStats.length), icon: 'school', color: 'text-primary' },
              { label: 'Tổng bài đã chấm', value: String(submissions.filter(s => s.status === 'returned').length), icon: 'grading', color: 'text-secondary' },
              { label: 'Bài chờ chấm', value: String(submissions.filter(s => s.status !== 'returned').length), icon: 'pending_actions', color: 'text-amber-500' },
              { label: 'Token tháng này', value: totalTokens > 0 ? `${(totalTokens / 1000).toFixed(1)}k` : '—', icon: 'memory', color: 'text-purple-500' },
            ].map((card, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-outline-variant/15">
                <span className={`material-symbols-outlined ${card.color} text-2xl mb-3 block`}>{card.icon}</span>
                <p className="text-3xl font-headline font-bold text-primary">{card.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Class bars */}
          <div className="bg-white/80 rounded-2xl p-8 border border-outline-variant/15">
            <h3 className="font-headline font-bold text-primary text-lg mb-6">Điểm trung bình theo lớp</h3>
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : classStats.length === 0 ? (
              <p className="text-slate-400 text-sm">Chưa có lớp nào.</p>
            ) : (
              <div className="space-y-5">
                {classStats.map(c => (
                  <div key={c.id} className="flex items-center gap-4">
                    <div className="w-40 flex-shrink-0">
                      <p className="font-bold text-primary text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.studentCount} HS</p>
                    </div>
                    <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all"
                        style={{ width: c.avgScore != null ? `${(c.avgScore / 10) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-10 text-right font-bold text-primary text-sm">
                      {c.avgScore != null ? c.avgScore.toFixed(1) : '—'}
                    </span>
                    {c.pendingCount > 0 && (
                      <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                        {c.pendingCount} chờ
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STUDENT STATS ────────────────────────────────── */}
      {tab === 'student_stats' && (
        <div className="bg-white/80 rounded-2xl border border-outline-variant/15 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Học sinh</th>
                <th className="px-6 py-4 font-bold">Lớp</th>
                <th className="px-6 py-4 font-bold">Bài đã chấm</th>
                <th className="px-6 py-4 font-bold text-right">Điểm gần nhất</th>
                <th className="px-6 py-4 font-bold text-right">Xu hướng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">Đang tải...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">Chưa có dữ liệu.</td></tr>
              ) : (
                submissions.slice(0, 30).map((s, i) => {
                  const score = s.teacherScore ?? s.aiScore;
                  const trend = studentTrend[s.studentId] ?? 0;
                  return (
                    <tr key={`${s.studentId}-${i}`} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">{s.studentName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{s.className}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{s.examTitle}</td>
                      <td className="px-6 py-4 text-right font-bold text-lg text-primary">{fmtScore(score)}</td>
                      <td className="px-6 py-4 text-right">
                        {trend !== 0 && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TOKENS ──────────────────────────────────────── */}
      {tab === 'tokens' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tokens.map(t => (
              <div key={t.feature} className="bg-white/80 rounded-2xl p-6 border border-outline-variant/15">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                      {FEATURE_LABELS[t.feature] || t.feature}
                    </p>
                    <p className="text-3xl font-headline font-bold text-primary">
                      {(t.totalTokens / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-surface-container-low px-2 py-1 rounded-full">
                    {t.callCount} lần
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-slate-400">
                  <span>In: {(t.totalInput / 1000).toFixed(1)}k</span>
                  <span>Out: {(t.totalOutput / 1000).toFixed(1)}k</span>
                </div>
              </div>
            ))}
            {tokens.length === 0 && !isLoading && (
              <p className="col-span-3 text-center text-slate-400 py-12">Chưa có dữ liệu sử dụng token.</p>
            )}
          </div>
        </div>
      )}

      {/* ── RUBRICS ───────────────────────────────────── */}
      {tab === 'rubrics' && (
        <div className="space-y-6">
          {/* Weight bar */}
          {!isLoading && rubrics.length > 0 && (
            <div className="bg-white/80 rounded-2xl p-6 border border-outline-variant/15">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                <span>Phân bổ trọng số</span>
                <span>{totalWeight}%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex bg-surface-container-low">
                {rubrics.map((r, i) => (
                  <div key={r.id} className="h-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                    style={{
                      width: `${r.weight}%`,
                      background: ['#326286', '#C9A84C', '#7c3aed', '#16a34a', '#ea580c'][i % 5],
                    }}
                    title={r.name}
                  >
                    {r.weight}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rubric cards */}
          <div className="flex justify-end">
            <button onClick={handleAddRubric}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md">
              <span className="material-symbols-outlined text-base">add</span>
              Thêm tiêu chí
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : rubrics.map(r => (
              <div key={r.id} className="bg-white/80 rounded-2xl p-6 border border-outline-variant/15 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-headline font-bold text-primary text-lg">{r.name}</h4>
                    <span className="text-xs font-bold text-secondary">{r.weight}%</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingRubric(r); setRubricForm({ name: r.name, description: r.description, weight: r.weight, hintPrompt: r.hintPrompt }); }}
                      className="text-xs text-primary hover:underline font-bold">Sửa</button>
                    <button onClick={() => handleDeleteRubric(r.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-bold">Xóa</button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{r.description || '—'}</p>
                {r.hintPrompt && (
                  <p className="text-xs text-slate-400 italic mt-2 bg-surface-container-low p-3 rounded-lg leading-relaxed">
                    Gợi ý: {r.hintPrompt}
                  </p>
                )}
              </div>
            ))}
          </div>
          {rubrics.length === 0 && !isLoading && (
            <div className="text-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">psychology</span>
              <p>Chưa có tiêu chí nào. Nhấn "Thêm tiêu chí" để bắt đầu.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Rubric Modal */}
      {editingRubric !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditingRubric(null)}
        >
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-headline text-xl font-bold text-primary mb-6">
              {editingRubric.id ? 'Sửa tiêu chí' : 'Thêm tiêu chí mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên tiêu chí *</label>
                <input value={rubricForm.name}
                  onChange={e => setRubricForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  placeholder="VD: Nội dung"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Mô tả / Hướng dẫn chấm</label>
                <textarea value={rubricForm.description}
                  onChange={e => setRubricForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm leading-relaxed focus:ring-2 focus:ring-primary/30 outline-none resize-y min-h-[80px]"
                  placeholder="Mô tả ngắn gọn cách đánh giá tiêu chí này..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Trọng số: <span className="text-primary font-bold">{rubricForm.weight}%</span>
                </label>
                <input type="range" min="5" max="100" step="5"
                  value={rubricForm.weight}
                  onChange={e => setRubricForm(f => ({ ...f, weight: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>5%</span><span>50%</span><span>100%</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Gợi ý cho AI (prompt hint)</label>
                <textarea value={rubricForm.hintPrompt}
                  onChange={e => setRubricForm(f => ({ ...f, hintPrompt: e.target.value }))}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm leading-relaxed focus:ring-2 focus:ring-primary/30 outline-none resize-y min-h-[80px]"
                  placeholder="VD: Trừ điểm nếu lạc đề, thiếu dẫn chứng..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingRubric(null)}
                className="flex-1 py-2.5 border border-outline-variant/30 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition-colors">
                Hủy
              </button>
              <button
                onClick={editingRubric.id ? handleSaveRubric : handleCreateRubric}
                disabled={saving || !rubricForm.name.trim()}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 text-sm transition-all"
              >
                {saving ? 'Đang lưu…' : editingRubric.id ? 'Lưu' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
