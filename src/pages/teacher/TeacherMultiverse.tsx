import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';

interface MultiverseStory {
  id: string;
  studentId: string;
  studentName: string | null;
  workId: string;
  workTitle: string;
  title: string | null;
  branchPoint: string;
  content: string | null;
  moral: string | null;
  generationMethod: string;
  depth: number;
  parentId: string | null;
  createdAt: string;
}

interface ClassRow {
  id: string;
  name: string;
}

interface Work {
  id: string;
  title: string;
}

function formatTimeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}p trước`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}g trước`;
    return `${Math.floor(h / 24)}d trước`;
  } catch { return ''; }
}

function DetailModal({
  story,
  onClose,
}: {
  story: MultiverseStory;
  onClose: () => void;
}) {
  const { data: compareData } = useSWR<{ data: MultiverseStory[] }>(
    `/api/multiverse?workId=${story.workId}&studentId=${story.studentId}`,
    fetcher
  );
  const siblings = (compareData?.data ?? []).filter(s => s.id !== story.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-[fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-8 py-5 border-b border-outline-variant/20">
          <div>
            <p className="text-xs font-bold text-secondary uppercase tracking-wider">
              {story.workTitle} · {story.studentName || 'Học sinh'}
            </p>
            <h3 className="font-headline font-bold text-lg text-primary mt-0.5">
              {story.branchPoint}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-xl text-outline">close</span>
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {story.content ? (
            <div className="bg-surface-container-low rounded-xl p-5">
              <p className="font-headline text-base leading-relaxed whitespace-pre-wrap text-on-surface">
                {story.content}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 italic">Chưa có nội dung.</div>
          )}

          {story.moral && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Bài học</p>
              <p className="font-headline text-primary italic">{story.moral}</p>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-container-low rounded-xl text-xs font-bold text-slate-500">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                story.generationMethod === 'ai_full' || story.generationMethod === 'ai_branch'
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-primary/10 text-primary'
              }`}>
                {story.generationMethod === 'ai_full' ? 'AI tạo' :
                 story.generationMethod === 'ai_branch' ? 'AI nhánh' : 'Tự viết'}
              </span>
              <span>·</span>
              <span>{story.depth === 0 ? 'Nhánh gốc' : `Độ sâu ${story.depth}`}</span>
              <span>·</span>
              <span>{formatTimeAgo(story.createdAt)}</span>
            </div>
          </div>

          {siblings.length > 0 && (
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                Các nhánh khác cùng tác phẩm · {siblings.length + 1} nhánh
              </p>
              <div className="space-y-2">
                {siblings.map((s, i) => (
                  <div key={s.id} className="bg-surface-container-low rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="text-xs font-bold text-secondary">
                        Nhánh {i + 2} · {s.branchPoint.length > 40 ? s.branchPoint.slice(0, 40) + '…' : s.branchPoint}
                      </span>
                    </div>
                    {s.content ? (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {s.content.slice(0, 200)}{s.content.length > 200 ? '…' : ''}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Chưa có nội dung.</p>
                    )}
                    {s.moral && (
                      <p className="text-xs text-amber-600 italic mt-1">→ {s.moral}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherMultiversePage() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedWork, setSelectedWork] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selected, setSelected] = useState<MultiverseStory | null>(null);

  const { data: mvData, isLoading } = useSWR<{ data: MultiverseStory[] }>(
    `/api/multiverse${selectedClass ? `?classId=${selectedClass}` : ''}`,
    fetcher
  );

  const { data: classesData } = useSWR<{ data: ClassRow[] }>('/api/classes', fetcher);
  const { data: worksData } = useSWR<{ data: Work[] }>('/api/works?analysisStatus=done', fetcher);

  const classes: ClassRow[] = classesData?.data ?? [];
  const works: Work[] = worksData?.data ?? [];
  const allStories: MultiverseStory[] = mvData?.data ?? [];

  // Client-side filters
  const filtered = useMemo(() => {
    return allStories.filter(s => {
      if (selectedWork && s.workId !== selectedWork) return false;
      if (studentSearch && !(s.studentName || '').toLowerCase().includes(studentSearch.toLowerCase())) return false;
      return true;
    });
  }, [allStories, selectedWork, studentSearch]);

  // Group by student
  const byStudent = useMemo(() => {
    const map = new Map<string, MultiverseStory[]>();
    for (const s of filtered) {
      const key = s.studentId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) =>
      (a[1][0].studentName || '').localeCompare(b[1][0].studentName || '')
    );
  }, [filtered]);

  const totalCount = allStories.length;
  const studentCount = selectedClass
    ? new Set(allStories.filter(s => !selectedWork || s.workId === selectedWork).map(s => s.studentId)).size
    : new Set(allStories.map(s => s.studentId)).size;

  return (
    <div className="pt-8 px-8 pb-20 max-w-7xl mx-auto page-enter">

      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">
          Không gian sáng tạo
        </span>
        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">
          Đa vũ trụ — Xem của học sinh
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xl">
          Theo dõi các nhánh cốt truyện sáng tạo của học sinh. Học sinh tự do khám phá các góc nhìn mới cho tác phẩm văn học.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex items-center gap-2 bg-white border border-outline-variant/30 rounded-xl px-4 py-2">
          <span className="material-symbols-outlined text-secondary text-lg">school</span>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="text-sm font-medium bg-transparent outline-none cursor-pointer min-w-[140px]"
          >
            <option value="">Tất cả lớp</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-outline-variant/30 rounded-xl px-4 py-2">
          <span className="material-symbols-outlined text-secondary text-lg">menu_book</span>
          <select
            value={selectedWork}
            onChange={e => setSelectedWork(e.target.value)}
            className="text-sm font-medium bg-transparent outline-none cursor-pointer min-w-[160px]"
          >
            <option value="">Tất cả tác phẩm</option>
            {works.map(w => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-outline-variant/30 rounded-xl px-4 py-2">
          <span className="material-symbols-outlined text-secondary text-lg">search</span>
          <input
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            placeholder="Tìm học sinh..."
            className="flex-1 text-sm bg-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-white border border-outline-variant/30 rounded-xl">
          <span className="material-symbols-outlined text-secondary text-lg">person</span>
          {studentCount} học sinh
          <span className="text-slate-300">·</span>
          {totalCount} nhánh
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-5xl animate-spin">sync</span>
          <p className="mt-3 font-medium">Đang tải...</p>
        </div>
      ) : byStudent.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">auto_awesome_mosaic</span>
          <p className="font-medium">Chưa có nhánh đa vũ trụ nào.</p>
          <p className="text-sm mt-1">Học sinh sẽ tạo khi khám phá tab Đa vũ trụ.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {byStudent.map(([studentId, stories]) => {
            const studentName = stories[0].studentName || 'Học sinh';
            const initials = (studentName.split(' ').pop() || '?').charAt(0).toUpperCase();

            return (
              <div key={studentId}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-headline font-bold text-primary text-sm">
                    {initials}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-primary">{studentName}</p>
                    <p className="text-xs text-slate-400">{stories.length} nhánh</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stories.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="text-left p-5 rounded-2xl border border-outline-variant/20 bg-white hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          {s.workTitle}
                        </span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.generationMethod === 'manual'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary/10 text-secondary'
                        }`}>
                          {s.generationMethod === 'ai_full' || s.generationMethod === 'ai_branch' ? 'AI' : 'Tự viết'}
                        </span>
                      </div>

                      <p className="font-headline font-bold text-sm text-primary leading-snug mb-3 line-clamp-2">
                        {s.branchPoint}
                      </p>

                      {s.content && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                          {s.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{formatTimeAgo(s.createdAt)}</span>
                        <span>{s.depth === 0 ? 'Nhánh gốc' : `↳ Độ sâu ${s.depth}`}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <DetailModal story={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
