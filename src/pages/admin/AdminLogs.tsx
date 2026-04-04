import { useState } from 'react';
import { formatLogTime } from '../../lib/utils';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';

const ACTIONS = [
  'all', 'login', 'logout',
  'create_user', 'update_user', 'delete_user',
  'create_class', 'update_class', 'delete_class',
  'reset_password',
] as const;
type Action = typeof ACTIONS[number];

const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  all:           { label: 'Tất cả',      color: '#326286', bg: 'bg-[#326286]/10' },
  login:          { label: 'Đăng nhập',   color: '#7c3aed', bg: 'bg-purple-100' },
  logout:         { label: 'Đăng xuất',   color: '#6b7280', bg: 'bg-gray-100' },
  create_user:    { label: 'Tạo user',    color: '#16a34a', bg: 'bg-green-100' },
  update_user:    { label: 'Sửa user',    color: '#2563eb', bg: 'bg-blue-100' },
  delete_user:    { label: 'Xóa user',    color: '#dc2626', bg: 'bg-red-100' },
  create_class:   { label: 'Tạo lớp',     color: '#16a34a', bg: 'bg-green-100' },
  update_class:   { label: 'Sửa lớp',     color: '#2563eb', bg: 'bg-blue-100' },
  delete_class:   { label: 'Xóa lớp',     color: '#dc2626', bg: 'bg-red-100' },
  reset_password: { label: 'Đặt lại MK',  color: '#d97706', bg: 'bg-amber-100' },
};

const ROLE_META: Record<string, { bg: string; color: string; label: string }> = {
  admin:   { bg: 'bg-[#C9A84C]/20', color: '#C9A84C', label: 'Admin' },
  teacher: { bg: 'bg-[#326286]/20', color: '#326286', label: 'GV' },
  student: { bg: 'bg-[#005142]/20', color: '#005142', label: 'HS' },
};

const TIME_PRESETS = [
  { label: 'Hôm nay',   value: 'today' },
  { label: '7 ngày',    value: '7d' },
  { label: '30 ngày',   value: '30d' },
  { label: 'Tùy chọn',  value: 'custom' },
];

function buildUrl(params: {
  limit: number;
  action: string;
  role: string;
  startDate: string;
  endDate: string;
}) {
  const q = new URLSearchParams({ limit: String(params.limit) });
  if (params.action !== 'all') q.set('action', params.action);
  if (params.role) q.set('role', params.role);
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  return `/api/admin/logs?${q}`;
}

function getDateRange(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  switch (preset) {
    case 'today': return { startDate: toDateStr(now), endDate: toDateStr(now) };
    case '7d': {
      const s = new Date(now); s.setDate(s.getDate() - 7);
      return { startDate: toDateStr(s), endDate: toDateStr(now) };
    }
    case '30d': {
      const s = new Date(now); s.setDate(s.getDate() - 30);
      return { startDate: toDateStr(s), endDate: toDateStr(now) };
    }
    default: return { startDate: '', endDate: '' };
  }
}

export default function AdminLogsPage() {
  const [limit, setLimit] = useState(50);
  const [activeAction, setActiveAction] = useState<Action>('all');
  const [filterRole, setFilterRole] = useState('');
  const [timePreset, setTimePreset] = useState('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range = timePreset === 'custom'
    ? { startDate: customStart, endDate: customEnd }
    : getDateRange(timePreset);

  const { data, isLoading } = useSWR(
    buildUrl({ limit, action: activeAction, role: filterRole, ...range }),
    fetcher
  );

  const logs: LogEntry[] = (data?.logs ?? []) as LogEntry[];
  const total = data?.total ?? 0;

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#326286] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Nhật ký Hoạt động</h2>
          </div>
          <p className="text-outline mt-1 text-sm">{total.toLocaleString('vi-VN')} sự kiện</p>
        </div>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="border border-[#326286]/20 bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#326286]/30 outline-none cursor-pointer"
        >
          <option value={20}>20 bản ghi</option>
          <option value={50}>50 bản ghi</option>
          <option value={100}>100 bản ghi</option>
        </select>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-md border border-[#326286]/15 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end">
        {/* Role filter */}
        <div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5">Vai trò</p>
          <div className="flex gap-1.5">
            {['', 'admin', 'teacher', 'student'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterRole === r
                    ? r === 'admin' ? 'bg-[#C9A84C] text-white' : r === 'teacher' ? 'bg-[#326286] text-white' : 'bg-[#005142] text-white'
                    : 'bg-white border border-[#326286]/15 text-outline hover:bg-[#326286]/5'
                }`}
              >
                {r === '' ? 'Tất cả' : ROLE_META[r]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time filter */}
        <div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5">Thời gian</p>
          <div className="flex gap-1.5">
            {TIME_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setTimePreset(p.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timePreset === p.value
                    ? 'bg-primary text-white'
                    : 'bg-white border border-[#326286]/15 text-outline hover:bg-[#326286]/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range */}
        {timePreset === 'custom' && (
          <div className="flex gap-2 items-end">
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Từ</p>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="border border-[#326286]/15 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#326286]/30 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Đến</p>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="border border-[#326286]/15 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#326286]/30 outline-none" />
            </div>
          </div>
        )}

        {/* Action filter */}
        <div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5">Hành động</p>
          <select
            value={activeAction}
            onChange={e => setActiveAction(e.target.value as Action)}
            className="border border-[#326286]/15 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#326286]/30 outline-none cursor-pointer"
          >
            {ACTIONS.map(a => (
              <option key={a} value={a}>{a === 'all' ? '— Tất cả —' : ACTION_META[a]?.label || a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <LogSkeleton key={i} />)
        ) : logs.length === 0 ? (
          <div className="bg-white/60 rounded-2xl border border-[#326286]/20 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-3 block">history</span>
            <p className="text-outline font-medium">Không có nhật ký nào</p>
          </div>
        ) : logs.map(log => <LogItem key={log.id} log={log} />)}
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  details: string | null;
  createdAt: string;
}

function LogItem({ log }: { log: LogEntry }) {
  const meta = ACTION_META[log.action] || { label: log.action, color: '#6b7280', bg: 'bg-gray-100' };
  const roleMeta = ROLE_META[log.userRole] || { bg: 'bg-[#326286]/20', color: '#326286', label: log.userRole };

  return (
    <div className="flex items-start gap-4 bg-white/80 backdrop-blur-md border border-[#326286]/15 rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
        <span className="material-symbols-outlined text-sm" style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}>
          {log.action.includes('login') ? 'login' :
           log.action.includes('logout') ? 'logout' :
           log.action.includes('create') ? 'add_circle' :
           log.action.includes('delete') ? 'delete' :
           log.action.includes('reset') ? 'key' : 'edit'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={roleMeta}>
              <span className="text-[10px] font-bold" style={{ color: roleMeta.color }}>
                {log.userName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-sm font-semibold text-on-surface">{log.userName || '—'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: roleMeta.bg, color: roleMeta.color }}>
              {roleMeta.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <span className="text-xs text-outline font-mono whitespace-nowrap shrink-0">
            {formatLogTime(log.createdAt)}
          </span>
        </div>
        {log.details && (
          <p className="text-xs text-outline mt-1.5 pl-0">{log.details}</p>
        )}
      </div>
    </div>
  );
}

function LogSkeleton() {
  return (
    <div className="flex items-start gap-4 bg-white/60 border border-[#326286]/10 rounded-2xl p-5 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-[#326286]/5 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#326286]/5" />
          <div className="h-3.5 bg-[#326286]/5 rounded w-24" />
          <div className="h-3 bg-[#326286]/5 rounded w-16" />
          <div className="h-3 bg-[#326286]/5 rounded w-20" />
        </div>
        <div className="h-3 bg-[#326286]/5 rounded w-64" />
      </div>
    </div>
  );
}
