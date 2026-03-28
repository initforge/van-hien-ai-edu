-- Văn Học AI — D1 Database Schema
-- Run: wrangler d1 execute van-hien-db --file=./db/schema.sql

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
