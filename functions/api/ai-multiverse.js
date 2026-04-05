/**
 * POST /api/ai/multiverse — AI multiverse / what-if storyline generation
 *
 * Uses @cf/qwen/qwq-32b for creative narrative branching.
 * Generates an alternate storyline based on a "branch point" in the original work.
 *
 * Body: { workId, branchPoint }
 */
import { aiCall } from './_ai.js';
import { logTokenUsage } from './_tokenLog.js';
import { jsonError, parseAiJson, estimateTokens, getWorkAnalysis } from './_utils.js';

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

    // ── Load work + analysis ──────────────────────────────────────────────
    const work = await env.DB.prepare(
      `SELECT id, title, author FROM works
       WHERE id = ? AND analysis_status = 'done' LIMIT 1`
    ).bind(workId).first();

    if (!work) return jsonError('Không tìm thấy tác phẩm.', 404);

    const analysis = await getWorkAnalysis(env.DB, workId);
    const passageContext =
      `\n\nTác phẩm: "${work.title}" của ${work.author}.` +
      (analysis.summary    ? `\nTóm tắt:\n${analysis.summary}`    : '') +
      (analysis.context   ? `\nBối cảnh:\n${analysis.context}`   : '') +
      (analysis.themes    ? `\nChủ đề:\n${analysis.themes}`     : '') +
      (analysis.characters ? `\nNhân vật:\n${analysis.characters}` : '');

    // ── Build prompt ──────────────────────────────────────────────────
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

    // ── Call AI ─────────────────────────────────────────────────────────
    const { text: aiResponse, inputTokens, outputTokens } = await aiCall(
      '@cf/qwen/qwq-32b',
      { systemPrompt, messages: [{ role: 'user', content: userPrompt }], maxTokens: 1536, temperature: 0.85 }
    );

    // Parse JSON (graceful fallback)
    const { parsed } = parseAiJson(aiResponse, null);
    const storyline = {
      title: `Nhánh mới — ${work.title}`,
      content: aiResponse,
      moral: '',
      ...( /** @type {any} */ (parsed) || {}),
    };

    // ── Save to DB ──────────────────────────────────────────────────────
    const storylineId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO storylines (id, work_id, student_id, branch_point, title, content, moral, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)`
    ).bind(storylineId, workId, user.id, branchPoint, storyline.title || '', storyline.content || aiResponse, storyline.moral || '', now).run();

    // Log token usage
    await logTokenUsage(env, user.id, 'multiverse',
      `Đa vũ trụ: ${work.title} — ${branchPoint.slice(0, 30)}`,
      inputTokens, outputTokens);

    return new Response(JSON.stringify({
      id: storylineId,
      workId,
      workTitle: work.title,
      branchPoint,
      title: storyline.title || '',
      content: storyline.content || aiResponse,
      moral: storyline.moral || '',
      createdAt: now,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-multiverse error:', error);
    return jsonError('Lỗi khi tạo đa vũ trụ.', 500);
  }
}

