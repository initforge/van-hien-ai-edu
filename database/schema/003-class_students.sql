-- 003-class_students.sql
-- Class-Student N:N join
CREATE TABLE IF NOT EXISTS class_students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id),
  student_id TEXT NOT NULL REFERENCES users(id)
);
