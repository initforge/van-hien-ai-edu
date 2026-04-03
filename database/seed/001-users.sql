-- 001-users.sql — Users
INSERT OR IGNORE INTO users (id, name, email, role, username, created_at) VALUES
  ('teacher-1', 'Thầy Nguyễn Văn An', 'an@vanhocai.edu.vn', 'teacher', 'an', datetime('now')),
  ('student-1', 'Trần Thị Mai', 'mai@vanhocai.edu.vn', 'student', 'mai', datetime('now')),
  ('student-2', 'Lê Hoàng Nam', 'nam@vanhocai.edu.vn', 'student', 'nam', datetime('now')),
  ('admin-1', 'Quản trị viên', 'admin@vanhocai.edu.vn', 'admin', 'admin', datetime('now'));
