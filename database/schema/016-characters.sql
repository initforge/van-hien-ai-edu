-- 016-characters.sql
-- AI Character Personas
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works(id),
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT,
  description TEXT,
  personality TEXT,
  system_prompt TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
