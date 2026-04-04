/**
 * POST /api/ai/exam-preview — Generate exam questions (preview only, no DB save)
 * Teacher clicks "AI gợi ý đề" → preview → approve/reject
 *
 * Body: { title, type, workId, classId, duration }
 * Response: { previewId, title, questions[] }
 */
import { aiCall } from '../_ai.js';
import { kvSet } from '../_kv.js';
import { jsonError, parseAiJson } from '../_utils.js';

const KV_KEY_PREFIX = 'exam-preview:';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const { title, type = 'exercise', duration = 45, workId, classId } = body;

    if (!title?.trim()) {
      return jsonError('Thiếu tiêu đề đề thi.', 400);
    }

    // Build passage context from work
    let passageContext = '';
    if (workId) {
      const work = await env.DB.prepare(
        `SELECT title, author, content FROM works WHERE id = ? AND teacher_id = ? LIMIT 1`
      ).bind(workId, user.id).first();
      if (work) {
        passageContext =
          `\n\nTác phẩm: "${work.title}" của ${work.author}.\n` +
          `Nội dung:\n${(work.content || '').slice(0, 3000)}`;
      }
    }

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

    const { text: aiResponse } = await aiCall(
      '@cf/qwen/qwen2.5-coder-32b-instruct',
      { systemPrompt, messages: [{ role: 'user', content: userPrompt }], maxTokens: 1536, temperature: 0.6 }
    );

    const { parsed } = parseAiJson(aiResponse, null);
    const questions = /** @type {any[]} */ (parsed?.questions || []).slice(0, 10);

    if (!questions.length) {
      return jsonError('AI không tạo được câu hỏi. Vui lòng thử lại.', 500);
    }

    // Store preview in KV (30 min TTL)
    const previewId = crypto.randomUUID();
    await kvSet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`, {
      title: title.trim(),
      type,
      workId: workId || null,
      classId: classId || null,
      duration,
      questions,
      teacherId: user.id,
      createdAt: new Date().toISOString(),
    }, 1800);

    return new Response(JSON.stringify({
      previewId,
      title: title.trim(),
      type,
      questions,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/exam-preview error:', error);
    return jsonError('Lỗi khi tạo xem trước đề thi AI.', 500);
  }
}
