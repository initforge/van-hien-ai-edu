-- 014-logs.sql
-- Auth Logs
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT,
  role TEXT,
  ip TEXT,
  timestamp TEXT
);
