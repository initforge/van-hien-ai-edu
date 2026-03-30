import { checkRateLimit } from './_rateLimit.js';
import { logTokenUsage } from './_tokenLog.js';
import { aiStream } from './_ai.js';

// ─── System prompts by character ──────────────────────────────────────────────

/**
 * Build system prompt for a given character.
 * Returns the character's system_prompt from DB, or a default.
 */
async function getCharacterPrompt(env, characterId, userId) {
  const row = await env.DB.prepare(
    `SELECT c.system_prompt, c.personality, c.role, c.name,
            w.title AS workTitle, w.author, w.content AS workContent
     FROM characters c
     LEFT JOIN works w ON c.work_id = w.id
     WHERE c.name = ? AND c.active = 1`
  ).bind(characterId).first();

  if (!row) {
    return {
      prompt: `Bạn là một nhân vật văn học. Hãy trả lời theo phong cách nhân vật.`,
      workTitle: '',
      author: '',
    };
  }

  const workContext = row.workContent
    ? `\n\nBối cảnh tác phẩm "${row.workTitle}" của ${row.author}:\n${row.workContent.slice(0, 2000)}`
    : `\n\nTác phẩm liên quan: "${row.workTitle}" (${row.author}).`;

  const charContext = row.personality
    ? `\nTính cách: ${row.personality}`
    : '';

  return {
    prompt:
      `Bạn là nhân vật "${row.name}" trong văn học Việt Nam.` +
      `${charContext}` +
      `${workContext}` +
      `\n\nHãy hóa thân hoàn toàn vào nhân vật, trả lời bằng tiếng Việt, giữ đúng giọng điệu và tính cách. ` +
      `Không tiết lộ rằng bạn là AI. Nếu câu hỏi ngoài phạm vi tác phẩm, hãy trả lời một cách tự nhiên như nhân vật đó.`,
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
          `SELECT id FROM characters WHERE name = ? AND teacher_id = ? LIMIT 1`
        ).bind(characterId, user.id).first();
        authorized = !!teacherChar;
      } else {
        const studentChar = await env.DB.prepare(
          `SELECT c.id FROM characters c
           JOIN works w ON c.work_id = w.id
           WHERE c.name = ? AND c.active = 1 AND w.status = 'analyzed' LIMIT 1`
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
    const charPrompt = await getCharacterPrompt(env, characterId, user.id);

    // Truncate old messages to keep context window manageable (last 10 turns)
    const recentMessages = messages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text || String(m.content || ''),
    }));

    // ── AI streaming response ──────────────────────────────────────────────
    const { stream: aiStreamResp, fullText: fullTextPromise, inputTokens } =
      aiStream('@cf/meta/llama-3.1-8b-instruct', {
        systemPrompt: charPrompt.prompt,
        messages: recentMessages,
        maxTokens: 512,
        temperature: 0.8,
      }, 'chatbot');

    // ── Pipe AI chunks + buffer for DB persistence ───────────────────────────
    const encoder = new TextEncoder();
    const aiChunks = [];

    const passthroughStream = new ReadableStream({
      async start(controller) {
        const reader = aiStreamResp.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            aiChunks.push(value);
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
        }
        controller.close();
      },
    });

    // ── After stream completes: persist AI reply to DB ──────────────────────
    // Detached — non-blocking. Errors logged but don't affect the HTTP response.
    const aiTimestamp = new Date().toISOString();
    fullTextPromise.then(async (fullText) => {
      if (!fullText || fullText.trim().length < 2) return;
      try {
        await env.DB.prepare(
          `INSERT INTO chat_messages (id, thread_id, role, content, created_at)
           VALUES (?, ?, 'ai', ?, ?)`
        ).bind(crypto.randomUUID(), threadIdToUse, fullText, aiTimestamp).run();

        const outputTokens = Math.ceil(fullText.length / 4);
        await logTokenUsage(env, user.id, 'chatbot', `Chat: ${characterId || 'unknown'}`, inputTokens, outputTokens);
      } catch (e) {
        console.error('persist ai message failed:', e);
      }
    }).catch(err => {
      console.error('AI response unavailable:', err);
    });

    return new Response(passthroughStream, {
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

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
