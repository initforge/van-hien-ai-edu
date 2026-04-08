-- 03-works.sql — Works + AI Analysis
CREATE TABLE IF NOT EXISTS works (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  author          TEXT NOT NULL,
  grade           TEXT,
  genre           TEXT CHECK(genre IN ('tho','van_ban') OR genre IS NULL),
  content         TEXT,
  teacher_id      TEXT NOT NULL REFERENCES users(id),
  file_name       TEXT,
  file_data       TEXT,
  word_count      INTEGER,
  analysis_status TEXT DEFAULT 'none' CHECK(analysis_status IN ('none','processing','done')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS work_analysis (
  id              TEXT PRIMARY KEY,
  work_id         TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  section         TEXT NOT NULL
                    CHECK(section IN ('summary','characters','art_features','content_value','themes','context')),
  content         TEXT NOT NULL,
  is_ai_generated INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(work_id, section)
);

