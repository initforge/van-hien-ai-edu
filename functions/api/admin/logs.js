import { cachedJson } from '../_cache.js';

// GET /api/admin/logs — all activity logs with timezone-aware date filtering
export async function onRequestGet({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const url = new URL(request.url);
    const rawLimit = url.searchParams.get('limit') || '50';
    const rawOffset = url.searchParams.get('offset') || '0';
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit)));
    const offset = Math.max(0, parseInt(rawOffset));
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const role = url.searchParams.get('role');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const binds = [];
    const tz = '+07:00';
    let where = ' WHERE 1=1';
    if (userId) { where += ' AND al.user_id = ?'; binds.push(userId); }
    if (action) { where += ' AND al.action = ?'; binds.push(action); }
    if (role) { where += ' AND al.user_role = ?'; binds.push(role); }
    if (startDate) {
      where += ` AND datetime(al.created_at, '${tz}') >= ?`;
      binds.push(startDate + 'T00:00:00');
    }
    if (endDate) {
      where += ` AND datetime(al.created_at, '${tz}') <= ?`;
      binds.push(endDate + 'T23:59:59');
    }

    const dateCol = `datetime(al.created_at, '${tz}') AS createdAt`;
    const [rowsResult, countResult] = await Promise.all([
      env.DB.prepare(
        `SELECT al.id, al.user_id AS userId, al.user_name AS userName, al.user_role AS userRole, ` +
        `al.action, al.target_type AS targetType, al.target_id AS targetId, ` +
        `al.details, ${dateCol} ` +
        `FROM activity_logs al${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`
      ).bind(...binds, limit, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) AS count FROM activity_logs al${where}`
      ).bind(...binds).first(),
    ]);

    return cachedJson({
      logs: rowsResult?.results || [],
      total: countResult?.count || 0,
      limit,
      offset,
    }, { profile: 'nocache' });
  } catch (e) {
    console.error('admin/logs error:', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), { status: 500 });
  }
}
