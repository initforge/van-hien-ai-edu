/**
 * GET  /api/teacher/rubric     — list rubric criteria for current teacher
 * POST /api/teacher/rubric    — create a new criterion
 * PUT  /api/teacher/rubric    — update a criterion
 * DELETE /api/teacher/rubric?id= — delete a criterion
 */
import { cachedJson } from '../_cache.js';
import { jsonError } from '../_utils.js';

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const rows = await env.DB.prepare(
      `SELECT id, name, description, weight, hint_prompt AS hintPrompt,
              order_index AS orderIndex, is_active AS isActive, created_at AS createdAt
       FROM rubric_criteria
       WHERE teacher_id = ? AND is_active = 1
       ORDER BY order_index ASC`
    ).bind(user.id).all();

    return cachedJson({ data: rows.results || [] }, { profile: 'dynamic' });
  } catch (e) {
    console.error('rubric GET error:', e);
    return jsonError('Lỗi khi tải tiêu chí.', 500);
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const body = await request.json();
    const { name, description, weight, hintPrompt } = body;
    if (!name?.trim()) return jsonError('Thiếu tên tiêu chí.', 400);

    const weightVal = Math.max(0, Math.min(100, parseFloat(weight) || 25));

    // Get next order_index
    const last = await env.DB.prepare(
      "SELECT MAX(order_index) AS maxIdx FROM rubric_criteria WHERE teacher_id = ?"
    ).bind(user.id).first();
    const orderIndex = (last?.maxIdx ?? 0) + 1;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO rubric_criteria (id, teacher_id, name, description, weight, hint_prompt, order_index, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(id, user.id, name.trim(), description || null, weightVal, hintPrompt || null, orderIndex, now, now).run();

    return new Response(JSON.stringify({ id, name: name.trim(), weight: weightVal }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('rubric POST error:', e);
    return jsonError('Lỗi khi tạo tiêu chí.', 500);
  }
}

export async function onRequestPut({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const body = await request.json();
    const { id, name, description, weight, hintPrompt, orderIndex, isActive } = body;
    if (!id) return jsonError('Thiếu id.', 400);

    // Verify ownership
    const existing = await env.DB.prepare(
      "SELECT id FROM rubric_criteria WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!existing) return jsonError('Không tìm thấy.', 404);

    const fields = [];
    const values = [];
    if (name !== undefined)       { fields.push('name = ?');           values.push(name.trim()); }
    if (description !== undefined) { fields.push('description = ?');   values.push(description || null); }
    if (weight !== undefined)     { fields.push('weight = ?');        values.push(Math.max(0, Math.min(100, parseFloat(weight)))); }
    if (hintPrompt !== undefined)  { fields.push('hint_prompt = ?');   values.push(hintPrompt || null); }
    if (orderIndex !== undefined)  { fields.push('order_index = ?');  values.push(parseInt(orderIndex)); }
    if (isActive !== undefined)   { fields.push('is_active = ?');    values.push(isActive ? 1 : 0); }

    if (fields.length === 0) return jsonError('Không có trường nào để cập nhật.', 400);

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await env.DB.prepare(`UPDATE rubric_criteria SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('rubric PUT error:', e);
    return jsonError('Lỗi khi cập nhật tiêu chí.', 500);
  }
}

export async function onRequestDelete({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonError('Thiếu id.', 400);

    const existing = await env.DB.prepare(
      "SELECT id FROM rubric_criteria WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!existing) return jsonError('Không tìm thấy.', 404);

    await env.DB.prepare("UPDATE rubric_criteria SET is_active = 0, updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), id).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('rubric DELETE error:', e);
    return jsonError('Lỗi khi xóa tiêu chí.', 500);
  }
}
