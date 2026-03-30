-- 999-indexes.sql
-- Performance indexes on foreign keys and filter columns

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Submission answers indexes
CREATE INDEX IF NOT EXISTS idx_submission_answers_submission_id ON submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_question_id ON submission_answers(question_id);

-- Class students indexes
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);

-- Exams indexes
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_work_id ON exams(work_id);

-- Questions index
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);

-- Chat messages index
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);

-- Storyline nodes index
CREATE INDEX IF NOT EXISTS idx_storyline_nodes_storyline_id ON storyline_nodes(storyline_id);

-- Chat threads indexes
CREATE INDEX IF NOT EXISTS idx_chat_threads_student_id ON chat_threads(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_work_id ON chat_threads(work_id);

-- Classes index
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);

-- Characters index
CREATE INDEX IF NOT EXISTS idx_characters_teacher_id ON characters(teacher_id);

-- Token logs index
CREATE INDEX IF NOT EXISTS idx_token_logs_teacher_id ON token_logs(teacher_id);

-- Exams filter index
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

-- Chat threads index
CREATE INDEX IF NOT EXISTS idx_chat_threads_character_name ON chat_threads(character_name);
