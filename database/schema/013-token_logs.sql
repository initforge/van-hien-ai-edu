-- 013-token_logs.sql
-- AI Token Audit
CREATE TABLE IF NOT EXISTS token_logs (
  id TEXT PRIMARY KEY,
  teacher_id TEXT REFERENCES users(id),
  feature TEXT NOT NULL,
  description TEXT,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
