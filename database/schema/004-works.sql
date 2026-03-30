-- 004-works.sql
-- Literary Works
CREATE TABLE IF NOT EXISTS works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  grade TEXT,
  genre TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'analyzed')),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
