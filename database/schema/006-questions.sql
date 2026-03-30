-- 006-questions.sql
-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id),
  type TEXT NOT NULL CHECK(type IN ('multiple_choice', 'short_answer', 'essay')),
  content TEXT NOT NULL,
  points REAL NOT NULL,
  rubric TEXT,
  order_index INTEGER NOT NULL
);
