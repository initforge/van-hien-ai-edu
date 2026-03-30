-- 011-chat_threads.sql
-- Chat Threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works(id),
  character_name TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
