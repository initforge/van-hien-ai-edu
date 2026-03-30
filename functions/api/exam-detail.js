import { cachedJson } from './_cache.js';

// GET /api/exam-detail?id=xxx — fetch exam with questions and passage content
export async function onRequestGet({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const examId = url.searchParams.get('id');
    if (!examId) return new Response(JSON.stringify({ error: 'Thiếu examId.' }), { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } });

    // Verify student is enrolled
    const enrolled = await env.DB.prepare(
      `SELECT 1 FROM class_students cs
       JOIN exams e ON cs.class_id = e.class_id
       WHERE cs.student_id = ? AND e.id = ? LIMIT 1`
    ).bind(user.id, examId).first();
    if (!enrolled) return new Response(JSON.stringify({ error: 'Không có quyền truy cập.' }), { status: 403, headers: { 'Cache-Control': 'no-store, max-age=0' } });

    // Get exam + work info
    const exam = await env.DB.prepare(
      `SELECT e.id, e.title, e.type, e.duration, e.deadline, e.work_id AS workId,
              w.title AS workTitle, w.author, w.content AS passage
       FROM exams e
       LEFT JOIN works w ON e.work_id = w.id
       WHERE e.id = ?`
    ).bind(examId).first();
    if (!exam) return new Response(JSON.stringify({ error: 'Không tìm thấy đề thi.' }), { status: 404, headers: { 'Cache-Control': 'no-store, max-age=0' } });

    // Get questions for this exam
    const questions = await env.DB.prepare(
      `SELECT id, content, type, points, "order" AS orderIndex FROM questions
       WHERE exam_id = ? ORDER BY "order" ASC`
    ).bind(examId).all();

    return cachedJson({
      exam,
      questions: questions.results || []
    }, { profile: 'dynamic' });
  } catch (e) {
    console.error('exam-detail GET error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi tải đề thi.' }), { status: 500 });
  }
}
