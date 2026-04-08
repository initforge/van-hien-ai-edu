import { checkRateLimit } from './_rateLimit.js';
import { logTokenUsage } from './_tokenLog.js';
import { aiStream } from './_ai.js';
import { jsonError, estimateTokens, getWorkAnalysis } from './_utils.js';

// ─── System prompts by character ──────────────────────────────────────────────

/**
 * Build system prompt for a given character.
 * Returns the character's system_prompt from DB, or a default.
 */
async function getCharacterPrompt(env, characterId) {
  const row = await env.DB.prepare(
    `SELECT c.system_prompt, c.personality, c.role, c.name, c.work_id,
            w.title AS workTitle, w.author
     FROM characters c
     LEFT JOIN works w ON c.work_id = w.id
     WHERE c.id = ? AND c.active = 1`
  ).bind(characterId).first();

  if (!row) {
    return {
      prompt: `Bạn là một nhân vật văn học. Hãy trả lời theo phong cách nhân vật.`,
      workTitle: '',
      author: '',
    };
  }

  // Load FULL work analysis: summary + characters + themes + art_features + context + content_value
  const analysis = row.work_id ? await getWorkAnalysis(env.DB, row.work_id) : {};
  const summary     = analysis.summary       || '';
  const chars       = analysis.characters   || '';
  const themes      = analysis.themes        || '';
  const context     = analysis.context       || '';
  const artFeatures  = analysis.art_features  || '';
  const contentValue = analysis.content_value || '';

  const workContext = row.workTitle
    ? [
        `📖 Tác phẩm: "${row.workTitle}" của ${row.author || '?'}.`,
        summary      && `📝 Tóm tắt tác phẩm:\n${summary}`,
        chars        && `👤 Phân tích nhân vật trong tác phẩm:\n${chars}`,
        themes       && `💡 Chủ đề và thông điệp:\n${themes}`,
        artFeatures  && `✨ Đặc sắc nghệ thuật:\n${artFeatures}`,
        contentValue && `🌿 Giá trị nội dung:\n${contentValue}`,
        context      && `🕰️ Bối cảnh ra đời:\n${context}`,
      ].filter(Boolean).join('\n')
    : '';

  const charContext = row.personality
    ? `🎭 Tính cách nhân vật: ${row.personality}`
    : '';

  // If DB has explicit system_prompt, use it; otherwise auto-generate
  const autoPrompt =
    `Bạn là nhân vật "${row.name}" trong văn học Việt Nam.\n` +
    (charContext ? `${charContext}\n` : '') +
    (workContext ? `${workContext}\n` : '') +
    `\nHãy hóa thân hoàn toàn vào nhân vật này. Trả lời bằng tiếng Việt, giữ đúng giọng điệu, ` +
    `tính cách, suy nghĩ và hành động của nhân vật. ` +
    `Không tiết lộ rằng bạn là AI. Nếu câu hỏi ngoài phạm vi tác phẩm, hãy trả lời tự nhiên như nhân vật đó.`;

  return {
    prompt: row.system_prompt?.trim() ? row.system_prompt : autoPrompt,
    workTitle: row.workTitle || '',
    author: row.author || '',
  };
}

// ─── POST /api/chat ────────────────────────────────────────────────────────────

export async function onRequestPost({ request, data, env }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const { messages, characterId, threadId } = await request.json();
    const lastUserMessage = messages?.[messages.length - 1]?.text || '';

    if (!lastUserMessage.trim()) {
      return jsonError('Tin nhắn trống.', 400);
    }

    // Rate limit: 10 messages/min per user
    const limit = await checkRateLimit(user.id, 10, env);
    if (!limit.allowed) {
      return jsonError(`Quá nhiều tin nhắn. Thử lại sau ${Math.ceil(limit.resetIn / 1000)}s.`, 429);
    }

    // ── characterId allowlist ─────────────────────────────────────────────────
    if (characterId) {
      let authorized = false;

      if (user.role === 'teacher') {
        const teacherChar = await env.DB.prepare(
          `SELECT id FROM characters WHERE id = ? AND teacher_id = ? LIMIT 1`
        ).bind(characterId, user.id).first();
        authorized = !!teacherChar;
      } else {
        // Student: character must exist, be active, and its work must have analysis done
        const studentChar = await env.DB.prepare(
          `SELECT c.id FROM characters c
           JOIN works w ON c.work_id = w.id
           WHERE c.id = ? AND c.active = 1 AND w.analysis_status = 'done' LIMIT 1`
        ).bind(characterId).first();
        authorized = !!studentChar;
      }

      if (!authorized) {
        return jsonError('Nhân vật không hợp lệ hoặc không khả dụng.', 403);
      }
    }

    const now = new Date().toISOString();

    // ── Thread: get or create ─────────────────────────────────────────────────
    let threadIdToUse = threadId || crypto.randomUUID();
    if (!threadId) {
      await env.DB.prepare(
        `INSERT INTO chat_threads (id, work_id, character_name, student_id, created_at)
         VALUES (?, NULL, ?, ?, ?)`
      ).bind(threadIdToUse, characterId || 'unknown', user.id, now).run();
    }

    // ── Persist user message ────────────────────────────────────────────────
    await env.DB.prepare(
      `INSERT INTO chat_messages (id, thread_id, role, content, created_at)
       VALUES (?, ?, 'user', ?, ?)`
    ).bind(crypto.randomUUID(), threadIdToUse, lastUserMessage, now).run();

    // ── Build AI messages ───────────────────────────────────────────────────
    const charPrompt = await getCharacterPrompt(env, characterId);

    // Truncate old messages to keep context window manageable (last 10 turns)
    const recentMessages = messages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text || String(m.content || ''),
    }));

    // ── AI streaming response ──────────────────────────────────────────────
    // Use fullTextPromise (already built inside aiStream) for DB persistence
    // after stream is fully consumed — no tee() needed (CF Workers ReadableStream
    // tee() is unreliable for manually-constructed streams).
    const { stream: httpStream, fullText: fullTextPromise, inputTokens } =
      aiStream(env, '@cf/google/gemma-3-12b-it', {
        systemPrompt: charPrompt.prompt,
        messages: recentMessages,
        maxTokens: 768,
        temperature: 0.8,
      }, 'chatbot');

    // ── Persist AI response to DB after stream fully drains ───────────────
    fullTextPromise.then(async (fullTextForDb) => {
      if (!fullTextForDb || fullTextForDb.trim().length < 2) return;
      try {
        const aiTimestamp = new Date().toISOString();
        await env.DB.prepare(
          `INSERT INTO chat_messages (id, thread_id, role, content, created_at)
           VALUES (?, ?, 'ai', ?, ?)`
        ).bind(crypto.randomUUID(), threadIdToUse, fullTextForDb.trim(), aiTimestamp).run();
        const outputTokens = estimateTokens(fullTextForDb.trim());
        await logTokenUsage(env, user.id, 'chatbot',
          `Chat: ${characterId || 'unknown'}`, inputTokens, outputTokens);
      } catch (e) {
        console.error('persist AI response failed:', e);
      }
    }).catch(e => { console.error('fullTextPromise rejected:', e); });

    return new Response(httpStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'X-RateLimit-Remaining': String(limit.remaining),
        'X-Thread-Id': threadIdToUse,
      },
    });
  } catch (error) {
    console.error('chat POST error:', error);
    return jsonError('Lỗi khi trả lời.', 500);
  }
}

// ─── GET /api/chat ──────────────────────────────────────────────────────────────

export async function onRequestGet({ request, data, env }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const threadId = url.searchParams.get('threadId');

    if (!threadId) {
      const threads = await env.DB.prepare(
        `SELECT id, character_name, created_at FROM chat_threads
         WHERE student_id = ? ORDER BY created_at DESC LIMIT 20`
      ).bind(user.id).all();
      return new Response(JSON.stringify({ threads: threads.results || [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify thread ownership
    const thread = await env.DB.prepare(
      `SELECT id FROM chat_threads WHERE id = ? AND student_id = ? LIMIT 1`
    ).bind(threadId, user.id).first();

    if (!thread) return jsonError('Thread not found.', 404);

    const messages = await env.DB.prepare(
      `SELECT id, role, content, created_at FROM chat_messages
       WHERE thread_id = ? ORDER BY created_at ASC`
    ).bind(threadId).all();

    return new Response(JSON.stringify({ threadId, messages: messages.results || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('chat GET error:', error);
    return jsonError('Lỗi khi tải tin nhắn.', 500);
  }
}

