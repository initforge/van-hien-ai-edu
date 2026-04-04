import { cachedJson } from './_cache.js';
import { computeAndSaveSkillAssessments } from './_skillAssessments.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    if (user.role === 'teacher') {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          `SELECT s.id, s.exam_id AS examId, s.student_id AS studentId,
                  s.status, s.ai_score AS aiScore, s.teacher_score AS teacherScore,
                  s.teacher_comment AS teacherComment, s.submitted_at AS submittedAt,
                  u.name AS studentName,
                  e.title AS examTitle, e.class_id AS classId
           FROM submissions s
           JOIN exams e ON s.exam_id = e.id
           JOIN users u ON s.student_id = u.id
           WHERE e.teacher_id = ?
           ORDER BY s.submitted_at DESC
           LIMIT ? OFFSET ?`
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ?"
        ).bind(user.id).first(),
      ]);
      return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
    } else {
      const [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          "SELECT s.id, s.exam_id AS examId, e.title, e.type, s.status, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment, s.submitted_at AS submittedAt FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE s.student_id = ? ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?"
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE s.student_id = ?"
        ).bind(user.id).first(),
      ]);
      return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
    }
  } catch (e) {
    console.error('submissions GET error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi tải bài nộp.' }), { status: 500, profile: 'nocache' });
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { examId, answers } = await request.json();
    if (!examId) return new Response(JSON.stringify({ error: 'Thiếu examId.' }), { status: 400 });

    const exam = await env.DB.prepare(
      "SELECT id, work_id FROM exams WHERE id = ? LIMIT 1"
    ).bind(examId).first();
    if (!exam) return new Response(JSON.stringify({ error: 'Không tìm thấy đề thi.' }), { status: 404 });

    const existing = await env.DB.prepare(
      "SELECT id FROM submissions WHERE exam_id = ? AND student_id = ? LIMIT 1"
    ).bind(examId, user.id).first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'Đã nộp rồi.', submissionId: existing.id }), { status: 409 });
    }

    const submissionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO submissions (id, exam_id, student_id, status, submitted_at) VALUES (?, ?, ?, 'submitted', ?)"
    ).bind(submissionId, examId, user.id, now).run();

    // Save essay answers
    if (answers && typeof answers === 'object') {
      const questions = await env.DB.prepare(
        "SELECT id FROM questions WHERE exam_id = ? ORDER BY order_index ASC"
      ).bind(examId).all();
      const questionIds = (questions.results || []).map(q => q.id);

      for (const [key, content] of Object.entries(answers)) {
        // key can be question id or 'essay1', 'essay2' etc.
        let questionId = key;
        // If key is 'essay1' or 'essay2', map to actual question id by index
        if (key.match(/^essay(\d+)$/)) {
          const idx = parseInt(key.replace('essay', '')) - 1;
          questionId = questionIds[idx] || key;
        }
        if (questionId) {
          await env.DB.prepare(
            `INSERT OR REPLACE INTO submission_answers (id, submission_id, question_id, content)
             VALUES (?, ?, ?, ?)`
          ).bind(crypto.randomUUID(), submissionId, questionId, String(content)).run().catch(() => {});
        }
      }
    }

    return new Response(JSON.stringify({ id: submissionId, examId, submittedAt: now }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('submissions POST error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi nộp bài.' }), { status: 500 });
  }
}

export async function onRequestPatch({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id, teacherScore, teacherComment } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: 'Thiếu id.' }), { status: 400 });

    const exam = await env.DB.prepare(
      "SELECT id FROM exams WHERE id = (SELECT exam_id FROM submissions WHERE id = ?) AND teacher_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!exam) return new Response(JSON.stringify({ error: 'Không có quyền.' }), { status: 403 });

    await env.DB.prepare(
      "UPDATE submissions SET teacher_score = ?, teacher_comment = ?, status = 'returned' WHERE id = ?"
    ).bind(teacherScore ?? null, teacherComment ?? null, id).run();

    // Trigger skill assessment computation (non-blocking)
    computeAndSaveSkillAssessments(env, id).catch(e => console.error('skill assessment error:', e));

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('submissions PATCH error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi cập nhật.' }), { status: 500 });
  }
}
