import { checkRateLimit } from './_rateLimit.js';
import { logTokenUsage } from './_tokenLog.js';

// POST /api/chat — send message (streaming, with persistence)
export async function onRequestPost({ request, data, env }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const { messages, characterId, threadId } = await request.json();
    const lastUserMessage = messages?.[messages.length - 1]?.text || '';

    // Rate limit: 10 messages/min per user (KV-backed, no in-memory fallback)
    const limit = await checkRateLimit(user.id, 10, env);
    if (!limit.allowed) {
      return jsonError(`Quá nhiều tin nhắn. Thử lại sau ${Math.ceil(limit.resetIn / 1000)}s.`, 429);
    }

    // ── characterId allowlist ─────────────────────────────────
    // Students: character must be active AND belong to an analyzed work
    // Teachers: character must belong to their own account
    if (characterId) {
      const charRow = await env.DB.prepare(
        `SELECT c.id FROM characters c
         JOIN works w ON c.work_id = w.id
         WHERE c.name = ? AND c.active = 1 AND w.status = 'analyzed'
         LIMIT 1`
      ).bind(characterId).first();

      const isTeacherChar = await env.DB.prepare(
        `SELECT id FROM characters WHERE name = ? AND teacher_id = ? LIMIT 1`
      ).bind(characterId, user.id).first();

      const isAuthorized = user.role === 'teacher'
        ? isTeacherChar
        : charRow;

      if (!isAuthorized) {
        return jsonError('Nhân vật không hợp lệ hoặc không khả dụng.', 403);
      }
    }

    const now = new Date().toISOString();

    // Get or create thread
    let threadIdToUse = threadId;
    if (!threadIdToUse) {
      threadIdToUse = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO chat_threads (id, work_id, character_name, student_id, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(threadIdToUse, null, characterId || 'unknown', user.id, now).run();
    }

    // Persist user message
    await env.DB.prepare(
      "INSERT INTO chat_messages (id, thread_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), threadIdToUse, 'user', lastUserMessage, now).run();

    // Estimate tokens from message length (MVP estimate: ~4 chars = 1 token)
    const estInput = Math.ceil(lastUserMessage.length / 4);
    const estOutput = 120; // stub: ~480 chars output
    if (user.role === 'teacher') {
      await logTokenUsage(env, user.id, 'chatbot', `Chat with ${characterId}`, estInput, estOutput);
    }

    // Build streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stub responses — replace with real AI SDK in production
        const responses = [
          `Chào bạn, ta là ${characterId || 'nhân vật văn học'}. Đây là tín hiệu streaming thời gian thực đang chạy trên Cloudflare Edge. Trí tuệ nhân tạo sẽ sinh ngôn ngữ từng chữ một thay vì phải chờ nguyên một khối dài.`,
          `Ta rất hiểu nỗi băn khoăn của bạn về vấn đề: "${lastUserMessage.slice(0, 80)}...". Trong nguyên tác, tác giả đã khắc hoạ những góc khuất trong tâm hồn con người để chúng ta chiêm nghiệm.`,
          `Tuy nhiên, đây chỉ là phiên bản MVP! Ở production, đoạn text này sẽ được sinh ra từ AI SDK hoặc GenMax.`
        ];
        const fullText = responses.join(' ');
        const words = fullText.split(' ');
        const totalWords = words.length;

        for (let i = 0; i < words.length; i++) {
          controller.enqueue(encoder.encode(words[i] + ' '));
          await new Promise(r => setTimeout(r, 40));
        }

        // Flush full AI response to DB after stream completes (no N+1)
        const aiTimestamp = new Date().toISOString();
        try {
          await env.DB.prepare(
            "INSERT INTO chat_messages (id, thread_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
          ).bind(crypto.randomUUID(), threadIdToUse, 'ai', fullText, aiTimestamp).run();
        } catch (_) { /* best-effort: non-critical if DB write fails */ }

        controller.close();
      }
    });

    return new Response(stream, {
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

// GET /api/chat — fetch chat history
export async function onRequestGet({ request, data, env }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const threadId = url.searchParams.get('threadId');

    if (!threadId) {
      // Return all threads for this user
      const threads = await env.DB.prepare(
        "SELECT id, character_name, created_at FROM chat_threads WHERE student_id = ? ORDER BY created_at DESC LIMIT 20"
      ).bind(user.id).all();
      return new Response(JSON.stringify({ threads: threads.results || [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify thread belongs to user
    const thread = await env.DB.prepare(
      "SELECT id FROM chat_threads WHERE id = ? AND student_id = ? LIMIT 1"
    ).bind(threadId, user.id).first();

    if (!thread) return jsonError('Thread not found.', 404);

    const messages = await env.DB.prepare(
      "SELECT id, role, content, created_at FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC"
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
