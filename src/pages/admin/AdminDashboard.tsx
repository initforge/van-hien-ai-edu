import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR('/api/admin/stats', fetcher);

  const counts = data?.counts || {
    total: 0, teachers: 0, students: 0,
    classes: 0, exams: 0, submissions: 0
  };
  const monthlyUsers = data?.monthlyUsers || [];
  const monthlySubmissions = data?.monthlySubmissions || [];
  const topTeachers = data?.topTeachers || [];

  // Build chart data
  const months = monthlyUsers.map((m: any) => m.month);
  const userData = monthlyUsers.map((m: any) => m.count);
  const subData = monthlySubmissions.map((m: any) => m.count);

  return (
    <>
      <div className="mb-10">
        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Tổng quan Hệ thống</h2>
        <p className="text-outline mt-2 font-body italic">"Quản trị là nghệ thuật làm cho mọi thứ xảy ra." — Quản trị hệ thống Văn Học AI</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard label="Tổng Users" value={counts.total} icon="group" color="primary" />
        <StatCard label="Giáo viên" value={counts.teachers} icon="school" color="secondary" />
        <StatCard label="Học sinh" value={counts.students} icon="person" color="tertiary" />
        <StatCard label="Lớp học" value={counts.classes} icon="class" color="primary" />
        <StatCard label="Bài thi" value={counts.exams} icon="quiz" color="secondary" />
        <StatCard label="Bài nộp" value={counts.submissions} icon="upload" color="tertiary" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* User Growth Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6">
          <h3 className="text-lg font-headline font-bold text-primary mb-4">Tăng trưởng Users</h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-outline">Đang tải...</div>
          ) : (
            <BarChart data={userData} labels={months} color="#326286" />
          )}
        </div>

        {/* Submissions Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6">
          <h3 className="text-lg font-headline font-bold text-primary mb-4">Bài nộp theo Tháng</h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-outline">Đang tải...</div>
          ) : (
            <BarChart data={subData} labels={months} color="#C9A84C" />
          )}
        </div>
      </div>

      {/* Top Teachers */}
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-6">
        <h3 className="text-lg font-headline font-bold text-primary mb-4">Top Giáo viên hoạt động</h3>
        {topTeachers.length === 0 ? (
          <p className="text-outline text-sm">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-3">
            {topTeachers.map((t: any, i: number) => (
              <div key={t.id} className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  i === 0 ? 'bg-[#C9A84C]' : i === 1 ? 'bg-[#326286]/70' : 'bg-[#326286]/40'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-outline">{t.examCount} bài thi</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{t.examCount}</span>
                  <span className="text-xs text-outline ml-1">đề</span>
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
  const colorMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
  };
  const bgMap = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    tertiary: 'bg-tertiary/10',
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg transition-all">
      <div className="relative z-10">
        <span className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">{label}</span>
        <span className="text-3xl font-headline font-bold text-primary">{value}</span>
      </div>
      <span className={`material-symbols-outlined absolute -right-3 -bottom-3 text-7xl ${bgMap[color]} p-2 rounded-full`}
        style={{ color: color === 'primary' ? '#326286' : color === 'secondary' ? '#326286' : '#C9A84C', opacity: 0.15 }}>
        {icon}
      </span>
    </div>
  );
}

// Simple bar chart using CSS
function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg transition-all hover:opacity-80"
            style={{
              height: `${Math.max((val / max) * 160, 4)}px`,
              background: color,
              opacity: 0.7 + (i / data.length) * 0.3,
            }}
          />
          <span className="text-[10px] text-outline">{labels[i]?.slice(5)}</span>
          <span className="text-xs font-bold" style={{ color }}>{val}</span>
        </div>
      ))}
    </div>
  );
}
