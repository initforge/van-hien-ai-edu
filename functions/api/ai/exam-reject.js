/**
 * POST /api/ai/exam-reject — Discard AI exam preview
 *
 * Body: { previewId }
 */
import { kvDelete } from '../_kv.js';
import { jsonError } from '../_utils.js';

const KV_KEY_PREFIX = 'exam-preview:';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const { previewId } = await request.json();
    if (!previewId) {
      return jsonError('Thiếu previewId.', 400);
    }

    await kvDelete(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/exam-reject error:', error);
    return jsonError('Lỗi khi hủy xem trước.', 500);
  }
}
