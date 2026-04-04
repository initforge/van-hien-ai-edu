/**
 * GET /api/teacher/chat-threads — list all student chat threads across teacher's characters
 *
 * Query params:
 *   characterId — filter by character name
 *   limit, offset — pagination
 */
import { cachedJson } from '../_cache.js';
import { jsonError } from '../_utils.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const url = new URL(request.url);
    const characterName = url.searchParams.get('characterId');
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    const where = ['c.teacher_id = ?'];
    const binds = [user.id];
    if (characterName) { where.push('ct.character_name = ?'); binds.push(characterName); }

    const [rowsResult, countResult] = await Promise.all([
      env.DB.prepare(`
        SELECT ct.id, ct.character_name AS characterName,
               ct.work_id AS workId,
               u.name AS studentName,
               ct.created_at AS createdAt,
               (SELECT COUNT(*) FROM chat_messages cm WHERE cm.thread_id = ct.id) AS messageCount
        FROM chat_threads ct
        JOIN characters c ON ct.character_name = c.name
        JOIN users u ON ct.student_id = u.id
        WHERE ${where.join(' AND ')}
        ORDER BY ct.created_at DESC
        LIMIT ? OFFSET ?`
      ).bind(...binds, limit, offset).all(),
      env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM chat_threads ct
        JOIN characters c ON ct.character_name = c.name
        WHERE ${where.join(' AND ')}`
      ).bind(...binds).first(),
    ]);

    return cachedJson({
      threads: rowsResult.results || [],
      total: countResult?.total || 0,
      limit,
      offset,
    }, { profile: 'dynamic' });
  } catch (e) {
    console.error('teacher/chat-threads error:', e);
    return jsonError('Lỗi khi tải lịch sử chat.', 500);
  }
}
