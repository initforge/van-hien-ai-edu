import React from 'react';

interface ActivityItem {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, string>;
  created_at: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

// Format relative time in Vietnamese
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
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

// Map action → icon + color + label
function getActionMeta(action: string, details: Record<string, string> = {}, targetType?: string) {
  const label = details?.examTitle || details?.title || details?.exam || targetType || action;

  const meta: Record<string, { icon: string; color: string; label: string; roleBadge?: string }> = {
    submission_submitted: {
      icon: 'upload_file',
      color: 'bg-tertiary/10 text-tertiary',
      label: `nộp bài "${label}"`,
    },
    exam_published: {
      icon: 'quiz',
      color: 'bg-primary/10 text-primary',
      label: `đăng đề "${label}"`,
    },
    ai_exam_approved: {
      icon: 'auto_awesome',
      color: 'bg-secondary/10 text-secondary',
      label: `duyệt đề AI "${label}"`,
    },
    ai_grading_accepted: {
      icon: 'check_circle',
      color: 'bg-secondary/10 text-secondary',
      label: `chấm AI bài của ${details?.studentName || 'học sinh'}`,
    },
    student_joined: {
      icon: 'person_add',
      color: 'bg-primary/10 text-primary',
      label: `${details?.studentName || 'học sinh'} tham gia hệ thống`,
    },
    student_registered: {
      icon: 'how_to_reg',
      color: 'bg-tertiary/10 text-tertiary',
      label: `${details?.studentName || 'học sinh'} đăng ký mới`,
    },
    grading_returned: {
      icon: 'send',
      color: 'bg-secondary/10 text-secondary',
      label: `trả bài "${label}"`,
    },
    storyline_created: {
      icon: 'auto_awesome_mosaic',
      color: 'bg-primary/10 text-primary',
      label: `tạo nhánh "${label}"`,
    },
    character_created: {
      icon: 'person',
      color: 'bg-tertiary/10 text-tertiary',
      label: `tạo nhân vật "${label}"`,
    },
    login: {
      icon: 'login',
      color: 'bg-green-100/50 text-green-700',
      label: 'đăng nhập',
    },
    logout: {
      icon: 'logout',
      color: 'bg-red-100/50 text-red-700',
      label: 'đăng xuất',
    },
    reset_password: {
      icon: 'key',
      color: 'bg-amber-100 text-amber-700',
      label: `đặt lại mật khẩu cho tài khoản`,
    },
  };

  return meta[action] || {
    icon: 'circle',
    color: 'bg-outline/10 text-outline',
    label: label,
  };
}

export default function ActivityFeed({ activities, onLoadMore, hasMore, isLoading }: ActivityFeedProps) {
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
      <div className="text-center py-12 text-outline">
        <span className="material-symbols-outlined text-4xl mb-2 opacity-40">history</span>
        <p className="text-sm">Chưa có hoạt động nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((item) => {
        const meta = getActionMeta(item.action, item.details || {}, item.target_type);
        const initials = (item.user_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-low/50 transition-colors"
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${item.user_role === 'teacher' ? 'bg-primary' : 'bg-secondary'}`}>
              {initials}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-on-surface truncate">
                    {item.user_name || 'Người dùng'}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.user_role === 'teacher' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                    {item.user_role === 'teacher' ? 'GV' : 'HS'}
                  </span>
                </div>
                <span className="text-[10px] text-outline flex-shrink-0">
                  {formatTimeAgo(item.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-5 h-5 rounded flex items-center justify-center material-symbols-outlined text-xs ${meta.color}`}>
                  {meta.icon}
                </span>
                <span className="text-xs text-outline truncate">{meta.label}</span>
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          Xem thêm hoạt động
        </button>
      )}
    </div>
  );
}
