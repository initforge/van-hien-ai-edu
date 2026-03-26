export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT id, title, type, work_id AS workId, class_id AS classId, teacher_id AS teacherId, duration, status, deadline, created_at AS createdAt FROM exams ORDER BY created_at DESC"
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
      "INSERT INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, body.title, body.type || 'exercise', body.workId || null, body.classId || null, 'teacher-1', body.duration || 60, body.status || 'draft', now).run();

    return Response.json({ id, title: body.title, type: body.type || 'exercise', status: 'draft', createdAt: now });
  } catch (e) {
    return Response.json({ error: 'Failed to create exam', details: String(e) }, { status: 500 });
  }
}
