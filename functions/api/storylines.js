import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'student') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const result = await env.DB.prepare(
      "SELECT s.id, s.work_id AS workId, s.branch_point AS branchPoint, s.created_at AS createdAt, w.title AS workTitle FROM storylines s LEFT JOIN works w ON s.work_id = w.id WHERE s.student_id = ? ORDER BY s.created_at DESC"
    ).bind(user.id).all();
    return cachedJson(result.results || [], { profile: 'dynamic' });
  } catch (e) {
    return cachedJson([], { profile: 'dynamic' });
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'student') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO storylines (id, work_id, student_id, branch_point, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, body.workId, user.id, body.branchPoint, now).run();

    return cachedJson({ id, workId: body.workId, branchPoint: body.branchPoint, createdAt: now }, { profile: 'nocache' });
  } catch (e) {
    return cachedJson({ error: 'Failed to create storyline', details: String(e) }, { status: 500, profile: 'nocache' });
  }
}
