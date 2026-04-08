/**
 * POST /api/ai/exam-preview — Generate exam questions (preview only, no DB save)
 * Teacher clicks "AI gợi ý đề" → preview → approve/reject
 *
 * Body: { title, type, workId, classId, duration }
 * Response: { previewId, title, questions[] }
 */
import { aiCall } from '../_ai.js';
import { kvSet } from '../_kv.js';
import { jsonError, parseAiJson, getWorkAnalysis } from '../_utils.js';
import { logTokenUsage } from '../_tokenLog.js';

const KV_KEY_PREFIX = 'exam-preview:';

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
      deadline,
      structure, // { part1Name, part1Points, part2Name, part2Points }
    } = body;

    if (!title?.trim()) {
      return jsonError('Thiếu tiêu đề đề thi.', 400);
    }

    // Build passage context from work_analysis + work metadata
    let passageContext = '';
    if (workId) {
      const work = await env.DB.prepare(
        `SELECT title, author FROM works WHERE id = ? AND teacher_id = ? LIMIT 1`
      ).bind(workId, user.id).first();
      if (work) {
        const analysis = await getWorkAnalysis(env.DB, workId);
        const summary   = analysis.summary       || '';
        const themes    = analysis.themes         || '';
        const chars     = analysis.characters     || '';
        const artFeat   = analysis.art_features  || '';
        const ctxVal    = analysis.content_value  || '';
        const context   = analysis.context       || '';

        passageContext =
          `\n\nTác phẩm: "${work.title}" của ${work.author}.` +
          (summary  ? `\nTóm tắt tác phẩm:\n${summary}` : '') +
          (chars    ? `\nPhân tích nhân vật:\n${chars}` : '') +
          (themes   ? `\nChủ đề và thông điệp:\n${themes}` : '') +
          (artFeat  ? `\nĐặc sắc nghệ thuật:\n${artFeat}` : '') +
          (ctxVal   ? `\nGiá trị nội dung:\n${ctxVal}` : '') +
          (context  ? `\nBối cảnh:\n${context}` : '');
      }
    }

    const systemPrompt =
      `Bạn là giáo viên ngữ văn Việt Nam. Nhiệm vụ: tạo CÂU HỎI bài tập/đề thi.` +
      passageContext +
      `\n\nLuôn trả JSON theo format sau, KHÔNG thêm text khác:` +
      `\n\n{\n  "questions": [\n    {\n      "content": "nội dung câu hỏi",\n      "type": "essay|short_answer|multiple_choice",\n      "points": 1-10,\n      "rubric": "gợi ý đáp án / rubric ngắn"\n    }\n  ]\n}` +
      `\n\nQuy tắc: Điểm essay tối đa 10, short_answer tối đa 5, multiple_choice tối đa 2.`;

    let userPrompt;
    if (type === 'exam' && structure) {
      // Exam: use the teacher's custom structure
      userPrompt =
        `Tạo 5 câu hỏi cho đề thi "${title}".\n` +
        `Tỷ lệ điểm:\n` +
        `  - Phần I: "${structure.part1Name}" — ${structure.part1Points} điểm\n` +
        `  - Phần II: "${structure.part2Name}" — ${structure.part2Points} điểm\n` +
        `\nCấu trúc chi tiết:\n` +
        `  - 2 câu hỏi phần ${structure.part1Name} (tổng ~${structure.part1Points}đ): nhận biết, thông hiểu, vận dụng\n` +
        `  - 2 câu phần ${structure.part2Name} vừa (~${Math.round(structure.part2Points / 2)}đ): ngắn, suy luận\n` +
        `  - 1 câu phần ${structure.part2Name} dài (${structure.part2Points - Math.round(structure.part2Points / 2)}đ): nghị luận sâu, viết bài hoàn chỉnh\n` +
        `\nĐề thi thuộc tác phẩm văn học Việt Nam. Tổng điểm: ${structure.part1Points + structure.part2Points} điểm.`;
    } else if (type === 'exam') {
      // Exam with default structure
      userPrompt =
        `Tạo 5 câu hỏi cho đề thi "${title}".\n` +
        `Cấu trúc: Phần I — Đọc hiểu (3 điểm): 2 câu ngắn; Phần II — Làm văn (7 điểm): 2 câu vừa + 1 câu dài.\n` +
        `Đề thi thuộc tác phẩm văn học Việt Nam.`;
    } else {
      // Exercise: flexible format
      userPrompt =
        `Tạo 4 câu hỏi bài tập "${title}".\n` +
        `Yêu cầu: đa dạng loại (tự luận, trắc nghiệm, trả lời ngắn), mỗi câu 1-3 điểm, tổng không quá 10 điểm.\n` +
        `Câu 1-2: đọc hiểu văn bản. Câu 3-4: vận dụng, nghị luận ngắn.\n` +
        `Không bắt buộc gắn tác phẩm cụ thể.`;
    }

    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      env,
      '@cf/mistralai/mistral-small-3.1-24b-instruct',
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
      deadline: deadline || null,
      questions,
      teacherId: user.id,
      createdAt: new Date().toISOString(),
    }, 1800);

    await logTokenUsage(env, user.id, 'exam_gen',
      `Tạo đề: ${title.trim()}`, inputTokens, outputTokens);

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
