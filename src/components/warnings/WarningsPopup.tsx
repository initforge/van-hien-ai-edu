import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import WarningCard from './WarningCard';

interface WarningItem {
  id: string;
  type: string;
  severity: string;
  studentId?: string;
  studentName?: string;
  className?: string;
  submissionId?: string;
  examId?: string;
  message: string;
  metadata?: string;
  createdAt?: string;
}

interface WarningsPopupProps {
  open: boolean;
  onClose: () => void;
}

const TABS = ['Tất cả', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6'] as const;
const TAB_LABELS: Record<string, { label: string; desc: string }> = {
  'Tất cả': { label: 'Tất cả',    desc: '' },
  W1: { label: 'Nộp nhanh',      desc: 'So sánh thời gian làm bài với số từ. Nếu tốc độ > 1.5 từ/giây → bất thường.' },
  W2: { label: 'Bài ngắn',        desc: 'Bài viết dưới 100 từ. Có thể học sinh không hiểu đề hoặc làm cẩu thả.' },
  W3: { label: 'Từ lặp',          desc: 'Đếm bigram lặp (cặp 2 từ trùng nhau). Tỷ lệ lặp > 15% → viết kém, thiếu từ vựng.' },
  W4: { label: 'Điểm giảm',       desc: 'So sánh điểm với TB 5 bài gần nhất. Giảm > 2 lần độ lệch chuẩn → cần chú ý.' },
  W5: { label: 'Điểm tăng',      desc: 'Điểm tăng bất thường. Có thể học sinh có tiến bộ thật hoặc gian lận.' },
  W6: { label: 'Trùng lặp',       desc: 'Jaccard similarity giữa 2 bài cùng lớp > 70%. Có thể copy bài nhau.' },
};

export default function WarningsPopup({ open, onClose }: WarningsPopupProps) {
  const [activeTab, setActiveTab] = useState<string>('Tất cả');
  const { data, mutate } = useSWR<{
    warnings: WarningItem[];
    counts: Record<string, number>;
    total: number;
  }>('/api/warnings', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const handleDismiss = async (warningId: string) => {
    await fetch('/api/warnings/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warningId }),
    });
    mutate();
  };

  if (!open) return null;

  const warnings = data?.warnings || [];
  const filtered = activeTab === 'Tất cả'
    ? warnings
    : warnings.filter((w: WarningItem) => w.type === activeTab);
  const counts = data?.counts || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_home</span>
            <h3 className="font-headline font-bold text-lg text-primary">Cảnh báo AI</h3>
            {data && (
              <span className="bg-tertiary/10 text-tertiary text-xs font-bold px-2 py-0.5 rounded-full">
                {data.total}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-outline">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-outline-variant/10 overflow-x-auto flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-tertiary text-white'
                  : 'bg-surface-container-low text-outline hover:text-on-surface'
              }`}
            >
              {tab === 'Tất cả' ? tab : tab}
              {tab !== 'Tất cả' && counts[tab] > 0 && (
                <span className={`text-[10px] ${activeTab === tab ? 'text-white/70' : 'text-tertiary'}`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab description */}
        {activeTab !== 'Tất cả' && TAB_LABELS[activeTab]?.desc && (
          <div className="flex items-start gap-2 px-6 py-2 bg-tertiary/5 border-b border-tertiary/20 flex-shrink-0">
            <span className="material-symbols-outlined text-tertiary text-sm mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <p className="text-xs text-tertiary leading-relaxed">{TAB_LABELS[activeTab].desc}</p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!data ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-surface-container-low rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-outline">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-30">verified</span>
              <p className="font-medium">Không có cảnh báo nào{activeTab !== 'Tất cả' ? ` (${TAB_LABELS[activeTab]})` : ''}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((w: WarningItem) => (
                <WarningCard key={w.id} warning={w as any} onDismiss={handleDismiss} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
