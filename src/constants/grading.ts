export type RubricRow = {
  name: string;
  desc: string;
  ai: string;
  gvRef: string;
};

export const RUBRIC_DEFAULT: RubricRow[] = [
  { name: 'Nội dung (40%)', desc: 'Phân tích đúng yêu cầu đề bài', ai: '7.5', gvRef: '7.5' },
  { name: 'Lập luận (25%)', desc: 'Sự logic và thuyết phục', ai: '6.0', gvRef: '6.5' },
  { name: 'Diễn đạt (20%)', desc: 'Từ vựng, ngữ pháp linh hoạt', ai: '8.0', gvRef: '8.0' },
  { name: 'Hình thức (15%)', desc: 'Trình bày, lỗi chính tả', ai: '9.0', gvRef: '9.0' },
];
