/**
 * scripts/cleanup-orphan-data.js
 * Dọn dẹp orphan records trong D1 database.
 *
 * Chạy: node scripts/cleanup-orphan-data.js
 * Yêu cầu: NODE_ENV=production npx wrangler d1 execute vanhien-db --file=scripts/cleanup-orphan-data.sql
 *
 * Hoặc chạy trực tiếp qua API admin (nếu có endpoint cleanup).
 */

import { D1Database } from '@cloudflare/workers-types';

const ORPHAN_QUERIES = [
  // 1. Students không thuộc lớp nào → xóa học sinh + toàn bộ dữ liệu liên quan
  {
    name: 'Students without any class enrollment',
    findSql: `
      SELECT u.id, u.name, u.role, u.created_at
      FROM users u
      WHERE u.role = 'student'
        AND NOT EXISTS (SELECT 1 FROM class_students cs WHERE cs.student_id = u.id)
    `,
    cleanupSql: `
      DELETE FROM users
      WHERE role = 'student'
        AND id NOT IN (SELECT student_id FROM class_students)
    `,
    severity: 'HIGH',
  },

  // 2. Chat threads không có messages (thread rỗng) → xóa thread
  {
    name: 'Orphan chat threads (no messages)',
    findSql: `
      SELECT ct.id, ct.student_id, ct.created_at
      FROM chat_threads ct
      WHERE NOT EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.thread_id = ct.id)
    `,
    cleanupSql: `
      DELETE FROM chat_threads
      WHERE id NOT IN (SELECT DISTINCT thread_id FROM chat_messages)
    `,
    severity: 'LOW',
  },

  // 3. Activity logs tham chiếu user không tồn tại → xóa logs
  {
    name: 'Activity logs referencing non-existent users',
    findSql: `
      SELECT al.id, al.user_id, al.action, al.created_at
      FROM activity_logs al
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = al.user_id)
    `,
    cleanupSql: `
      DELETE FROM activity_logs
      WHERE user_id NOT IN (SELECT id FROM users)
    `,
    severity: 'LOW',
  },

  // 4. Chat messages tham chiếu thread không tồn tại → xóa messages
  {
    name: 'Chat messages referencing non-existent threads',
    findSql: `
      SELECT cm.id, cm.thread_id
      FROM chat_messages cm
      WHERE NOT EXISTS (SELECT 1 FROM chat_threads ct WHERE ct.id = cm.thread_id)
    `,
    cleanupSql: `
      DELETE FROM chat_messages
      WHERE thread_id NOT IN (SELECT id FROM chat_threads)
    `,
    severity: 'LOW',
  },

  // 5. Multiverse storylines của student không tồn tại → xóa storyline
  {
    name: 'Multiverse storylines for non-existent students',
    findSql: `
      SELECT sm.id, sm.student_id
      FROM student_multiverse sm
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = sm.student_id)
    `,
    cleanupSql: `
      DELETE FROM student_multiverse
      WHERE student_id NOT IN (SELECT id FROM users)
    `,
    severity: 'LOW',
  },

  // 6. Skill assessments của student không tồn tại → xóa assessments
  {
    name: 'Skill assessments for non-existent students',
    findSql: `
      SELECT sa.id, sa.student_id
      FROM skill_assessments sa
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = sa.student_id)
    `,
    cleanupSql: `
      DELETE FROM skill_assessments
      WHERE student_id NOT IN (SELECT id FROM users)
    `,
    severity: 'LOW',
  },
];

// Nếu chạy trực tiếp qua CLI
if (typeof process !== 'undefined' && process.argv[1]?.includes('cleanup-orphan-data')) {
  console.log('⚠️  Chạy script này bằng wrangler:');
  console.log('');
  console.log('  # Dry-run (xem trước):');
  console.log('  npx wrangler d1 execute vanhien-db --command="SELECT ..."');
  console.log('');
  console.log('  # Xóa orphans (STUDENTS):');
  console.log('  npx wrangler d1 execute vanhien-db --command="DELETE FROM users WHERE role = \'student\' AND id NOT IN (SELECT student_id FROM class_students)"');
  console.log('');
  console.log('  # Xóa orphans (CHAT THREADS):');
  console.log('  npx wrangler d1 execute vanhien-db --command="DELETE FROM chat_threads WHERE id NOT IN (SELECT DISTINCT thread_id FROM chat_messages)"');
  console.log('');
  console.log('  # Xóa orphans (ACTIVITY LOGS):');
  console.log('  npx wrangler d1 execute vanhien-db --command="DELETE FROM activity_logs WHERE user_id NOT IN (SELECT id FROM users)"');
  console.log('');
  console.log('  # Xóa orphans (CHAT MESSAGES):');
  console.log('  npx wrangler d1 execute vanhien-db --command="DELETE FROM chat_messages WHERE thread_id NOT IN (SELECT id FROM chat_threads)"');
  console.log('');
  console.log('  # Xóa orphans (MULTIVERSE):');
  console.log('  npx wrangler d1 execute vanhien-db --command="DELETE FROM student_multiverse WHERE student_id NOT IN (SELECT id FROM users)"');
  console.log('');
  console.log('  # Xóa orphans (SKILL ASSESSMENTS):');
  console.log('  npx wrangler d1 execute vanhien-db --command="DELETE FROM skill_assessments WHERE student_id NOT IN (SELECT id FROM users)"');
}

export { ORPHAN_QUERIES };
