import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import { fetcher, authFetch } from '../../lib/fetcher';
import * as XLSX from 'xlsx';
import BaseModal from '../../components/ui/BaseModal';

interface ClassRow {
  id: string;
  name: string;
  gradeLevel: number | null;
  inviteCode: string | null;
  studentCount: number;
  pendingCount: number;
  createdAt: string;
}

interface StudentRow {
  id: string;
  name: string;
  gender: string | null;
  birthdate: string | null;
  username: string;
  password_plain: string | null;
  avgScore: number | null;
  gradeLabel: string | null;
}

export default function ClassManagementPage() {
  const [activeClass, setActiveClass] = useState<ClassRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createGrade, setCreateGrade] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: { name: string; reason: string }[]; credentials: { name: string; username: string; password: string }[] } | null>(null);
  const [showCredentials, setShowCredentials] = useState<{ name: string; username: string; password: string }[] | null>(null);
  const [editStudentPw, setEditStudentPw] = useState<StudentRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassGrade, setEditClassGrade] = useState('');
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRow | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: classesData, mutate: mutateClasses } = useSWR<{ data: ClassRow[] }>('/api/teacher/classes', fetcher);
  const classes: ClassRow[] = classesData?.data ?? [];

  const { data: studentsData, mutate: mutateStudents } = useSWR<{ data: StudentRow[] }>(
    activeClass ? `/api/teacher/students?classId=${activeClass.id}` : null,
    fetcher
  );
  const students: StudentRow[] = studentsData?.data ?? [];

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const newClass: ClassRow = {
      id: tempId,
      name: createName.trim(),
      gradeLevel: createGrade ? parseInt(createGrade) : null,
      inviteCode: null,
      studentCount: 0,
      pendingCount: 0,
      createdAt: new Date().toISOString(),
    };
    // Optimistic
    await mutateClasses(
      (current: { data: ClassRow[] } | undefined) => ({
        ...current,
        data: [...(current?.data ?? []), newClass],
      }),
      false
    );
    setCreateName('');
    setCreateGrade('');
    setShowCreate(false);
    try {
      const res = await authFetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), gradeLevel: createGrade ? parseInt(createGrade) : undefined }),
      });
      if (res.ok) {
        await mutateClasses();
      }
    } catch {
      // Rollback
      await mutateClasses();
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editClassName.trim()) return;
    const res = await authFetch(`/api/teacher/classes/${editingClass.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editClassName.trim(), gradeLevel: editClassGrade ? parseInt(editClassGrade) : undefined }),
    });
    if (res.status === 404) {
      // Lớp đã bị admin xóa — đóng modal và xóa khỏi cache
      setEditingClass(null);
      await mutateClasses();
      if (activeClass?.id === editingClass.id) setActiveClass(null);
    } else if (res.ok) {
      await mutateClasses();
      setEditingClass(null);
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;
    const res = await authFetch(`/api/teacher/classes/${deletingClass.id}`, { method: 'DELETE' });
    if (res.status === 404) {
      // Lớp đã bị admin xóa — đồng bộ lại
      setDeletingClass(null);
      await mutateClasses();
      if (activeClass?.id === deletingClass.id) setActiveClass(null);
    } else if (res.ok) {
      await mutateClasses();
      if (activeClass?.id === deletingClass.id) setActiveClass(null);
      setDeletingClass(null);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    const res = await authFetch(`/api/teacher/students/${deletingStudent.id}`, { method: 'DELETE' });
    if (res.ok) {
      await mutateStudents();
      await mutateClasses();
    }
    setDeletingStudent(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClass) return;
    setImporting(true);
    setImportResult(null);

    try {
      // Read as ArrayBuffer so xlsx library can handle .xlsx / .xls / .csv
      const buffer = await file.arrayBuffer();
      const { students, skipped } = parseExcel(buffer);
      const res = await authFetch('/api/teacher/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: activeClass.id, students }),
      });
      const data = await res.json();
      setImportResult({ created: data.created ?? 0, skipped: data.skipped ?? skipped, credentials: data.credentials ?? [] });
    } catch {
      setImportResult({ created: 0, skipped: [{ name: 'Lỗi', reason: 'Không đọc được file. Đảm bảo file là .xlsx, .xls, hoặc .csv.' }], credentials: [] });
    } finally {
      setImporting(false);
      // Reset the file input so same file can be selected again
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!activeClass) return;
    // Optimistic remove
    await mutateStudents(
      (current: { data: StudentRow[] } | undefined) => ({
        ...current,
        data: (current?.data ?? []).filter(s => s.id !== studentId),
      }),
      false
    );
    try {
      const res = await authFetch(`/api/teacher/students?classId=${activeClass.id}&studentId=${studentId}`, { method: 'DELETE' });
      if (!res.ok) {
        // Rollback
        await mutateStudents();
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Xóa thất bại.');
      }
    } catch {
      await mutateStudents();
      alert('Lỗi mạng. Vui lòng thử lại.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentPw || !newPassword.trim()) return;
    if (newPassword.length < 6) { setPwError('Mật khẩu phải ít nhất 6 ký tự.'); return; }
    setPwSaving(true);
    setPwError('');
    try {
      const res = await authFetch('/api/teacher/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: editStudentPw.id, password: newPassword }),
      });
      if (res.ok) {
        setPwSuccess(newPassword);
        await mutateStudents();
      } else {
        const err = await res.json().catch(() => ({}));
        setPwError(err.error || 'Thao tác thất bại.');
      }
    } finally {
      setPwSaving(false);
    }
  };

  const gradeLabel = (score: number | null) => {
    if (score == null) return null;
    if (score < 5) return { label: 'Yếu', color: 'text-red-500' };
    if (score < 6.5) return { label: 'Trung bình', color: 'text-amber-500' };
    if (score < 8) return { label: 'Khá', color: 'text-blue-500' };
    if (score < 8.5) return { label: 'Giỏi', color: 'text-green-600' };
    return { label: 'Xuất sắc', color: 'text-emerald-600' };
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">Quản lý lớp học</span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Lớp học của tôi</h2>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md"
        >
          <span className="material-symbols-outlined">add</span>
          Thêm lớp mới
        </button>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {classes.map(c => (
          <div
            key={c.id}
            className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border transition-all hover:shadow-lg ${
              activeClass?.id === c.id
                ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                : 'border-outline-variant/20 hover:border-primary/40'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setActiveClass(c.id === activeClass?.id ? null : c)}
              >
                <h3 className="font-headline font-bold text-primary text-xl">{c.name}</h3>
                {c.gradeLevel && (
                  <span className="text-xs text-secondary font-medium">Khối {c.gradeLevel}</span>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingClass(c); setEditClassName(c.name); setEditClassGrade(c.gradeLevel ? String(c.gradeLevel) : ''); }}
                  title="Sửa lớp"
                  className="p-1.5 rounded-lg hover:bg-surface-container-high text-secondary hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingClass(c); }}
                  title="Xóa lớp"
                  className="p-1.5 rounded-lg hover:bg-surface-container-high text-secondary hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
            <div
              className="flex flex-col gap-0.5 items-end mb-3"
              onClick={() => setActiveClass(c.id === activeClass?.id ? null : c)}
            >
              {c.inviteCode && (
                <>
                  <span className="text-[9px] font-bold text-[#C9A84C] uppercase">Mã lớp</span>
                  <code className="font-mono font-bold text-[#C9A84C] text-sm tracking-wider">{c.inviteCode}</code>
                </>
              )}
            </div>
            <div className="flex gap-4 mb-3">
              <div>
                <span className="text-2xl font-bold text-primary">{c.studentCount}</span>
                <span className="text-sm text-outline ml-1">học sinh</span>
              </div>
              {c.pendingCount > 0 && (
                <div>
                  <span className="text-2xl font-bold text-tertiary">{c.pendingCount}</span>
                  <span className="text-sm text-outline ml-1">chờ chấm</span>
                </div>
              )}
            </div>
            <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all"
                style={{ width: c.studentCount > 0 ? '100%' : '0%' }} />
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">school</span>
            <p>Chưa có lớp nào. Nhấn "Thêm lớp mới" để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Class Detail Panel */}
      {activeClass && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-outline-variant/20 p-8 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-headline font-bold text-primary">{activeClass.name}</h3>
              {activeClass.gradeLevel && <p className="text-sm text-secondary">Khối {activeClass.gradeLevel}</p>}
              {activeClass.inviteCode && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#C9A84C] font-bold uppercase">Mã lớp:</span>
                  <code className="font-mono font-bold text-[#C9A84C] tracking-wider">{activeClass.inviteCode}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(activeClass.inviteCode || '').catch(() => {})}
                    title="Sao chép mã lớp"
                    className="text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold text-sm cursor-pointer hover:bg-green-100 transition-colors">
                <span className="material-symbols-outlined text-base">upload_file</span>
                Import Excel
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={() => setActiveClass(null)}
                className="px-4 py-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Import result */}
          {importResult && (
            <div className={`mb-6 p-4 rounded-xl ${importResult.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-sm mb-1">
                    {importResult.created > 0
                      ? `Đã tạo ${importResult.created} tài khoản học sinh.`
                      : 'Không tạo được tài khoản nào.'}
                  </p>
                  {importResult.skipped.length > 0 && importResult.skipped.map((s, i) => (
                    <p key={i} className="text-xs text-slate-500">
                      Bỏ qua "{s.name}": {s.reason}
                    </p>
                  ))}
                </div>
                {importResult.created > 0 && (
                  <button
                    onClick={() => setShowCredentials(importResult.credentials)}
                    className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Xem tài khoản
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Students table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Họ tên</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm TB</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map(s => {
                  const gl = gradeLabel(s.avgScore);
                  return (
                    <tr key={s.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-on-surface">{s.name}</td>
                      <td className="py-3 px-4 text-sm text-secondary font-mono">{s.username}</td>
                      <td className="py-3 px-4">
                        {s.password_plain ? (
                          <span className="font-mono text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-1 rounded-lg font-bold">{s.password_plain}</span>
                        ) : (
                          <span className="text-outline/40 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.avgScore != null ? (
                          <span className={`font-bold ${gl?.color}`}>
                            {s.avgScore.toFixed(1)}
                            {gl && <span className="text-xs font-normal ml-1">({gl.label})</span>}
                          </span>
                        ) : (
                          <span className="text-outline text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => { setEditStudentPw(s); setNewPassword(''); setPwError(''); }}
                          className="text-[#C9A84C] hover:text-[#b8973d] text-sm font-medium transition-colors mr-3"
                        >
                          Đổi mật khẩu
                        </button>
                        <button
                          onClick={() => setDeletingStudent(s)}
                          className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Chưa có học sinh nào. Import file Excel để thêm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            File Excel cần có cột: STT, Họ tên, Giới tính, Ngày sinh. Username tự tạo, mật khẩu = ngày sinh (ddMMyyyy).
          </p>
        </div>
      )}

      {/* Create Class Modal */}
      <BaseModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Thêm lớp mới"
        subtitle="Tạo lớp học mới để quản lý học sinh."
        icon="school"
        footer={
          <>
            <button type="button" onClick={() => setShowCreate(false)}
              className="flex-1 border border-outline-variant/30 py-3 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
              Hủy
            </button>
            <button type="submit" form="createClassForm"
              className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-md">
              Tạo lớp
            </button>
          </>
        }
      >
        <form id="createClassForm" onSubmit={handleCreateClass} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tên lớp *</label>
            <input
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="VD: Lớp 8A"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Khối</label>
            <select
              value={createGrade}
              onChange={e => setCreateGrade(e.target.value)}
              className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">— Chọn khối —</option>
              {[6, 7, 8, 9].map(g => (
                <option key={g} value={g}>Khối {g}</option>
              ))}
            </select>
          </div>
        </form>
      </BaseModal>

      {/* Credentials Modal */}
      {showCredentials && showCredentials.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCredentials(null)}>
          <div className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  badge
                </span>
                <div>
                  <h3 className="text-lg font-headline font-bold text-primary">Tài khoản học sinh</h3>
                  <p className="text-xs text-outline">{showCredentials.length} tài khoản — mật khẩu = ngày sinh (ddMMyyyy)</p>
                </div>
              </div>
              <button onClick={() => setShowCredentials(null)}
                className="text-outline hover:text-on-surface transition-colors p-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Credential list */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/20">
                  <tr>
                    <th className="text-left px-6 py-2 text-[10px] font-bold text-outline uppercase tracking-widest">Họ tên</th>
                    <th className="text-left px-6 py-2 text-[10px] font-bold text-outline uppercase tracking-widest">Username</th>
                    <th className="text-left px-6 py-2 text-[10px] font-bold text-outline uppercase tracking-widest">Mật khẩu</th>
                  </tr>
                </thead>
                <tbody>
                  {showCredentials.map((c, i) => (
                    <tr key={i} className="border-b border-outline-variant/10 hover:bg-surface-container-low/30">
                      <td className="px-6 py-2.5 font-medium text-on-surface">{c.name}</td>
                      <td className="px-6 py-2.5 font-mono text-xs text-secondary">{c.username}</td>
                      <td className="px-6 py-2.5">
                        <span className="font-mono text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-lg">{c.password}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 shrink-0 bg-surface-container-lowest">
              <p className="text-xs text-outline flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-tertiary">info</span>
                Gửi thông tin đăng nhập cho học sinh qua kênh phù hợp (Zalo, email...). Mật khẩu có thể đổi sau khi đăng nhập.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditingClass(null)}>
          <div className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <form onSubmit={handleEditClass}>
              <div className="flex items-center gap-2 px-6 pt-6 pb-0">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  edit
                </span>
                <h3 className="text-lg font-headline font-bold text-primary">Sửa lớp</h3>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">Tên lớp</label>
                  <input
                    type="text"
                    value={editClassName}
                    onChange={e => setEditClassName(e.target.value)}
                    className="w-full border border-outline-variant/40 rounded-xl px-4 py-2.5 text-primary bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="VD: 9/1"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">Khối</label>
                  <select
                    value={editClassGrade}
                    onChange={e => setEditClassGrade(e.target.value)}
                    className="w-full border border-outline-variant/40 rounded-xl px-4 py-2.5 text-primary bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">— Không chọn —</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(k => (
                      <option key={k} value={k}>Khối {k}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button type="button" onClick={() => setEditingClass(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/40 text-secondary font-semibold hover:bg-surface-container-high transition-colors">
                  Hủy
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-md">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Class Confirm Modal */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeletingClass(null)}>
          <div className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 pt-6 pb-0">
              <span className="material-symbols-outlined text-red-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <h3 className="text-lg font-headline font-bold text-red-500">Xóa lớp</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-primary leading-relaxed">
                Xóa lớp <strong>{deletingClass.name}</strong> sẽ xóa toàn bộ học sinh trong lớp. Hành động này <strong>không thể hoàn tác</strong>.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setDeletingClass(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/40 text-secondary font-semibold hover:bg-surface-container-high transition-colors">
                Hủy
              </button>
              <button onClick={handleDeleteClass}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-md">
                Xóa lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirm Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeletingStudent(null)}>
          <div className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 pt-6 pb-0">
              <span className="material-symbols-outlined text-red-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <h3 className="text-lg font-headline font-bold text-red-500">Xóa học sinh</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-primary leading-relaxed">
                Xóa học sinh <strong>{deletingStudent.name}</strong>. Tài khoản sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setDeletingStudent(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/40 text-secondary font-semibold hover:bg-surface-container-high transition-colors">
                Hủy
              </button>
              <button onClick={handleDeleteStudent}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-md">
                Xóa học sinh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {editStudentPw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setEditStudentPw(null); setPwSuccess(''); setNewPassword(''); }}>
          <div className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 pt-6 pb-0">
              <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                key
              </span>
              <div>
                <h3 className="text-lg font-headline font-bold text-primary">Đổi mật khẩu</h3>
                <p className="text-xs text-outline">{editStudentPw.name}</p>
              </div>
            </div>

            {pwSuccess && (
              <div className="mx-6 mt-4 p-4 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl">
                <p className="text-sm font-bold text-[#C9A84C]">Đổi thành công!</p>
                <p className="font-mono font-bold text-lg text-[#C9A84C] mt-1">{pwSuccess}</p>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="px-6 pb-6 mt-2">
              {pwError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">{pwError}</div>
              )}
              <div className="mb-4">
                <label className="block text-xs font-bold text-outline uppercase mb-1">Mật khẩu mới</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    minLength={6}
                    className="flex-1 border border-outline-variant rounded-xl px-4 py-2.5 bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    title="Tạo mật khẩu ngẫu nhiên"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
                      const pwd = Array.from({ length: 8 }, (_, i) =>
                        i === 0 ? chars[Math.floor(Math.random() * 26)] :
                        i === 4 ? chars[26 + Math.floor(Math.random() * 26)] :
                        chars[26 + Math.floor(Math.random() * (chars.length - 26))]
                      ).join('');
                      setNewPassword(pwd);
                    }}
                    className="px-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-outline shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">autorenew</span>
                  </button>
                </div>
                <p className="text-[10px] text-outline mt-1">Tối thiểu 6 ký tự</p>
              </div>
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setEditStudentPw(null); setPwSuccess(''); setNewPassword(''); }}
                  className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors">
                  Đóng
                </button>
                <button type="submit" disabled={pwSaving}
                  className="flex-1 bg-secondary text-white py-2.5 rounded-xl font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50">
                  {pwSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Parse .xlsx / .xls / .csv files using the xlsx library.
 * Columns are matched by HEADER NAME (not position), so file format is flexible.
 * Required columns: Họ tên (or Name), Giới tính (or Gender), Ngày sinh (or Birthdate)
 * Optional: Lớp (class), ghi chú
 */
function parseExcel(buffer: ArrayBuffer): { students: { name: string; gender: string; birthdate: string; username: string; password: string }[]; skipped: { name: string; reason: string }[] } {
  const results: { name: string; gender: string; birthdate: string; username: string; password: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true, cellNF: true });
    const ws = wb.Sheets[wb.SheetNames[0]];

    // Locate the actual header row (some files have school info rows before the header)
    const nameAliases = ['họ tên', 'ho ten', 'hoten', 'name', 'full name', 'họ và tên'];
    const normalize = (s: string) =>
      s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

    // Parse all rows as arrays (header:1 returns each row as an array of cell values)
    const allRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '', raw: false });

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(allRows.length, 20); i++) {
      if (allRows[i]?.some(cell => nameAliases.includes(normalize(cell)))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex < 0) {
      skipped.push({ name: 'File', reason: 'Không tìm thấy cột "Họ tên". File cần có cột: Họ tên, Giới tính, Ngày sinh.' });
      return { students: results, skipped };
    }

    const headerRow = allRows[headerRowIndex];

    // Find column indices — case-insensitive + diacritic-normalized
    const findColIdx = (aliases: string[]): number => {
      for (let i = 0; i < aliases.length; i++) {
        const normalizedAlias = normalize(aliases[i]);
        const idx = headerRow.findIndex(cell => normalize(cell) === normalizedAlias);
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const colName   = findColIdx(['họ tên', 'ho ten', 'hoten', 'name', 'full name', 'họ và tên']);
    const colGender = findColIdx(['giới tính', 'gioi tinh', 'gioitinh', 'gender', 'sex']);
    const colBirth  = findColIdx(['ngày sinh', 'ngay sinh', 'birthdate', 'birth date', 'ngày bd', 'sinh nhật']);
    const colSTT   = findColIdx(['stt', 'no', 'no.', 'số tt', 'stt.', 'no.']);

    if (colName < 0) {
      skipped.push({ name: 'File', reason: 'Không tìm thấy cột "Họ tên". File cần có cột: Họ tên, Giới tính, Ngày sinh.' });
      return { students: results, skipped };
    }

    // Data rows start right after the header row
    const dataRows = allRows.slice(headerRowIndex + 1);

    if (dataRows.length === 0) {
      skipped.push({ name: 'File', reason: 'Không tìm thấy dữ liệu học sinh.' });
      return { students: results, skipped };
    }

    // Parse each data row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rawName = String(row[colName] ?? '').trim();

      // Skip empty rows
      if (!rawName) {
        skipped.push({ name: `dòng ${i + headerRowIndex + 2}`, reason: 'Trống.' });
        continue;
      }

      const rawGender   = String(colGender >= 0 ? row[colGender] ?? '' : '').trim();
      let   rawBirthRaw = colBirth >= 0 ? row[colBirth] : null;

      // Parse birthdate string: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
      let birthdate = '';
      if (rawBirthRaw) {
        const s = String(rawBirthRaw).trim();
        const parts = s.split(/[\/\-\.]/);
        if (parts.length === 3) {
          const [p0, p1, p2] = parts;
          let year: number, month: number, day: number;
          if (p2.length === 4) {
            // dd/mm/yyyy
            [year, month, day] = [parseInt(p2), parseInt(p1) - 1, parseInt(p0)];
          } else if (p0.length === 4) {
            // yyyy/mm/dd
            [year, month, day] = [parseInt(p0), parseInt(p1) - 1, parseInt(p2)];
          } else {
            continue; // ambiguous, skip
          }
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) {
            birthdate =
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        }
      }

      // Generate username from name
      const slug = rawName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '').slice(0, 20) || `hs${i + 1}`;

      results.push({
        name: rawName,
        gender: rawGender === 'Nam' ? 'male' : rawGender === 'Nữ' ? 'female' : '',
        birthdate,
        username: slug,
        password: birthdate ? birthdate.replace(/-/g, '') : slug + '1234',
      });
    }
  } catch (err) {
    skipped.push({ name: 'File', reason: `Lỗi đọc file: ${String(err)}` });
  }

  if (results.length === 0 && skipped.length === 0) {
    skipped.push({ name: 'File', reason: 'Không tìm thấy học sinh nào trong file.' });
  }

  return { students: results, skipped };
}
