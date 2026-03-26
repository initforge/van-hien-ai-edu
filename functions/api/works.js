export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT id, title, author, grade, genre, content, status, teacher_id AS teacherId, created_at AS createdAt FROM works ORDER BY created_at DESC"
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
      "INSERT INTO works (id, title, author, grade, genre, content, status, teacher_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, body.title, body.author, body.grade || null, body.genre || null, body.content || null, 'pending', 'teacher-1', now).run();

    return Response.json({ id, title: body.title, author: body.author, status: 'pending', createdAt: now });
  } catch (e) {
    return Response.json({ error: 'Failed to create work', details: String(e) }, { status: 500 });
  }
}
