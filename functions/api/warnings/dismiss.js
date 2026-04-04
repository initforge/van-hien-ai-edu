/**
 * POST /api/warnings/dismiss — Dismiss one or more warnings
 *
 * Body: { warningId: string }            — dismiss single
 *    or { type: string, studentId: string } — dismiss all of type for student
 */
import { kvDelete } from '../_kv.js';
import { cachedJson } from '../_cache.js';
import { jsonError } from '../_utils.js';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();

    if (body.warningId) {
      await env.DB.prepare(
        `UPDATE ai_warnings SET dismissed = 1 WHERE id = ? AND teacher_id = ?`
      ).bind(body.warningId, user.id).run();
    } else if (body.type && body.studentId) {
      await env.DB.prepare(
        `UPDATE ai_warnings SET dismissed = 1
         WHERE teacher_id = ? AND type = ? AND student_id = ? AND dismissed = 0`
      ).bind(user.id, body.type, body.studentId).run();
    } else {
      return jsonError('Thiếu warningId hoặc type+studentId.', 400);
    }

    // Invalidate warnings cache
    await kvDelete(env.VANHIEN_KV, `warnings:${user.id}`);

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (error) {
    console.error('warnings/dismiss.js error:', error);
    return cachedJson({ error: 'Failed to dismiss warning.' }, { status: 500, profile: 'nocache' });
  }
}
