/**
 * Shared TypeScript interfaces for API response shapes.
 * Replace all `as any` / `any[]` with these typed interfaces.
 */

// ─── Common ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface MeResponse {
  user: User;
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface UpcomingExam {
  id: string;
  title: string;
  type: 'exercise' | 'exam';
  deadline: string | null;
}

export interface RecentResult {
  submissionId: string;
  examTitle: string;
  examType: 'exercise' | 'exam';
  aiScore: number | null;
  teacherScore: number | null;
  teacherComment: string | null;
}

export interface TeacherStats {
  upcomingExams: UpcomingExam[];
  recentResults: RecentResult[];
  studentCount: number;
  pendingGrading: number;
  totalExams: number;
  aiPending: number;
}

export interface StudentStats {
  upcomingExams: UpcomingExam[];
  recentResults: RecentResult[];
}

// ─── Works ─────────────────────────────────────────────────────────────────────

export interface Work {
  id: string;
  title: string;
  author: string;
  grade: number | null;
  genre: string | null;
  content: string | null;
  status: 'pending' | 'analyzed';
  createdAt: string;
}

// ─── Exams ─────────────────────────────────────────────────────────────────────

export interface Exam {
  id: string;
  title: string;
  type: 'exercise' | 'exam';
  workId: string | null;
  classId: string | null;
  duration: number;
  status: 'draft' | 'published';
  deadline: string | null;
  createdAt: string;
  // exam-detail.js extended fields
  passage?: string;
  workTitle?: string;
  author?: string;
  // teacher/grading.js enriched fields
  graded?: number;
  total?: number;
  date?: string;
  subject?: string;
}

export interface ExamDetail {
  exam: Exam;
  questions: Question[];
}

export interface Question {
  id: string;
  order_index: number;
  type: 'essay' | 'text';
  content: string;
  points: number;
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export type SubmissionStatus = 'draft' | 'submitted' | 'ai_graded' | 'returned' | 'pending';

export interface Submission {
  id: string;
  examId: string;
  studentId?: string;
  name?: string; // student name (joined from users table)
  title?: string;
  type?: 'exercise' | 'exam';
  status: SubmissionStatus;
  aiScore: number | null;
  teacherScore: number | null;
  teacherComment: string | null;
  submittedAt: string;
}

// ─── Characters ────────────────────────────────────────────────────────────────

export interface Character {
  id: string;
  name: string;
  initials: string;
  role: string;
  description: string;
  personality: string | null;
  systemPrompt: string | null;
  active: boolean;
  workId: string;
  workTitle: string | null;
  chatCount?: number;
  createdAt: string;
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatThread {
  id: string;
  character_name: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface ChatThreadsResponse {
  threads: ChatThread[];
}

export interface ChatMessagesResponse {
  threadId: string;
  messages: ChatMessage[];
}

// ─── Storylines ────────────────────────────────────────────────────────────────

export interface Storyline {
  id: string;
  workId: string;
  workTitle?: string;
  branchPoint: string;
  createdAt: string;
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export interface Class {
  id: string;
  name: string;
  teacherId: string | null;
  createdAt: string;
  // admin/classes.js extended fields
  teacherName?: string;
  teacherEmail?: string;
  studentCount?: number;
  // teacher/grading.js fields (enriched)
  students?: number;
  pendingExams?: number;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  counts: {
    total: number;
    teachers: number;
    students: number;
    classes?: number;
    exams?: number;
    submissions?: number;
  };
  monthlyUsers?: { month: string; count: number }[];
  monthlySubmissions?: { month: string; count: number }[];
  topTeachers?: { id: string; name: string; examCount: number }[];
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string | null;
  createdAt: string;
}
