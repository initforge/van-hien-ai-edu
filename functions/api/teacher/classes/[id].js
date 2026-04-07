/**
 * PATCH /api/teacher/classes/:id  — update class name / grade
 * DELETE /api/teacher/classes/:id — delete class + students + submissions
 */
import { jsonError } from '../../_utils.js';

export async function onRequestPatch({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { name, gradeLevel } = body;

    const cls = await env.DB.prepare(
      "SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!cls) return jsonError('Không tìm thấy lớp.', 404);

    const fields = [];
    const vals = [];
    if (name !== undefined) { fields.push('name = ?'); vals.push(name.trim()); }
    if (gradeLevel !== undefined) { fields.push('grade_level = ?'); vals.push(gradeLevel ? parseInt(gradeLevel) : null); }

    if (fields.length > 0) {
      vals.push(id);
      await env.DB.prepare(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
    }

    await env.DB.prepare(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), user.id, user.name, user.role, 'update_class', 'class', id,
           JSON.stringify({ name, gradeLevel }), new Date().toISOString()).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('teacher/classes/[id] PATCH error:', e);
    return jsonError('Lỗi khi cập nhật lớp.', 500);
  }
}

export async function onRequestDelete({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    const cls = await env.DB.prepare(
      "SELECT id, name FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!cls) return jsonError('Không tìm thấy lớp.', 404);

    // Cascade: class_students → submissions → exams → class
    await env.DB.prepare("DELETE FROM class_students WHERE class_id = ?").bind(id).run();
    const exams = await env.DB.prepare("SELECT id FROM exams WHERE class_id = ?").bind(id).all();
    for (const e of exams.results || []) {
      await env.DB.prepare("DELETE FROM submissions WHERE exam_id = ?").bind(e.id).run();
    }
    await env.DB.prepare("DELETE FROM exams WHERE class_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM classes WHERE id = ?").bind(id).run();

    await env.DB.prepare(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), user.id, user.name, user.role, 'delete_class', 'class', id,
           JSON.stringify({ name: cls.name }), new Date().toISOString()).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('teacher/classes/[id] DELETE error:', e);
    return jsonError('Lỗi khi xóa lớp.', 500);
  }
}
