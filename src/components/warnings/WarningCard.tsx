import React from 'react';
import { useNavigate } from 'react-router-dom';

interface WarningItem {
  id: string;
  type: 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'W6' | 'W7';
  severity: 'low' | 'medium' | 'high';
  studentId?: string;
  studentName?: string;
  className?: string;
  submissionId?: string;
  examId?: string;
  message: string;
  metadata?: string;
  createdAt?: string;
}

interface WarningCardProps {
  warning: WarningItem;
  onDismiss: (warningId: string) => Promise<void>;
}

const WARNING_META: Record<string, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
  severityColor: Record<string, string>;
  actionLabel?: string;
  secondAction?: string;
}> = {
  W1: {
    icon: 'bolt',
    color: 'text-amber-600',
    bgColor: 'border-l-amber-400',
    label: 'Nộp quá nhanh',
    severityColor: { low: 'bg-amber-100 text-amber-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' },
    actionLabel: 'Xem bài',
  },
  W2: {
    icon: 'short_text',
    color: 'text-amber-600',
    bgColor: 'border-l-amber-400',
    label: 'Bài quá ngắn',
    severityColor: { low: 'bg-amber-100 text-amber-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' },
    actionLabel: 'Xem bài',
  },
  W3: {
    icon: 'repeat',
    color: 'text-tertiary',
    bgColor: 'border-l-tertiary',
    label: 'Từ lặp cao',
    severityColor: { low: 'bg-tertiary/10 text-tertiary', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' },
    actionLabel: 'Xem bài',
  },
  W4: {
    icon: 'trending_down',
    color: 'text-red-600',
    bgColor: 'border-l-red-400',
    label: 'Điểm giảm sút',
    severityColor: { low: 'bg-amber-100 text-amber-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' },
    actionLabel: 'Gửi tài liệu ôn tập',
  },
  W5: {
    icon: 'trending_up',
    color: 'text-green-600',
    bgColor: 'border-l-green-400',
    label: 'Điểm tăng đột ngột',
    severityColor: { low: 'bg-green-100 text-green-700', medium: 'bg-green-100 text-green-800', high: 'bg-green-100 text-green-900' },
  },
  W6: {
    icon: 'content_copy',
    color: 'text-tertiary',
    bgColor: 'border-l-tertiary',
    label: 'Nội dung trùng lặp',
    severityColor: { low: 'bg-tertiary/10 text-tertiary', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' },
    actionLabel: 'Xem báo cáo',
    secondAction: 'Bỏ qua',
  },
  W7: {
    icon: 'schedule',
    color: 'text-amber-600',
    bgColor: 'border-l-amber-400',
    label: 'Sắp hết hạn',
    severityColor: { low: 'bg-amber-100 text-amber-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' },
    actionLabel: 'Xem đề',
    secondAction: 'Gia hạn',
  },
};

export default function WarningCard({ warning, onDismiss }: WarningCardProps) {
  const navigate = useNavigate();
  const meta = WARNING_META[warning.type] || WARNING_META.W1;
  const [dismissing, setDismissing] = React.useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await onDismiss(warning.id);
    } finally {
      setDismissing(false);
    }
  };

  const handleAction = () => {
    if (warning.submissionId) {
      navigate(`/teacher/grading?submissionId=${warning.submissionId}`);
    } else if (warning.examId) {
      navigate(`/teacher/exam-bank?examId=${warning.examId}`);
    }
  };

  return (
    <div className={`p-4 bg-white border-l-4 ${meta.bgColor} rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-sm ${meta.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {meta.icon}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{meta.label}</span>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.severityColor[warning.severity]}`}>
          {warning.severity === 'high' ? 'Nghiêm trọng' : warning.severity === 'medium' ? 'Cảnh báo' : 'Thấp'}
        </span>
      </div>

      {(warning.studentName || warning.className) && (
        <p className="text-sm font-semibold text-on-surface mb-1">
          {warning.studentName}
          {warning.className && <span className="text-outline font-normal"> — {warning.className}</span>}
        </p>
      )}

      <p className="text-xs text-outline leading-relaxed">{warning.message}</p>

      <div className="flex gap-2 mt-3">
        {meta.actionLabel && (
          <button
            onClick={handleAction}
            className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            {meta.actionLabel}
          </button>
        )}
        {meta.secondAction && (
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="px-3 py-1.5 border border-outline-variant text-outline text-[10px] font-bold rounded uppercase tracking-wider hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            {meta.secondAction}
          </button>
        )}
        {!meta.secondAction && (
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="px-3 py-1.5 text-tertiary text-[10px] font-bold hover:underline tracking-wider transition-colors disabled:opacity-50 ml-auto"
          >
            {dismissing ? 'Đang bỏ...' : 'Bỏ qua'}
          </button>
        )}
      </div>
    </div>
  );
}
