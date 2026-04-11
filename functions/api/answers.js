import { cachedJson } from './_cache.js';

// GET /api/answers?submissionId=xxx — fetch student's written answers for grading
export async function onRequestGet({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user) return cachedJson({ error: 'Unauthorized' }, { status: 401, profile: 'nocache' });

    const url = new URL(request.url);
    const submissionId = url.searchParams.get('submissionId');

    if (!submissionId) {
      return cachedJson({ error: 'Thiếu submissionId.' }, { status: 400, profile: 'nocache' });
    }

    // Verify teacher owns this submission, get student name
    const submission = await env.DB.prepare(
      `SELECT s.student_id, u.name AS studentName
       FROM submissions s
       JOIN exams e ON s.exam_id = e.id
       JOIN users u ON s.student_id = u.id
       WHERE s.id = ? AND e.teacher_id = ?
       LIMIT 1`
    ).bind(submissionId, user.id).first();

    if (!submission) {
      return cachedJson({ error: 'Không có quyền truy cập.' }, { status: 403, profile: 'nocache' });
    }

    // Fetch all answers with question content, rubric, and order
    const result = await env.DB.prepare(
      `SELECT sa.question_id AS questionId,
              sa.content,
              sa.ai_score  AS aiScore,
              sa.teacher_score AS teacherScore,
              q.content     AS questionContent,
              q.type        AS questionType,
              q.points      AS questionPoints,
              q.order_index AS orderIndex
       FROM submission_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.submission_id = ?
       ORDER BY q.order_index ASC`
    ).bind(submissionId).all();

    return cachedJson({ studentName: submission.studentName, answers: result.results || [] }, { profile: 'dynamic' });
  } catch (e) {
    console.error('answers GET error:', e);
    return cachedJson({ error: 'Lỗi khi tải bài làm.' }, { status: 500, profile: 'nocache' });
  }
}
