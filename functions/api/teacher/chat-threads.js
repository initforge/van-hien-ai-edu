/**
 * GET /api/teacher/chat-threads — list all student chat threads across teacher's characters
 *
 * Query params:
 *   characterId — filter by character name
 *   classId     — filter by class (via exam/class join)
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
    const classId = url.searchParams.get('classId');

    const rawLimit = parseInt(url.searchParams.get('limit') || '20', 10);
    const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100);
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

    const where = ['c.teacher_id = ?'];
    const binds = [user.id];
    if (characterName) { where.push('ct.character_name = ?'); binds.push(characterName); }
    if (classId)       { where.push('e.class_id = ?'); binds.push(classId); }

    const whereStr = where.join(' AND ');

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
        LEFT JOIN works w ON ct.work_id = w.id
        LEFT JOIN exams e ON e.work_id = w.id
        WHERE ${whereStr}
        GROUP BY ct.id
        ORDER BY ct.created_at DESC
        LIMIT ? OFFSET ?`
      ).bind(...binds, limit, offset).all(),
      env.DB.prepare(`
        SELECT COUNT(*) AS total
        FROM (
          SELECT ct.id FROM chat_threads ct
          JOIN characters c ON ct.character_name = c.name
          LEFT JOIN works w ON ct.work_id = w.id
          LEFT JOIN exams e ON e.work_id = w.id
          WHERE ${whereStr}
          GROUP BY ct.id
        )`
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
