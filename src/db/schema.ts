import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// 1. Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['student', 'teacher', 'admin'] }).notNull(),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 2. Classes
export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 3. Class_Students (N-N)
export const classStudents = sqliteTable('class_students', {
  id: text('id').primaryKey(),
  classId: text('class_id').notNull().references(() => classes.id),
  studentId: text('student_id').notNull().references(() => users.id),
});

// 4. Literature Works (Thư viện Tác phẩm)
export const works = sqliteTable('works', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  grade: text('grade'),
  genre: text('genre'),
  content: text('content'),
  status: text('status', { enum: ['pending', 'analyzed'] }).default('pending'),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 5. Exams (Đề thi & Bài tập)
export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type', { enum: ['exercise', 'exam'] }).notNull(),
  workId: text('work_id').references(() => works.id),
  classId: text('class_id').references(() => classes.id), // If assigned
  teacherId: text('teacher_id').notNull().references(() => users.id),
  duration: integer('duration'), // in minutes
  status: text('status', { enum: ['draft', 'published', 'completed'] }).default('draft'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 6. Questions
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull().references(() => exams.id),
  type: text('type', { enum: ['multiple_choice', 'short_answer', 'essay'] }).notNull(),
  content: text('content').notNull(),
  points: real('points').notNull(),
  rubric: text('rubric'), // AI grading rules
  order: integer('order').notNull(),
});

// 7. Submissions (Bài nộp của Học sinh)
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull().references(() => exams.id),
  studentId: text('student_id').notNull().references(() => users.id),
  status: text('status', { enum: ['draft', 'submitted', 'ai_graded', 'returned'] }).default('draft'),
  aiScore: real('ai_score'),
  aiComment: text('ai_comment'),
  teacherScore: real('teacher_score'),
  teacherComment: text('teacher_comment'),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
});

// 8. Submission Answers
export const submissionAnswers = sqliteTable('submission_answers', {
  id: text('id').primaryKey(),
  submissionId: text('submission_id').notNull().references(() => submissions.id),
  questionId: text('question_id').notNull().references(() => questions.id),
  content: text('content'),
  aiScore: real('ai_score'),
  teacherScore: real('teacher_score'),
});

// 9. Multiverse Storylines
export const storylines = sqliteTable('storylines', {
  id: text('id').primaryKey(),
  workId: text('work_id').notNull().references(() => works.id),
  studentId: text('student_id').references(() => users.id),
  branchPoint: text('branch_point').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const storylineNodes = sqliteTable('storyline_nodes', {
  id: text('id').primaryKey(),
  storylineId: text('storyline_id').notNull().references(() => storylines.id),
  text: text('text').notNull(),
  detail: text('detail'),
  tagColor: text('tag_color'),
  tagLabel: text('tag_label'),
});

// 10. Chat Threads (Character Chat)
export const chatThreads = sqliteTable('chat_threads', {
  id: text('id').primaryKey(),
  workId: text('work_id').notNull().references(() => works.id),
  characterName: text('character_name').notNull(),
  studentId: text('student_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => chatThreads.id),
  role: text('role', { enum: ['user', 'ai'] }).notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 11. Token Logs (for AI Audit)
export const tokenLogs = sqliteTable('token_logs', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').references(() => users.id),
  feature: text('feature').notNull(),
  description: text('description'),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
