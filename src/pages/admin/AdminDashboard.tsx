import React from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { AdminStats } from '../../types/api';

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR<AdminStats>('/api/admin/stats', fetcher);

  const counts = data?.counts ?? { total: 0, teachers: 0, students: 0, classes: 0, exams: 0, submissions: 0 };
  const monthlyUsers: { month: string; count: number }[] = data?.monthlyUsers ?? [];
  const monthlySubmissions: { month: string; count: number }[] = data?.monthlySubmissions ?? [];
  const topTeachers: { id: string; name: string; examCount: number }[] = data?.topTeachers ?? [];
  const roleDist: { role: string; count: number }[] = data?.roleDistribution ?? [];

  const userCount = roleDist.find(r => r.role === 'student')?.count ?? 0;
  const teacherCount = roleDist.find(r => r.role === 'teacher')?.count ?? 0;

  const months = monthlyUsers.map(m => m.month);
  const userData = monthlyUsers.map(m => m.count);
  const subData = monthlySubmissions.map(m => m.count);

  return (
    <>
      <div className="mb-10">
        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Tổng quan Hệ thống</h2>
        <p className="text-outline mt-2 font-body italic">"Quản trị là nghệ thuật làm cho mọi thứ xảy ra." — Quản trị hệ thống Văn Học AI</p>
      </div>

      {/* Stat Cards — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard label="Tổng Users" value={counts.total} icon="group" color="primary" />
        <StatCard label="Giáo viên" value={counts.teachers} icon="school" color="secondary" />
        <StatCard label="Học sinh" value={counts.students} icon="person" color="tertiary" />
        <StatCard label="Lớp học" value={counts.classes ?? 0} icon="class" color="primary" />
        <StatCard label="Bài thi" value={counts.exams ?? 0} icon="quiz" color="secondary" />
        <StatCard label="Bài nộp" value={counts.submissions ?? 0} icon="upload" color="tertiary" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* User Growth Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#326286] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
            <h3 className="text-base font-headline font-bold text-primary">Tăng trưởng Users</h3>
          </div>
          {isLoading ? (
            <div className="h-52 flex items-center justify-center text-outline">Đang tải...</div>
          ) : monthlyUsers.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-outline text-sm">Chưa có dữ liệu</div>
          ) : (
            <BarChart data={userData} labels={months} color="#326286" />
          )}
        </div>

        {/* Submissions Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#C9A84C] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
            <h3 className="text-base font-headline font-bold text-primary">Bài nộp theo Tháng</h3>
          </div>
          {isLoading ? (
            <div className="h-52 flex items-center justify-center text-outline">Đang tải...</div>
          ) : monthlySubmissions.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-outline text-sm">Chưa có dữ liệu</div>
          ) : (
            <BarChart data={subData} labels={months} color="#C9A84C" />
          )}
        </div>
      </div>

      {/* Top Teachers */}
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <h3 className="text-base font-headline font-bold text-primary">Top Giáo viên hoạt động</h3>
        </div>
        {topTeachers.length === 0 ? (
          <p className="text-outline text-sm text-center py-8">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-3">
            {topTeachers.map((t, i) => (
              <div key={t.id} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl hover:shadow-sm transition-all">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-[#C9A84C]' : i === 1 ? 'bg-[#326286]/80' : 'bg-[#326286]/50'
                }`}>
                  {i + 1}
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-base">school</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{t.name}</p>
                  <p className="text-xs text-outline">{t.examCount} bài thi</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-headline font-bold text-primary">{t.examCount}</span>
                  <p className="text-[10px] text-outline">đề</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: string; color: 'primary' | 'secondary' | 'tertiary';
}) {
  const iconColor = color === 'primary' ? '#326286' : color === 'secondary' ? '#005142' : '#C9A84C';
  const iconBg = color === 'primary' ? 'bg-[#326286]/10' : color === 'secondary' ? 'bg-[#005142]/10' : 'bg-[#C9A84C]/10';
  const textColor = color === 'primary' ? 'text-[#326286]' : color === 'secondary' ? 'text-[#005142]' : 'text-[#C9A84C]';

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="relative z-10">
        <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">{label}</span>
        <span className={`text-3xl font-headline font-bold ${textColor}`}>{value}</span>
      </div>
      <span className={`material-symbols-outlined absolute -right-3 -bottom-3 text-7xl ${iconBg} p-2 rounded-full`}
        style={{ color: iconColor, opacity: 0.12 }}>
        {icon}
      </span>
    </div>
  );
}

function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-52 mt-2">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg transition-all duration-300 hover:brightness-110"
            style={{
              height: `${Math.max((val / max) * 176, 4)}px`,
              background: color,
              opacity: 0.65 + (i / data.length) * 0.35,
            }}
          />
          <span className="text-[10px] text-outline">{labels[i]?.slice(5)}</span>
          <span className="text-xs font-bold" style={{ color }}>{val}</span>
        </div>
      ))}
    </div>
  );
}
