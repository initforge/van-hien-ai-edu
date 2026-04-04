import React from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { TeacherStats } from '../../types/api';
import ActivityPopup from '../../components/activity/ActivityPopup';
import WarningsPopup from '../../components/warnings/WarningsPopup';

export default function TeacherDashboardPage() {
  const { data } = useSWR<TeacherStats>('/api/stats', fetcher);
  const stats = data ?? {
    studentCount: 0, pendingGrading: 0, totalExams: 0,
    upcomingExams: [], recentResults: [],
  };

  const [showActivity, setShowActivity] = React.useState(false);
  const [showWarnings, setShowWarnings] = React.useState(false);

  return (
    <>
      <div className="mb-10">
        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Tổng quan</h2>
        <p className="text-outline mt-2 font-body italic">"Văn chương luyện cho ta những tình cảm ta không có, luyện cho ta những mối dây liên lạc ta chưa hề biết." — Hoài Thanh</p>
      </div>

      {/* ROW 1: Stat Cards (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Sĩ số */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-white/90 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style={{ animation: "fadeIn 0.5s ease-out 0.1s both" }}>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] block mb-4">Sĩ số</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-primary">{stats.studentCount}</span>
              <span className="text-outline text-sm">học sinh</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">groups</span>
        </div>

        {/* Card 2: Bài chờ chấm */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-white/90 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style={{ animation: "fadeIn 0.5s ease-out 0.2s both" }}>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Bài chờ chấm</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stats.pendingGrading > 0 ? 'bg-tertiary/10 text-tertiary' : 'bg-green-100 text-green-700'}`}>
                {stats.pendingGrading > 0 ? `${stats.pendingGrading} MỚI` : 'HOÀN THÀNH'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-primary">{stats.pendingGrading}</span>
              <span className="text-outline text-sm">bài nộp</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">history_edu</span>
        </div>

        {/* Card 3: Đề đã tạo */}
        <div className="bg-white/80 backdrop-blur-md border border-[#326286]/20 p-6 rounded-2xl relative overflow-hidden group hover:bg-white/90 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" style={{ animation: "fadeIn 0.5s ease-out 0.3s both" }}>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] block mb-4">Đề đã tạo</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-primary">{stats.totalExams}</span>
              <span className="text-outline text-sm">đề thi</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/5 group-hover:text-primary/10 transition-colors">quiz</span>
        </div>
      </div>

      {/* Class Drill-down */}
      <ClassDrillDown />

      {/* ROW 2: Activity + Warnings (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Hoạt động gần đây */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-headline font-bold text-primary">Hoạt động gần đây</h3>
            <button
              onClick={() => setShowActivity(true)}
              className="text-xs font-bold text-secondary hover:underline tracking-widest uppercase"
            >
              Xem tất cả
            </button>
          </div>
          <ActivityFeedMini />
        </div>

        {/* Right: Cảnh báo AI */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-headline font-bold text-primary">Cảnh báo AI</h3>
            <button
              onClick={() => setShowWarnings(true)}
              className="text-xs font-bold text-tertiary hover:underline tracking-widest uppercase"
            >
              Xem tất cả
            </button>
          </div>
          <WarningsFeedMini onViewAll={() => setShowWarnings(true)} />
        </div>
      </div>

      {/* Popups */}
      <ActivityPopup open={showActivity} onClose={() => setShowActivity(false)} />
      <WarningsPopup open={showWarnings} onClose={() => setShowWarnings(false)} />
    </>
  );
}

function ClassDrillDown() {
  const [selected, setSelected] = React.useState<{ id: string; name: string; avgScore: number | null } | null>(null);
  const { data, isLoading } = useSWR<{ data: { id: string; name: string; avgScore: number | null }[] }>('/api/teacher/classes', fetcher);
  const classes = data?.data ?? [];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))
        ) : classes.map(cls => (
          <button
            key={cls.id}
            onClick={() => setSelected(selected?.id === cls.id ? null : cls)}
            className={`text-left p-5 rounded-2xl border transition-all ${
              selected?.id === cls.id
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white border-outline-variant/20 hover:border-primary/40 hover:shadow-md'
            }`}
          >
            <p className={`font-headline font-bold ${selected?.id === cls.id ? 'text-white' : 'text-primary'}`}>
              {cls.name}
            </p>
            <p className={`text-sm mt-1 ${selected?.id === cls.id ? 'text-white/70' : 'text-slate-400'}`}>
              TB {cls.avgScore != null ? cls.avgScore.toFixed(1) : '—'} / 10
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <ClassStudentList classId={selected.id} className={selected.name} />
      )}
    </div>
  );
}

function ClassStudentList({ classId, className }: { classId: string; className: string }) {
  const { data, isLoading } = useSWR<{ data: any[] }>(
    `/api/teacher/students?classId=${classId}`, fetcher
  );
  const students = data?.data ?? [];

  const gl = (score: number | null) =>
    score == null ? null :
    score < 5 ? { label: 'Yếu', color: 'text-red-500' } :
    score < 6.5 ? { label: 'TB', color: 'text-amber-500' } :
    score < 8 ? { label: 'Khá', color: 'text-blue-500' } :
    score < 8.5 ? { label: 'Giỏi', color: 'text-green-600' } :
    { label: 'XS', color: 'text-purple-600' };

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 mb-8 animate-[fadeIn_0.2s_ease-out]">
      <p className="font-headline font-bold text-primary mb-4">Học sinh lớp {className}</p>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}</div>
      ) : students.length === 0 ? (
        <p className="text-slate-400 text-sm py-6 text-center">Chưa có học sinh nào trong lớp này.</p>
      ) : (
        students.map(s => {
          const g = gl(s.avgScore ?? null);
          return (
            <div key={s.id} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
              <div>
                <p className="text-sm font-semibold text-primary">{s.name}</p>
                <p className="text-xs text-slate-400">{s.username}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400">{s.submissionCount ?? 0} bài</span>
                {g && (
                  <span className={`font-bold ${g.color}`}>
                    {s.avgScore?.toFixed(1)} ({g.label})
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Mini components (embedded, no extra files) ────────────────────────────────

// ─── Warnings Feed Mini ───────────────────────────────────────────────────────────

interface MiniWarning {
  id: string;
  type: string;
  severity: string;
  studentName?: string;
  className?: string;
  message: string;
  createdAt?: string;
}

const MINI_WARNING_META: Record<string, { icon: string; color: string; label: string; desc: string }> = {
  W1: { icon: 'bolt',          color: 'text-amber-600', label: 'Nộp nhanh',   desc: 'Tốc độ làm bài quá nhanh so với số từ' },
  W2: { icon: 'short_text',    color: 'text-amber-600', label: 'Bài ngắn',     desc: 'Số từ bài viết dưới 100 từ' },
  W3: { icon: 'repeat',        color: 'text-tertiary',   label: 'Từ lặp',       desc: 'Từ ngữ lặp lại nhiều lần trong bài' },
  W4: { icon: 'trending_down', color: 'text-red-600',   label: 'Điểm giảm',   desc: 'Điểm thấp hơn đáng kể so với 5 bài gần nhất' },
  W5: { icon: 'trending_up',  color: 'text-green-600', label: 'Điểm tăng',  desc: 'Điểm cao bất thường so với lịch sử' },
  W6: { icon: 'content_copy',  color: 'text-tertiary',   label: 'Trùng lặp',   desc: 'Nội dung trùng lặp với bạn cùng lớp' },
  W7: { icon: 'schedule',      color: 'text-amber-600', label: 'Hết hạn',     desc: 'Bài nộp gần đến hạn hoặc đã quá hạn' },
};

const SEV_COLOR: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-600',
  low: 'text-secondary',
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return 'Hôm qua';
  return `${diffDay} ngày trước`;
}

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  submission_submitted: { icon: 'upload_file', color: 'bg-tertiary/10 text-tertiary', label: 'nộp bài' },
  exam_published: { icon: 'quiz', color: 'bg-primary/10 text-primary', label: 'đăng đề' },
  ai_exam_approved: { icon: 'auto_awesome', color: 'bg-secondary/10 text-secondary', label: 'duyệt đề AI' },
  ai_grading_accepted: { icon: 'check_circle', color: 'bg-secondary/10 text-secondary', label: 'chấm AI' },
  student_joined: { icon: 'person_add', color: 'bg-primary/10 text-primary', label: 'HS tham gia' },
  student_registered: { icon: 'how_to_reg', color: 'bg-tertiary/10 text-tertiary', label: 'HS đăng ký' },
  grading_returned: { icon: 'send', color: 'bg-secondary/10 text-secondary', label: 'trả bài' },
  storyline_created: { icon: 'auto_awesome_mosaic', color: 'bg-primary/10 text-primary', label: 'tạo nhánh' },
};

function ActivityFeedMini() {
  const { data, isLoading } = useSWR('/api/activity?limit=3', fetcher, { revalidateOnFocus: false });
  const activities = data?.activities ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-surface-container-low" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-container-low rounded w-3/4" />
              <div className="h-3 bg-surface-container-low rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="p-8 text-center text-outline rounded-xl border border-dashed border-outline-variant/30">
        <span className="material-symbols-outlined text-4xl mb-2 opacity-30">history</span>
        <p className="text-sm">Chưa có hoạt động nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((item: { id: string; user_name: string; user_role: string; action: string; target_type?: string; details?: Record<string, string>; created_at: string }) => {
        const meta = ACTION_META[item.action] || { icon: 'circle', color: 'bg-outline/10 text-outline', label: item.action };
        const initials = (item.user_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        const label = item.details?.examTitle || item.details?.title || item.target_type || '';
        return (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low/50 transition-colors">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${item.user_role === 'teacher' ? 'bg-primary' : 'bg-secondary'}`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded flex items-center justify-center material-symbols-outlined text-xs ${meta.color}`}>
                  {meta.icon}
                </span>
                <span className="text-sm font-medium text-on-surface truncate">
                  {item.user_name}
                </span>
                <span className="text-xs text-outline">·</span>
                <span className="text-xs text-secondary">{meta.label}</span>
                {label && <><span className="text-xs text-outline">·</span><span className="text-xs text-outline truncate">{label}</span></>}
              </div>
            </div>
            <span className="text-[10px] text-outline flex-shrink-0">{formatTimeAgo(item.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Warnings Feed Mini ───────────────────────────────────────────────────────────

function WarningsFeedMini({ onViewAll }: { onViewAll: () => void }) {
  const { data, isLoading } = useSWR<{
    warnings: MiniWarning[];
    counts: Record<string, number>;
  }>('/api/warnings', fetcher, { revalidateOnFocus: false });

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/15 rounded-2xl divide-y divide-outline-variant/10 overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-[#326286]/5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-[#326286]/5 rounded w-3/4" />
              <div className="h-3 bg-[#326286]/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const warnings = data?.warnings ?? [];
  const top = warnings.slice(0, 5);
  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0) as number;

  if (warnings.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-[#326286]/15 rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-secondary mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
        <p className="text-sm font-semibold text-secondary">Không có cảnh báo nào</p>
        <p className="text-xs text-outline mt-1">Hệ thống AI hoạt động bình thường.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[#326286]/15 rounded-2xl overflow-hidden">
      {/* Summary bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-tertiary/5 border-b border-[#326286]/10">
        <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Tổng: {total} cảnh báo</span>
        <div className="flex gap-2 ml-auto flex-wrap">
          {(['W1', 'W2', 'W3', 'W4', 'W5', 'W6'] as const).map(w => counts[w] > 0 && (
            <span key={w} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary" title={MINI_WARNING_META[w]?.desc}>
              {MINI_WARNING_META[w]?.label} {counts[w]}
            </span>
          ))}
        </div>
      </div>

      {/* Warning list */}
      <div className="divide-y divide-outline-variant/10">
        {top.map((w: MiniWarning) => {
          const meta = MINI_WARNING_META[w.type] || { icon: 'warning', color: 'text-amber-600', label: w.type, desc: '' };
          return (
            <div key={w.id} className="flex items-start gap-3 p-3 hover:bg-[#326286]/4 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${w.severity === 'high' ? 'bg-red-50' : 'bg-amber-50'}`}>
                <span className={`material-symbols-outlined text-sm ${meta.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {meta.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black font-mono px-1 py-0.5 rounded bg-tertiary/10 text-tertiary">{w.type}</span>
                  <span className={`text-[10px] font-bold uppercase ${SEV_COLOR[w.severity] || SEV_COLOR.medium}`}>
                    {meta.label}
                  </span>
                  {w.studentName && (
                    <>
                      <span className="text-[10px] text-outline">·</span>
                      <span className="text-[10px] font-semibold text-on-surface truncate">{w.studentName}</span>
                    </>
                  )}
                  {w.className && (
                    <span className="text-[10px] text-outline">({w.className})</span>
                  )}
                </div>
                <p className="text-[10px] text-tertiary mt-0.5 italic">{meta.desc}</p>
                <p className="text-xs text-outline leading-snug line-clamp-1 mt-0.5">{w.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* View all */}
      {warnings.length > 5 && (
        <button
          onClick={onViewAll}
          className="w-full px-4 py-3 text-xs font-bold text-tertiary hover:bg-tertiary/5 border-t border-[#326286]/10 transition-colors flex items-center justify-center gap-1"
        >
          Xem thêm {warnings.length - 5} cảnh báo
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
