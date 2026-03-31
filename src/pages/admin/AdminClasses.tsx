import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { Class, User } from '../../types/api';

export default function AdminClassesPage() {
  const { data: classData, mutate: mutateClasses } = useSWR('/api/admin/classes', fetcher);
  const { data: teachersData } = useSWR('/api/admin/users', fetcher);
  const classes: Class[] = classData?.data ?? [];
  const teachers: User[] = teachersData?.data ?? [];
  const teacherList = teachers.filter(u => u.role === 'teacher');

  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [form, setForm] = useState({ name: '', teacherId: '' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCreate = () => {
    setEditClass(null);
    setForm({ name: '', teacherId: '' });
    setShowModal(true);
  };

  const openEdit = (c: Class) => {
    setEditClass(c);
    setForm({ name: c.name, teacherId: c.teacherId || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSaving(true);
    try {
      const method = editClass ? 'PUT' : 'POST';
      const body = editClass ? { ...form, id: editClass.id } : form;
      const res = await fetch('/api/admin/classes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        mutateClasses();
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
      await fetch(`/api/admin/classes?id=${confirmDeleteId}`, { method: 'DELETE' });
      mutateClasses();
      setExpandedId(null);
    } finally {
      setConfirmDeleteId(null);
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Quản lý Lớp học</h2>
          <p className="text-outline mt-1 text-sm">{classes.length} lớp học</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all hover:shadow-md active:scale-[0.98]">
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm Lớp học
        </button>
      </div>

      {/* Class Cards */}
      <div className="space-y-3">
        {classes.length === 0 ? (
          <div className="text-center text-outline py-16 bg-white/60 rounded-2xl border border-[#326286]/20">
            <span className="material-symbols-outlined text-5xl mb-3 block">school</span>
            <p className="font-medium">Chưa có lớp học nào</p>
          </div>
        ) : classes.map(c => (
          <div key={c.id} className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl overflow-hidden transition-all hover:shadow-md">
            {/* Card Header */}
            <div
              className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[#326286]/3 transition-colors"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            >
              {/* Class Avatar */}
              <div className="w-12 h-12 rounded-xl bg-[#326286]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">school</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-headline font-bold text-primary truncate">{c.name}</h3>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.studentCount > 0 ? 'bg-[#005142]/10 text-[#005142]' : 'bg-[#326286]/10 text-[#326286]'
                  }`}>
                    {c.studentCount || 0} học sinh
                  </span>
                </div>
                <p className="text-xs text-outline truncate mt-0.5">
                  {c.teacherName || '—'} {c.teacherEmail && `· ${c.teacherEmail}`}
                </p>
              </div>

              {/* Expand indicator */}
              <span className="material-symbols-outlined text-outline transition-transform duration-200 shrink-0"
                style={{ transform: expandedId === c.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(c)}
                  className="p-2 hover:bg-[#326286]/10 rounded-xl transition-colors text-primary" title="Sửa">
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button onClick={() => setConfirmDeleteId(c.id)}
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-400" title="Xóa">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>

            {/* Expanded: Student List */}
            {expandedId === c.id && (
              <div className="border-t border-[#326286]/10 bg-surface-container-lowest">
                <div className="px-5 py-3 flex items-center gap-2 border-b border-[#326286]/5">
                  <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">Danh sách học sinh</span>
                  <span className="text-xs text-outline">({c.studentCount || 0})</span>
                </div>
                {c.studentCount > 0 ? (
                  <div className="px-5 py-3 flex flex-wrap gap-2">
                    {[...Array(c.studentCount)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-[#326286]/5">
                        <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#C9A84C]">{(i + 1).toString().padStart(2, '0')}</span>
                        </div>
                        <span className="text-xs text-on-surface font-medium">
                          Học sinh #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center">
                    <span className="text-outline text-sm">Lớp chưa có học sinh nào</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-headline font-bold text-primary mb-6">
              {editClass ? 'Sửa Lớp học' : 'Thêm Lớp học'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{submitError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Tên lớp</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#326286]/30 focus:border-[#326286] outline-none transition-all"
                  placeholder="Ví dụ: Lớp 10A" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Giáo viên</label>
                <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                  className="w-full border border-[#326286]/20 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#326286]/30 focus:border-[#326286] outline-none transition-all bg-white">
                  <option value="">— Chọn giáo viên —</option>
                  {teacherList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-[#326286]/20 py-2.5 rounded-xl font-semibold hover:bg-[#326286]/5 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
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
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-headline font-bold text-red-500 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc muốn xóa lớp học này? Học sinh và bài thi trong lớp cũng sẽ bị xóa. Hành động không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-[#326286]/20 py-2.5 rounded-xl font-semibold hover:bg-[#326286]/5 transition-colors">
                Hủy
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleting}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
