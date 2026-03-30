import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./contexts/AuthContext";

// Layouts
import StudentLayout from "./components/layout/StudentLayout";
import TeacherLayout from "./components/layout/TeacherLayout";

// Pages (lazy-loaded for code splitting)
const Homepage = lazy(() => import("./pages/Homepage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ExamRoomPage = lazy(() => import("./pages/ExamRoomPage"));

// Student
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentExamRoom = lazy(() => import("./pages/student/StudentExamRoom"));
const CharacterChat = lazy(() => import("./pages/student/CharacterChat"));
const Multiverse = lazy(() => import("./pages/student/Multiverse"));
const Results = lazy(() => import("./pages/student/Results"));
const Profile = lazy(() => import("./pages/student/Profile"));
const ExamDetail = lazy(() => import("./pages/student/ExamDetail"));

// Teacher
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));

// Admin
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminClasses = lazy(() => import("./pages/admin/AdminClasses"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const Library = lazy(() => import("./pages/teacher/Library"));
const ExamBank = lazy(() => import("./pages/teacher/ExamBank"));
const Grading = lazy(() => import("./pages/teacher/Grading"));
const Characters = lazy(() => import("./pages/teacher/Characters"));
const AIReview = lazy(() => import("./pages/teacher/AIReview"));
const TeacherMultiverse = lazy(() => import("./pages/teacher/TeacherMultiverse"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-primary animate-pulse">auto_stories</span>
        <p className="text-sm text-on-surface-variant font-medium">Đang tải...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Student Dashboard */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="exam-room" element={<StudentExamRoom />} />
          <Route path="exam-room/:id" element={<ExamDetail />} />
          <Route path="character-chat" element={<CharacterChat />} />
          <Route path="multiverse" element={<Multiverse />} />
          <Route path="results" element={<Results />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Teacher Dashboard */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="exam-bank" element={<ExamBank />} />
          <Route path="grading" element={<Grading />} />
          <Route path="characters" element={<Characters />} />
          <Route path="ai-review" element={<AIReview />} />
          <Route path="multiverse" element={<TeacherMultiverse />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
