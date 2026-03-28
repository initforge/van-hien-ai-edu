-- Văn Học AI — Seed Data
-- Run: wrangler d1 execute van-hien-db --file=./db/seed.sql

-- Users
INSERT OR IGNORE INTO users (id, name, email, role, created_at) VALUES
  ('teacher-1', 'Thầy Nguyễn Văn An', 'an@vanhocai.edu.vn', 'teacher', datetime('now')),
  ('student-1', 'Trần Thị Mai', 'mai@vanhocai.edu.vn', 'student', datetime('now')),
  ('student-2', 'Lê Hoàng Nam', 'nam@vanhocai.edu.vn', 'student', datetime('now'));

-- Classes
INSERT OR IGNORE INTO classes (id, name, teacher_id, created_at) VALUES
  ('class-8a', 'Lớp 8A', 'teacher-1', datetime('now')),
  ('class-9b', 'Lớp 9B', 'teacher-1', datetime('now'));

-- Class Students
INSERT OR IGNORE INTO class_students (id, class_id, student_id) VALUES
  ('cs-1', 'class-8a', 'student-1'),
  ('cs-2', 'class-8a', 'student-2');

-- Literary Works
INSERT OR IGNORE INTO works (id, title, author, grade, genre, status, teacher_id, created_at) VALUES
  ('work-1', 'Lão Hạc', 'Nam Cao', '8', 'Truyện ngắn', 'analyzed', 'teacher-1', datetime('now')),
  ('work-2', 'Tắt Đèn', 'Ngô Tất Tố', '8', 'Tiểu thuyết', 'analyzed', 'teacher-1', datetime('now')),
  ('work-3', 'Đồng Chí', 'Chính Hữu', '9', 'Thơ', 'pending', 'teacher-1', datetime('now'));

-- Exams
INSERT OR IGNORE INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, deadline, created_at) VALUES
  ('exam-1', 'Phân tích nhân vật Lão Hạc', 'exercise', 'work-1', 'class-8a', 'teacher-1', 45, 'published', '2026-03-28', datetime('now')),
  ('exam-2', 'Đề thi giữa kỳ — Lớp 8', 'exam', NULL, 'class-8a', 'teacher-1', 90, 'published', '2026-03-30', datetime('now')),
  ('exam-3', 'Nghị luận xã hội — Lòng dũng cảm', 'exercise', NULL, NULL, 'teacher-1', 60, 'draft', NULL, datetime('now'));

-- Submissions
INSERT OR IGNORE INTO submissions (id, exam_id, student_id, status, ai_score, ai_comment, teacher_score, teacher_comment, submitted_at) VALUES
  ('sub-1', 'exam-1', 'student-1', 'returned', 8.5, 'Bài viết có ý tưởng tốt, phân tích sâu sắc.', 8.0, 'Bài viết có ý tưởng tốt, phân tích sâu sắc. Cần bổ sung thêm dẫn chứng cụ thể.', datetime('now', '-2 days')),
  ('sub-2', 'exam-2', 'student-1', 'returned', 7.0, 'Phân tích hình ảnh thơ khá tốt.', 7.5, 'Phân tích tốt hình ảnh thơ. Cần liên hệ thực tế để bài viết sâu sắc hơn.', datetime('now', '-1 day'));

-- Storylines
INSERT OR IGNORE INTO storylines (id, work_id, branch_point, created_at) VALUES
  ('story-1', 'work-1', 'Nếu Lão Hạc không bán con Vàng', datetime('now'));
