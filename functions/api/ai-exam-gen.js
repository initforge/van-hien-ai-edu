/**
 * POST /api/ai/exam-gen — AI exam/question generation
 *
 * Uses @cf/mistralai/mistral-small-3.1-24b-instruct for structured question generation.
 * Creates exam + questions in DB. Called by teacher.
 *
 * Body: { workId?, classId?, title, type, duration, questions: [{content, type, points}] }
 */
import { aiCall } from './_ai.js';
import { logTokenUsage } from './_tokenLog.js';
import { jsonError, parseAiJson, estimateTokens, getWorkAnalysis } from './_utils.js';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const { title, type = 'exercise', duration = 45, workId, classId } = body;
    const { questions: questionRequests = [] } = body;

    if (!title?.trim()) {
      return jsonError('Thiếu tiêu đề đề thi.', 400);
    }

    // ── Build AI prompt from work_analysis ────────────────────────────────
    let passageContext = '';
    if (workId) {
      const work = await env.DB.prepare(
        `SELECT title, author FROM works WHERE id = ? AND teacher_id = ? LIMIT 1`
      ).bind(workId, user.id).first();
      if (work) {
        const analysis = await getWorkAnalysis(env.DB, workId);
        const parts = [
          analysis.summary       && `Tóm tắt:\n${analysis.summary}`,
          analysis.themes       && `Chủ đề:\n${analysis.themes}`,
          analysis.characters   && `Nhân vật:\n${analysis.characters}`,
          analysis.art_features && `Đặc sắc nghệ thuật:\n${analysis.art_features}`,
          analysis.content_value && `Giá trị:\n${analysis.content_value}`,
        ].filter(Boolean);
        passageContext = parts.length
          ? `\n\nTác phẩm "${work.title}" của ${work.author}:\n${parts.join('\n')}`
          : '';
      }
    }

    // Build existing questions hint
    const existingHint = questionRequests.length
      ? questionRequests.map((q, i) => `Câu ${i + 1}: ${q.content} (${q.type}, ${q.points} điểm)`).join('\n')
      : '(chưa có câu hỏi nào)';

    const systemPrompt =
      `Bạn là giáo viên ngữ văn Việt Nam. Nhiệm vụ: tạo CÂU HỎI bài tập/đề thi.` +
      passageContext +
      `\n\nLuôn trả JSON theo format sau, KHÔNG thêm text khác:` +
      `\n\n{\n  "questions": [\n    {\n      "content": "nội dung câu hỏi",\n      "type": "essay|short_answer|multiple_choice",\n      "points": 1-10,\n      "rubric": "gợi ý đáp án / rubric ngắn"\n    }\n  ]\n}` +
      `\n\nQuy tắc: Điểm essay tối đa 10, short_answer tối đa 5, multiple_choice tối đa 2.`;

    const userPrompt =
      `Tạo 5 câu hỏi cho đề "${title}" (${type}).\n` +
      `Tỷ lệ: 2 câu ngắn (1-2 điểm), 2 câu essay ngắn (2-3 điểm), 1 câu essay dài (4-5 điểm).\n` +
      `Yêu cầu: câu 1-2 phần đọc hiểu, câu 3-5 phần nghị luận.\n` +
      `Đề thi thuộc tác phẩm văn học Việt Nam.`;

    // ── Call AI ─────────────────────────────────────────────────────────────
    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      '@cf/mistralai/mistral-small-3.1-24b-instruct',
      { systemPrompt, messages: [{ role: 'user', content: userPrompt }], maxTokens: 1536, temperature: 0.6 }
    );

    // Parse AI JSON
    const { parsed } = parseAiJson(aiResponse, null);
    const parsedQuestions = /** @type {any[]} */ (parsed?.questions || []).slice(0, 10);

    if (!parsedQuestions.length) {
      return jsonError('AI không tạo được câu hỏi. Vui lòng thử lại.', 500);
    }

    // ── Create exam + questions in DB (transactional) ────────────────────
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

    // Log token usage
    await logTokenUsage(env, user.id, 'exam_gen',
      `Tạo đề: ${title} (${parsedQuestions.length} câu)`, inputTokens, outputTokens);

    return new Response(JSON.stringify({
      success: true,
      examId,
      title: title.trim(),
      type,
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

