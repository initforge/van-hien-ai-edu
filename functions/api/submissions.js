export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT id, exam_id AS examId, student_id AS studentId, status, ai_score AS aiScore, ai_comment AS aiComment, teacher_score AS teacherScore, teacher_comment AS teacherComment, submitted_at AS submittedAt FROM submissions ORDER BY submitted_at DESC"
    ).all();
    return Response.json(result.results || []);
  } catch (e) {
    return Response.json([], { headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO submissions (id, exam_id, student_id, status, submitted_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, body.examId, body.studentId || 'student-1', 'submitted', now).run();

    return Response.json({ id, examId: body.examId, status: 'submitted', submittedAt: now });
  } catch (e) {
    return Response.json({ error: 'Failed to submit', details: String(e) }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const body = await request.json();

    await env.DB.prepare(
      "UPDATE submissions SET teacher_score = ?, teacher_comment = ?, status = 'returned' WHERE id = ?"
    ).bind(body.teacherScore, body.teacherComment || '', body.id).run();

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: 'Failed to grade', details: String(e) }, { status: 500 });
  }
}
