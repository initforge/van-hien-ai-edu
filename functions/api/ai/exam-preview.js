/**
 * POST /api/ai/exam-preview — Generate exam questions (preview only, no DB save)
 *
 * KEY RULES:
 * - Exam Part I: NEVER uses passageContext. Uses part1Prompt if given, else AI generates freely.
 * - Exam Part II.1 (NLXH): Uses part2Prompt if given, else AI generates freely.
 * - Exam Part II.2 (NLVH): ONLY this part uses passageContext (from work selection).
 * - Exercise: passageContext is fine since the whole exercise is based on one work.
 *
 * Body: { title, type, workId, classId, duration, structure,
 *         customPrompt, part1Prompt, part2Prompt }
 * Response: { previewId, title, questions[] }
 */
import { aiCall } from '../_ai.js';
import { kvSet } from '../_kv.js';
import { jsonError, parseAiJson, getWorkAnalysis } from '../_utils.js';
import { logTokenUsage } from '../_tokenLog.js';

const KV_KEY_PREFIX = 'exam-preview:';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function buildPassageContext(env, user, workId) {
  if (!workId) return '';
  const work = await env.DB.prepare(
    `SELECT title, author FROM works WHERE id = ? AND teacher_id = ? LIMIT 1`
  ).bind(workId, user.id).first();
  if (!work) return '';
  const analysis = await getWorkAnalysis(env.DB, workId);
  const lines = [
    `Tác phẩm "${work.title}" của ${work.author}.`,
    analysis.summary       ? `Tóm tắt: ${analysis.summary}`       : '',
    analysis.characters    ? `Phân tích nhân vật: ${analysis.characters}` : '',
    analysis.themes         ? `Chủ đề: ${analysis.themes}`          : '',
    analysis.art_features  ? `Đặc sắc nghệ thuật: ${analysis.art_features}` : '',
    analysis.content_value ? `Giá trị nội dung: ${analysis.content_value}` : '',
    analysis.context       ? `Bối cảnh: ${analysis.context}`       : '',
  ].filter(Boolean);
  return lines.join('\n');
}

const SYSTEM_PROMPT =
  `Bạn là giáo viên ngữ văn Việt Nam (THCS). Nhiệm vụ: tạo CÂU HỎI bài tập hoặc đề thi.` +
  `\n\nLuôn trả JSON theo format sau, KHÔNG thêm text khác ngoài JSON:` +
  `\n{ "questions": [ { "content": "nội dung câu hỏi", "type": "essay|short_answer", "points": 1-10, "rubric": "gợi ý" } ] }` +
  `\nQuy tắc: essay tối đa 10đ, short_answer tối đa 5đ. Tổng điểm mặc định 10.`;

// ── Main handler ───────────────────────────────────────────────────────────────

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
      structure,
      customPrompt,
      part1Prompt,
      part2Prompt,
    } = body;

    if (!title?.trim()) {
      return jsonError('Thiếu tiêu đề.', 400);
    }

    // passageContext chỉ dùng cho Part II.2 (đề thi) và exercise (bài tập)
    const passageContext = await buildPassageContext(env, user, workId);

    let userPrompt;

    if (type === 'exam' && structure) {
      // ── EXAM: cố định 3+7, gán ĐÚNG điểm từng câu ───────────────────────
      // Câu 1 = I.1 Nhận biết (0.5đ), Câu 2 = I.2 Thông hiểu (1đ), Câu 3 = I.3 Vận dụng (1.5đ)
      // Câu 4 = II.1 Nghị luận xã hội (2đ), Câu 5 = II.2 Nghị luận văn học (5đ)
      const part1 = part1Prompt
        ? `Câu 1 (0.5đ) — Nhận biết: ${part1Prompt}\nCâu 2 (1.0đ) — Thông hiểu: ${part1Prompt}\nCâu 3 (1.5đ) — Vận dụng: ${part1Prompt}`
        : `Câu 1 (0.5đ) — Nhận biết. Tự tạo văn bản đọc hiểu nếu cần.\nCâu 2 (1.0đ) — Thông hiểu. Tự tạo văn bản đọc hiểu nếu cần.\nCâu 3 (1.5đ) — Vận dụng. Tự tạo văn bản đọc hiểu nếu cần.\nLưu ý: KHÔNG dùng tác phẩm từ thư viện cho 3 câu này.`;

      const part2Social = part2Prompt
        ? `Câu 4 (2.0đ) — Nghị luận xã hội: ${part2Prompt}`
        : `Câu 4 (2.0đ) — Nghị luận xã hội. Viết đoạn văn ngắn 150-200 chữ. Tự chọn chủ đề phù hợp.`;

      const part2Lit = passageContext
        ? `Câu 5 (5.0đ) — Nghị luận văn học. Dựa trên tác phẩm đã chọn.\n${passageContext}`
        : `Câu 5 (5.0đ) — Nghị luận văn học. Tự chọn tác phẩm Việt Nam phù hợp chương trình THCS.`;

      userPrompt =
        `Tạo đề thi "${title}" (THCS).\n` +
        `Cấu trúc bắt buộc — mỗi câu có ĐÚNG số điểm như ghi bên dưới:\n` +
        `${part1}\n${part2Social}\n${part2Lit}`;

    } else if (type === 'exam') {
      // Default exam structure (hardcoded 3+7)
      userPrompt =
        `Tạo đề thi "${title}" (THCS). Cấu trúc bắt buộc:\n` +
        `Câu 1 (0.5đ) — Nhận biết. Tự tạo văn bản đọc hiểu. KHÔNG dùng tác phẩm thư viện.\n` +
        `Câu 2 (1.0đ) — Thông hiểu.\n` +
        `Câu 3 (1.5đ) — Vận dụng.\n` +
        `Câu 4 (2.0đ) — Nghị luận xã hội. Viết đoạn văn 150-200 chữ.\n` +
        `Câu 5 (5.0đ) — Nghị luận văn học. Tự chọn tác phẩm Việt Nam phù hợp.`;

    } else {
      // ── EXERCISE ─────────────────────────────────────────────────────────
      if (customPrompt) {
        userPrompt =
          `Tạo 4 câu hỏi bài tập "${title}" theo yêu cầu giáo viên:\n${customPrompt}`;
      } else if (passageContext) {
        userPrompt =
          `Tạo 4 câu hỏi bài tập "${title}" dựa trên tác phẩm:\n${passageContext}\n` +
          `2 câu đọc hiểu (1đ) + 1 câu thông hiểu (2đ) + 1 câu vận dụng/nghị luận (2đ). Tổng 6 điểm.`;
      } else {
        userPrompt =
          `Tạo 4 câu hỏi bài tập "${title}".\n` +
          `Đa dạng loại (tự luận, trả lời ngắn), mỗi câu 1-3 điểm, tổng tối đa 10 điểm.\n` +
          `Câu 1-2: đọc hiểu. Câu 3-4: vận dụng, nghị luận ngắn. Không bắt buộc gắn tác phẩm.`;
      }
    }

    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      env,
      '@cf/mistralai/mistral-small-3.1-24b-instruct',
      { systemPrompt: SYSTEM_PROMPT, messages: [{ role: 'user', content: userPrompt }], maxTokens: 1536, temperature: 0.6 }
    );

    const { parsed } = parseAiJson(aiResponse, null);
    const questions = /** @type {any[]} */ (parsed?.questions || []).slice(0, 10);

    if (!questions.length) {
      return jsonError('AI không tạo được câu hỏi. Vui lòng thử lại.', 500);
    }

    const previewId = crypto.randomUUID();
    await kvSet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`, {
      title: title.trim(),
      type,
      workId: workId || null,
      classId: classId || null,
      duration,
      deadline: deadline || null,
      questions,
      customPrompt: customPrompt || null,
      teacherId: user.id,
      createdAt: new Date().toISOString(),
    }, 1800);

    await logTokenUsage(env, user.id, 'exam_gen',
      `Tạo đề: ${title.trim()}`, inputTokens, outputTokens);

    return new Response(JSON.stringify({ previewId, title: title.trim(), type, questions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/exam-preview error:', error);
    return jsonError('Lỗi khi tạo xem trước đề thi AI.', 500);
  }
}
