import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';

interface MultiverseStory {
  id: string;
  studentId: string;
  studentName: string;
  workId: string;
  workTitle: string;
  branchPoint: string;
  content: string | null;
  moral: string | null;
  generationMethod: string;
  depth: number;
  createdAt: string;
}

interface TeacherClass {
  id: string;
  name: string;
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

export default function TeacherMultiversePage() {
  const [filterClass, setFilterClass] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [previewStory, setPreviewStory] = useState<MultiverseStory | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const apiUrl = `/api/multiverse${filterClass ? `?classId=${filterClass}${filterStudent ? `&studentId=${filterStudent}` : ''}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}` : ''}`;
  const { data: mvData, isLoading } = useSWR<{ data: MultiverseStory[] }>(apiUrl, fetcher);
  const { data: classesData } = useSWR<{ data: TeacherClass[] }>('/api/teacher/classes', fetcher);

  const storylines: MultiverseStory[] = (mvData && typeof mvData === 'object' && !('error' in mvData) && Array.isArray(mvData.data)) ? mvData.data : [];
  const classes: TeacherClass[] = (classesData && typeof classesData === 'object' && !('error' in classesData) && Array.isArray(classesData.data)) ? classesData.data : [];

  // Unique students for secondary filter
  const students = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const s of storylines) {
      if (!map.has(s.studentId)) {
        map.set(s.studentId, { id: s.studentId, name: s.studentName || 'Học sinh' });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [storylines]);

  // Group: className → studentName → stories[]
  const byClass = React.useMemo(() => {
    const map = new Map<string, Map<string, MultiverseStory[]>>();
    for (const s of storylines) {
      const cls = s.workTitle || 'Khác';
      if (!map.has(cls)) map.set(cls, new Map());
      const byStu = map.get(cls)!;
      const stuKey = s.studentName || s.studentId;
      if (!byStu.has(stuKey)) byStu.set(stuKey, []);
      byStu.get(stuKey)!.push(s);
    }
    return map;
  }, [storylines]);

  const total = storylines.length;
  const hasStories = total > 0;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2">
            Không gian sáng tạo
          </span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Đa Vũ trụ cốt truyện
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">
            Xem và review các storyline sáng tạo của học sinh.
          </p>
        </div>
        {hasStories && (
          <div className="bg-secondary/10 text-secondary px-4 py-2 rounded-xl text-sm font-bold">
            {total} storyline{total !== 1 ? '' : ''}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <div className="relative">
          <select
            value={filterClass}
            onChange={e => { setFilterClass(e.target.value); setFilterStudent(''); }}
            className="appearance-none bg-white border border-outline-variant/40 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="">Tất cả lớp</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
        </div>

        {filterClass && (
          <div className="relative">
            <select
              value={filterStudent}
              onChange={e => setFilterStudent(e.target.value)}
              className="appearance-none bg-white border border-outline-variant/40 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">Tất cả học sinh</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
          </div>
        )}
      </div>

      {/* Empty: no class selected */}
      {!filterClass && (
        <div className="text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">hub</span>
          <p className="font-headline font-bold text-lg">Chọn lớp để xem storyline</p>
          <p className="text-sm mt-2">Sử dụng bộ lọc lớp bên trên để xem storyline của học sinh.</p>
        </div>
      )}

      {/* Empty: class selected but no stories */}
      {filterClass && !isLoading && !hasStories && (
        <div className="text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">auto_awesome_mosaic</span>
          <p className="font-headline font-bold text-lg">Chưa có storyline nào</p>
          <p className="text-sm mt-2">Học sinh trong lớp này chưa tạo storyline đa vũ trụ.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && filterClass && (
        <div className="text-center py-12 text-slate-400">
          <span className="material-symbols-outlined text-4xl animate-spin mb-4 block opacity-50">progress_activity</span>
          <p className="text-sm">Đang tải storyline...</p>
        </div>
      )}

      {/* Stories — grouped by class > student */}
      {hasStories && (
        <div className="space-y-10">
          {Array.from(byClass.entries()).map(([workTitle, byStudent]) => (
            <div key={workTitle}>
              {/* Work header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-primary">{workTitle}</h3>
                  <span className="text-xs text-slate-400">
                    {Array.from(byStudent.values()).reduce((a, v) => a + v.length, 0)} storyline
                  </span>
                </div>
              </div>

              {/* Students in this work */}
              <div className="space-y-8 pl-4 border-l-2 border-primary/10">
                {Array.from(byStudent.entries()).map(([studentName, stories]) => (
                  <div key={studentName}>
                    {/* Student row */}
                    <div className="flex items-center gap-2 mb-4 pl-4">
                      <div className="w-7 h-7 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary text-xs font-bold">
                        {(studentName || 'HS').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-tertiary">{studentName}</span>
                      <span className="text-xs text-slate-400">· {stories.length} storyline</span>
                    </div>

                    {/* Storyline cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      {stories.map(s => (
                        <div
                          key={s.id}
                          className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md ${
                            expanded === s.id
                              ? 'border-primary shadow-md ring-2 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-primary/30'
                          }`}
                          onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                        >
                          {/* Card header */}
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              s.generationMethod === 'ai_full'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-surface-container-low text-slate-500'
                            }`}>
                              {s.generationMethod === 'ai_full' ? 'AI' : 'Tự viết'}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatTimeAgo(s.createdAt)}</span>
                          </div>

                          <p className="font-headline font-bold text-sm text-primary leading-snug mb-2 line-clamp-2">
                            {s.branchPoint}
                          </p>

                          {/* Expanded content */}
                          {expanded === s.id && (
                            <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-3 animate-[fadeIn_0.15s_ease-out]">
                              {s.content ? (
                                <div className="bg-surface-container-low rounded-xl p-4">
                                  <p className="text-xs text-slate-500 font-bold mb-1">Nội dung</p>
                                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{s.content}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic text-center py-4">Chưa có nội dung.</p>
                              )}

                              {s.moral && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Bài học</p>
                                  <p className="text-sm text-amber-700 italic">{s.moral}</p>
                                </div>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); setPreviewStory(s); }}
                                className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm align-middle mr-1">open_in_new</span>
                                Xem chi tiết
                              </button>
                            </div>
                          )}

                          {/* Collapse indicator */}
                          {expanded !== s.id && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">expand_more</span>
                              Xem thêm
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {previewStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPreviewStory(null)}
        >
          <div
            className="relative z-10 bg-white rounded-2xl p-8 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary text-xs font-bold">
                    {(previewStory.studentName || 'HS').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-tertiary">{previewStory.studentName}</span>
                  <span className="text-xs text-slate-400">· {previewStory.workTitle}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  previewStory.generationMethod === 'ai_full'
                    ? 'bg-secondary/10 text-secondary'
                    : 'bg-surface-container-low text-slate-500'
                }`}>
                  {previewStory.generationMethod === 'ai_full' ? 'AI tạo' : 'Tự viết'}
                </span>
              </div>
              <button onClick={() => setPreviewStory(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <h3 className="font-headline font-bold text-xl text-primary mb-4 leading-snug">
              {previewStory.branchPoint}
            </h3>

            {previewStory.content ? (
              <div className="bg-surface-container-low rounded-xl p-6 mb-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{previewStory.content}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-8">Chưa có nội dung.</p>
            )}

            {previewStory.moral && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">lightbulb</span>
                  Bài học rút ra
                </p>
                <p className="text-sm text-amber-700 italic">{previewStory.moral}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-between items-center text-xs text-slate-400">
              <span>{formatTimeAgo(previewStory.createdAt)}</span>
              <span>{previewStory.depth === 0 ? 'Nhánh gốc' : `Độ sâu ${previewStory.depth}`}</span>
            </div>
          </div>
        </div>
      )}
      {/* Pagination */}
      {hasStories && (
        <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-outline-variant/20">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center disabled:opacity-40 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="text-sm font-medium text-slate-500">
            Trang {page + 1}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={storylines.length < PAGE_SIZE}
            className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center disabled:opacity-40 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
