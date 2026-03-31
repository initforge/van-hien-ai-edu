/**
 * POST /api/ai/grade — AI grading for a submission
 *
 * Uses @cf/agent/llama-4-llama-4-scout-fw for structured rubric evaluation.
 * Runs after a student submits an exam. Stores result in submission.ai_score + AI comment.
 *
 * Body: { submissionId }
 */
import { aiCall } from './_ai.js';
import { logTokenUsage } from './_tokenLog.js';
import { jsonError, parseAiJson, estimateTokens } from './_utils.js';

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
    const submission = await env.DB.prepare(
      `SELECT s.id, s.exam_id AS examId, s.student_id AS studentId,
              e.title AS examTitle, e.work_id AS workId,
              w.title AS workTitle, w.author, w.content AS passage
       FROM submissions s
       JOIN exams e ON s.exam_id = e.id
       LEFT JOIN works w ON e.work_id = w.id
       WHERE s.id = ?`
    ).bind(submissionId).first();

    if (!submission) return jsonError('Không tìm thấy bài nộp.', 404);

    // Verify teacher owns this exam
    const examOwner = await env.DB.prepare(
      `SELECT id FROM exams WHERE id = ? AND teacher_id = ? LIMIT 1`
    ).bind(submission.examId, user.id).first();
    if (!examOwner) return jsonError('Không có quyền chấm bài này.', 403);

    // Load questions
    const questions = await env.DB.prepare(
      `SELECT id, content, type, points, rubric_content AS rubric
       FROM questions WHERE exam_id = ? ORDER BY "order" ASC`
    ).bind(submission.examId).all();

    // Load student answers
    const answers = await env.DB.prepare(
      `SELECT sa.question_id AS questionId, sa.content
       FROM submission_answers sa
       WHERE sa.submission_id = ?`
    ).bind(submissionId).all();

    if (!answers.results?.length) {
      return jsonError('Không tìm thấy câu trả lời.', 404);
    }

    const answerMap = new Map(answers.results.map(a => [a.questionId, a.content || '']));

    // ── Build grading prompt ────────────────────────────────────────────────
    const passageContext = submission.passage
      ? `\n\nVăn bản tác phẩm "${submission.workTitle}" của ${submission.author}:\n${submission.passage.slice(0, 3000)}`
      : '';

    const questionsText = questions.results.map((q, i) =>
      `Câu ${i + 1} (${q.points} điểm, ${q.type}):\n${q.content}\nCâu trả lời: ${answerMap.get(q.id) || '(trống)'}`
    ).join('\n\n');

    const systemPrompt =
      `Bạn là một giáo viên ngữ văn giàu kinh nghiệm. ` +
      `Nhiệm vụ: CHẤM BÀI bài tập làm văn của học sinh theo rubric cho sẵn.` +
      `${passageContext}` +
      `\n\nHãy chấm từng câu theo rubric, rồi trả lời theo định dạng JSON sau (KHÔNG thêm text khác ngoài JSON):` +
      `\n\n{\n  "scores": [\n    { "questionId": "...", "points": 0-10, "comment": "nhận xét ngắn" },\n    ...\n  ],\n  "totalScore": 0-10,\n  "summary": "nhận xét tổng quát 2-3 câu"\n}` +
      `\n\nQuy tắc: điểm trên thang 10, cho điểm tổng = (điểm_đạt / tổng_điểm) × 10.` +
      `\nChỉ trả JSON, không giải thích thêm.`;

    const userPrompt =
      `Đề thi: "${submission.examTitle}"\n\n${questionsText}`;

    // ── Call AI ─────────────────────────────────────────────────────────────
    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      '@cf/google/gemma-3-12b-it',
      { systemPrompt, messages: [{ role: 'user', content: userPrompt }], maxTokens: 1024, temperature: 0.2 }
    );

    // Parse AI response
    const { parsed: grading } = parseAiJson(aiResponse, null);
    if (!grading) {
      return jsonError('AI không trả JSON hợp lệ. Thử lại.', 500);
    }

    const gradingScores = /** @type {{ totalScore?: number, summary?: string, scores?: Array<{questionId: string, points: number, comment: string}> }} */ (grading || {});
    const aiScore = gradingScores.totalScore !== null && gradingScores.totalScore !== undefined
      ? Number(gradingScores.totalScore.toFixed(1))
      : null;

    // ── Save AI score to submission ─────────────────────────────────────────
    const summaryComment = gradingScores.summary || aiResponse.slice(0, 500);
    await env.DB.prepare(
      `UPDATE submissions
       SET ai_score = ?, teacher_comment = CONCAT(IFNULL(teacher_comment,''), '\n[AI] ', ?),
           status = CASE WHEN status = 'submitted' THEN 'ai_graded' ELSE status END
       WHERE id = ?`
    ).bind(aiScore, summaryComment.slice(0, 1000), submissionId).run();

    // Log token usage
    await logTokenUsage(env, user.id, 'grading',
      `Chấm: ${submission.examTitle} — ${submission.studentId}`, inputTokens, outputTokens);

    return new Response(JSON.stringify({
      success: true,
      aiScore,
      summary: summaryComment,
      details: gradingScores.scores || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-grade error:', error);
    return jsonError('Lỗi khi chấm bài AI.', 500);
  }
}

