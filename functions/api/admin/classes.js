/**
 * Admin: Classes management
 *
 * GET  /api/admin/classes?gradeLevel=8&teacherId=xxx       — list all classes
 * GET  /api/admin/classes?classId=xxx                       — list students in a class
 * POST /api/admin/classes                                  — create class
 * POST /api/admin/classes                                  — add student to class (body: { studentId, classId })
 * PUT  /api/admin/classes                                  — update class / regenerate invite
 * DELETE /api/admin/classes?id=                            — delete class
 * DELETE /api/admin/classes?classId=&studentId=           — remove student from class
 */
import { cachedJson } from '../_cache.js';
import { jsonError } from '../_utils.js';

function generateInviteCode() {
  return Array.from({ length: 8 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');
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

// ─── GET ────────────────────────────────────────────────────────────────────────
export async function onRequestGet({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') return jsonError('Forbidden', 403);

    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const gradeLevel = url.searchParams.get('gradeLevel');
    const teacherId = url.searchParams.get('teacherId');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    // ── List students in a specific class ────────────────────────────────────
    if (classId) {
      const cls = await env.DB.prepare(
        "SELECT id, name, grade_level AS grade, teacher_id, invite_code AS inviteCode FROM classes WHERE id = ?"
      ).bind(classId).first();
      if (!cls) return jsonError('Không tìm thấy lớp.', 404);

      const teacher = await env.DB.prepare(
        "SELECT name, email FROM users WHERE id = ?"
      ).bind(cls.teacher_id).first();

      const examCount = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM exams WHERE class_id = ?"
      ).bind(classId).first();

      const students = await env.DB.prepare(`
        SELECT u.id, u.name, u.email, u.username, cs.id AS enrollmentId, s.submitted_at AS lastSubmitted
        FROM class_students cs
        JOIN users u ON cs.student_id = u.id
        LEFT JOIN (
          SELECT student_id, MAX(submitted_at) AS submitted_at
          FROM submissions
          WHERE exam_id IN (SELECT id FROM exams WHERE class_id = ?)
          GROUP BY student_id
        ) s ON s.student_id = u.id
        WHERE cs.class_id = ?
        ORDER BY u.name ASC
      `).bind(classId, classId).all();

      return cachedJson({
        classInfo: {
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          inviteCode: cls.inviteCode || null,
          teacherName: teacher?.name || null,
          teacherEmail: teacher?.email || null,
          examCount: examCount?.count || 0,
        },
        students: students.results || [],
      }, { profile: 'dynamic' });
    }

    // ── List all classes ──────────────────────────────────────────────────────
    let where = [];
    const binds = [];
    if (gradeLevel) { where.push('c.grade_level = ?'); binds.push(parseInt(gradeLevel)); }
    if (teacherId) { where.push('c.teacher_id = ?'); binds.push(teacherId); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(`
        SELECT c.id, c.name, c.grade_level AS gradeLevel, c.invite_code AS inviteCode,
               c.teacher_id AS teacherId, c.created_at AS createdAt,
               u.name AS teacherName,
               COUNT(DISTINCT cs.student_id) AS studentCount,
               COUNT(DISTINCT e.id) AS examCount,
               COUNT(DISTINCT CASE WHEN s.status IN ('submitted','ai_graded') THEN s.id END) AS pendingCount
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN class_students cs ON cs.class_id = c.id
        LEFT JOIN exams e ON e.class_id = c.id
        LEFT JOIN submissions s ON s.exam_id = e.id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.grade_level ASC, c.name ASC
        LIMIT ? OFFSET ?`
      ).bind(...binds, limit, offset).all(),
      env.DB.prepare(`SELECT COUNT(*) AS total FROM classes c ${whereClause}`).bind(...binds).first(),
    ]);

    return cachedJson({
      data: rows.results || [],
      total: countRow?.total || 0,
      limit,
      offset,
    }, { profile: 'dynamic' });
  } catch (e) {
    console.error('admin/classes GET error:', e);
    return jsonError('Lỗi khi tải lớp học.', 500);
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────────
export async function onRequestPost({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') return jsonError('Forbidden', 403);

    const body = await request.json();
    const { studentId, classId } = body;

    // ── Add student to class ─────────────────────────────────────────────────
    if (studentId && classId) {
      const [student, cls] = await Promise.all([
        env.DB.prepare("SELECT id FROM users WHERE id = ? AND role = 'student' LIMIT 1").bind(studentId).first(),
        env.DB.prepare("SELECT id FROM classes WHERE id = ? LIMIT 1").bind(classId).first(),
      ]);
      if (!student) return jsonError('Không tìm thấy học sinh.', 404);
      if (!cls) return jsonError('Không tìm thấy lớp.', 404);

      await env.DB.prepare(
        "INSERT OR IGNORE INTO class_students (id, class_id, student_id) VALUES (?, ?, ?)"
      ).bind(crypto.randomUUID(), classId, studentId).run();

      await logActivity(env, data.user, 'student_joined', 'class', classId, `Thêm HS vào lớp: ${studentId}`);
      return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Create class ─────────────────────────────────────────────────────────
    const { name, teacherId, gradeLevel } = body;
    if (!name?.trim()) return jsonError('Thiếu tên lớp.', 400);
    if (!teacherId) return jsonError('Thiếu giáo viên.', 400);

    const [teacher, clsExists] = await Promise.all([
      env.DB.prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher' LIMIT 1").bind(teacherId).first(),
      name?.trim() ? env.DB.prepare(
        "SELECT id FROM classes WHERE name = ? AND teacher_id = ? LIMIT 1"
      ).bind(name.trim(), teacherId).first() : null,
    ]);
    if (!teacher) return jsonError('Không tìm thấy giáo viên.', 404);
    if (clsExists) return jsonError('Lớp này đã tồn tại.', 409);

    const id = crypto.randomUUID();
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO classes (id, name, teacher_id, grade_level, invite_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, name.trim(), teacherId, gradeLevel ? parseInt(gradeLevel) : null, inviteCode, now).run();

    await logActivity(env, data.user, 'create_class', 'class', id, `Tạo lớp: ${name}`);
    return new Response(JSON.stringify({ id, name: name.trim(), gradeLevel, teacherId, inviteCode }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('admin/classes POST error:', e);
    return jsonError('Lỗi khi tạo lớp học.', 500);
  }
}

// ─── PUT ────────────────────────────────────────────────────────────────────────
export async function onRequestPut({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') return jsonError('Forbidden', 403);

    const body = await request.json();
    const { id, name, gradeLevel, teacherId, regenerateInvite } = body;
    if (!id) return jsonError('Thiếu id.', 400);

    const fields = [];
    const vals = [];
    if (name !== undefined) {
      fields.push('name = ?'); vals.push(name.trim());
    }
    if (gradeLevel !== undefined) {
      fields.push('grade_level = ?'); vals.push(gradeLevel ? parseInt(gradeLevel) : null);
    }
    if (teacherId !== undefined) {
      const t = await env.DB.prepare(
        "SELECT id FROM users WHERE id = ? AND role = 'teacher' LIMIT 1"
      ).bind(teacherId).first();
      if (!t) return jsonError('Không tìm thấy giáo viên.', 404);
      fields.push('teacher_id = ?'); vals.push(teacherId);
    }
    if (regenerateInvite) {
      fields.push('invite_code = ?'); vals.push(generateInviteCode());
    }
    if (fields.length === 0) return jsonError('Không có trường nào để cập nhật.', 400);

    vals.push(id);
    await env.DB.prepare(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
    await logActivity(env, data.user, 'update_class', 'class', id, `Cập nhật lớp: ${id}`);
    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('admin/classes PUT error:', e);
    return jsonError('Lỗi khi cập nhật lớp học.', 500);
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────────
export async function onRequestDelete({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') return jsonError('Forbidden', 403);

    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const classId = url.searchParams.get('classId');

    // ── Remove student from class ────────────────────────────────────────────
    if (studentId && classId) {
      await env.DB.prepare(
        "DELETE FROM class_students WHERE class_id = ? AND student_id = ?"
      ).bind(classId, studentId).run();
      return cachedJson({ success: true }, { profile: 'nocache' });
    }

    // ── Delete class ─────────────────────────────────────────────────────────
    const deleteId = url.searchParams.get('id');
    if (!deleteId) return jsonError('Thiếu id.', 400);

    // Cascade: submissions → answers, questions, exams, class_students
    const submissions = await env.DB.prepare(
      "SELECT id FROM submissions WHERE exam_id IN (SELECT id FROM exams WHERE class_id = ?)"
    ).bind(deleteId).all();
    for (const s of submissions.results || []) {
      await env.DB.prepare("DELETE FROM submission_answers WHERE submission_id = ?").bind(s.id).run();
    }
    await env.DB.prepare(
      "DELETE FROM submissions WHERE exam_id IN (SELECT id FROM exams WHERE class_id = ?)"
    ).bind(deleteId).run();
    await env.DB.prepare(
      "DELETE FROM questions WHERE exam_id IN (SELECT id FROM exams WHERE class_id = ?)"
    ).bind(deleteId).run();
    await env.DB.prepare("DELETE FROM exams WHERE class_id = ?").bind(deleteId).run();
    await env.DB.prepare("DELETE FROM class_students WHERE class_id = ?").bind(deleteId).run();
    await env.DB.prepare("DELETE FROM classes WHERE id = ?").bind(deleteId).run();

    await logActivity(env, data.user, 'delete_class', 'class', deleteId, `Xóa lớp: ${deleteId}`);
    return cachedJson({ success: true }, { profile: 'dynamic' });
  } catch (e) {
    console.error('admin/classes DELETE error:', e);
    return jsonError('Lỗi khi xóa lớp học.', 500);
  }
}
