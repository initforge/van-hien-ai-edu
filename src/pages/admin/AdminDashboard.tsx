import React from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { AdminStats } from '../../types/api';

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR<AdminStats>('/api/admin/stats', fetcher);

  const counts = data?.counts ?? { total: 0, teachers: 0, students: 0, classes: 0, exams: 0, submissions: 0 };
  const topTeachers: { id: string; name: string; examCount: number }[] = data?.topTeachers ?? [];

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[#326286] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Tổng quan Hệ thống</h2>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Tổng Users" value={counts.total} icon="group" color="primary" />
        <StatCard label="Giáo viên" value={counts.teachers} icon="school" color="secondary" />
        <StatCard label="Học sinh" value={counts.students} icon="person" color="tertiary" />
        <StatCard label="Lớp học" value={counts.classes ?? 0} icon="class" color="primary" />
        <StatCard label="Bài thi" value={counts.exams ?? 0} icon="quiz" color="secondary" />
        <StatCard label="Bài nộp" value={counts.submissions ?? 0} icon="upload" color="tertiary" />
      </div>

      {/* Top Teachers */}
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#C9A84C] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <h3 className="text-base font-headline font-bold text-primary">Top Giáo viên hoạt động</h3>
        </div>
        {isLoading ? (
          <p className="text-outline text-sm text-center py-8">Đang tải...</p>
        ) : topTeachers.length === 0 ? (
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
                <div className="w-9 h-9 rounded-full bg-[#326286]/10 flex items-center justify-center shrink-0">
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
    <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-4 relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div>
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
