import { cachedJson } from '../_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const { results } = await env.DB.prepare(`
      SELECT
        c.id,
        c.name,
        c.teacher_id AS teacherId,
        u.name AS teacherName,
        u.email AS teacherEmail,
        c.created_at AS createdAt,
        (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS studentCount
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.created_at DESC
    `).all();

    return cachedJson(results || [], { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch classes' }), { status: 500 });
  }
}

export async function onRequestPost({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    const { name, teacherId } = body;

    if (!name || !teacherId) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const teacher = await env.DB.prepare(
      "SELECT id FROM users WHERE id = ? AND role = 'teacher'"
    ).bind(teacherId).first();

    if (!teacher) {
      return new Response(JSON.stringify({ error: 'Teacher not found' }), { status: 404 });
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO classes (id, name, teacher_id, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(id, name, teacherId).run();

    await logActivity(env, data.user, 'create_class', 'class', id, `Created class: ${name}`);

    return new Response(JSON.stringify({ id, name, teacherId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to create class' }), { status: 500 });
  }
}

export async function onRequestPut({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    const { id, name, teacherId } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Class ID required' }), { status: 400 });
    }

    const existing = await env.DB.prepare("SELECT id FROM classes WHERE id = ?").bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Class not found' }), { status: 404 });
    }

    if (teacherId) {
      const teacher = await env.DB.prepare(
        "SELECT id FROM users WHERE id = ? AND role = 'teacher'"
      ).bind(teacherId).first();
      if (!teacher) {
        return new Response(JSON.stringify({ error: 'Teacher not found' }), { status: 404 });
      }
    }

    const updates = [];
    const binds = [];
    if (name) { updates.push('name = ?'); binds.push(name); }
    if (teacherId) { updates.push('teacher_id = ?'); binds.push(teacherId); }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });
    }

    binds.push(id);
    await env.DB.prepare(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();

    await logActivity(env, data.user, 'update_class', 'class', id, `Updated class: ${name || id}`);

    return cachedJson({ success: true }, { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update class' }), { status: 500 });
  }
}

export async function onRequestDelete({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const url = new URL(request.url);
    const classId = url.searchParams.get('id');

    if (!classId) {
      return new Response(JSON.stringify({ error: 'Class ID required' }), { status: 400 });
    }

    await env.DB.prepare("DELETE FROM class_students WHERE class_id = ?").bind(classId).run();
    await env.DB.prepare("DELETE FROM exams WHERE class_id = ?").bind(classId).run();
    await env.DB.prepare("DELETE FROM classes WHERE id = ?").bind(classId).run();

    await logActivity(env, data.user, 'delete_class', 'class', classId, `Deleted class: ${classId}`);

    return cachedJson({ success: true }, { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to delete class' }), { status: 500 });
  }
}

async function logActivity(env, user, action, targetType, targetId, details) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), user.id, user.name, user.role, action, targetType, targetId, details).run();
  } catch (e) {
    console.error('activity_log failed:', e);
  }
}
