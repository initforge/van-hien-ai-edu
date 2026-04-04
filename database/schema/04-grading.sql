-- 04-grading.sql — Grading Rubrics + Skill Assessments + Student Profiles + AI Warnings
-- (depends on: users, classes)
CREATE TABLE IF NOT EXISTS rubric_criteria (
  id           TEXT PRIMARY KEY,
  teacher_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  weight      REAL NOT NULL DEFAULT 25,
  hint_prompt TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rubric_criteria_teacher ON rubric_criteria(teacher_id, is_active);

CREATE TABLE IF NOT EXISTS skill_assessments (
  id             TEXT PRIMARY KEY,
  student_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id  TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  exam_id        TEXT REFERENCES exams(id),
  class_id       TEXT REFERENCES classes(id),
  criteria_id    TEXT NOT NULL REFERENCES rubric_criteria(id),
  score          REAL NOT NULL,
  period         TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_student   ON skill_assessments(student_id, period);
CREATE INDEX IF NOT EXISTS idx_skill_class    ON skill_assessments(class_id, period);
CREATE INDEX IF NOT EXISTS idx_skill_criteria ON skill_assessments(criteria_id);

CREATE TABLE IF NOT EXISTS student_profiles (
  student_id  TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avg_score   REAL DEFAULT 0,
  skill_data  TEXT DEFAULT '{}',
  grade_label TEXT DEFAULT 'chưa_xếp',
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_warnings (
  id             TEXT PRIMARY KEY,
  teacher_id    TEXT NOT NULL REFERENCES users(id),
  type          TEXT NOT NULL CHECK(type IN ('W1','W2','W3','W4','W5','W6','W7')),
  severity      TEXT NOT NULL CHECK(severity IN ('low','medium','high')),
  student_id    TEXT REFERENCES users(id),
  student_name  TEXT,
  class_id      TEXT REFERENCES classes(id),
  class_name   TEXT,
  submission_id TEXT REFERENCES submissions(id),
  exam_id       TEXT REFERENCES exams(id),
  message       TEXT NOT NULL,
  metadata      TEXT,
  dismissed     INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_warnings_teacher ON ai_warnings(teacher_id, dismissed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_warnings_student ON ai_warnings(student_id, type, dismissed);
