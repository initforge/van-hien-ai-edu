-- cleanup-orphan-data.sql
-- Dọn dẹp orphan records trong D1 database
-- Chạy: npx wrangler d1 execute vanhien-db --file=scripts/cleanup-orphan-data.sql

-- ============================================================
-- STEP 1: Xóa students không thuộc lớp nào
-- ============================================================
-- Trước khi xóa students, phải xóa dữ liệu liên quan (chat, multiverse, submissions, enrollments)

-- 1a. Chat threads của student không có class
DELETE FROM chat_threads
WHERE student_id IN (
  SELECT u.id FROM users u
  WHERE u.role = 'student'
    AND NOT EXISTS (SELECT 1 FROM class_students cs WHERE cs.student_id = u.id)
);

-- 1b. Chat messages của orphaned threads
DELETE FROM chat_messages
WHERE thread_id NOT IN (SELECT id FROM chat_threads);

-- 1c. Multiverse storylines của orphaned students
DELETE FROM student_multiverse
WHERE student_id IN (
  SELECT u.id FROM users u
  WHERE u.role = 'student'
    AND NOT EXISTS (SELECT 1 FROM class_students cs WHERE cs.student_id = u.id)
);

-- 1d. Submissions của orphaned students
DELETE FROM submissions
WHERE student_id IN (
  SELECT u.id FROM users u
  WHERE u.role = 'student'
    AND NOT EXISTS (SELECT 1 FROM class_students cs WHERE cs.student_id = u.id)
);

-- 1e. Xóa enrollment của orphaned students
DELETE FROM class_students
WHERE student_id IN (
  SELECT u.id FROM users u
  WHERE u.role = 'student'
    AND NOT EXISTS (SELECT 1 FROM class_students cs2 WHERE cs2.student_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM classes c WHERE c.id = class_students.class_id)
);

-- 1f. Xóa students không có enrollment nào
DELETE FROM users
WHERE role = 'student'
  AND id NOT IN (SELECT student_id FROM class_students);

-- ============================================================
-- STEP 2: Xóa orphaned chat threads (không có messages)
-- ============================================================
DELETE FROM chat_threads
WHERE id NOT IN (SELECT DISTINCT thread_id FROM chat_messages);

-- ============================================================
-- STEP 3: Xóa activity logs tham chiếu non-existent users
-- ============================================================
DELETE FROM activity_logs
WHERE user_id NOT IN (SELECT id FROM users);

-- ============================================================
-- STEP 4: Xóa chat messages tham chiếu non-existent threads
-- ============================================================
DELETE FROM chat_messages
WHERE thread_id NOT IN (SELECT id FROM chat_threads);

-- ============================================================
-- STEP 5: Xóa multiverse của non-existent students
-- ============================================================
DELETE FROM student_multiverse
WHERE student_id NOT IN (SELECT id FROM users);

-- ============================================================
-- STEP 6: Xóa skill_assessments của non-existent students
-- ============================================================
DELETE FROM skill_assessments
WHERE student_id NOT IN (SELECT id FROM users);

-- ============================================================
-- STEP 7: Xóa ai_warnings của non-existent students
-- ============================================================
DELETE FROM ai_warnings
WHERE student_id NOT IN (SELECT id FROM users);

-- ============================================================
-- VERIFY: Kiểm tra số lượng sau cleanup
-- ============================================================
SELECT 'Students' AS tbl, COUNT(*) AS count FROM users WHERE role = 'student'
UNION ALL
SELECT 'Teachers', COUNT(*) FROM users WHERE role = 'teacher'
UNION ALL
SELECT 'Admins', COUNT(*) FROM users WHERE role = 'admin'
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM class_students
UNION ALL
SELECT 'Submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'ChatThreads', COUNT(*) FROM chat_threads
UNION ALL
SELECT 'ChatMessages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'Multiverse', COUNT(*) FROM student_multiverse
UNION ALL
SELECT 'ActivityLogs', COUNT(*) FROM activity_logs;
