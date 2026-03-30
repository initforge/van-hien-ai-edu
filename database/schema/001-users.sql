-- 001-users.sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
