/**
 * POST /api/ai/exam-preview — Generate exam questions (preview only, no DB save)
 * Teacher clicks "AI gợi ý đề" → preview → approve/reject
 *
 * Body: { title, type, workId, classId, duration, level, deadline }
 *   type = 'exercise' | 'exam'
 *   level = 'THCS' | 'THPT' (cấp học, ảnh hưởng ngữ liệu và yêu cầu)
 * Response: { previewId, title, questions[] }
 */
import { aiCall } from '../_ai.js';
import { kvSet } from '../_kv.js';
import { jsonError, parseAiJson, getWorkAnalysis } from '../_utils.js';
import { logTokenUsage } from '../_tokenLog.js';

const KV_KEY_PREFIX = 'exam-preview:';

// ── Level metadata ─────────────────────────────────────────────────────────
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

// ── Work context builder ────────────────────────────────────────────────────
async function buildWorkContext(db, workId, teacherId, level) {
  if (!workId) return { work: null, context: '' };

  const work = await db.prepare(
    `SELECT title, author FROM works WHERE id = ? AND teacher_id = ? LIMIT 1`
  ).bind(workId, teacherId).first();
  if (!work) return { work: null, context: '' };

  const a = await getWorkAnalysis(db, workId);
  const meta = LEVEL_META[level] || LEVEL_META.THCS;
  const context =
    `\n\nTác phẩm "${work.title}" của ${work.author} (${meta.gradeBand}).` +
    (a.summary       ? `\nTóm tắt: ${a.summary}` : '') +
    (a.characters    ? `\nPhân tích nhân vật: ${a.characters}` : '') +
    (a.themes        ? `\nChủ đề: ${a.themes}` : '') +
    (a.art_features  ? `\nĐặc sắc nghệ thuật: ${a.art_features}` : '') +
    (a.content_value ? `\nGiá trị: ${a.content_value}` : '') +
    (a.context       ? `\nBối cảnh: ${a.context}` : '');

  return { work, context };
}

// ── Exercise prompt: 4 câu Đọc hiểu phù hợp cấp 2 ──────────────────────────
function buildExercisePrompt(title, workContext, level) {
  const meta = LEVEL_META[level] || LEVEL_META.THCS;

  const systemPrompt =
    `Bạn là giáo viên ngữ văn Việt Nam giàu kinh nghiệm, chuyên ra đề ${meta.gradeBand}.` +
    workContext +
    `\n\nTrả JSON đúng format, KHÔNG thêm text khác ngoài JSON:` +
    `\n{\n  "questions": [\n    {\n      "content": "nội dung câu hỏi",\n      "type": "essay|short_answer|multiple_choice",\n      "points": số điểm 1-10,\n      "rubric": "gợi ý đáp án ngắn gọn"\n    }\n  ]\n}` +
    `\nQuy tắc: short_answer tối đa 3 điểm, multiple_choice tối đa 2 điểm, essay tối đa 10 điểm.`;

  // 4 câu Đọc hiểu đúng cấu trúc cấp 2
  const userPrompt =
    `Tạo 4 câu hỏi ĐỌC HIỂU cho bài tập "${title}", ${meta.gradeDesc}.\n\n` +
    `LUÔN theo cấu trúc và thứ tự sau:\n\n` +
    `Câu 1 (1.0 điểm, short_answer): Cho một khổ thơ/trích đoạn ngắn (tự viết phù hợp bối cảnh tác phẩm) rồi hỏi:\n` +
    `"Đoạn thơ gây ấn tượng trong em ở điểm nào? Vì sao?"\n` +
    `Yêu cầu: HS trả lời bằng 2-4 câu, nêu cụ thể chi tiết (hình ảnh, âm thanh, cảm xúc, từ ngữ đặc sắc) gây ấn tượng và giải thích vì sao.\n\n` +
    `Câu 2 (1.0 điểm, short_answer): "Nêu nội dung chính của khổ thơ/trích đoạn."\n` +
    `Yêu cầu: paraphrasing hoặc tóm tắt ngắn gọn 2-4 câu.\n\n` +
    `Câu 3 (1.0 điểm, short_answer): "Tìm một phép tu từ (ẩn dụ, so sánh, nhân hóa, điệp ngữ, đối xứng...) có trong khổ thơ và nêu tác dụng của nó."\n` +
    `Lưu ý: Có thể gợi ý đúng phép tu từ cần tìm (VD: "Tìm phép ẩn dụ...") hoặc để HS tự nhận diện.\n\n` +
    `Câu 4 (2.0 điểm, essay): Viết đoạn văn ${meta.writingLen} nêu suy nghĩ/cảm nhận về một khía cạnh trong tác phẩm hoặc rút ra từ nội dung đọc hiểu.\n` +
    `Yêu cầu: có suy luận, cảm nhận cá nhân, liên hệ bản thân.\n\n` +
    `Tất cả câu hỏi phải phù hợp ${meta.readerLevel}. Dùng ngôn ngữ rõ ràng, không mơ hồ.`;

  return { systemPrompt, userPrompt };
}

// ── Exam prompt: Phần I Đọc hiểu 3.0đ + Phần II Viết 7.0đ ──────────────────
function buildExamPrompt(title, workContext, level, hasWork) {
  const meta = LEVEL_META[level] || LEVEL_META.THCS;
  const essayLen = level === 'THCS' ? '600-800 chữ' : '600-900 chữ';

  const systemPrompt =
    `Bạn là giáo viên ngữ văn Việt Nam giàu kinh nghiệm, chuyên ra đề kiểm tra ${meta.gradeBand}.` +
    workContext +
    `\n\nTrả JSON đúng format, KHÔNG thêm text khác ngoài JSON:` +
    `\n{\n  "questions": [\n    {\n      "content": "nội dung câu hỏi",\n      "type": "essay|short_answer|multiple_choice",\n      "points": số điểm 1-10,\n      "rubric": "gợi ý đáp án ngắn gọn"\n    }\n  ]\n}` +
    `\nQuy tắc: short_answer tối đa 3, multiple_choice tối đa 2, essay tối đa 10. Tổng điểm mặc định 10.`;

  let userPrompt = '';

  if (hasWork) {
    // Có tác phẩm → Phần I dùng ngữ liệu thật + Phần II Câu 2 NLVH bắt buộc dựa vào tác phẩm
    userPrompt =
      `Tạo đề thi kiểm tra "${title}", ${meta.gradeDesc}.\n\n` +
      `CẤU TRÚC BẮT BUỘC:\n\n` +
      `PHẦN I — ĐỌC HIỂU (3.0 điểm)\n` +
      `Gồm 3 câu hỏi tổng cộng 3.0 điểm:\n` +
      `• Câu I.1 (0.5 điểm, multiple_choice): Hỏi về yếu tố hình thức cụ thể (thể thơ, phép tu từ, biện pháp tu từ, nhịp điệu, từ vựng đặc sắc). LUÔN kèm 4 đáp án A/B/C/D rõ ràng.\n` +
      `• Câu I.2 (1.0 điểm, short_answer): Hỏi nội dung hoặc ý nghĩa một khía cạnh cụ thể trong tác phẩm. Trả lời ngắn gọn 1-3 câu.\n` +
      `• Câu I.3 (1.5 điểm, essay): "Nêu cảm nhận về [nhân vật / khổ thơ / chi tiết cụ thể]. Điều đó gây ấn tượng trong em ở điểm nào? Vì sao?"\n` +
      `Viết đoạn văn ${meta.writingLen}.\n\n` +
      `PHẦN II — VIẾT (7.0 điểm)\n` +
      `• Câu II.1 — Nghị luận xã hội (2.0 điểm, essay): Viết đoạn văn ${meta.writingLen} bàn về một tư tưởng đạo lý hoặc hiện tượng đời sống được gợi ra từ nội dung tác phẩm đã đọc HOẶC từ cuộc sống hằng ngày.\n` +
      `• Câu II.2 — Nghị luận văn học (5.0 điểm, essay): Dựa trên tác phẩm trong phần đọc hiểu.\n` +
      `  Yêu cầu: Phân tích, đánh giá một khía cạnh văn học cụ thể — cảm nhận nhân vật, phân tích chi tiết tiêu biểu, nhận xét giá trị nội dung hoặc nghệ thuật, tác dụng biện pháp tu từ...\n` +
      `  Viết bài văn hoàn chỉnh khoảng ${essayLen}, có mở bài, thân bài, kết bài.\n`;
  } else {
    // Không có tác phẩm → Phần I tự tạo ngữ liệu + NLVH tự do
    userPrompt =
      `Tạo đề thi kiểm tra "${title}", ${meta.gradeDesc}.\n\n` +
      `CẤU TRÚC BẮT BUỘC:\n\n` +
      `PHẦN I — ĐỌC HIỂU (3.0 điểm)\n` +
      `• Câu I.1 (0.5 điểm, multiple_choice): Đầu tiên TỰ VIẾT một đoạn văn/bài thơ ngắn (phù hợp ${meta.readerLevel}, khoảng 10-15 dòng, chủ đề văn học Việt Nam phổ thông) rồi hỏi về yếu tố hình thức (thể thơ, phép tu từ, biện pháp tu từ). LUÔN kèm 4 đáp án A/B/C/D.\n` +
      `• Câu I.2 (1.0 điểm, short_answer): Hỏi nội dung chính hoặc ý nghĩa của đoạn văn/bài thơ đó.\n` +
      `• Câu I.3 (1.5 điểm, essay): "Đoạn văn/bài thơ gây ấn tượng trong em ở điểm nào? Vì sao?" Viết đoạn văn ${meta.writingLen}.\n\n` +
      `PHẦN II — VIẾT (7.0 điểm)\n` +
      `• Câu II.1 — Nghị luận xã hội (2.0 điểm, essay): Viết đoạn văn ${meta.writingLen} bàn về một tư tưởng đạo lý hoặc hiện tượng đời sống gần gũi.\n` +
      `• Câu II.2 — Nghị luận văn học (5.0 điểm, essay): Phân tích, đánh giá một tác phẩm hoặc đoạn trích văn học Việt Nam (tự chọn, ưu tiên tác phẩm nổi tiếng phù hợp ${meta.readerLevel}).\n` +
      `  Trọng tâm: cảm nhận văn học, phân tích nhân vật/tư tưởng, nhận xét đặc sắc nghệ thuật.\n` +
      `  Viết bài văn hoàn chỉnh khoảng ${essayLen}, có mở bài, thân bài, kết bài.\n`;
  }

  userPrompt += `\n\nTất cả câu hỏi phải phù hợp ${meta.readerLevel}. Không hỏi chung chung, mỗi câu phải có nội dung cụ thể.`;

  return { systemPrompt, userPrompt };
}

// ── Main handler ──────────────────────────────────────────────────────────
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
      level = 'THCS',
    } = body;

    if (!title?.trim()) {
      return jsonError('Thiếu tiêu đề đề thi.', 400);
    }
    if (!['exercise', 'exam'].includes(type)) {
      return jsonError("type phải là 'exercise' hoặc 'exam'.", 400);
    }
    if (!['THCS', 'THPT'].includes(level)) {
      return jsonError("level phải là 'THCS' hoặc 'THPT'.", 400);
    }

    // Build work context
    const { work, context: workContext } = await buildWorkContext(env.DB, workId, user.id, level);

    // Build prompts based on type
    const { systemPrompt, userPrompt } =
      type === 'exercise'
        ? buildExercisePrompt(title, workContext, level)
        : buildExamPrompt(title, workContext, level, !!work);

    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      '@cf/mistralai/mistral-small-3.1-24b-instruct',
      { systemPrompt, messages: [{ role: 'user', content: userPrompt }], maxTokens: 2048, temperature: 0.65 }
    );

    const { parsed } = parseAiJson(aiResponse, null);
    const questions = /** @type {any[]} */ (parsed?.questions || []).slice(0, 10);

    if (!questions.length) {
      return jsonError('AI không tạo được câu hỏi. Thử lại hoặc đổi nội dung.', 500);
    }

    // Store preview in KV (30 min TTL)
    const previewId = crypto.randomUUID();
    await kvSet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`, {
      title: title.trim(),
      type,
      workId: workId || null,
      classId: classId || null,
      duration,
      level,
      deadline: deadline || null,
      questions,
      teacherId: user.id,
      createdAt: new Date().toISOString(),
    }, 1800);

    await logTokenUsage(env, user.id, 'exam_preview',
      `Tạo đề: ${title.trim()} (${type}, ${level})`, inputTokens, outputTokens);

    return new Response(JSON.stringify({
      previewId,
      title: title.trim(),
      type,
      level,
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