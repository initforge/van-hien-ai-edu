import React from 'react';

export interface GradingScore {
  questionId: string;
  points: number;
  comment: string;
  questionContent?: string;
  maxPoints?: number;
}

interface GradingPreviewTableProps {
  scores: GradingScore[];
  totalScore: number;
  summary: string;
  onScoreChange: (questionId: string, points: number) => void;
  onSummaryChange: (summary: string) => void;
}

export default function GradingPreviewTable({
  scores,
  totalScore,
  summary,
  onScoreChange,
  onSummaryChange,
}: GradingPreviewTableProps) {
  return (
    <div className="space-y-6">
      {/* Per-question scores */}
      <div className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-primary/5 text-primary text-xs font-label uppercase tracking-widest border-b border-outline-variant/20">
              <th className="px-4 py-3">Tiêu chí</th>
              <th className="px-4 py-3 text-center">Điểm AI</th>
              <th className="px-4 py-3 text-center">Chỉnh sửa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {scores.map((s) => (
              <tr key={s.questionId} className="hover:bg-surface-container-low/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-on-surface line-clamp-2">
                    {s.questionContent || s.questionId}
                  </div>
                  <div className="text-xs text-secondary/70 mt-1 italic line-clamp-1">
                    {s.comment || '—'}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-secondary/10 text-secondary font-headline font-bold text-lg px-3 py-1 rounded-full">
                    {s.points}/10
                  </span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={s.points}
                    onChange={(e) => onScoreChange(s.questionId, parseFloat(e.target.value) || 0)}
                    className="w-16 mx-auto block bg-surface-container-low/50 border border-outline-variant/30 rounded focus:border-primary focus:ring-1 focus:ring-primary/20 py-1.5 text-center text-sm font-medium"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary text-white">
              <td className="px-4 py-4 font-headline font-bold uppercase tracking-wider">Tổng điểm</td>
              <td className="px-4 py-4 text-center">
                <span className="font-headline font-black text-2xl text-blue-200">{totalScore}/10</span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">
          Nhận xét tổng quát của AI
        </label>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={3}
          className="w-full bg-secondary/5 border-l-4 border-secondary rounded-r-xl p-4 text-sm leading-relaxed text-[#005142] italic focus:border-secondary focus:ring-1 focus:ring-secondary/20 resize-none"
          placeholder="AI sẽ điền nhận xét tổng quát ở đây..."
        />
      </div>
    </div>
  );
}
