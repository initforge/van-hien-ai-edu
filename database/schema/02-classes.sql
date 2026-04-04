-- 02-classes.sql — Classes + Enrollments
CREATE TABLE IF NOT EXISTS classes (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  teacher_id  TEXT NOT NULL REFERENCES users(id),
  grade_level INTEGER,
  invite_code TEXT,  -- 8-char uppercase, auto-generated on creation
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);

CREATE TABLE IF NOT EXISTS class_students (
  id          TEXT PRIMARY KEY,
  class_id    TEXT NOT NULL REFERENCES classes(id),
  student_id  TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id   ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
