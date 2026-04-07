import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher, authFetch } from '../../lib/fetcher';
import type { User } from '../../types/api';

type RoleFilter = 'all' | 'teacher' | 'admin';

const ROLE_META = {
  all:     { label: 'Tất cả',     icon: 'group',          color: '#326286', bg: 'bg-[#326286]/10' },
  teacher: { label: 'Giáo viên',  icon: 'school',         color: '#005142', bg: 'bg-[#005142]/10' },
  admin:   { label: 'Quản trị',   icon: 'admin_panel_settings', color: '#6f0403', bg: 'bg-tertiary/10' },
} as const;

const ROLE_BADGE = {
  teacher: { bg: 'bg-[#005142]/10', text: 'text-[#005142]' },
  admin:   { bg: 'bg-tertiary/10',  text: 'text-tertiary' },
} as const;

export default function AdminUsersPage() {
  const { data: usersData, mutate } = useSWR('/api/admin/users', fetcher);
  const users: User[] = usersData?.data ?? [];
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', username: '', role: 'student' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const filtered = filter === 'all'
    ? users.filter(u => u.role === 'teacher' || u.role === 'admin')
    : users.filter(u => u.role === filter);
  const counts = {
    all: users.filter(u => u.role === 'teacher' || u.role === 'admin').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', username: '', role: 'student' });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, username: u.username || '', role: u.role });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSaving(true);
    try {
      const method = editUser ? 'PUT' : 'POST';
      const body = editUser ? { ...form, id: editUser.id } : form;
      const res = await authFetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        mutate();
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error || 'Thao tác thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/users?id=${confirmDeleteId}`, { method: 'DELETE' });
      if (res.ok) {
        mutate();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Xóa thất bại.');
      }
    } catch {
      alert('Lỗi mạng. Vui lòng thử lại.');
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
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Quản lý Người dùng</h2>
          <p className="text-outline mt-1 text-sm">{users.length} tài khoản trong hệ thống</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all hover:shadow-md active:scale-[0.98]">
          <span className="material-symbols-outlined text-lg">person_add</span>
          Thêm Người dùng
        </button>
      </div>

      {/* Role Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {(Object.keys(ROLE_META) as RoleFilter[]).map(role => {
          const meta = ROLE_META[role];
          const active = filter === role;
          return (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`relative flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                active
                  ? `bg-white shadow-md ring-2`
                  : 'bg-white/60 hover:bg-white hover:shadow-sm'
              }`}
              style={active ? { boxShadow: `0 0 0 2px ${meta.color}40` } : {}}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                <span className="material-symbols-outlined text-lg" style={{ color: meta.color }}>
                  {meta.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-headline font-bold" style={{ color: active ? meta.color : 'var(--color-primary, #326286)' }}>
                  {counts[role]}
                </p>
                <p className="text-xs text-outline truncate">{meta.label}</p>
              </div>
              {active && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: meta.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#326286]/10">
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Tên</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Username</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Email</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Vai trò</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Ngày tạo</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-outline">Không có người dùng</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-[#326286]/5 hover:bg-[#326286]/5 transition-colors">
                  <td className="p-4 font-semibold text-on-surface">{u.name}</td>
                  <td className="p-4 font-mono text-xs text-outline">{u.username || '—'}</td>
                  <td className="p-4 text-outline">{u.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE[u.role as keyof typeof ROLE_BADGE]?.bg} ${ROLE_BADGE[u.role as keyof typeof ROLE_BADGE]?.text}`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Giáo viên' : u.role}
                    </span>
                  </td>
                  <td className="p-4 text-outline text-xs">{u.createdAt?.slice(0, 10)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)}
                        className="p-2 hover:bg-[#326286]/10 rounded-lg transition-colors text-primary" title="Sửa">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => { setResetUser(u); setResetPassword(''); setResetError(''); }}
                        className="p-2 hover:bg-[#C9A84C]/10 rounded-lg transition-colors text-[#C9A84C]" title="Đặt lại mật khẩu">
                        <span className="material-symbols-outlined text-sm">key</span>
                      </button>
                      <button onClick={() => setConfirmDeleteId(u.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400" title="Xóa">
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
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 pt-6 pb-0">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {editUser ? 'edit' : 'person_add'}
              </span>
              <h3 className="text-xl font-headline font-bold text-primary">
                {editUser ? 'Sửa Người dùng' : 'Thêm Người dùng'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
              {submitError && (
                <div className="p-3 bg-error-container border border-error/20 rounded-xl text-error text-sm">{submitError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Họ tên</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-surface-container-lowest" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Username</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono transition-all bg-surface-container-lowest" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-surface-container-lowest" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Vai trò</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-surface-container-lowest cursor-pointer">
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Quản trị</option>
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

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setResetUser(null)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 pt-6 pb-0">
              <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
              <h3 className="text-xl font-headline font-bold text-primary">Đặt lại mật khẩu</h3>
            </div>
            <p className="text-sm text-outline px-6 mb-5">
              Đặt mật khẩu mới cho <strong>{resetUser.name}</strong>. Hãy gửi mật khẩu này cho người dùng qua kênh phù hợp (Zalo, email...).
            </p>
            {resetError && (
              <div className="mx-6 p-3 bg-error-container border border-error/20 rounded-xl text-error text-sm mb-4">{resetError}</div>
            )}
            {resetSuccess && (
              <div className="mx-6 mb-4 p-4 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#C9A84C] text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <p className="text-sm font-bold text-[#C9A84C]">Đặt lại thành công!</p>
                    <p className="text-xs text-outline mt-1">Mật khẩu mới cho <strong>{resetUser?.name}</strong>:</p>
                    <p className="font-mono font-bold text-lg text-[#C9A84C] mt-1">{resetSuccess}</p>
                    <p className="text-[10px] text-outline mt-1">Hãy gửi cho người dùng qua kênh phù hợp.</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setResetError('');
              setResetSuccess('');
              setResetting(true);
              try {
                const res = await authFetch('/api/admin/users', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: resetUser.id, password: resetPassword }),
                });
                if (res.ok) {
                  mutate();
                  setResetSuccess(resetPassword);
                  setResetPassword('');
                } else {
                  const err = await res.json().catch(() => ({}));
                  setResetError(err.error || 'Thao tác thất bại.');
                }
              } finally {
                setResetting(false);
              }
            }}>
              <div className="mb-4 px-6">
                <label className="block text-xs font-bold text-outline uppercase mb-1">Mật khẩu mới</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    placeholder="Nhập hoặc tạo mật khẩu..."
                    minLength={6}
                    className="flex-1 border border-outline-variant rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all bg-surface-container-lowest"
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
                      setResetPassword(pwd);
                    }}
                    className="px-3 py-2 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-outline shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">autorenew</span>
                  </button>
                </div>
                <p className="text-[10px] text-outline mt-1">Tối thiểu 6 ký tự. Dùng nút <span className="font-mono text-[9px] bg-surface-container-low px-1 rounded">autorenew</span> để tạo nhanh.</p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button type="button" onClick={() => { setResetUser(null); setResetSuccess(''); setResetPassword(''); }}
                  className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
                  Đóng
                </button>
                <button type="submit" disabled={resetting}
                  className="flex-1 bg-tertiary text-on-tertiary py-2.5 rounded-xl font-semibold hover:bg-tertiary/90 transition-colors disabled:opacity-50">
                  {resetting ? 'Đang lưu...' : 'Đặt lại'}
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
            <p className="text-sm text-on-surface px-6 pb-6 mt-2">Bạn có chắc muốn xóa người dùng này?</p>
            <div className="flex gap-3 px-6 pb-6">
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
