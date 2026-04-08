/**
 * POST /api/ai/grade-approve — Save AI grading result to DB
 *
 * Body: { submissionId, scores?, totalScore?, summary? }
 * Teacher can override any field before approving.
 */
import { kvGet, kvDelete } from '../_kv.js';
import { jsonError } from '../_utils.js';
import { logTokenUsage } from '../_tokenLog.js';

const KV_KEY_PREFIX = 'grade-preview:';

async function logActivity(env, user, action, targetType, targetId, details) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), user.id, user.name, user.role, action, targetType, targetId, details).run();
  } catch (e) {
    console.error('activity_log failed:', e);
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const { submissionId, scores, totalScore, summary } = body;

    if (!submissionId) {
      return jsonError('Thiếu submissionId.', 400);
    }

    const preview = await kvGet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${submissionId}`);
    if (!preview) {
      return jsonError('Phiên xem trước đã hết hạn. Vui lòng chấm lại.', 410);
    }

    if (preview.teacherId !== user.id) {
      return jsonError('Không có quyền duyệt bài này.', 403);
    }

    const finalScore = totalScore ?? preview.totalScore;
    const finalSummary = summary || preview.summary || '';
    const finalScores = scores || preview.scores || [];

    // Update submission
    await env.DB.prepare(
      `UPDATE submissions
       SET ai_score = ?, ai_comment = ?,
           status = CASE WHEN status = 'submitted' THEN 'ai_graded' ELSE status END
       WHERE id = ?`
    ).bind(finalScore, finalSummary.slice(0, 1000), submissionId).run();

    // Write per-question scores
    if (finalScores.length) {
      const stmt = env.DB.prepare(
        `UPDATE submission_answers SET ai_score = ? WHERE submission_id = ? AND question_id = ?`
      );
      for (const score of finalScores) {
        if (score.questionId && score.points != null) {
          await stmt.bind(score.points, submissionId, score.questionId).run();
        }
      }
    }

    await kvDelete(env.VANHIEN_KV, `${KV_KEY_PREFIX}${submissionId}`);

    // Log: get student name
    const studentRow = await env.DB.prepare(
      `SELECT u.name FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?`
    ).bind(submissionId).first();
    const submissionRow = await env.DB.prepare(
      `SELECT e.title FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE s.id = ?`
    ).bind(submissionId).first();

    await logActivity(env, user, 'ai_grading_accepted', 'submission', submissionId,
      JSON.stringify({ title: submissionRow?.title, studentName: studentRow?.name, score: finalScore }));

    return new Response(JSON.stringify({
      success: true,
      aiScore: finalScore,
      summary: finalSummary,
      details: finalScores,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/grade-approve error:', error);
    return jsonError('Lỗi khi duyệt kết quả chấm bài.', 500);
  }
}