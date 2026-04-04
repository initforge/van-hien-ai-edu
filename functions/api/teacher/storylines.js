/**
 * GET /api/teacher/storylines — list teacher-authored storylines
 * GET  /api/teacher/storylines?workId=...
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
    const workId = url.searchParams.get('workId');
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    const where = ['st.teacher_id = ?'];
    const binds = [user.id];
    if (workId) { where.push('st.work_id = ?'); binds.push(workId); }

    const [rowsResult, countResult] = await Promise.all([
      env.DB.prepare(`
        SELECT st.id, st.work_id AS workId, st.branch_point AS branchPoint,
               st.title, st.status, st.created_at AS createdAt,
               w.title AS workTitle
        FROM storylines st
        LEFT JOIN works w ON st.work_id = w.id
        WHERE ${where.join(' AND ')}
        ORDER BY st.created_at DESC
        LIMIT ? OFFSET ?`
      ).bind(...binds, limit, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) AS total FROM storylines st WHERE ${where.join(' AND ')}`
      ).bind(...binds).first(),
    ]);

    return cachedJson({
      data: rowsResult.results || [],
      total: countResult?.total || 0,
      limit,
      offset,
    }, { profile: 'dynamic' });
  } catch (e) {
    console.error('teacher/storylines GET error:', e);
    return jsonError('Lỗi khi tải nhánh cốt truyện.', 500);
  }
}
