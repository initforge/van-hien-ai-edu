import React from 'react';

interface MultiversePreviewContentProps {
  title: string;
  content: string;
  moral: string;
  onChange: (field: 'title' | 'content' | 'moral', value: string) => void;
}

export default function MultiversePreviewContent({ title, content, moral, onChange }: MultiversePreviewContentProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Tiêu đề nhánh</label>
        <input
          value={title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm font-medium text-primary focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Nội dung câu chuyện</label>
        <div className="bg-secondary/5 border-l-4 border-secondary rounded-r-xl p-4">
          <textarea
            value={content}
            onChange={(e) => onChange('content', e.target.value)}
            rows={12}
            className="w-full bg-transparent text-sm leading-relaxed text-on-surface/90 resize-none focus:outline-none font-body italic"
          />
        </div>
      </div>

      {/* Moral */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Ý nghĩa / Bài học</label>
        <textarea
          value={moral}
          onChange={(e) => onChange('moral', e.target.value)}
          rows={2}
          placeholder="Giá trị nghệ thuật và ý nghĩa của nhánh cốt truyện này..."
          className="w-full bg-surface-container-low/30 border border-outline-variant/20 rounded-lg px-3 py-2 text-sm leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
        />
      </div>
    </div>
  );
}
