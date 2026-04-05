/**
 * POST /api/ai/grade-preview — Generate AI grading (preview only, no DB save)
 *
 * Body: { submissionId }
 * Response: { submissionId, scores[], totalScore, summary }
 */
import { aiCall } from '../_ai.js';
import { kvSet } from '../_kv.js';
import { jsonError, parseAiJson, getWorkAnalysis } from '../_utils.js';

const KV_KEY_PREFIX = 'grade-preview:';

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

    // Load submission + exam + work
    const submission = await env.DB.prepare(
      `SELECT s.id, s.exam_id AS examId, s.student_id AS studentId,
              e.title AS examTitle, e.work_id AS workId,
              w.title AS workTitle, w.author
       FROM submissions s
       JOIN exams e ON s.exam_id = e.id
       LEFT JOIN works w ON e.work_id = w.id
       WHERE s.id = ?`
    ).bind(submissionId).first();

    if (!submission) return jsonError('Không tìm thấy bài nộp.', 404);

    const examOwner = await env.DB.prepare(
      `SELECT id FROM exams WHERE id = ? AND teacher_id = ? LIMIT 1`
    ).bind(submission.examId, user.id).first();
    if (!examOwner) return jsonError('Không có quyền chấm bài này.', 403);

    // Load questions and answers
    const [questionsResult, answersResult] = await Promise.all([
      env.DB.prepare(
        `SELECT id, content, type, points, rubric FROM questions WHERE exam_id = ? ORDER BY order_index ASC`
      ).bind(submission.examId).all(),
      env.DB.prepare(
        `SELECT question_id AS questionId, content FROM submission_answers WHERE submission_id = ?`
      ).bind(submissionId).all(),
    ]);

    if (!answersResult.results?.length) {
      return jsonError('Không tìm thấy câu trả lời.', 404);
    }

    const answerMap = new Map(answersResult.results.map(a => [a.questionId, a.content || '']));

    // Build passage context from work_analysis (structured analysis)
    const passageContext = submission.workId
      ? await (async () => {
          const analysis = await getWorkAnalysis(env.DB, submission.workId);
          const parts = [
            analysis.summary       && `Tóm tắt:\n${analysis.summary}`,
            analysis.characters    && `Phân tích nhân vật:\n${analysis.characters}`,
            analysis.art_features && `Đặc sắc nghệ thuật:\n${analysis.art_features}`,
            analysis.content_value && `Giá trị nội dung:\n${analysis.content_value}`,
            analysis.context      && `Bối cảnh:\n${analysis.context}`,
          ].filter(Boolean);
          const header = submission.workTitle
            ? `\n\nTác phẩm "${submission.workTitle}" của ${submission.author || '?'}:`
            : '';
          return header + (parts.length ? '\n' + parts.join('\n') : '');
        })()
      : '';

    const questionsText = questionsResult.results.map((q, i) =>
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

    const { text: aiResponse } = await aiCall(
      '@cf/google/gemma-3-12b-it',
      { systemPrompt, messages: [{ role: 'user', content: questionsText }], maxTokens: 1024, temperature: 0.2 }
    );

    const { parsed } = parseAiJson(aiResponse, null);
    const grading = /** @type {{ totalScore?: number, summary?: string, scores?: any[] }} */ (parsed || {});

    const totalScore = grading.totalScore !== null && grading.totalScore !== undefined
      ? Number(grading.totalScore.toFixed(1))
      : null;

    const payload = {
      submissionId,
      scores: grading.scores || [],
      totalScore,
      summary: grading.summary || '',
      raw: aiResponse.slice(0, 500),
      teacherId: user.id,
    };

    // Store in KV (re-use submissionId as key, 30 min TTL)
    await kvSet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${submissionId}`, payload, 1800);

    return new Response(JSON.stringify({
      submissionId,
      scores: grading.scores || [],
      totalScore,
      summary: grading.summary || '',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/grade-preview error:', error);
    return jsonError('Lỗi khi chấm bài AI.', 500);
  }
}