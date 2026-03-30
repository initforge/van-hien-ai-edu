import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    if (user.role === 'teacher') {
      const result = await env.DB.prepare(
        "SELECT s.id, s.exam_id AS examId, s.student_id AS studentId, s.status, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment, s.submitted_at AS submittedAt FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? ORDER BY s.submitted_at DESC"
      ).bind(user.id).all();
      return cachedJson(result.results || [], { profile: 'dynamic' });
    } else {
      const result = await env.DB.prepare(
        "SELECT s.id, s.exam_id AS examId, e.title, e.type, s.status, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment, s.submitted_at AS submittedAt FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE s.student_id = ? ORDER BY s.submitted_at DESC"
      ).bind(user.id).all();
      return cachedJson(result.results || [], { profile: 'dynamic' });
    }
  } catch (e) {
    console.error('submissions GET error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi tải bài nộp.' }), { status: 500, profile: 'dynamic' });
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'student') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { examId, answers = {} } = body;

    if (!examId) {
      return new Response(JSON.stringify({ error: 'Thiếu examId.' }), { status: 400, profile: 'nocache' });
    }

    // Verify student is enrolled in this exam's class
    const enrolled = await env.DB.prepare(
      "SELECT 1 FROM class_students cs JOIN exams e ON cs.class_id = e.class_id WHERE cs.student_id = ? AND e.id = ? LIMIT 1"
    ).bind(user.id, examId).first();

    if (!enrolled) {
      return new Response(JSON.stringify({ error: 'Bạn không được đăng ký thi đề này.' }), { status: 403, profile: 'nocache' });
    }

    const now = new Date().toISOString();

    // Check for duplicate submission
    const existing = await env.DB.prepare(
      "SELECT id FROM submissions WHERE exam_id = ? AND student_id = ? AND status != 'draft' LIMIT 1"
    ).bind(examId, user.id).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Bạn đã nộp bài này rồi.' }), { status: 409, profile: 'nocache' });
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO submissions (id, exam_id, student_id, status, submitted_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, examId, user.id, 'submitted', now).run();

    // Persist each answer to submission_answers
    for (const [questionId, content] of Object.entries(answers)) {
      await env.DB.prepare(
        "INSERT INTO submission_answers (id, submission_id, question_id, content) VALUES (?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), id, questionId, String(content)).run();
    }

    return cachedJson({ id, examId, status: 'submitted', submittedAt: now }, { profile: 'nocache' });
  } catch (e) {
    console.error('submissions POST error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi nộp bài. Vui lòng thử lại.' }), { status: 500, profile: 'nocache' });
  }
}

export async function onRequestPatch({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { id, teacherScore, teacherComment } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Thiếu submission ID.' }), { status: 400, profile: 'nocache' });
    }

    // Bound score to valid range [0, 10]
    const score = Math.min(10, Math.max(0, Number(teacherScore) || 0));

    // Verify this submission belongs to the teacher's class
    const valid = await env.DB.prepare(
      "SELECT 1 FROM submissions s JOIN exams e ON s.exam_id = e.id JOIN class_students cs ON e.class_id = cs.class_id WHERE s.id = ? AND e.teacher_id = ? AND cs.student_id = s.student_id LIMIT 1"
    ).bind(id, user.id).first();

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Không có quyền chấm bài này.' }), { status: 403, profile: 'nocache' });
    }

    await env.DB.prepare(
      "UPDATE submissions SET teacher_score = ?, teacher_comment = ?, status = 'returned' WHERE id = ?"
    ).bind(score, teacherComment || 'Đã chấm xong.', id).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('submissions PATCH error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi chấm bài. Vui lòng thử lại.' }), { status: 500, profile: 'nocache' });
  }
}
