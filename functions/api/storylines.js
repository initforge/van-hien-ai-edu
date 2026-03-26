export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT s.id, s.work_id AS workId, s.branch_point AS branchPoint, s.created_at AS createdAt, w.title AS workTitle FROM storylines s LEFT JOIN works w ON s.work_id = w.id ORDER BY s.created_at DESC"
    ).all();
    return Response.json(result.results || []);
  } catch (e) {
    return Response.json([], { headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO storylines (id, work_id, branch_point, created_at) VALUES (?, ?, ?, ?)"
    ).bind(id, body.workId, body.branchPoint, now).run();

    return Response.json({ id, workId: body.workId, branchPoint: body.branchPoint, createdAt: now });
  } catch (e) {
    return Response.json({ error: 'Failed to create storyline', details: String(e) }, { status: 500 });
  }
}
