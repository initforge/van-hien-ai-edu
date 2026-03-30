-- 005-submissions.sql — Submissions + storylines
INSERT OR IGNORE INTO submissions (id, exam_id, student_id, status, ai_score, ai_comment, teacher_score, teacher_comment, submitted_at) VALUES
  ('sub-1', 'exam-1', 'student-1', 'returned', 8.5, 'Bài viết có ý tưởng tốt, phân tích sâu sắc.', 8.0, 'Bài viết có ý tưởng tốt, phân tích sâu sắc. Cần bổ sung thêm dẫn chứng cụ thể.', datetime('now', '-2 days')),
  ('sub-2', 'exam-2', 'student-1', 'returned', 7.0, 'Phân tích hình ảnh thơ khá tốt.', 7.5, 'Phân tích tốt hình ảnh thơ. Cần liên hệ thực tế để bài viết sâu sắc hơn.', datetime('now', '-1 day'));

INSERT OR IGNORE INTO storylines (id, work_id, student_id, branch_point, created_at) VALUES
  ('story-1', 'work-1', 'student-1', 'Nếu Lão Hạc không bán con Vàng', datetime('now'));
