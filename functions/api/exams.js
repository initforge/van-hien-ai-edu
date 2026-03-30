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
          "SELECT id, title, type, work_id AS workId, class_id AS classId, duration, status, deadline, created_at AS createdAt FROM exams WHERE teacher_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM exams WHERE teacher_id = ?"
        ).bind(user.id).first(),
      ]);
      return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
    } else {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          "SELECT e.id, e.title, e.type, e.work_id AS workId, e.duration, e.status, e.deadline, e.created_at AS createdAt FROM exams e JOIN class_students cs ON e.class_id = cs.class_id WHERE cs.student_id = ? AND e.status = 'published' ORDER BY e.created_at DESC LIMIT ? OFFSET ?"
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM exams e JOIN class_students cs ON e.class_id = cs.class_id WHERE cs.student_id = ? AND e.status = 'published'"
        ).bind(user.id).first(),
      ]);
      return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
    }
  } catch (e) {
    console.error('exams GET error:', e);
    return cachedJson({ error: 'Lỗi khi tải đề thi.' }, { status: 500, profile: 'nocache' });
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();

    // Validate required fields
    if (!body.title || String(body.title).trim().length === 0) {
      return cachedJson({ error: 'Thiếu tiêu đề đề thi.' }, { status: 400, profile: 'nocache' });
    }

    // Validate type enum
    const validTypes = ['exercise', 'exam'];
    const examType = String(body.type || 'exercise');
    if (!validTypes.includes(examType)) {
      return cachedJson({ error: `Loại đề không hợp lệ. Chỉ chấp nhận: ${validTypes.join(', ')}` }, { status: 400, profile: 'nocache' });
    }

    // Guard: always create as 'draft', never allow direct publish
    const examStatus = 'draft';

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, String(body.title).trim(), examType, body.workId || null, body.classId || null, user.id, body.duration || 60, examStatus, body.deadline || null, now).run();

    return cachedJson({ id, title: String(body.title).trim(), type: examType, status: examStatus, createdAt: now }, { status: 201, profile: 'nocache' });
  } catch (e) {
    console.error('exams POST error:', e);
    return cachedJson({ error: 'Lỗi khi tạo đề thi. Vui lòng thử lại.' }, { status: 500, profile: 'nocache' });
  }
}
