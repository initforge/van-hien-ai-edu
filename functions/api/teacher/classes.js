/**
 * GET  /api/teacher/classes  — list classes with student + submission counts
 * POST /api/teacher/classes  — create class
 */
import { cachedJson } from '../_cache.js';
import { jsonError } from '../_utils.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    const [rowsResult, countResult] = await Promise.all([
      env.DB.prepare(`
        SELECT c.id, c.name, c.grade_level AS gradeLevel, c.invite_code AS inviteCode, c.created_at AS createdAt,
               COUNT(DISTINCT cs.student_id) AS studentCount,
               COUNT(DISTINCT CASE WHEN s.status IN ('submitted','ai_graded') THEN s.id END) AS pendingCount,
               AVG(COALESCE(s.teacher_score, s.ai_score)) AS avgScore
        FROM classes c
        LEFT JOIN class_students cs ON c.id = cs.class_id
        LEFT JOIN exams e ON e.class_id = c.id
        LEFT JOIN submissions s ON s.exam_id = e.id AND s.status = 'returned'
        WHERE c.teacher_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(user.id, limit, offset).all(),
      env.DB.prepare(
        "SELECT COUNT(*) AS total FROM classes WHERE teacher_id = ?"
      ).bind(user.id).first(),
    ]);

    return cachedJson({
      data: rowsResult.results || [],
      total: countResult?.total || 0,
    }, { profile: 'dynamic' });
  } catch (e) {
    console.error('teacher/classes GET error:', e);
    return jsonError('Lỗi khi tải lớp học.', 500);
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const body = await request.json();
    const { name, gradeLevel } = body;

    if (!name?.trim()) return jsonError('Thiếu tên lớp.', 400);

    const id = crypto.randomUUID();
    const inviteCode = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO classes (id, name, teacher_id, grade_level, invite_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, name.trim(), user.id, gradeLevel ? parseInt(gradeLevel) : null, inviteCode, now).run();

    return new Response(JSON.stringify({ id, name: name.trim(), gradeLevel, inviteCode, createdAt: now }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('teacher/classes POST error:', e);
    return jsonError('Lỗi khi tạo lớp.', 500);
  }
}
