import { cachedJson } from '../_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');

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

    if (userId) {
      query += " AND al.user_id = ?";
      binds.push(userId);
    }
    if (action) {
      query += " AND al.action = ?";
      binds.push(action);
    }

    query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
    binds.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...binds).all();

    const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM activity_logs").first();

    return cachedJson({
      logs: results || [],
      total: total?.count || 0,
      limit,
      offset,
    }, { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), { status: 500 });
  }
}
