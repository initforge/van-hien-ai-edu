/**
 * GET /api/activity — Teacher-scoped activity feed (safe parameterized queries)
 * Query params: ?limit=10&offset=0&action=&startDate=&endDate=
 */
import { cachedJson } from './_cache.js';
import { jsonError } from './_utils.js';

export async function onRequestGet({ env, data, request }) {
  try {
    if (!data?.user || data.user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }
    const user = data.user;
    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
    const actionFilter = url.searchParams.get('action') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    // Build parameterized filter
    const binds = [user.id, user.id];
    let actionClause = '';
    let dateClause = '';
    if (actionFilter) { actionClause = 'AND action = ?'; binds.push(actionFilter); }
    if (startDate && endDate) {
      dateClause = 'AND created_at >= ? AND created_at <= ?';
      binds.push(startDate, endDate);
    } else if (startDate) {
      dateClause = 'AND created_at >= ?';
      binds.push(startDate);
    }

    const studentBinds = [user.id, ...(actionFilter ? [actionFilter] : []), ...(startDate && endDate ? [startDate, endDate] : startDate ? [startDate] : [])];
    const teacherBinds = [user.id, ...(actionFilter ? [actionFilter] : []), ...(startDate && endDate ? [startDate, endDate] : startDate ? [startDate] : [])];

    // Count
    const countQuery = `
      SELECT COUNT(*) AS total FROM (
        SELECT 1 FROM activity_logs
        WHERE user_role = 'student'
          AND user_id IN (SELECT student_id FROM class_students cs2 JOIN classes c2 ON c2.id = cs2.class_id WHERE c2.teacher_id = ?)
          ${actionClause}
          ${dateClause}
        UNION ALL
        SELECT 1 FROM activity_logs
        WHERE user_id = ? AND user_role = 'teacher'
          ${actionClause}
          ${dateClause}
      )
    `;
    const countBinds = [...studentBinds, ...teacherBinds];
    const countResult = await env.DB.prepare(countQuery).bind(...countBinds).first().catch(e => ({ total: 0 }));

    // Rows
    const rowsQuery = `
      SELECT id, user_id, user_name, user_role, action, target_type, target_id, details, created_at
      FROM (
        SELECT id, user_id, user_name, user_role, action, target_type, target_id, details, created_at
        FROM activity_logs
        WHERE user_role = 'student'
          AND user_id IN (SELECT student_id FROM class_students cs3 JOIN classes c3 ON c3.id = cs3.class_id WHERE c3.teacher_id = ?)
          ${actionClause}
          ${dateClause}
        UNION ALL
        SELECT id, user_id, user_name, user_role, action, target_type, target_id, details, created_at
        FROM activity_logs
        WHERE user_id = ? AND user_role = 'teacher'
          ${actionClause}
          ${dateClause}
      )
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rowsBinds = [...countBinds, limit, offset];
    const rowsResult = await env.DB.prepare(rowsQuery).bind(...rowsBinds).all().catch(e => ({ results: [] }));
    const rows = rowsResult?.results || [];

    const activities = rows.map(row => {
      let details = {};
      try { details = row.details ? JSON.parse(row.details) : {}; } catch { /* ignore */ }
      return { ...row, details };
    });

    return cachedJson({ activities, total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
  } catch (error) {
    console.error('activity.js error:', error);
    return jsonError(String(error?.message || 'Lỗi khi tải hoạt động.'), 500);
  }
}
