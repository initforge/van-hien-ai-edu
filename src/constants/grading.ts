export type RubricRow = {
  name: string;
  desc: string;
  weight: number;
  ai: string;
  aiComment: string;
  gvRef: string;
  gvComment: string;
};

export const RUBRIC_DEFAULT: RubricRow[] = [
  { name: 'Nội dung', desc: 'Phân tích đúng yêu cầu đề bài', weight: 40, ai: '', aiComment: '', gvRef: '', gvComment: '' },
  { name: 'Lập luận', desc: 'Sự logic và thuyết phục', weight: 25, ai: '', aiComment: '', gvRef: '', gvComment: '' },
  { name: 'Diễn đạt', desc: 'Từ vựng, ngữ pháp linh hoạt', weight: 20, ai: '', aiComment: '', gvRef: '', gvComment: '' },
  { name: 'Hình thức', desc: 'Trình bày, lỗi chính tả', weight: 15, ai: '', aiComment: '', gvRef: '', gvComment: '' },
];
