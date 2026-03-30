// ─── Class Stats ────────────────────────────────────────────────────────────
export const CLASS_STATS_CARDS = [
  { label: 'Tổng bài đã chấm', value: '248', icon: 'grading', color: 'text-primary' },
  { label: 'Điểm TB các lớp', value: '7.6', icon: 'analytics', color: 'text-secondary' },
  { label: 'Bài chờ chấm', value: '15', icon: 'pending_actions', color: 'text-amber-600' },
  { label: 'Lớp xuất sắc nhất', value: '9B', icon: 'emoji_events', color: 'text-yellow-600' },
];

export const CLASS_STATS_BARS = [
  { name: 'Lớp 8A', avg: 7.2, count: 35 },
  { name: 'Lớp 9B', avg: 8.1, count: 32 },
  { name: 'Lớp 9C', avg: 7.8, count: 30 },
];

// ─── Student Stats ──────────────────────────────────────────────────────────
export const STUDENT_STATS_ROWS = [
  { name: 'Nguyễn Thị Mai', cls: '8A', submitted: 12, avg: 8.2, trend: '+0.5' },
  { name: 'Trần Văn Hào', cls: '8A', submitted: 10, avg: 6.8, trend: '-0.3' },
  { name: 'Lê Minh Anh', cls: '9B', submitted: 11, avg: 7.9, trend: '+0.8' },
  { name: 'Phạm Hương Giang', cls: '9B', submitted: 12, avg: 8.5, trend: '+0.2' },
  { name: 'Vũ Thị Hồng', cls: '9C', submitted: 9, avg: 7.1, trend: '+0.1' },
];

// ─── Style Analysis ────────────────────────────────────────────────────────
export const STYLE_CARDS = [
  { label: 'Lỗi chính tả phổ biến', value: '23', desc: 'Lỗi thường gặp nhất: sai dấu thanh', icon: 'spellcheck', color: 'bg-red-50 text-red-600' },
  { label: 'Từ vựng trùng lặp', value: '8.4%', desc: 'Tỷ lệ lặp từ trung bình của lớp', icon: 'content_copy', color: 'bg-amber-50 text-amber-600' },
  { label: 'Độ phong phú ngôn ngữ', value: '7.2/10', desc: 'Dựa trên đa dạng từ vựng và cấu trúc câu', icon: 'auto_stories', color: 'bg-blue-50 text-blue-600' },
];

export const COMMON_ERRORS = [
  { error: 'sai dấu hỏi/ngã', count: 45 },
  { error: 'thiếu dấu phẩy trong câu ghép', count: 38 },
  { error: 'lặp liên từ "và"', count: 31 },
  { error: 'viết tắt không hợp lệ', count: 22 },
  { error: 'sai cấu trúc câu phức', count: 18 },
];

// ─── Token Usage ────────────────────────────────────────────────────────────
export const TOKEN_FEATURES = [
  { name: 'Chấm bài', tokens: 18400, pct: 41 },
  { name: 'Chatbot nhân vật', tokens: 12100, pct: 27 },
  { name: 'Ra đề thi', tokens: 9500, pct: 21 },
  { name: 'Đa Vũ Trụ', tokens: 5230, pct: 11 },
];

export const TOKEN_DETAIL_ROWS = [
  { date: '20/03', feature: 'Chấm bài', desc: 'Lớp 8A — Phân tích Lão Hạc (5 bài)', input: 3200, output: 1800, total: 5000 },
  { date: '20/03', feature: 'Chatbot', desc: 'Cuộc trò chuyện với nhân vật Lão Hạc', input: 800, output: 1200, total: 2000 },
  { date: '19/03', feature: 'Ra đề', desc: 'Đề thi Lớp 9 — Truyện Kiều', input: 1500, output: 2500, total: 4000 },
  { date: '19/03', feature: 'Chấm bài', desc: 'Lớp 9B — Cảm nhận Đồng chí (8 bài)', input: 4800, output: 3200, total: 8000 },
  { date: '18/03', feature: 'Đa Vũ Trụ', desc: 'Tạo câu chuyện thay thế — Tắt đèn', input: 2000, output: 3230, total: 5230 },
  { date: '18/03', feature: 'Chatbot', desc: 'Cuộc trò chuyện với Thúy Kiều', input: 1500, output: 2100, total: 3600 },
  { date: '17/03', feature: 'Ra đề', desc: 'Bài tập Nghị luận xã hội', input: 1000, output: 1500, total: 2500 },
];
