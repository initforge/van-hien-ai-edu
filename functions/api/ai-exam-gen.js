/**
 * POST /api/ai/exam-gen — AI exam/question generation (direct to DB)
 *
 * Uses @cf/mistralai/mistral-small-3.1-24b-instruct for structured question generation.
 * Creates exam + questions in DB. Called by teacher after approving a preview.
 *
 * Body: { workId?, classId?, title, type, duration, level, questions }
 */
import { aiCall } from './_ai.js';
import { logTokenUsage } from './_tokenLog.js';
import { jsonError, parseAiJson, estimateTokens, getWorkAnalysis } from './_utils.js';

// ── Level metadata (mirror of exam-preview.js) ────────────────────────────
const LEVEL_META = {
  THCS: {
    gradeBand: 'THCS (lớp 6–9)',
    gradeDesc: 'phù hợp học sinh THCS, ngôn ngữ dễ hiểu, yêu cầu vừa phải',
    readerLevel: 'học sinh THCS',
    writingLen: 'khoảng 150–200 chữ',
  },
  THPT: {
    gradeBand: 'THPT (lớp 10–12)',
    gradeDesc: 'phù hợp học sinh THPT, ngôn ngữ chuyên sâu, yêu cầu cao hơn',
    readerLevel: 'học sinh THPT',
    writingLen: 'khoảng 200–300 chữ',
  },
};

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const {
      title,
      type = 'exercise',
      duration = 45,
      workId,
      classId,
      level = 'THCS',
      questions: parsedQuestions = [],
    } = body;

    if (!title?.trim()) {
      return jsonError('Thiếu tiêu đề đề thi.', 400);
    }
    if (!parsedQuestions.length) {
      return jsonError('Không có câu hỏi.', 400);
    }

    // ── Create exam in DB ──────────────────────────────────────────────────
    const examId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO exams (id, title, type, work_id, class_id, teacher_id, duration, status, deadline, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NULL, ?)`
    ).bind(examId, title.trim(), type, workId || null, classId || null, user.id, duration, now).run();

    // Insert questions
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      await env.DB.prepare(
        `INSERT INTO questions (id, exam_id, content, type, points, rubric, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        examId,
        String(q.content || '').slice(0, 500),
        String(q.type || 'essay'),
        Math.max(1, Math.min(10, Number(q.points) || 2)),
        String(q.rubric || '').slice(0, 500),
        i + 1
      ).run();
    }

    // Log token usage — called by exam-preview on behalf, so log as exam_preview
    await logTokenUsage(env, user.id, 'exam_preview',
      `Duyệt đề: ${title.trim()} (${parsedQuestions.length} câu)`, 0, 0);

    return new Response(JSON.stringify({
      success: true,
      examId,
      title: title.trim(),
      type,
      level,
      questions: parsedQuestions,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-exam-gen error:', error);
    return jsonError('Lỗi khi tạo đề thi AI.', 500);
  }
}

