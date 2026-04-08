/**
 * POST /api/ai/grade — AI grading for a submission
 *
 * Uses teacher's rubric criteria from rubric_criteria table.
 * Saves per-question ai_scores + triggers skill_assessments update.
 *
 * Body: { submissionId }
 */
import { aiCall } from './_ai.js';
import { logTokenUsage } from './_tokenLog.js';
import { jsonError, parseAiJson } from './_utils.js';
import { computeAndSaveSkillAssessments } from './_skillAssessments.js';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const { submissionId } = await request.json();
    if (!submissionId) {
      return jsonError('Thiếu submissionId.', 400);
    }

    // ── Load submission + answers + exam info ─────────────────────────────────
    const submission = await env.DB.prepare(`
      SELECT s.id, s.exam_id AS examId, s.student_id AS studentId,
             e.title AS examTitle, e.work_id AS workId, e.teacher_id AS teacherId,
             w.title AS workTitle, w.author, w.content AS passage
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      LEFT JOIN works w ON e.work_id = w.id
      WHERE s.id = ?`
    ).bind(submissionId).first();

    if (!submission) return jsonError('Không tìm thấy bài nộp.', 404);

    if (submission.teacherId !== user.id) {
      return jsonError('Không có quyền chấm bài này.', 403);
    }

    // ── Load teacher's rubric criteria ────────────────────────────────────────
    const criteriaRows = await env.DB.prepare(`
      SELECT id, name, description, weight, hint_prompt
      FROM rubric_criteria
      WHERE teacher_id = ? AND is_active = 1
      ORDER BY order_index ASC`
    ).bind(user.id).all();
    const criteria = criteriaRows.results || [];

    // ── Load questions ─────────────────────────────────────────────────────────
    const questions = await env.DB.prepare(
      `SELECT id, content, type, points, rubric
       FROM questions WHERE exam_id = ? ORDER BY order_index ASC`
    ).bind(submission.examId).all();

    // ── Load student answers ──────────────────────────────────────────────────
    const answers = await env.DB.prepare(
      `SELECT sa.question_id AS questionId, sa.content
       FROM submission_answers sa WHERE sa.submission_id = ?`
    ).bind(submissionId).all();

    if (!answers.results?.length) {
      return jsonError('Không tìm thấy câu trả lời.', 404);
    }

    const answerMap = new Map(answers.results.map(a => [a.questionId, a.content || '']));

    // ── Build passage context ─────────────────────────────────────────────────
    const passageContext = submission.passage
      ? `\n\nTác phẩm "${submission.workTitle}" của ${submission.author}:\n${submission.passage.slice(0, 3000)}`
      : '';

    // ── Build rubric text for prompt ────────────────────────────────────────
    const rubricText = criteria.length > 0
      ? criteria.map((c, i) =>
          `Tiêu chí ${i + 1}: ${c.name} (trọng số ${c.weight}%)\nMô tả: ${c.description || '(không có)'}\nGợi ý chấm: ${c.hint_prompt || '(không có)'}`)
          .join('\n\n')
      : '(Không có rubric tùy chỉnh — chấm theo cảm nhận chung)';

    // ── Build questions + answers text ──────────────────────────────────────
    const questionsText = questions.results.map((q, i) =>
      `Câu ${i + 1} (${q.type}, ${q.points} điểm):\n${q.content}\nCâu trả lời:\n${answerMap.get(q.id) || '(trống)'}`
    ).join('\n\n');

    const systemPrompt =
      `Bạn là giáo viên ngữ văn giàu kinh nghiệm. Nhiệm vụ: CHẤM BÀI theo rubric của giáo viên.` +
      passageContext +
      `\n\nRUBRIC CỦA GIÁO VIÊN:\n${rubricText}` +
      `\n\nLUẬT CHẤM:\n` +
      `- Mỗi câu hỏi được chấm theo tiêu chí tương ứng (luân phiên nếu nhiều câu hơn tiêu chí).\n` +
      `- Điểm mỗi tiêu chí trên thang 10.\n` +
      `- Tổng điểm = trung bình có trọng số của các tiêu chí × 10.\n` +
      `- Luôn trả JSON thuần, KHÔNG thêm text khác ngoài JSON:` +
      `\n\n{\n  "scores": [\n    { "questionId": "...", "criteriaId": "...", "points": 0-10, "comment": "nhận xét ngắn" },\n    ...\n  ],\n  "totalScore": 0-10,\n  "summary": "nhận xét tổng quát 2-3 câu về bài làm"\n}` +
      `\n\nKHÔNG thêm text ngoài JSON.`;

    const userPrompt =
      `Đề thi: "${submission.examTitle}"\n\n${questionsText}`;

    // ── Call AI ───────────────────────────────────────────────────────────────
    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      env,
      '@cf/google/gemma-3-12b-it',
      { systemPrompt, messages: [{ role: 'user', content: userPrompt }], maxTokens: 1024, temperature: 0.2 }
    );

    const { parsed: grading } = parseAiJson(aiResponse, null);
    if (!grading) {
      return jsonError('AI không trả JSON hợp lệ. Thử lại.', 500);
    }

    const gs = grading || {};
    const aiScore = gs.totalScore != null ? Number(Number(gs.totalScore).toFixed(1)) : null;
    const summaryComment = (gs.summary || '').slice(0, 1000);

    // ── Save AI score ───────────────────────────────────────────────────────
    await env.DB.prepare(`
      UPDATE submissions
      SET ai_score = ?, ai_comment = ?,
          status = CASE WHEN status = 'submitted' THEN 'ai_graded' ELSE status END
      WHERE id = ?`
    ).bind(aiScore, summaryComment, submissionId).run();

    // ── Write per-question scores + link to criteria ─────────────────────────
    if (gs.scores?.length && criteria.length > 0) {
      for (let i = 0; i < gs.scores.length; i++) {
        const score = gs.scores[i];
        const question = questions.results[i];
        if (!question) continue;
        // Cycle through criteria
        const crit = criteria[i % criteria.length];
        await env.DB.prepare(
          `UPDATE submission_answers
           SET ai_score = ?, criteria_id = ?
           WHERE submission_id = ? AND question_id = ?`
        ).bind(Number(score.points).toFixed(1), crit?.id || null, submissionId, score.questionId || question.id).run();
      }
    }

    // ── Log token usage ────────────────────────────────────────────────────
    await logTokenUsage(env, user.id, 'grading',
      `Chấm: ${submission.examTitle}`, inputTokens, outputTokens);

    // ── Trigger skill assessment (non-blocking) ───────────────────────────────
    computeAndSaveSkillAssessments(env, submissionId)
      .catch(e => console.error('skill assessment error:', e));

    return new Response(JSON.stringify({
      success: true,
      aiScore,
      summary: summaryComment,
      details: gs.scores || [],
      rubricUsed: criteria.length,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('ai-grade error:', error);
    return jsonError('Lỗi khi chấm bài AI.', 500);
  }
}
