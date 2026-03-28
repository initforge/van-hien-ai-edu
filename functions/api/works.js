import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    if (user.role === 'teacher') {
      const result = await env.DB.prepare(
        "SELECT id, title, author, grade, genre, content, status, created_at AS createdAt FROM works WHERE teacher_id = ? ORDER BY created_at DESC"
      ).bind(user.id).all();
      return cachedJson(result.results || [], { profile: 'dynamic' });
    } else {
      const result = await env.DB.prepare(
        "SELECT id, title, author, grade, genre, status, created_at AS createdAt FROM works WHERE status = 'analyzed' ORDER BY created_at DESC"
      ).all();
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
      "INSERT INTO works (id, title, author, grade, genre, content, status, teacher_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, body.title, body.author, body.grade || null, body.genre || null, body.content || null, 'pending', user.id, now).run();

    return cachedJson({ id, title: body.title, author: body.author, status: 'pending', createdAt: now }, { profile: 'nocache' });
  } catch (e) {
    return cachedJson({ error: 'Failed to create work', details: String(e) }, { status: 500, profile: 'nocache' });
  }
}
