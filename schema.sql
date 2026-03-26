-- Văn Học AI — D1 Database Schema
-- Run: wrangler d1 execute van-hien-db --file=./schema.sql

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Classes
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Class Students (N-N)
CREATE TABLE IF NOT EXISTS class_students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id),
  student_id TEXT NOT NULL REFERENCES users(id)
);

-- 4. Literary Works
CREATE TABLE IF NOT EXISTS works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  grade TEXT,
  genre TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'analyzed')),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Exams
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('exercise', 'exam')),
  work_id TEXT REFERENCES works(id),
  class_id TEXT REFERENCES classes(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  duration INTEGER DEFAULT 60,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'completed')),
  deadline TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id),
  type TEXT NOT NULL CHECK(type IN ('multiple_choice', 'short_answer', 'essay')),
  content TEXT NOT NULL,
  points REAL NOT NULL,
  rubric TEXT,
  "order" INTEGER NOT NULL
);

-- 7. Submissions
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

-- 8. Submission Answers
CREATE TABLE IF NOT EXISTS submission_answers (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  content TEXT,
  ai_score REAL,
  teacher_score REAL
);

-- 9. Storylines (Multiverse)
CREATE TABLE IF NOT EXISTS storylines (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id),
  student_id TEXT REFERENCES users(id),
  branch_point TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. Storyline Nodes
CREATE TABLE IF NOT EXISTS storyline_nodes (
  id TEXT PRIMARY KEY,
  storyline_id TEXT NOT NULL REFERENCES storylines(id),
  text TEXT NOT NULL,
  detail TEXT,
  tag_color TEXT,
  tag_label TEXT
);

-- 11. Chat Threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id),
  character_name TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES chat_threads(id),
  role TEXT NOT NULL CHECK(role IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 13. Token Logs (AI Audit)
CREATE TABLE IF NOT EXISTS token_logs (
  id TEXT PRIMARY KEY,
  teacher_id TEXT REFERENCES users(id),
  feature TEXT NOT NULL,
  description TEXT,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. Logs (Auth logging)
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT,
  role TEXT,
  ip TEXT,
  timestamp TEXT
);

-- =========================================
-- SEED DATA
-- =========================================

INSERT OR IGNORE INTO users (id, name, email, role, created_at) VALUES
  ('teacher-1', 'Thầy Nguyễn Văn An', 'an@vanhocai.edu.vn', 'teacher', datetime('now')),
  ('student-1', 'Trần Thị Mai', 'mai@vanhocai.edu.vn', 'student', datetime('now')),
  ('student-2', 'Lê Hoàng Nam', 'nam@vanhocai.edu.vn', 'student', datetime('now'));

INSERT OR IGNORE INTO classes (id, name, teacher_id, created_at) VALUES
  ('class-8a', 'Lớp 8A', 'teacher-1', datetime('now')),
  ('class-9b', 'Lớp 9B', 'teacher-1', datetime('now'));

INSERT OR IGNORE INTO class_students (id, class_id, student_id) VALUES
  ('cs-1', 'class-8a', 'student-1'),
  ('cs-2', 'class-8a', 'student-2');

INSERT OR IGNORE INTO works (id, title, author, grade, genre, status, teacher_id, created_at) VALUES
  ('work-1', 'Lão Hạc', 'Nam Cao', '8', 'Truyện ngắn', 'analyzed', 'teacher-1', datetime('now')),
  ('work-2', 'Tắt Đèn', 'Ngô Tất Tố', '8', 'Tiểu thuyết', 'analyzed', 'teacher-1', datetime('now')),
  ('work-3', 'Đồng Chí', 'Chính Hữu', '9', 'Thơ', 'pending', 'teacher-1', datetime('now'));

INSERT OR IGNORE INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, deadline, created_at) VALUES
  ('exam-1', 'Phân tích nhân vật Lão Hạc', 'exercise', 'work-1', 'class-8a', 'teacher-1', 45, 'published', '2026-03-28', datetime('now')),
  ('exam-2', 'Đề thi giữa kỳ — Lớp 8', 'exam', NULL, 'class-8a', 'teacher-1', 90, 'published', '2026-03-30', datetime('now')),
  ('exam-3', 'Nghị luận xã hội — Lòng dũng cảm', 'exercise', NULL, NULL, 'teacher-1', 60, 'draft', NULL, datetime('now'));

INSERT OR IGNORE INTO submissions (id, exam_id, student_id, status, ai_score, ai_comment, teacher_score, teacher_comment, submitted_at) VALUES
  ('sub-1', 'exam-1', 'student-1', 'returned', 8.5, 'Bài viết có ý tưởng tốt, phân tích sâu sắc.', 8.0, 'Bài viết có ý tưởng tốt, phân tích sâu sắc. Cần bổ sung thêm dẫn chứng cụ thể.', datetime('now', '-2 days')),
  ('sub-2', 'exam-2', 'student-1', 'returned', 7.0, 'Phân tích hình ảnh thơ khá tốt.', 7.5, 'Phân tích tốt hình ảnh thơ. Cần liên hệ thực tế để bài viết sâu sắc hơn.', datetime('now', '-1 day'));

INSERT OR IGNORE INTO storylines (id, work_id, branch_point, created_at) VALUES
  ('story-1', 'work-1', 'Nếu Lão Hạc không bán con Vàng', datetime('now'));
