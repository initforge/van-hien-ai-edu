/**
 * Cloudflare Pages Functions Cron — scheduled/warnings
 *
 * Runs daily at 07:00 (configured in wrangler.toml triggers).
 * Generates W7 warnings: exams approaching deadline with low submission rate.
 *
 * Also invalidates KV warning caches for all teachers.
 */
import { kvGet, kvSet, kvDelete } from '../_kv.js';

export async function scheduled(controller, env) {
  try {
    console.log('[cron/warnings] Starting daily warnings scan...');

    // 1. Get all teachers
    const teachers = await env.DB.prepare(
      `SELECT DISTINCT c.teacher_id FROM classes c WHERE c.teacher_id IS NOT NULL`
    ).all();

    let totalWarnings = 0;

    for (const { teacher_id } of teachers.results || []) {
      if (!teacher_id) continue;

      // 2. Find exams with deadline in next 48 hours, <50% submission rate
      const approaching = await env.DB.prepare(`
        SELECT e.id AS examId, e.title AS examTitle, e.deadline,
               c.teacher_id, c.name AS className, c.id AS classId,
               COUNT(DISTINCT cs.student_id) AS totalStudents,
               COUNT(DISTINCT s.id) AS submittedCount
        FROM exams e
        JOIN classes c ON e.class_id = c.id
        JOIN class_students cs ON cs.class_id = c.id
        LEFT JOIN submissions s ON s.exam_id = e.id AND s.student_id = cs.student_id
        WHERE c.teacher_id = ?
          AND e.status = 'published'
          AND e.deadline IS NOT NULL
          AND julianday(e.deadline) - julianday('now', 'localtime') BETWEEN 0 AND 2
        GROUP BY e.id
        HAVING COUNT(DISTINCT s.id) < COUNT(DISTINCT cs.student_id) * 0.5
      `).bind(teacher_id).all();

      for (const row of approaching.results || []) {
        const submissionRate = Math.round((row.submittedCount / row.totalStudents) * 100);

        // Check if warning already exists (avoid duplicates)
        const existing = await env.DB.prepare(
          `SELECT id FROM ai_warnings
           WHERE teacher_id = ? AND exam_id = ? AND type = 'W7' AND dismissed = 0
           LIMIT 1`
        ).bind(teacher_id, row.examId).first();

        if (!existing) {
          const warningId = crypto.randomUUID();
          await env.DB.prepare(
            `INSERT INTO ai_warnings
              (id, teacher_id, type, severity, exam_id, class_id, class_name,
               message, metadata, created_at)
             VALUES (?, ?, 'W7', 'medium', ?, ?, ?, ?, ?, datetime('now'))`
          ).bind(
            warningId,
            teacher_id,
            row.examId,
            row.classId,
            row.className,
            `Đề "${row.examTitle}" sắp hết hạn (${row.deadline}) — chỉ ${submissionRate}% học sinh nộp (${row.submittedCount}/${row.totalStudents})`,
            JSON.stringify({ deadline: row.deadline, submitted: row.submittedCount, total: row.totalStudents, rate: submissionRate })
          ).run();
          totalWarnings++;
        }
      }

      // 3. Invalidate KV cache for this teacher (so next GET /api/warnings fetches fresh data)
      await kvDelete(env.VANHIEN_KV, `warnings:${teacher_id}`);
    }

    console.log(`[cron/warnings] Done. Generated ${totalWarnings} W7 warnings across ${teachers.results?.length || 0} teachers.`);

    controller.resume();
  } catch (error) {
    console.error('[cron/warnings] Error:', error);
    controller.error(new Error('Warnings cron failed: ' + error.message));
  }
}
