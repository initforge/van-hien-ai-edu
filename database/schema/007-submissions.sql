-- 007-submissions.sql
-- Student Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'ai_graded', 'returned')),
  ai_score REAL,
  ai_comment TEXT,
  teacher_score REAL,
  teacher_comment TEXT,
  submitted_at TEXT
);
