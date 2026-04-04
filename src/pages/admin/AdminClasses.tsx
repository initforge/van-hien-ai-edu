import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { Class, User } from '../../types/api';

const GRADE_LABELS: Record<number, string> = {
  6: 'Khối 6',
  7: 'Khối 7',
  8: 'Khối 8',
  9: 'Khối 9',
};

const GRADE_COLORS: Record<number, { bg: string; text: string }> = {
  6: { bg: 'bg-[#326286]/10', text: 'text-[#326286]' },
  7: { bg: 'bg-[#005142]/10', text: 'text-[#005142]' },
  8: { bg: 'bg-[#C9A84C]/10', text: 'text-[#C9A84C]' },
  9: { bg: 'bg-[#7c3aed]/10', text: 'text-[#7c3aed]' },
};

export default function AdminClassesPage() {
  const { data: classData, mutate: mutateClasses } = useSWR('/api/admin/classes', fetcher);
  const { data: teachersData } = useSWR('/api/admin/users', fetcher);
  const classes: (Class & { grade?: number })[] = classData?.data ?? [];
  const teachers: User[] = teachersData?.data ?? [];
  const teacherList = teachers.filter(u => u.role === 'teacher');

  // Filters
  const [filterGrade, setFilterGrade] = useState<number | null>(null);
  const [filterTeacher, setFilterTeacher] = useState<string | ''>('');

  // Card expand
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: expandedData, mutate: mutateExpanded } = useSWR<ClassExpandedData>(
    expandedId ? `/api/admin/classes?classId=${expandedId}` : null,
    fetcher
  );

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [form, setForm] = useState({ name: '', teacherId: '', grade: '' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Compute unique grades from data
  const grades = [...new Set(classes.map(c => c.grade).filter((g): g is number => g != null))].sort();

  // Apply filters
  const filtered = classes.filter(c => {
    if (filterGrade !== null && c.grade !== filterGrade) return false;
    if (filterTeacher && c.teacherId !== filterTeacher) return false;
    return true;
  });

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (filterGrade !== null) params.set('gradeLevel', String(filterGrade));
    if (filterTeacher) params.set('teacherId', filterTeacher);
    return `/api/admin/classes${params.toString() ? `?${params}` : ''}`;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { data: filteredData } = useSWR(buildUrl(), fetcher);
  const displayClasses: Class[] = (filteredData?.data ?? filtered) as Class[];

  const openCreate = () => {
    setEditClass(null);
    setForm({ name: '', teacherId: '', grade: '' });
    setSubmitError('');
    setShowModal(true);
  };

  const openEdit = (c: Class) => {
    setEditClass(c);
    setForm({ name: c.name, teacherId: c.teacherId || '', grade: String(c.grade ?? '') });
    setSubmitError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSaving(true);
    try {
      const grade = form.grade ? parseInt(form.grade, 10) : null;
      const payload = editClass
        ? { id: editClass.id, name: form.name, teacherId: form.teacherId, grade }
        : { name: form.name, teacherId: form.teacherId, grade };
      const res = await fetch('/api/admin/classes', {
        method: editClass ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        mutateClasses();
        if (expandedId) mutateExpanded();
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error || 'Thao tác thất bại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/classes?id=${confirmDeleteId}`, { method: 'DELETE' });
      if (res.ok) {
        mutateClasses();
        if (expandedId === confirmDeleteId) setExpandedId(null);
      }
    } finally {
      setConfirmDeleteId(null);
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Quản lý Lớp học</h2>
          <p className="text-outline mt-1 text-sm">{displayClasses.length} lớp</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all hover:shadow-md active:scale-[0.98]">
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm Lớp học
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Grade filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">Khối:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterGrade(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterGrade === null ? 'bg-[#326286] text-white shadow-sm' : 'bg-white hover:bg-[#326286]/5 border border-[#326286]/15 text-outline'
              }`}
            >
              Tất cả
            </button>
            {[6, 7, 8, 9].map(g => (
              <button
                key={g}
                onClick={() => setFilterGrade(filterGrade === g ? null : g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterGrade === g ? `${GRADE_COLORS[g].bg} ${GRADE_COLORS[g].text} ring-1` : 'bg-white hover:bg-[#326286]/5 border border-[#326286]/15 text-outline'
                }`}
                style={filterGrade === g ? { boxShadow: `0 0 0 1px ${GRADE_COLORS[g].text}40` } : {}}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Teacher filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">GV:</span>
          <select
            value={filterTeacher}
            onChange={e => setFilterTeacher(e.target.value)}
            className="border border-[#326286]/15 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#326286]/30 outline-none cursor-pointer"
          >
            <option value="">Tất cả</option>
            {teacherList.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Active filter count */}
        {(filterGrade !== null || filterTeacher) && (
          <button
            onClick={() => { setFilterGrade(null); setFilterTeacher(''); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-400 hover:bg-red-100 transition-all"
          >
            <span className="material-symbols-outlined text-xs">close</span>
            Xóa lọc
          </button>
        )}
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {displayClasses.length === 0 ? (
          <div className="col-span-full text-center text-outline py-16 bg-white/60 rounded-2xl border border-[#326286]/20">
            <span className="material-symbols-outlined text-5xl mb-3 block">school</span>
            <p className="font-medium">Không có lớp nào phù hợp</p>
          </div>
        ) : displayClasses.map(c => (
          <div key={c.id}
            className={`bg-white/80 backdrop-blur-md border rounded-2xl overflow-hidden transition-all hover:shadow-md cursor-pointer ${
              expandedId === c.id
                ? 'border-[#326286] ring-1 ring-[#326286]/30 shadow-md'
                : 'border-[#326286]/15 hover:border-[#326286]/30'
            }`}
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
          >
            {/* Card body */}
            <div className="p-5">
              <div className="flex items-start gap-3">
                {/* Grade badge */}
                {c.grade ? (
                  <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${GRADE_COLORS[c.grade]?.bg || 'bg-[#326286]/10'}`}>
                    <span className={`text-base font-headline font-bold leading-none ${GRADE_COLORS[c.grade]?.text || 'text-[#326286]'}`}>{c.grade}</span>
                    <span className={`text-[8px] font-bold uppercase leading-none mt-0.5 ${GRADE_COLORS[c.grade]?.text || 'text-[#326286]'}`}>khối</span>
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#326286]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">school</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-headline font-bold text-primary truncate">{c.name}</h3>
                  <p className="text-xs text-outline truncate mt-0.5">
                    {c.teacherName || '— Chưa gán GV'}
                  </p>
                  {c.inviteCode && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] font-bold text-[#C9A84C] uppercase">Mã:</span>
                      <code className="text-xs font-mono font-bold text-[#C9A84C] tracking-wider">{c.inviteCode}</code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(c.inviteCode || '').catch(() => {});
                        }}
                        title="Sao chép mã lớp"
                        className="text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">content_copy</span>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#005142]">
                      <span className="material-symbols-outlined text-xs">group</span>
                      {c.studentCount || 0} HS
                    </span>
                  </div>
                </div>

                {/* Expand */}
                <span className="material-symbols-outlined text-outline transition-transform duration-200 shrink-0 mt-1"
                  style={{ transform: expandedId === c.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>
            </div>

            {/* Actions — stop propagation */}
            <div className="px-5 pb-4 flex gap-2 border-t border-[#326286]/8 pt-3" onClick={e => e.stopPropagation()}>
              <button onClick={() => openEdit(c)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-[#326286]/5 hover:bg-[#326286]/10 text-primary transition-all">
                <span className="material-symbols-outlined text-xs">edit</span>
                Sửa
              </button>
              <button onClick={() => setConfirmDeleteId(c.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-400 transition-all">
                <span className="material-symbols-outlined text-xs">delete</span>
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded: Student Table (full width below cards) */}
      {expandedId && (
        <ClassDetailPanel
          data={expandedData}
          onRefresh={() => mutateExpanded()}
          classId={expandedId}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 pt-6 pb-0">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {editClass ? 'edit' : 'school'}
              </span>
              <h3 className="text-xl font-headline font-bold text-primary">
                {editClass ? 'Sửa Lớp học' : 'Thêm Lớp học'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 mt-2">
              {submitError && (
                <div className="p-3 bg-error-container border border-error/20 rounded-xl text-error text-sm">{submitError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Tên lớp</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-surface-container-lowest"
                  placeholder="Ví dụ: Lớp 6A1" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Khối</label>
                <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-surface-container-lowest cursor-pointer">
                  <option value="">— Chọn khối —</option>
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Giáo viên</label>
                <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-surface-container-lowest cursor-pointer">
                  <option value="">— Chọn giáo viên —</option>
                  {teacherList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 pt-6 pb-2">
              <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div>
                <h3 className="text-xl font-headline font-bold text-error">Xác nhận xóa</h3>
                <p className="text-sm text-outline">Hành động không thể hoàn tác.</p>
              </div>
            </div>
            <p className="text-sm text-on-surface px-6 pb-2 mt-1">Bạn có chắc muốn xóa lớp học này? Học sinh và bài thi trong lớp cũng sẽ bị xóa.</p>
            <div className="flex gap-3 px-6 pb-6 mt-4">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
                Hủy
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleting}
                className="flex-1 bg-error text-on-error py-2.5 rounded-xl font-semibold hover:bg-error/90 transition-colors disabled:opacity-50">
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Class Detail Panel ────────────────────────────────────────────────────────

interface ClassExpandedData {
  classInfo: {
    id: string;
    name: string;
    grade: number | null;
    inviteCode: string | null;
    teacherName: string | null;
    teacherEmail: string | null;
    examCount: number;
  };
  students: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    password_plain: string | null;
    enrollmentId: string;
    lastSubmitted: string | null;
  }[];
}

function ClassDetailPanel({ data, onRefresh, classId }: {
  data?: ClassExpandedData;
  onRefresh: () => void;
  classId: string;
}) {
  const info = data?.classInfo;
  const students: ClassExpandedData['students'] = data?.students ?? [];
  const isLoading = !data;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-[#326286] rounded-2xl overflow-hidden shadow-lg mb-8">
      {/* Class info header */}
      {isLoading ? (
        <div className="p-5 border-b border-[#326286]/10 flex gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-[#326286]/5 rounded-xl animate-pulse w-32" />
          ))}
        </div>
      ) : (
        <div className="p-5 border-b border-[#326286]/10 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Lớp</p>
            <p className="text-lg font-headline font-bold text-primary">{info?.name}</p>
          </div>
          {info?.inviteCode && (
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Mã lớp</p>
              <div className="flex items-center gap-1.5">
                <code className="font-mono font-bold text-[#C9A84C] text-base tracking-wider">{info.inviteCode}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(info?.inviteCode || '').catch(() => {})}
                  title="Sao chép mã lớp"
                  className="text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Tái tạo mã lớp? Mã cũ sẽ không còn hoạt động.')) return;
                    const res = await fetch('/api/admin/classes', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: classId, regenerateInvite: true }),
                    });
                    if (res.ok) onRefresh();
                  }}
                  title="Tái tạo mã lớp"
                  className="text-[#C9A84C]/50 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              </div>
            </div>
          )}
          {info?.grade && (
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Khối</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-bold ${GRADE_COLORS[info.grade]?.bg} ${GRADE_COLORS[info.grade]?.text}`}>
                {info.grade}
              </span>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Giáo viên</p>
            <p className="text-sm font-semibold text-on-surface">{info?.teacherName || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Bài thi</p>
            <p className="text-sm font-semibold text-on-surface">{info?.examCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Học sinh</p>
            <p className="text-sm font-semibold text-on-surface">{students.length}</p>
          </div>
        </div>
      )}

      {/* Student table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#326286]/10">
              <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">#</th>
              <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Họ tên</th>
              <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Username</th>
              <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Mật khẩu</th>
              <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Email</th>
              <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Nộp bài gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-[#326286]/5">
                  <td className="p-4"><div className="h-4 bg-[#326286]/5 rounded animate-pulse w-4" /></td>
                  <td className="p-4"><div className="h-4 bg-[#326286]/5 rounded animate-pulse w-32" /></td>
                  <td className="p-4"><div className="h-4 bg-[#326286]/5 rounded animate-pulse w-20" /></td>
                  <td className="p-4"><div className="h-4 bg-[#326286]/5 rounded animate-pulse w-16" /></td>
                  <td className="p-4"><div className="h-4 bg-[#326286]/5 rounded animate-pulse w-40" /></td>
                  <td className="p-4"><div className="h-4 bg-[#326286]/5 rounded animate-pulse w-24" /></td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-outline">Lớp chưa có học sinh nào</td>
              </tr>
            ) : students.map((s, i) => (
              <tr key={s.id} className="border-b border-[#326286]/5 hover:bg-[#326286]/4 transition-colors">
                <td className="p-4 text-outline font-mono text-xs">{i + 1}</td>
                <td className="p-4 font-semibold text-on-surface">{s.name}</td>
                <td className="p-4 font-mono text-xs text-secondary">{s.username || '—'}</td>
                <td className="p-4">
                  {s.password_plain ? (
                    <span className="font-mono text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-1 rounded-lg font-bold">{s.password_plain}</span>
                  ) : (
                    <span className="text-outline/40 text-xs italic">—</span>
                  )}
                </td>
                <td className="p-4 text-outline text-sm">{s.email}</td>
                <td className="p-4 text-outline text-xs">
                  {s.lastSubmitted ? new Date(s.lastSubmitted).toLocaleDateString('vi-VN') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
