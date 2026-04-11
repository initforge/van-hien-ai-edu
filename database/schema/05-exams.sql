-- 05-exams.sql — Exams + Questions + Submissions + Submission Answers
-- (depends on: users, classes, works, rubric_criteria)
CREATE TABLE IF NOT EXISTS exams (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL CHECK(type IN ('exercise','exam')),
  work_id      TEXT REFERENCES works(id),
  class_id     TEXT REFERENCES classes(id),
  teacher_id   TEXT NOT NULL REFERENCES users(id),
  duration     INTEGER DEFAULT 60,
  status       TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  deadline     TEXT,
  ai_generated INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_id   ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_work_id    ON exams(work_id);
CREATE INDEX IF NOT EXISTS idx_exams_status     ON exams(status);

CREATE TABLE IF NOT EXISTS questions (
  id           TEXT PRIMARY KEY,
  exam_id      TEXT NOT NULL REFERENCES exams(id),
  type         TEXT NOT NULL CHECK(type IN ('multiple_choice','short_answer','essay')),
  content      TEXT NOT NULL,
  points       REAL NOT NULL,
  rubric       TEXT,
  order_index  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);

CREATE TABLE IF NOT EXISTS submissions (
  id              TEXT PRIMARY KEY,
  exam_id         TEXT NOT NULL REFERENCES exams(id),
  student_id      TEXT NOT NULL REFERENCES users(id),
  status          TEXT DEFAULT 'draft'
                    CHECK(status IN ('draft','submitted','ai_graded','returned')),
  ai_score        REAL,
  ai_comment      TEXT,
  ai_rubric       TEXT,
  teacher_score   REAL,
  teacher_comment TEXT,
  submitted_at    TEXT,
  started_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id    ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status     ON submissions(status);

CREATE TABLE IF NOT EXISTS submission_answers (
  id              TEXT PRIMARY KEY,
  submission_id   TEXT NOT NULL REFERENCES submissions(id),
  question_id     TEXT NOT NULL REFERENCES questions(id),
  content         TEXT,
  ai_score        REAL,
  teacher_score   REAL,
  criteria_id     TEXT REFERENCES rubric_criteria(id)
);
CREATE INDEX IF NOT EXISTS idx_submission_answers_submission_id ON submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_question_id  ON submission_answers(question_id);
