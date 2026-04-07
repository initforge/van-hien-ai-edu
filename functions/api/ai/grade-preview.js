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

    // Load rubric criteria from DB
    const rubricRows = await env.DB.prepare(
      `SELECT name, description, weight, hint_prompt AS hintPrompt
       FROM rubric_criteria
       WHERE teacher_id = ? AND is_active = 1
       ORDER BY order_index ASC`
    ).bind(user.id).all();

    const criteria = rubricRows.results?.length
      ? rubricRows.results
      : [
          { name: 'Nội dung', description: 'Phân tích đúng yêu cầu đề bài', weight: 40, hintPrompt: '' },
          { name: 'Lập luận', description: 'Sự logic và thuyết phục', weight: 25, hintPrompt: '' },
          { name: 'Diễn đạt', description: 'Từ vựng, ngữ pháp linh hoạt', weight: 20, hintPrompt: '' },
          { name: 'Hình thức', description: 'Trình bày, lỗi chính tả', weight: 15, hintPrompt: '' },
        ];

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

    const criteriaText = criteria.map((c, i) =>
      `Tiêu chí ${i + 1}: ${c.name} (${c.weight}%)${c.description ? ` — ${c.description}` : ''}${c.hintPrompt ? ` | Gợi ý: ${c.hintPrompt}` : ''}`
    ).join('\n');

    const systemPrompt =
      `Bạn là một giáo viên ngữ văn giàu kinh nghiệm. ` +
      `Nhiệm vụ: CHẤM BÀI bài tập làm văn của học sinh theo rubric cho sẵn.` +
      `${passageContext}` +
      `\n\nRubric chấm điểm (tổng 10 điểm):\n${criteriaText}` +
      `\n\nBài làm của học sinh:\n${questionsText}` +
      `\n\nHãy chấm từng tiêu chí theo rubric, rồi trả lời JSON (KHÔNG thêm text khác):` +
      `\n\n{\n  "rubricScores": [\n    { "name": "Nội dung", "points": 0-10, "comment": "nhận xét ngắn gọn" },\n    ...\n  ],\n  "totalScore": 0-10,\n  "summary": "nhận xét tổng quát 2-3 câu"\n}` +
      `\n\nQuy tắc: điểm trên thang 10, chỉ trả JSON.`;

    const { text: aiResponse } = await aiCall(
      '@cf/google/gemma-3-12b-it',
      { systemPrompt, messages: [{ role: 'user', content: questionsText }], maxTokens: 1024, temperature: 0.2 }
    );

    const { parsed } = parseAiJson(aiResponse, null);
    const grading = /** @type {{ totalScore?: number, summary?: string, rubricScores?: any[] }} */ (parsed || {});

    const rubricScores = (grading.rubricScores || []).map(s => ({
      name: String(s.name || ''),
      points: Math.max(0, Math.min(10, parseFloat(s.points ?? s.point ?? 0))),
      comment: String(s.comment || ''),
    }));

    const totalScore = grading.totalScore !== null && grading.totalScore !== undefined
      ? Number(grading.totalScore.toFixed(1))
      : null;

    const payload = {
      submissionId,
      rubricScores,
      totalScore,
      summary: grading.summary || '',
      raw: aiResponse.slice(0, 500),
      teacherId: user.id,
    };

    // Store in KV (re-use submissionId as key, 30 min TTL)
    await kvSet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${submissionId}`, payload, 1800);

    return new Response(JSON.stringify({
      submissionId,
      rubricScores,
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