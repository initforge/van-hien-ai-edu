import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return cachedJson({ error: 'Unauthorized' }, { status: 401, profile: 'nocache' });

    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    if (user.role === 'teacher') {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          "SELECT id, title, author, grade, genre, content, status, created_at AS createdAt FROM works WHERE teacher_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM works WHERE teacher_id = ?").bind(user.id).first(),
      ]);
      return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
    } else {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          "SELECT id, title, author, grade, genre, status, created_at AS createdAt FROM works WHERE status = 'analyzed' ORDER BY created_at DESC LIMIT ? OFFSET ?"
        ).bind(limit, offset).all(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM works WHERE status = 'analyzed'").first(),
      ]);
      return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
    }
  } catch (e) {
    console.error('works GET error:', e);
    return cachedJson({ error: 'Lỗi khi tải tác phẩm.' }, { status: 500, profile: 'nocache' });
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

    return cachedJson({ id, title: body.title, author: body.author, status: 'pending', createdAt: now }, { status: 201, profile: 'nocache' });
  } catch (e) {
    console.error('works POST error:', e);
    return cachedJson({ error: 'Lỗi khi tạo tác phẩm. Vui lòng thử lại.' }, { status: 500, profile: 'nocache' });
  }
}
