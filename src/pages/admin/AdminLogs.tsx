import { useState } from 'react';
import { formatLogTime } from '../../lib/utils';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';

const ACTIONS = ['all', 'login', 'logout', 'create_user', 'update_user', 'delete_user', 'create_class', 'update_class', 'delete_class'] as const;
type Action = typeof ACTIONS[number];

const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  all:          { label: 'Tất cả',    color: '#326286', bg: 'bg-[#326286]/10' },
  login:         { label: 'Đăng nhập', color: '#7c3aed', bg: 'bg-purple-100' },
  logout:        { label: 'Đăng xuất', color: '#6b7280', bg: 'bg-gray-100' },
  create_user:   { label: 'Tạo user',  color: '#16a34a', bg: 'bg-green-100' },
  update_user:   { label: 'Sửa user',   color: '#2563eb', bg: 'bg-blue-100' },
  delete_user:   { label: 'Xóa user',   color: '#dc2626', bg: 'bg-red-100' },
  create_class:  { label: 'Tạo lớp',    color: '#16a34a', bg: 'bg-green-100' },
  update_class:  { label: 'Sửa lớp',    color: '#2563eb', bg: 'bg-blue-100' },
  delete_class:  { label: 'Xóa lớp',    color: '#dc2626', bg: 'bg-red-100' },
};

const ROLE_META: Record<string, { bg: string; color: string }> = {
  admin:   { bg: 'bg-[#C9A84C]/20', color: '#C9A84C' },
  teacher: { bg: 'bg-[#326286]/20', color: '#326286' },
  student: { bg: 'bg-[#005142]/20', color: '#005142' },
};

export default function AdminLogsPage() {
  const [limit, setLimit] = useState(50);
  const [activeAction, setActiveAction] = useState<Action>('all');
  const { data, isLoading } = useSWR(`/api/admin/logs?limit=${limit}`, fetcher);

  const logs = (data?.logs ?? []) as {
    id: string;
    userName: string;
    userRole: string;
    action: string;
    details: string | null;
    createdAt: string;
  }[];
  const total = data?.total ?? 0;

  const filtered = activeAction === 'all'
    ? logs
    : logs.filter(l => l.action === activeAction);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#326286] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Nhật ký Hoạt động</h2>
          </div>
          <p className="text-outline mt-1 text-sm">{total} sự kiện được ghi nhận</p>
        </div>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="border border-[#326286]/20 bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#326286]/30 outline-none transition-all cursor-pointer"
        >
          <option value={20}>20 bản ghi</option>
          <option value={50}>50 bản ghi</option>
          <option value={100}>100 bản ghi</option>
        </select>
      </div>

      {/* Action Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {ACTIONS.map(action => {
          const meta = ACTION_META[action];
          const active = activeAction === action;
          return (
            <button
              key={action}
              onClick={() => setActiveAction(action)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                active
                  ? `${meta.bg} ring-1`
                  : 'bg-white/60 hover:bg-white text-outline'
              }`}
              style={active ? { color: meta.color, boxShadow: `0 0 0 1px ${meta.color}40` } : {}}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-outline py-16">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/60 rounded-2xl border border-[#326286]/20 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-3 block">history</span>
            <p className="text-outline font-medium">Chưa có nhật ký nào</p>
          </div>
        ) : filtered.map(log => {
          const meta = ACTION_META[log.action] || { label: log.action, color: '#6b7280', bg: 'bg-gray-100' };
          const roleMeta = ROLE_META[log.userRole] || { bg: 'bg-[#326286]/20', color: '#326286' };
          return (
            <div key={log.id}
              className="flex items-start gap-4 bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-5 hover:shadow-md transition-all group"
            >
              {/* Timeline dot */}
              <div className="relative shrink-0 mt-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>
                    {log.action.includes('login') ? 'login' :
                     log.action.includes('logout') ? 'logout' :
                     log.action.includes('create') ? 'add_circle' :
                     log.action.includes('delete') ? 'delete' :
                     'edit'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* User avatar */}
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={roleMeta}>
                      <span className="text-[10px] font-bold" style={{ color: roleMeta.color }}>
                        {log.userName?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{log.userName || '—'}</span>

                    {/* Action badge */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-outline font-mono whitespace-nowrap shrink-0">
                    {formatLogTime(log.createdAt)}
                  </span>
                </div>

                {/* Details */}
                {log.details && (
                  <p className="text-xs text-outline mt-1.5 pl-9">{log.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
