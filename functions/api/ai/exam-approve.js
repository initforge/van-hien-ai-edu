/**
 * POST /api/ai/exam-approve — Save AI-previewed exam to DB
 *
 * Body: { previewId, title?, questions? }
 * Teacher can override any question field before approving.
 */
import { kvGet, kvDelete } from '../_kv.js';
import { jsonError } from '../_utils.js';

const KV_KEY_PREFIX = 'exam-preview:';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const { previewId, title, questions } = body;

    if (!previewId) {
      return jsonError('Thiếu previewId.', 400);
    }

    // Get preview from KV
    const preview = await kvGet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`);
    if (!preview) {
      return jsonError('Phiên xem trước đã hết hạn. Vui lòng tạo lại.', 410);
    }

    if (preview.teacherId !== user.id) {
      return jsonError('Không có quyền duyệt đề này.', 403);
    }

    const finalTitle = title?.trim() || preview.title;
    const finalQuestions = questions || preview.questions;

    if (!finalQuestions?.length) {
      return jsonError('Không có câu hỏi nào để lưu.', 400);
    }

    // Create exam in DB
    const examId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, deadline, ai_generated, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NULL, 1, ?)`
    ).bind(
      examId,
      finalTitle,
      preview.type,
      preview.workId,
      preview.classId,
      user.id,
      preview.duration,
      now
    ).run();

    // Insert questions
    for (let i = 0; i < finalQuestions.length; i++) {
      const q = finalQuestions[i];
      await env.DB.prepare(
        `INSERT INTO questions (id, exam_id, content, type, points, rubric, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        examId,
        String(q.content || '').slice(0, 500),
        String(q.type || 'essay'),
        Math.max(1, Math.min(10, Number(q.points) || 2)),
        String(q.rubric || '').slice(0, 500),
        i + 1
      ).run();
    }

    // Delete KV key
    await kvDelete(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`);

    return new Response(JSON.stringify({
      success: true,
      examId,
      title: finalTitle,
      questions: finalQuestions,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/exam-approve error:', error);
    return jsonError('Lỗi khi duyệt đề thi.', 500);
  }
}
