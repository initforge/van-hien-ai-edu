import { cachedJson } from './_cache.js';

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

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return cachedJson({ error: 'Unauthorized' }, { status: 401, profile: 'nocache' });

    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
    const classId = url.searchParams.get('classId');

    if (user.role === 'teacher') {
      const teacherWhere = classId
        ? 'WHERE e.teacher_id = ? AND e.class_id = ?'
        : 'WHERE e.teacher_id = ?';
      const teacherBinds = classId ? [user.id, classId] : [user.id];
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          `SELECT e.id, e.title, e.type, e.work_id AS workId, w.title AS workTitle,
                  e.class_id AS classId, c.name AS className,
                  e.duration, e.status, e.deadline, e.created_at AS createdAt,
                  COUNT(DISTINCT s.id) AS total,
                  COUNT(DISTINCT CASE WHEN s.status = 'returned' THEN s.id END) AS graded
           FROM exams e
           LEFT JOIN works w ON e.work_id = w.id
           LEFT JOIN classes c ON e.class_id = c.id
           LEFT JOIN submissions s ON e.id = s.exam_id
           ${teacherWhere}
           GROUP BY e.id
           ORDER BY e.created_at DESC
           LIMIT ? OFFSET ?`
        ).bind(...teacherBinds, limit, offset).all(),
        env.DB.prepare(
          `SELECT COUNT(*) AS total FROM exams e ${teacherWhere}`
        ).bind(...teacherBinds).first(),
      ]);
      return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
    } else {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          `SELECT e.id, e.title, e.type, e.work_id AS workId, w.title AS workTitle,
                  e.class_id AS classId, c.name AS className,
                  e.duration, e.status, e.deadline, e.created_at AS createdAt
           FROM exams e
           LEFT JOIN works w ON e.work_id = w.id
           LEFT JOIN classes c ON e.class_id = c.id
           JOIN class_students cs ON e.class_id = cs.class_id
           WHERE cs.student_id = ? AND e.status = 'published'
           ORDER BY e.created_at DESC
           LIMIT ? OFFSET ?`
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

    // ── Mode: add questions to existing exam ───────────────────────────────
    if (body.examId && body.questions) {
      const exam = await env.DB.prepare(
        "SELECT id FROM exams WHERE id = ? AND teacher_id = ? LIMIT 1"
      ).bind(body.examId, user.id).first();
      if (!exam) return cachedJson({ error: 'Không tìm thấy đề thi.' }, { status: 404, profile: 'nocache' });

      const questions = Array.isArray(body.questions) ? body.questions : [];
      if (!questions.length) return cachedJson({ error: 'Không có câu hỏi.' }, { status: 400, profile: 'nocache' });

      const existing = await env.DB.prepare(
        "SELECT MAX(order_index) AS maxIdx FROM questions WHERE exam_id = ?"
      ).bind(body.examId).first();
      let order = (existing?.maxIdx ?? 0);

      for (const q of questions) {
        order++;
        await env.DB.prepare(
          `INSERT INTO questions (id, exam_id, content, type, points, rubric, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          body.examId,
          String(q.content || '').slice(0, 500),
          String(q.type || 'essay'),
          Math.max(1, Math.min(10, Number(q.points) || 2)),
          String(q.rubric || '').slice(0, 500),
          order
        ).run();
      }
      return cachedJson({ success: true, added: questions.length }, { status: 201, profile: 'nocache' });
    }

    // ── Mode: create new exam (standalone) ──────────────────────────────────
    // Validate type enum
    const validTypes = ['exercise', 'exam'];
    if (body.type != null && !validTypes.includes(body.type)) {
      return cachedJson({ error: `Loại đề không hợp lệ. Chỉ chấp nhận: ${validTypes.join(', ')}` }, { status: 400, profile: 'nocache' });
    }

    // Guard: always create as 'draft', never allow direct publish
    const examType = body.type != null ? String(body.type) : 'exercise';
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

// PATCH /api/exams — update status (publish/unpublish) or title
export async function onRequestPatch({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();
    const { id, status, title } = body;

    if (!id) return new Response(JSON.stringify({ error: 'Thiếu exam ID.' }), { status: 400 });

    // Verify ownership
    const exam = await env.DB.prepare(
      "SELECT id FROM exams WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!exam) return new Response(JSON.stringify({ error: 'Không tìm thấy hoặc không có quyền.' }), { status: 404 });

    const fields = [];
    const values = [];
    if (status !== undefined) {
      if (!['draft', 'published'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Trạng thái không hợp lệ.' }), { status: 400 });
      }
      fields.push('status = ?');
      values.push(status);
    }
    if (title !== undefined) {
      fields.push('title = ?');
      values.push(String(title).trim());
    }

    if (fields.length === 0) {
      return new Response(JSON.stringify({ error: 'Không có trường nào để cập nhật.' }), { status: 400 });
    }

    values.push(id);
    await env.DB.prepare(`UPDATE exams SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

    if (status === 'published') {
      await logActivity(env, user, 'exam_published', 'exam', id, JSON.stringify({ title: title || id }));
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('exams PATCH error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi cập nhật.' }), { status: 500 });
  }
}

// DELETE /api/exams?id=xxx — delete exam (teacher only)
export async function onRequestDelete({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Thiếu exam ID.' }), { status: 400 });

    const exam = await env.DB.prepare(
      "SELECT id FROM exams WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!exam) return new Response(JSON.stringify({ error: 'Không tìm thấy hoặc không có quyền.' }), { status: 404 });

    // Delete questions first (foreign key)
    await env.DB.prepare("DELETE FROM questions WHERE exam_id = ?").bind(id).run();
    // Delete submissions first
    await env.DB.prepare("DELETE FROM submissions WHERE exam_id = ?").bind(id).run();
    // Delete exam
    await env.DB.prepare("DELETE FROM exams WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('exams DELETE error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi xóa.' }), { status: 500 });
  }
}
