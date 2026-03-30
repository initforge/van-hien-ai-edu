import { useState } from 'react';
import { formatLogTime } from '../../lib/utils';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';


const ACTION_COLORS: Record<string, string> = {
  create_user: 'bg-green-50 text-green-600',
  update_user: 'bg-blue-50 text-blue-600',
  delete_user: 'bg-red-50 text-red-500',
  create_class: 'bg-green-50 text-green-600',
  update_class: 'bg-blue-50 text-blue-600',
  delete_class: 'bg-red-50 text-red-500',
  login: 'bg-purple-50 text-purple-600',
  logout: 'bg-gray-50 text-gray-500',
};

const ACTION_LABELS: Record<string, string> = {
  create_user: 'Tạo user',
  update_user: 'Sửa user',
  delete_user: 'Xóa user',
  create_class: 'Tạo lớp',
  update_class: 'Sửa lớp',
  delete_class: 'Xóa lớp',
  login: 'Đăng nhập',
  logout: 'Đăng xuất',
};

export default function AdminLogsPage() {
  const [limit, setLimit] = useState(50);
  const { data, isLoading } = useSWR(`/api/admin/logs?limit=${limit}`, fetcher);

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <div className="mb-8">
        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Nhật ký Hoạt động</h2>
        <p className="text-outline mt-1 text-sm">{total} sự kiện được ghi nhận</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm text-outline">Hiển thị:</label>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="border border-outline-variant/30 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value={20}>20 bản ghi</option>
          <option value={50}>50 bản ghi</option>
          <option value={100}>100 bản ghi</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Thời gian</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Người dùng</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Hành động</th>
                <th className="text-left p-4 text-[10px] font-bold text-outline uppercase tracking-widest">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-outline">Đang tải...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-outline">Chưa có nhật ký</td></tr>
              ) : logs.map((log: { id: string; user_name: string; user_role: string; userName?: string; userRole?: string; action: string; details: string | null; createdAt: string }) => (
                <tr key={log.id} className="border-b border-outline-variant/5 hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4 text-xs text-outline font-mono whitespace-nowrap">
                    {formatLogTime(log.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        log.userRole === 'admin' ? 'bg-[#C9A84C]' :
                        log.userRole === 'teacher' ? 'bg-primary' : 'bg-tertiary'
                      }`}>
                        {log.userName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{log.userName || '—'}</p>
                        <p className="text-[10px] text-outline capitalize">{log.userRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ACTION_COLORS[log.action] || 'bg-gray-50 text-gray-500'
                    }`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-outline max-w-xs truncate" title={log.details ?? undefined}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
