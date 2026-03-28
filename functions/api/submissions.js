import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    
    if (user.role === 'teacher') {
      const result = await env.DB.prepare(
        "SELECT s.id, s.exam_id AS examId, s.student_id AS studentId, s.status, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.submitted_at AS submittedAt FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? ORDER BY s.submitted_at DESC"
      ).bind(user.id).all();
      return cachedJson(result.results || [], { profile: 'dynamic' });
    } else {
      const result = await env.DB.prepare(
        "SELECT id, exam_id AS examId, status, ai_score AS aiScore, teacher_score AS teacherScore, submitted_at AS submittedAt FROM submissions WHERE student_id = ? ORDER BY submitted_at DESC"
      ).bind(user.id).all();
      return cachedJson(result.results || [], { profile: 'dynamic' });
    }
  } catch (e) {
    return cachedJson([], { profile: 'dynamic' });
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'student') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO submissions (id, exam_id, student_id, status, submitted_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, body.examId, user.id, 'submitted', now).run();

    return cachedJson({ id, examId: body.examId, status: 'submitted', submittedAt: now }, { profile: 'nocache' });
  } catch (e) {
    return cachedJson({ error: 'Failed to submit', details: String(e) }, { status: 500, profile: 'nocache' });
  }
}

export async function onRequestPatch({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();
    await env.DB.prepare(
      "UPDATE submissions SET teacher_score = ?, teacher_comment = ?, status = 'returned' WHERE id = ? AND exam_id IN (SELECT id FROM exams WHERE teacher_id = ?)"
    ).bind(body.teacherScore, body.teacherComment || '', body.id, user.id).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    return cachedJson({ error: 'Failed to grade', details: String(e) }, { status: 500, profile: 'nocache' });
  }
}
