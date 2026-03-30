-- 008-submission_answers.sql
-- Submission Answers
CREATE TABLE IF NOT EXISTS submission_answers (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  content TEXT,
  ai_score REAL,
  teacher_score REAL
);
