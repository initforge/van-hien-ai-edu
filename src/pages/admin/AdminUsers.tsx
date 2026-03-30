import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const ROLES = ['student', 'teacher', 'admin'];

export default function AdminUsersPage() {
  const { data, mutate, error } = useSWR('/api/admin/users', fetcher);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', username: '', role: 'student' });
  const [saving, setSaving] = useState(false);

  const users = data ?? [];

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', username: '', role: 'student' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, username: u.username || '', role: u.role });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editUser ? '/api/admin/users' : '/api/admin/users';
      const method = editUser ? 'PUT' : 'POST';
      const body = editUser ? { ...form, id: editUser.id } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        mutate();
      } else {
        alert('Thao tác thất bại');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa người dùng này?')) return;
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Quản lý Người dùng</h2>
          <p className="text-outline mt-1 text-sm">{users.length} tài khoản trong hệ thống</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Thêm Người dùng
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(['teacher', 'student', 'admin'] as const).map(role => {
          const count = users.filter((u: any) => u.role === role).length;
          return (
            <div key={role} className="bg-white/60 border border-[#326286]/10 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                role === 'teacher' ? 'bg-primary/10 text-primary' :
                role === 'admin' ? 'bg-[#C9A84C]/10 text-[#C9A84C]' :
                'bg-tertiary/10 text-tertiary'
              }`}>
                <span className="material-symbols-outlined">{role === 'teacher' ? 'school' : role === 'admin' ? 'admin_panel_settings' : 'person'}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{count}</p>
                <p className="text-xs text-outline capitalize">{role === 'admin' ? 'Quản trị' : role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Tên</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Username</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Email</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Vai trò</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Ngày tạo</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-outline">Chưa có người dùng</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="border-b border-outline-variant/5 hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4 font-semibold">{u.name}</td>
                  <td className="p-4 text-outline font-mono text-xs">{u.username || '—'}</td>
                  <td className="p-4 text-outline">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-[#C9A84C]/10 text-[#C9A84C]' :
                      u.role === 'teacher' ? 'bg-primary/10 text-primary' :
                      'bg-tertiary/10 text-tertiary'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                    </span>
                  </td>
                  <td className="p-4 text-outline text-xs">{u.createdAt?.slice(0, 10)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary" title="Sửa">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400" title="Xóa">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-headline font-bold text-primary mb-6">
              {editUser ? 'Sửa Người dùng' : 'Thêm Người dùng'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Họ tên</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Username</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none font-mono" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Vai trò</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r === 'admin' ? 'Admin' : r === 'teacher' ? 'Giáo viên' : 'Học sinh'}</option>)}
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
    </>
  );
}
