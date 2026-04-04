-- 06-activity.sql — Chat + Characters + Storylines + Multiverse + Audit Logs
-- (depends on: users, works, classes, exams, submissions)
CREATE TABLE IF NOT EXISTS chat_threads (
  id              TEXT PRIMARY KEY,
  work_id         TEXT REFERENCES works(id),
  character_name  TEXT NOT NULL,
  student_id      TEXT NOT NULL REFERENCES users(id),
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_threads_student_id ON chat_threads(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_work_id    ON chat_threads(work_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         TEXT PRIMARY KEY,
  thread_id  TEXT NOT NULL REFERENCES chat_threads(id),
  role       TEXT NOT NULL CHECK(role IN ('user','ai')),
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);

CREATE TABLE IF NOT EXISTS characters (
  id            TEXT PRIMARY KEY,
  work_id       TEXT REFERENCES works(id),
  name          TEXT NOT NULL,
  initials      TEXT NOT NULL,
  role          TEXT,
  description   TEXT,
  personality   TEXT,
  system_prompt  TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  teacher_id    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_characters_teacher_id ON characters(teacher_id);

CREATE TABLE IF NOT EXISTS storylines (
  id           TEXT PRIMARY KEY,
  work_id      TEXT NOT NULL REFERENCES works(id),
  student_id   TEXT REFERENCES users(id),
  branch_point  TEXT NOT NULL,
  title         TEXT,
  content       TEXT,
  moral         TEXT,
  teacher_id   TEXT REFERENCES users(id),
  status        TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS storyline_nodes (
  id           TEXT PRIMARY KEY,
  storyline_id TEXT NOT NULL REFERENCES storylines(id),
  text         TEXT NOT NULL,
  detail       TEXT,
  tag_color    TEXT,
  tag_label    TEXT
);

CREATE TABLE IF NOT EXISTS student_multiverse (
  id               TEXT PRIMARY KEY,
  student_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_id         TEXT NOT NULL REFERENCES works(id),
  class_id        TEXT REFERENCES classes(id),
  title           TEXT,
  branch_point    TEXT NOT NULL,
  content         TEXT,
  moral           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK(status IN ('draft','published')),
  generation_method TEXT DEFAULT 'ai_full'
                    CHECK(generation_method IN ('ai_full','ai_branch','manual')),
  parent_id       TEXT REFERENCES student_multiverse(id),
  depth           INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_multiverse_student ON student_multiverse(student_id, work_id);
CREATE INDEX IF NOT EXISTS idx_multiverse_class  ON student_multiverse(class_id);
CREATE INDEX IF NOT EXISTS idx_multiverse_work   ON student_multiverse(work_id);
CREATE INDEX IF NOT EXISTS idx_multiverse_parent ON student_multiverse(parent_id);

CREATE TABLE IF NOT EXISTS multiverse_nodes (
  id            TEXT PRIMARY KEY,
  multiverse_id TEXT NOT NULL REFERENCES student_multiverse(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  detail        TEXT,
  tag_label     TEXT,
  tag_color     TEXT DEFAULT '#326286',
  is_leaf       INTEGER NOT NULL DEFAULT 0,
  sequence      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mv_nodes ON multiverse_nodes(multiverse_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  user_name    TEXT,
  user_role    TEXT NOT NULL CHECK(user_role IN ('student','teacher','admin')),
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  details      TEXT,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action  ON activity_logs(action);

CREATE TABLE IF NOT EXISTS token_logs (
  id            TEXT PRIMARY KEY,
  teacher_id    TEXT REFERENCES users(id),
  feature       TEXT NOT NULL,
  description   TEXT,
  input_tokens  INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_token_logs_teacher_id ON token_logs(teacher_id);

CREATE TABLE IF NOT EXISTS logs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  action    TEXT,
  role      TEXT,
  ip        TEXT,
  timestamp TEXT
);
