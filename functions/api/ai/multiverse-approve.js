/**
 * POST /api/ai/multiverse-approve — Save AI-previewed multiverse storyline to DB
 *
 * Body: { previewId, title?, content?, moral? }
 */
import { kvGet, kvDelete } from '../_kv.js';
import { jsonError } from '../_utils.js';

const KV_KEY_PREFIX = 'multiverse-preview:';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const { previewId, title, content, moral } = body;

    if (!previewId) {
      return jsonError('Thiếu previewId.', 400);
    }

    const preview = await kvGet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`);
    if (!preview) {
      return jsonError('Phiên xem trước đã hết hạn. Vui lòng tạo lại.', 410);
    }

    if (preview.userId !== user.id) {
      return jsonError('Không có quyền duyệt nhánh này.', 403);
    }

    const storylineId = crypto.randomUUID();
    const now = new Date().toISOString();

    // For students: insert as published (their own multiverse branch)
    // For teachers: insert as draft (teacher can review before publishing)
    const status = user.role === 'teacher' ? 'draft' : 'published';

    await env.DB.prepare(
      `INSERT INTO storylines (id, work_id, student_id, teacher_id, branch_point, title, content, moral, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      storylineId,
      preview.workId,
      user.role === 'student' ? user.id : null,
      user.role === 'teacher' ? user.id : null,
      preview.branchPoint,
      title?.trim() || preview.title || '',
      content || preview.content || '',
      moral?.trim() || preview.moral || '',
      status,
      now
    ).run();

    await kvDelete(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`);

    return new Response(JSON.stringify({
      success: true,
      id: storylineId,
      title: title?.trim() || preview.title || '',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/multiverse-approve error:', error);
    return jsonError('Lỗi khi duyệt đa vũ trụ.', 500);
  }
}
