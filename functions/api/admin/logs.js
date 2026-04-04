import { cachedJson } from '../_cache.js';

export async function onRequestGet({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const role = url.searchParams.get('role');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let query = `
      SELECT
        al.id,
        al.user_id AS userId,
        al.user_name AS userName,
        al.user_role AS userRole,
        al.action,
        al.target_type AS targetType,
        al.target_id AS targetId,
        al.details,
        al.ip,
        al.created_at AS createdAt
      FROM activity_logs al
      WHERE 1=1
    `;
    const binds = [];
    let countQuery = "SELECT COUNT(*) AS count FROM activity_logs al WHERE 1=1";
    const countBinds = [];

    if (userId) {
      query += " AND al.user_id = ?";
      binds.push(userId);
      countQuery += " AND al.user_id = ?";
      countBinds.push(userId);
    }
    if (action) {
      query += " AND al.action = ?";
      binds.push(action);
      countQuery += " AND al.action = ?";
      countBinds.push(action);
    }
    if (role) {
      query += " AND al.user_role = ?";
      binds.push(role);
      countQuery += " AND al.user_role = ?";
      countBinds.push(role);
    }
    if (startDate) {
      query += " AND al.created_at >= ?";
      binds.push(startDate);
      countQuery += " AND al.created_at >= ?";
      countBinds.push(startDate);
    }
    if (endDate) {
      query += " AND al.created_at <= ?";
      binds.push(endDate);
      countQuery += " AND al.created_at <= ?";
      countBinds.push(endDate);
    }

    query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
    binds.push(limit, offset);

    const [{ results }, totalResult] = await Promise.all([
      env.DB.prepare(query).bind(...binds).all(),
      env.DB.prepare(countQuery).bind(...countBinds).first(),
    ]);

    return cachedJson({
      logs: results || [],
      total: totalResult?.count || 0,
      limit,
      offset,
    }, { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), { status: 500 });
  }
}
