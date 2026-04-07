import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import { useAuth } from '../../contexts/AuthContext';

const GRADE_CONFIG = [
  { label: 'Yếu',        min: 0,    max: 5,    color: '#ef4444' },
  { label: 'Trung bình', min: 5,    max: 6.5,  color: '#f59e0b' },
  { label: 'Khá',        min: 6.5,  max: 8,    color: '#3b82f6' },
  { label: 'Giỏi',       min: 8,    max: 8.5,  color: '#22c55e' },
  { label: 'Xuất sắc',   min: 8.5,  max: 11,   color: '#7c3aed' },
];

function getGradeColor(avg: number | null) {
  if (avg == null) return null;
  return GRADE_CONFIG.find(g => avg >= g.min && avg < g.max) ?? GRADE_CONFIG[GRADE_CONFIG.length - 1];
}

function formatDate(str: string) {
  try {
    const d = new Date(str);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  } catch { return str || '—'; }
}

interface ScoreHistoryRow {
  id: string;
  examTitle: string;
  type: string;
  aiScore: number | null;
  teacherScore: number | null;
  teacherComment: string | null;
  submittedAt: string;
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data, isLoading } = useSWR<{
    studentId: string;
    avgScore: number | null;
    gradeLabel: string;
    skillData: Record<string, number>;
    scoreHistory: ScoreHistoryRow[];
  }>('/api/profile', fetcher);

  const avg = data?.avgScore ?? null;
  const gradeColor = getGradeColor(avg);
  const skillData = data?.skillData ?? {};
  const history: ScoreHistoryRow[] = data?.scoreHistory ?? [];
  const criteria = Object.keys(skillData);
  const maxSkill = 10;

  // Build radar chart SVG path
  const radarW = 300, radarH = 300, radarCx = 150, radarCy = 150, radarR = 100;
  const angleStep = criteria.length > 0 ? (2 * Math.PI / Math.max(criteria.length, 3)) : 0;

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const axisLines = criteria.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x2: radarCx + radarR * Math.cos(angle),
      y2: radarCy + radarR * Math.sin(angle),
    };
  });

  const dataPoints = criteria.map((key, i) => {
    const val = skillData[key] ?? 0;
    const angle = angleStep * i - Math.PI / 2;
    const r = (val / maxSkill) * radarR;
    return {
      x: radarCx + r * Math.cos(angle),
      y: radarCy + r * Math.sin(angle),
    };
  });

  const polyPath = dataPoints.length >= 3
    ? dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
    : '';

  return (
    <div className="pt-8 px-10 pb-20 max-w-5xl mx-auto page-enter">
      {/* Header */}
      <section className="mb-12">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-3">
          Hồ sơ của tôi
        </span>
        <div className="flex items-center gap-6">
          <div>
            <h1 className="font-headline text-4xl font-bold text-primary tracking-tight">
              {user?.name || 'Học sinh'}
            </h1>
            {avg != null ? (
              <div className="flex items-center gap-3 mt-3">
                <span
                  className="text-2xl font-headline font-bold"
                  style={{ color: gradeColor?.color }}
                >
                  {avg.toFixed(1)}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold text-white"
                  style={{ background: gradeColor?.color }}
                >
                  {gradeColor?.label}
                </span>
              </div>
            ) : (
              <p className="text-slate-400 mt-2 text-sm">Chưa có điểm nào.</p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Bản đồ Kỹ năng */}
        <section className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/15">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-xl font-bold text-primary">Bản đồ Kỹ năng</h2>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
          ) : criteria.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-30">radar</span>
              <p className="text-sm">Chưa có dữ liệu kỹ năng.<br/>Hãy nộp bài để AI phân tích.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg width={radarW} height={radarH} viewBox={`0 0 ${radarW} ${radarH}`}>
                {/* Grid rings */}
                {gridLevels.map(level => (
                  <polygon
                    key={level}
                    points={criteria.map((_, i) => {
                      const angle = angleStep * i - Math.PI / 2;
                      return `${radarCx + radarR * level * Math.cos(angle)},${radarCy + radarR * level * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                ))}
                {/* Axes */}
                {axisLines.map((line, i) => (
                  <line key={i} x1={radarCx} y1={radarCy} x2={line.x2} y2={line.y2} stroke="#e2e8f0" strokeWidth="1" />
                ))}
                {/* Data polygon */}
                {dataPoints.length >= 3 && (
                  <polygon
                    points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="#326286"
                    fillOpacity="0.15"
                    stroke="#326286"
                    strokeWidth="2"
                  />
                )}
                {/* Data dots */}
                {dataPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="#326286" />
                ))}
                {/* Labels */}
                {criteria.map((key, i) => {
                  const angle = angleStep * i - Math.PI / 2;
                  const lx = radarCx + (radarR + 22) * Math.cos(angle);
                  const ly = radarCy + (radarR + 22) * Math.sin(angle);
                  const val = skillData[key] ?? 0;
                  return (
                    <text key={key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                      fontSize="11" fill="#475569" fontWeight="600" fontFamily="inherit">
                      {key.length > 12 ? key.slice(0, 11) + '…' : key}
                    </text>
                  );
                })}
              </svg>

              {/* Criteria list */}
              <div className="w-full mt-4 space-y-2">
                {criteria.map(key => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">{key}</span>
                    <span className="text-sm font-bold text-primary">
                      {skillData[key]?.toFixed(1)} / {maxSkill}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right: Lịch sử điểm */}
        <section className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/15">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-xl font-bold text-primary">Lịch sử điểm số</h2>
            <button
              onClick={() => setHistoryOpen(true)}
              className="text-xs font-bold text-secondary hover:underline uppercase tracking-wider"
            >
              Soi lại lịch sử
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">history</span>
              <p className="text-sm">Chưa có bài nộp nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map(row => {
                const score = row.teacherScore ?? row.aiScore;
                const gc = getGradeColor(score ?? null);
                return (
                  <div key={row.id} className="p-4 bg-surface-container-low rounded-xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-primary leading-tight">{row.examTitle}</span>
                      <span className="text-lg font-headline font-bold" style={{ color: gc?.color }}>
                        {score != null ? score.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-400">{formatDate(row.submittedAt)}</span>
                      <span className="text-[11px] font-medium" style={{ color: gc?.color }}>
                        {gc?.label}
                      </span>
                    </div>
                    {row.teacherComment && (
                      <p className="text-xs text-slate-500 mt-1 italic line-clamp-2">{row.teacherComment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* History Timeline Modal */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-8 py-5 border-b border-outline-variant/20">
              <h3 className="font-headline text-xl font-bold text-primary">Lịch sử điểm số</h3>
              <button onClick={() => setHistoryOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-slate-400 py-12">Chưa có bài nộp nào.</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-outline-variant/30" />
                  {history.map((row, i) => {
                    const score = row.teacherScore ?? row.aiScore;
                    const gc = getGradeColor(score ?? null);
                    return (
                      <div key={row.id} className="relative pl-12 pb-6">
                        <div
                          className="absolute left-2.5 w-5 h-5 rounded-full border-2 border-white shadow"
                          style={{ background: gc?.color || '#94a3b8', top: '4px' }}
                        />
                        <div className="bg-surface-container-low rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-primary text-sm">{row.examTitle}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {formatDate(row.submittedAt)} · {row.type === 'exam' ? 'Đề thi' : 'Bài tập'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-headline font-bold" style={{ color: gc?.color }}>
                                {score != null ? score.toFixed(1) : '—'}
                              </span>
                              {row.teacherScore != null && row.aiScore != null && (
                                <p className="text-[10px] text-slate-400">
                                  AI: {row.aiScore.toFixed(1)}
                                </p>
                              )}
                            </div>
                          </div>
                          {row.teacherComment && (
                            <p className="text-xs text-slate-500 italic leading-relaxed">
                              "{row.teacherComment.slice(0, 120)}{row.teacherComment.length > 120 ? '…' : ''}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
