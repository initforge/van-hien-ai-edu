import React, { useState } from 'react';

export interface EditableQuestion {
  content: string;
  type: string;
  points: number;
  rubric: string;
}

interface ExamPreviewContentProps {
  title: string;
  questions: EditableQuestion[];
  onChange: (questions: EditableQuestion[]) => void;
}

const QUESTION_TYPES = [
  { value: 'essay', label: 'Tự luận' },
  { value: 'short_answer', label: 'Trả lời ngắn' },
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
];

export default function ExamPreviewContent({ title, questions, onChange }: ExamPreviewContentProps) {
  const updateQuestion = (idx: number, field: keyof EditableQuestion, value: string | number) => {
    const next = [...questions];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Tiêu đề đề thi</label>
        <input
          value={title}
          readOnly
          className="w-full bg-surface-container-low/50 border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm font-medium text-primary"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">
          Câu hỏi ({questions.length})
        </label>
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden">
            {/* Question header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary/3 border-b border-outline-variant/10">
              <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs font-bold text-primary">Câu hỏi {idx + 1}</span>
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                  className="text-xs border border-outline-variant/30 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-primary/20"
                >
                  {QUESTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={q.points}
                    onChange={(e) => updateQuestion(idx, 'points', parseFloat(e.target.value) || 1)}
                    className="w-14 text-xs border border-outline-variant/30 rounded px-2 py-1 text-center bg-white"
                  />
                  <span className="text-xs text-outline">điểm</span>
                </div>
              </div>
            </div>

            {/* Question content */}
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Nội dung câu hỏi</label>
                <textarea
                  value={q.content}
                  onChange={(e) => updateQuestion(idx, 'content', e.target.value)}
                  rows={2}
                  className="w-full bg-surface-container-low/30 border border-outline-variant/20 rounded-lg px-3 py-2 text-sm leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Gợi ý đáp án / Rubric</label>
                <textarea
                  value={q.rubric}
                  onChange={(e) => updateQuestion(idx, 'rubric', e.target.value)}
                  rows={2}
                  placeholder="Nhập rubric để hướng dẫn chấm bài..."
                  className="w-full bg-surface-container-low/30 border border-outline-variant/20 rounded-lg px-3 py-2 text-sm leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none text-secondary/80"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
