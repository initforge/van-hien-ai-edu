-- 003-works.sql — Literary works
INSERT OR IGNORE INTO works (id, title, author, grade, genre, status, teacher_id, created_at) VALUES
  ('work-1', 'Lão Hạc', 'Nam Cao', '8', 'Truyện ngắn', 'analyzed', 'teacher-1', datetime('now')),
  ('work-2', 'Tắt Đèn', 'Ngô Tất Tố', '8', 'Tiểu thuyết', 'analyzed', 'teacher-1', datetime('now')),
  ('work-3', 'Đồng Chí', 'Chính Hữu', '9', 'Thơ', 'pending', 'teacher-1', datetime('now'));
