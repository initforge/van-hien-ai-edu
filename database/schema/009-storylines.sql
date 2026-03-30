-- 009-storylines.sql
-- Multiverse Storylines
CREATE TABLE IF NOT EXISTS storylines (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id),
  student_id TEXT REFERENCES users(id),
  branch_point TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
