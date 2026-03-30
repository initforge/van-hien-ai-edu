/**
 * Shared pagination helper for list endpoints.
 * Reads ?limit= and ?offset= from request URL, applies sane defaults.
 * @param {Request} request
 * @returns {{ limit: number, offset: number }}
 */
export function getPagination(request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20), 100);
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
  return { limit, offset };
}

/**
 * Run a paginated SELECT query.
 * Returns { results, total } where results includes LIMIT/OFFSET slice.
 * @param {D1Database} db
 * @param {string} baseSql   Full SELECT without LIMIT/OFFSET
 * @param {any[]} bindParams
 * @param {{ limit: number, offset: number }} pagination
 * @param {boolean} hasWhere  Whether baseSql already has a WHERE clause (for count suffix)
 * @returns {Promise<{ results: any[], total: number }>}
 */
export async function paginatedQuery(db, baseSql, bindParams, { limit, offset }, hasWhere = false) {
  // Count total rows
  const countSql = hasWhere
    ? `SELECT COUNT(*) AS total FROM (${baseSql}) AS _cnt`
    : `SELECT COUNT(*) AS total FROM (${baseSql}) AS _cnt`;
  const countStmt = db.prepare(countSql);
  const countResult = await (bindParams.length > 0 ? countStmt.bind(...bindParams) : countStmt).first();
  const total = countResult?.total ?? 0;

  // Fetch page
  const pageSql = `${baseSql} LIMIT ? OFFSET ?`;
  const pageResult = await db.prepare(pageSql).bind(...bindParams, limit, offset).all();

  return { results: pageResult.results ?? [], total };
}
