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

    // Build parameterized WHERE clauses (applied identically to both subqueries)
    // created_at stored as UTC; convert to local (+07:00) for comparison
    const tz = '+07:00';
    const studentWhere = (b) => {
      let sql = `user_role = 'student' AND user_id IN (SELECT student_id FROM class_students cs2 JOIN classes c2 ON c2.id = cs2.class_id WHERE c2.teacher_id = ?)`;
      b.push(user.id);
      if (actionFilter) { sql += ' AND action = ?'; b.push(actionFilter); }
      if (startDate && endDate) { sql += ` AND datetime(created_at, '${tz}') >= ? AND datetime(created_at, '${tz}') <= ?`; b.push(startDate + 'T00:00:00', endDate + 'T23:59:59'); }
      else if (startDate) { sql += ` AND datetime(created_at, '${tz}') >= ?`; b.push(startDate + 'T00:00:00'); }
      return sql;
    };
    const teacherWhere = (b) => {
      let sql = 'user_id = ? AND user_role = \'teacher\'';
      b.push(user.id);
      if (actionFilter) { sql += ' AND action = ?'; b.push(actionFilter); }
      if (startDate && endDate) { sql += ` AND datetime(created_at, '${tz}') >= ? AND datetime(created_at, '${tz}') <= ?`; b.push(startDate + 'T00:00:00', endDate + 'T23:59:59'); }
      else if (startDate) { sql += ` AND datetime(created_at, '${tz}') >= ?`; b.push(startDate + 'T00:00:00'); }
      return sql;
    };

    // Count
    const countBinds = [];
    const countQuery =
      `SELECT COUNT(*) AS total FROM (` +
      `SELECT 1 FROM activity_logs WHERE ${studentWhere(countBinds)}` +
      ` UNION ALL ` +
      `SELECT 1 FROM activity_logs WHERE ${teacherWhere(countBinds)}` +
      `)`;
    const countResult = await env.DB.prepare(countQuery).bind(...countBinds).first().catch(() => ({ total: 0 }));

    // Rows — bind same params twice (once per subquery), then limit/offset
    const rowsBinds = [];
    const rowsQuery =
      `SELECT * FROM (` +
      `SELECT id, user_id, user_name, user_role, action, target_type, target_id, details, datetime(created_at, '+07:00') AS created_at FROM activity_logs WHERE ${studentWhere(rowsBinds)}` +
      ` UNION ALL ` +
      `SELECT id, user_id, user_name, user_role, action, target_type, target_id, details, datetime(created_at, '+07:00') AS created_at FROM activity_logs WHERE ${teacherWhere(rowsBinds)}` +
      `) ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    rowsBinds.push(limit, offset);
    const rowsResult = await env.DB.prepare(rowsQuery).bind(...rowsBinds).all().catch(() => ({ results: [] }));
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
