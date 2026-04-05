/**
 * POST /api/ai/multiverse-preview — Generate multiverse storyline (preview only)
 * Allowed for: students and teachers
 *
 * Body: { workId, branchPoint }
 * Response: { previewId, title, content, moral }
 */
import { aiCall } from '../_ai.js';
import { kvSet } from '../_kv.js';
import { jsonError, parseAiJson, getWorkAnalysis } from '../_utils.js';
import { logTokenUsage } from '../_tokenLog.js';

const KV_KEY_PREFIX = 'multiverse-preview:';

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
      return jsonError('Unauthorized', 401);
    }

    const { workId, branchPoint } = await request.json();
    if (!workId || !branchPoint?.trim()) {
      return jsonError('Thiếu workId hoặc branchPoint.', 400);
    }

    // Load work + analysis
    const work = await env.DB.prepare(
      `SELECT id, title, author FROM works
       WHERE id = ? AND analysis_status = 'done' LIMIT 1`
    ).bind(workId).first();

    if (!work) return jsonError('Không tìm thấy tác phẩm.', 404);

    const analysis = await getWorkAnalysis(env.DB, workId);
    const passageContext =
      `\n\nTác phẩm: "${work.title}" của ${work.author}.` +
      (analysis.summary  ? `\nTóm tắt:\n${analysis.summary}` : '') +
      (analysis.context ? `\nBối cảnh:\n${analysis.context}` : '') +
      (analysis.themes  ? `\nChủ đề:\n${analysis.themes}` : '') +
      (analysis.characters ? `\nNhân vật:\n${analysis.characters}` : '');

    const systemPrompt =
      `Bạn là nhà văn sáng tạo chuyên về văn học Việt Nam. ` +
      `Nhiệm vụ: viết một CÂU CHUYỆN THAY THẾ dựa trên một "điểm rẽ nhánh" trong tác phẩm gốc.` +
      `${passageContext}` +
      `\n\nQuy tắc:` +
      `\n- Giữ đúng giọng văn, phong cách, nhịp điệu của tác giả gốc` +
      `\n- Không quá 800 từ` +
      `\n- Có đoạn mở đầu nối từ "Điểm rẽ nhánh" rồi phát triển câu chuyện thay thế` +
      `\n- Kết thúc tự nhiên, có ý nghĩa` +
      `\n- Trả về JSON: { "title": "...", "content": "...", "moral": "..." }`;

    const userPrompt =
      `Điểm rẽ nhánh: "${branchPoint}"\n\n` +
      `Hãy viết một câu chuyện thay thế cho tác phẩm "${work.title}" bắt đầu từ điểm rẽ nhánh trên.`;

    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      '@cf/qwen/qwq-32b',
      { systemPrompt, messages: [{ role: 'user', content: userPrompt }], maxTokens: 1536, temperature: 0.85 }
    );

    await logTokenUsage(env, user.id, 'multiverse',
      `Đa vũ trụ preview: ${work.title} — ${branchPoint.slice(0, 30)}`,
      inputTokens, outputTokens);

    const { parsed } = parseAiJson(aiResponse, null);
    const storyline = {
      title: `Nhánh mới — ${work.title}`,
      content: aiResponse,
      moral: '',
      ...( /** @type {any} */ (parsed) || {}),
    };

    // Store preview in KV (30 min TTL)
    const previewId = crypto.randomUUID();
    await kvSet(env.VANHIEN_KV, `${KV_KEY_PREFIX}${previewId}`, {
      workId,
      branchPoint,
      title: storyline.title || '',
      content: storyline.content || aiResponse,
      moral: storyline.moral || '',
      userId: user.id,
      userRole: user.role,
      createdAt: new Date().toISOString(),
    }, 1800);

    return new Response(JSON.stringify({
      previewId,
      title: storyline.title || '',
      content: storyline.content || aiResponse,
      moral: storyline.moral || '',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai/multiverse-preview error:', error);
    return jsonError('Lỗi khi tạo xem trước đa vũ trụ.', 500);
  }
}
