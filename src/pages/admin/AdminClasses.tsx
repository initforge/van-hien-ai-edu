import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { Class, User } from '../../types/api';

export default function AdminClassesPage() {
  const { data: classData, mutate: mutateClasses } = useSWR('/api/admin/classes', fetcher);
  const { data: teachersData } = useSWR('/api/admin/users', fetcher);

  const classes: Class[] = classData?.data ?? [];
  const teachers: User[] = teachersData?.data ?? [];
  const teacherList: User[] = teachers.filter(u => u.role === 'teacher');
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [form, setForm] = useState({ name: '', teacherId: '' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        setSubmitError(err.error || 'Thao tác thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/classes?id=${confirmDeleteId}`, { method: 'DELETE' });
      mutateClasses();
    } finally {
      setConfirmDeleteId(null);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Quản lý Lớp học</h2>
          <p className="text-outline mt-1 text-sm">{classes.length} lớp học</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm Lớp học
        </button>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full text-center text-outline py-12">Chưa có lớp học nào</div>
        ) : classes.map(c => (
          <div key={c.id} className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-primary" title="Sửa">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => handleDeleteRequest(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400" title="Xóa">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
            <h3 className="text-lg font-headline font-bold text-primary mb-1">{c.name}</h3>
            <p className="text-sm text-outline mb-3">
              <span className="font-semibold text-on-surface">{c.teacherName || '—'}</span>
              {c.teacherEmail && <span className="text-xs ml-1">({c.teacherEmail})</span>}
            </p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-secondary">group</span>
              <span className="text-sm font-semibold text-secondary">{c.studentCount || 0} học sinh</span>
            </div>
            <p className="text-[10px] text-outline mt-2">Tạo: {c.createdAt?.slice(0, 10)}</p>
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{submitError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Tên lớp</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Giáo viên</label>
                <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none">
                  <option value="">— Chọn giáo viên —</option>
                  {teacherList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-outline-variant/30 py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors">
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

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-headline font-bold text-red-600 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-600 mb-6">Bạn có chắc muốn xóa lớp học này? Học sinh và bài thi trong lớp cũng sẽ bị xóa. Hành động không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-outline-variant/30 py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors">
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
