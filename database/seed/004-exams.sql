-- 004-exams.sql — Exams
INSERT OR IGNORE INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, deadline, created_at) VALUES
  ('exam-1', 'Phân tích nhân vật Lão Hạc', 'exercise', 'work-1', 'class-8a', 'teacher-1', 45, 'published', '2026-03-28', datetime('now')),
  ('exam-2', 'Đề thi giữa kỳ — Lớp 8', 'exam', NULL, 'class-8a', 'teacher-1', 90, 'published', '2026-03-30', datetime('now')),
  ('exam-3', 'Nghị luận xã hội — Lòng dũng cảm', 'exercise', NULL, NULL, 'teacher-1', 60, 'draft', NULL, datetime('now'));
