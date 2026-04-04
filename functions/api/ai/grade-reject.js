/**
 * POST /api/ai/grade-reject — Discard AI grading preview
 *
 * Body: { submissionId }
 */
import { kvDelete } from '../_kv.js';
import { jsonError } from '../_utils.js';

const KV_KEY_PREFIX = 'grade-preview:';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const { submissionId } = await request.json();
    if (!submissionId) {
      return jsonError('Thiếu submissionId.', 400);
    }

    await kvDelete(env.VANHIEN_KV, `${KV_KEY_PREFIX}${submissionId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/grade-reject error:', error);
    return jsonError('Lỗi khi hủy xem trước.', 500);
  }
}