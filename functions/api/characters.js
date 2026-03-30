import { cachedJson } from './_cache.js';

// GET /api/characters — list characters
export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return cachedJson({ error: 'Unauthorized' }, { status: 401, profile: 'nocache' });

    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    let rows, total = 0;
    if (user.role === 'teacher') {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          `SELECT c.id, c.name, c.initials, c.role, c.description, c.personality, c.system_prompt AS systemPrompt,
                  c.active, c.work_id AS workId, w.title AS workTitle,
                  c.created_at AS createdAt,
                  (SELECT COUNT(*) FROM chat_messages cm JOIN chat_threads ct ON cm.thread_id = ct.id WHERE ct.character_name = c.name) AS chatCount
           FROM characters c
           LEFT JOIN works w ON c.work_id = w.id
           WHERE c.teacher_id = ?
           ORDER BY c.created_at DESC
           LIMIT ? OFFSET ?`
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM characters WHERE teacher_id = ?").bind(user.id).first(),
      ]);
      rows = rowsResult.results || [];
      total = countResult?.total || 0;
    } else {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          `SELECT c.id, c.name, c.initials, c.role, c.description,
                  c.work_id AS workId, w.title AS workTitle
           FROM characters c
           JOIN works w ON c.work_id = w.id
           WHERE c.active = 1 AND w.status = 'analyzed'
           ORDER BY w.grade ASC, c.name ASC
           LIMIT ? OFFSET ?`
        ).bind(limit, offset).all(),
        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM characters c JOIN works w ON c.work_id = w.id WHERE c.active = 1 AND w.status = 'analyzed'"
        ).first(),
      ]);
      rows = rowsResult.results || [];
      total = countResult?.total || 0;
    }

    return cachedJson({ data: rows, total, limit, offset }, { profile: 'dynamic' });
  } catch (e) {
    console.error('characters GET error:', e);
    return cachedJson({ error: 'Lỗi khi tải nhân vật.' }, { status: 500, profile: 'nocache' });
  }
}

// POST /api/characters — create character (teacher only)
export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { name, initials, role, description, personality, systemPrompt, workId } = body;

    if (!name || !initials) {
      return new Response(JSON.stringify({ error: 'Thiếu tên hoặc chữ viết tắt.' }), { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const shortInitials = initials.trim().toUpperCase().slice(0, 3);

    await env.DB.prepare(
      `INSERT INTO characters (id, name, initials, role, description, personality, system_prompt, work_id, teacher_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, name, shortInitials, role || null, description || null,
       personality || null, systemPrompt || null, workId || null, user.id, now).run();

    return cachedJson({ id, name, initials: shortInitials, active: 1, createdAt: now }, { status: 201, profile: 'nocache' });
  } catch (e) {
    console.error('characters POST error:', e);
    return cachedJson({ error: 'Lỗi khi tạo nhân vật.' }, { status: 500, profile: 'nocache' });
  }
}

// PATCH /api/characters — update / toggle active (teacher only)
export async function onRequestPatch({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { id, active, name, initials, role, description, personality, systemPrompt } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Thiếu id.' }), { status: 400 });
    }

    const char = await env.DB.prepare(
      "SELECT id FROM characters WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();

    if (!char) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy hoặc không có quyền.' }), { status: 403 });
    }

    const fields = [];
    const values = [];
    if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0); }
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (initials !== undefined) { fields.push('initials = ?'); values.push(initials.trim().toUpperCase().slice(0, 3)); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (personality !== undefined) { fields.push('personality = ?'); values.push(personality); }
    if (systemPrompt !== undefined) { fields.push('system_prompt = ?'); values.push(systemPrompt); }

    if (fields.length === 0) {
      return new Response(JSON.stringify({ error: 'Không có trường nào để cập nhật.' }), { status: 400 });
    }

    values.push(id);
    await env.DB.prepare(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('characters PATCH error:', e);
    return cachedJson({ error: 'Lỗi khi cập nhật.' }, { status: 500, profile: 'nocache' });
  }
}
