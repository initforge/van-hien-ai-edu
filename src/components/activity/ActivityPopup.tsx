import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import ActivityFeed from './ActivityFeed';

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

interface ActivityPopupProps {
  open: boolean;
  onClose: () => void;
}

const TABS = ['Tất cả', 'Nộp bài', 'Chấm bài', 'Đăng đề', 'Hệ thống'] as const;

function getActionCategory(action: string): string {
  if (['submission_submitted'].includes(action)) return 'Nộp bài';
  if (['ai_grading_accepted', 'grading_returned'].includes(action)) return 'Chấm bài';
  if (['exam_published', 'ai_exam_approved'].includes(action)) return 'Đăng đề';
  if (['student_joined', 'student_registered', 'character_created', 'storyline_created'].includes(action)) return 'Hệ thống';
  return 'Hệ thống';
}

export default function ActivityPopup({ open, onClose }: ActivityPopupProps) {
  const [activeTab, setActiveTab] = useState<string>('Tất cả');
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const { data, isLoading } = useSWR<{
    activities: ActivityItem[];
    total: number;
    limit: number;
    offset: number;
  }>(
    `/api/activity?limit=${LIMIT}&offset=${page * LIMIT}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!open) return null;

  const activities = data?.activities || [];
  const filtered = activeTab === 'Tất cả'
    ? activities
    : activities.filter((a: ActivityItem) => getActionCategory(a.action) === activeTab);
  const total = data?.total || 0;
  const hasMore = (page + 1) * LIMIT < total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h3 className="font-headline font-bold text-lg text-primary">Hoạt động gần đây</h3>
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
              onClick={() => { setActiveTab(tab); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-secondary text-white'
                  : 'bg-surface-container-low text-outline hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ActivityFeed
            activities={filtered}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={() => setPage(p => p + 1)}
          />
        </div>
      </div>
    </div>
  );
}
