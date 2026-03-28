import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    if (user.role === 'teacher') {
      const result = await env.DB.prepare(
        "SELECT id, title, type, work_id AS workId, class_id AS classId, duration, status, deadline, created_at AS createdAt FROM exams WHERE teacher_id = ? ORDER BY created_at DESC"
      ).bind(user.id).all();
      return cachedJson(result.results || [], { profile: 'dynamic' });
    } else {
      const result = await env.DB.prepare(
        "SELECT e.id, e.title, e.type, e.work_id AS workId, e.duration, e.status, e.deadline, e.created_at AS createdAt FROM exams e JOIN class_students cs ON e.class_id = cs.class_id WHERE cs.student_id = ? AND e.status = 'published' ORDER BY e.created_at DESC"
      ).bind(user.id).all();
      return cachedJson(result.results || [], { profile: 'dynamic' });
    }
  } catch (e) {
    return cachedJson([], { profile: 'dynamic' });
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, body.title, body.type || 'exercise', body.workId || null, body.classId || null, user.id, body.duration || 60, body.status || 'draft', body.deadline || null, now).run();

    return cachedJson({ id, title: body.title, type: body.type || 'exercise', status: 'draft', createdAt: now }, { profile: 'nocache' });
  } catch (e) {
    return cachedJson({ error: 'Failed to create exam', details: String(e) }, { status: 500, profile: 'nocache' });
  }
}
