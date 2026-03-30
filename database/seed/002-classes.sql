-- 002-classes.sql — Classes + students
INSERT OR IGNORE INTO classes (id, name, teacher_id, created_at) VALUES
  ('class-8a', 'Lớp 8A', 'teacher-1', datetime('now')),
  ('class-9b', 'Lớp 9B', 'teacher-1', datetime('now'));

INSERT OR IGNORE INTO class_students (id, class_id, student_id) VALUES
  ('cs-1', 'class-8a', 'student-1'),
  ('cs-2', 'class-8a', 'student-2');
