-- 001-users-classes.sql — Seed Users + Classes + Enrollments
-- Idempotent: INSERT OR IGNORE (skips if id already exists)

-- ── Users ──────────────────────────────────────────────────────────────────────
-- password_plain: plaintext password for display
INSERT OR IGNORE INTO users (id, name, email, role, username, password_plain, created_at) VALUES
  ('teacher-1', 'Thầy Nguyễn Văn An', 'an@vanhocai.edu.vn', 'teacher', 'an',     'an123',     datetime('now')),
  ('student-1', 'Trần Thị Mai',        'mai@vanhocai.edu.vn', 'student', 'mai',    'mai123',    datetime('now')),
  ('student-2', 'Lê Hoàng Nam',        'nam@vanhocai.edu.vn', 'student', 'nam',   'nam123',    datetime('now')),
  ('admin-1',  'Quản Trị Viên',        'admin@vanhocai.edu.vn', 'admin', 'admin', 'admin123', datetime('now'));

-- ── Classes ────────────────────────────────────────────────────────────────────
-- invite_code: 8-char uppercase hex generated per class
INSERT OR IGNORE INTO classes (id, name, teacher_id, grade_level, invite_code, created_at) VALUES
  ('class-8a', 'Lớp 8A', 'teacher-1', 8, upper(hex(randomblob(4))), datetime('now')),
  ('class-9b', 'Lớp 9B', 'teacher-1', 9, upper(hex(randomblob(4))), datetime('now'));

-- ── Enrollments ────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO class_students (id, class_id, student_id) VALUES
  ('cs-1', 'class-8a', 'student-1'),
  ('cs-2', 'class-8a', 'student-2');
