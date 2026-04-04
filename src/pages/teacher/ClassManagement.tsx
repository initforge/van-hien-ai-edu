import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';

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
  avgScore: number | null;
  gradeLabel: string | null;
}

export default function ClassManagementPage() {
  const [activeClass, setActiveClass] = useState<ClassRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createGrade, setCreateGrade] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: { name: string; reason: string }[] } | null>(null);
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
    const res = await fetch('/api/teacher/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: createName.trim(), gradeLevel: createGrade ? parseInt(createGrade) : undefined }),
    });
    if (res.ok) {
      setCreateName('');
      setCreateGrade('');
      setShowCreate(false);
      await mutateClasses();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClass) return;
    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const { students, skipped } = parseExcel(text);
      const res = await fetch('/api/teacher/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: activeClass.id, students }),
      });
      const data = await res.json();
      setImportResult({ created: data.created ?? 0, skipped: data.skipped ?? skipped });
      await mutateStudents();
    } catch {
      setImportResult({ created: 0, skipped: [{ name: 'Lỗi', reason: 'Không đọc được file' }] });
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!activeClass) return;
    await fetch(`/api/teacher/students?classId=${activeClass.id}&studentId=${studentId}`, { method: 'DELETE' });
    await mutateStudents();
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
            onClick={() => setActiveClass(c.id === activeClass?.id ? null : c)}
            className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border cursor-pointer transition-all hover:shadow-lg ${
              activeClass?.id === c.id
                ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                : 'border-outline-variant/20 hover:border-primary/40'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-headline font-bold text-primary text-xl">{c.name}</h3>
                {c.gradeLevel && (
                  <span className="text-xs text-secondary font-medium">Khối {c.gradeLevel}</span>
                )}
              </div>
              {c.inviteCode && (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[9px] font-bold text-[#C9A84C] uppercase">Mã lớp</span>
                  <code className="font-mono font-bold text-[#C9A84C] text-sm tracking-wider">{c.inviteCode}</code>
                </div>
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
          )}

          {/* Students table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Họ tên</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày sinh</th>
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
                      <td className="py-3 px-4 text-sm text-outline font-mono">{s.username}</td>
                      <td className="py-3 px-4 text-sm text-outline">{s.birthdate || '—'}</td>
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
                          onClick={() => handleRemoveStudent(s.id)}
                          className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                          Xóa khỏi lớp
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
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCreate(false)}>
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-headline font-bold text-primary mb-6">Thêm lớp mới</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên lớp *</label>
                <input
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  placeholder="VD: Lớp 8A"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Khối</label>
                <select
                  value={createGrade}
                  onChange={e => setCreateGrade(e.target.value)}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/30 outline-none"
                >
                  <option value="">— Chọn khối —</option>
                  {[6, 7, 8, 9].map(g => (
                    <option key={g} value={g}>Khối {g}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 border border-[#326286]/20 py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors">
                  Hủy
                </button>
                <button type="submit"
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function parseExcel(csvText: string): { students: { name: string; gender: string; birthdate: string; username: string; password: string }[]; skipped: { name: string; reason: string }[] } {
  const lines = csvText.trim().split('\n');
  const results: { name: string; gender: string; birthdate: string; username: string; password: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Split by comma, strip quotes
    const cols = lines[i].split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));
    // cols[0] = STT, cols[1] = Họ tên, cols[2] = Giới tính, cols[3] = Ngày sinh
    if (cols.length < 4) { skipped.push({ name: `dòng ${i + 1}`, reason: 'Thiếu cột' }); continue; }
    const rawName = (cols[1] || '').trim();
    const rawGender = (cols[2] || '').trim();
    const rawBirthdate = (cols[3] || '').trim();
    if (!rawName) { skipped.push({ name: `dòng ${i + 1}`, reason: 'Thiếu tên' }); continue; }

    const slug = rawName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '').slice(0, 20);

    let birthdate = '';
    if (rawBirthdate) {
      const parts = rawBirthdate.split('/');
      if (parts.length === 3) {
        birthdate = `${(parts[2] || '').trim().padStart(4, '0')}-${(parts[1] || '').trim().padStart(2, '0')}-${(parts[0] || '').trim().padStart(2, '0')}`;
      }
    }
    results.push({
      name: rawName,
      gender: rawGender === 'Nam' ? 'male' : rawGender === 'Nữ' ? 'female' : '',
      birthdate,
      username: slug,
      password: birthdate ? birthdate.replace(/-/g, '') : slug + '1234',
    });
  }
  return { students: results, skipped };
}
