-- 007-admin.sql — Admin account
INSERT OR IGNORE INTO users (id, name, email, role, username, created_at) VALUES
  ('admin-1', 'Quản Trị Viên', 'admin@vanhocai.edu.vn', 'admin', 'admin', datetime('now'));
