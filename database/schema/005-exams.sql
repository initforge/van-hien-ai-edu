-- 005-exams.sql
-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('exercise', 'exam')),
  work_id TEXT REFERENCES works(id),
  class_id TEXT REFERENCES classes(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  duration INTEGER DEFAULT 60,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'completed')),
  deadline TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
