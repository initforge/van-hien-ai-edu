import { checkRateLimit } from './_rateLimit.js';
import { logTokenUsage } from './_tokenLog.js';
import { aiStream } from './_ai.js';
import { jsonError, estimateTokens, getWorkAnalysis } from './_utils.js';

// ─── System prompts by character ──────────────────────────────────────────────

/**
 * Build system prompt for a given character.
 * Returns the character's system_prompt from DB, or a high-quality auto-generated one.
 */
async function getCharacterPrompt(env, characterId, user) {
  const row = await env.DB.prepare(
    `SELECT c.system_prompt, c.personality, c.role, c.name, c.work_id,
            w.title AS workTitle, w.author, w.content AS workContent
     FROM characters c
     LEFT JOIN works w ON c.work_id = w.id
     WHERE c.id = ? AND c.active = 1`
  ).bind(characterId).first();

  const charName    = row?.name        || 'nhân vật văn học';
  const workTitle   = row?.workTitle   || '';
  const author      = row?.author      || '';
  const charRole    = row?.role        || '';
  const charPersonality = row?.personality || '';

  // ── Build work context from analysis ─────────────────────────────────────
  let workContext = '';
  let charBio = '';
  let analysis = {};
  if (row?.work_id) {
    analysis = await getWorkAnalysis(env.DB, row.work_id);

    // Extract this character's bio from the characters analysis section.
    // Use broader matching: split name into words and match any word that appears.
    if (analysis.characters) {
      const nameWords = charName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const lines = analysis.characters.split('\n');
      const bioLines = lines.filter(l => {
        const lower = l.toLowerCase();
        return nameWords.some(w => lower.includes(w));
      });
      if (bioLines.length) charBio = bioLines.join('\n');
    }

    const sections = [
      ['summary',       '📖 Tóm tắt tác phẩm'],
      ['characters',    '👤 Phân tích nhân vật'],
      ['themes',        '💡 Chủ đề chính'],
      ['art_features',  '✨ Đặc sắc nghệ thuật'],
      ['content_value', '🌿 Giá trị nội dung'],
      ['context',       '🕰️ Bối cảnh'],
    ];
    const parts = sections
      .filter(([key]) => analysis[key])
      .map(([, label]) => {
        const key = sections.find(([k]) => k === sections.find(([, l]) => l === label)?.[0])?.[0] || label;
        return `${label}:\n${analysis[key]}`;
      });
    if (parts.length) workContext = parts.join('\n\n');
  }

  // ── Role-aware auto prompt ────────────────────────────────────────────────
  // Extract other important character names from the work to prevent identity confusion.
  // If the character is "Con trai Lão Hạc", warn against being "Lão Hạc".
  const otherChars = workContext
    ? (() => {
        const charSection = analysis?.characters || '';
        const knownChars = [];
        // Extract names that appear in the character analysis (skip this character)
        const charLines = charSection.split('\n');
        for (const line of charLines) {
          // Simple heuristic: find lines with "–" or "—", take first part before dash as a name
          const dash = line.indexOf('–') !== -1 ? line.indexOf('–') : line.indexOf('—');
          if (dash > 0 && dash < 30) {
            const name = line.slice(0, dash).trim();
            if (name.length > 1 && name.length < 50 && !name.toLowerCase().includes(charName.toLowerCase())) {
              knownChars.push(name);
            }
          }
        }
        return knownChars.slice(0, 3);
      })()
    : [];

  const otherCharsWarning = otherChars.length
    ? `\n- BẠN KHÔNG PHẢI những nhân vật sau trong tác phẩm này: ${otherChars.join(', ')}.`
    : '';

  const autoPrompt = workContext
    ? `Bạn đang hóa thân HOÀN TOÀN vào nhân vật "${charName}" trong truyện ngắn "${workTitle}" của ${author}.${otherCharsWarning}\n\n` +
      (charBio ? `THÔNG TIN VỀ NHÂN VẬT BẠN ĐANG HÓA THÂN:\n${charBio}\n\n` : '') +
      `Ngữ cảnh tác phẩm:\n${workContext}\n\n` +
      `QUY TẮC PHẢN ỨNG TUYỆT ĐỐI:\n` +
      `- BẠN LÀ "${charName}". KHÔNG BAO GIỜ xưng là "${author.split(' ').pop()}", "bác", "cậu", hay bất kỳ tên nhân vật nào khác.\n` +
      `- CHỈ TRẢ LỜI dựa trên THÔNG TIN NHÂN VẬT và NGỮ CẢNH TÁC PHẨM ở trên.\n` +
      `- NẾU KHÔNG CHẮC CHẮN hoặc THÔNG TIN KHÔNG ĐỀ CẬP: trả lời "Mình không rõ lắm" hoặc "Mình không biết chuyện đó." — tuyệt đối KHÔNG bịa.\n` +
      `- KHÔNG bịa thêm chi tiết gia đình, sự kiện, cảm xúc không có trong tác phẩm.\n` +
      `- KHÔNG gọi người đối thoại là "bác", "cháu", "bác Hạc". Gọi "bạn".\n` +
      `- Nói đúng giọng, đúng tính cách, đúng hoàn cảnh của nhân vật trong tác phẩm.\n` +
      `- KHÔNG nói "tôi là AI" hay "trong truyện".\n` +
      `- Trả lời NGẮN GỌN 2-4 câu.`
    : `Bạn đang hóa thân HOÀN TOÀN vào nhân vật "${charName}" trong văn học Việt Nam.\n` +
      `BẠN LÀ "${charName}". KHÔNG BAO GIỜ xưng là nhân vật khác.\n` +
      `NẾU KHÔNG CHẮC CHẮN: nói "Mình không rõ lắm". KHÔNG bịa.\n` +
      `KHÔNG gọi "bác", "cháu". Gọi "bạn".\n` +
      `Không tiết lộ bạn là AI. Trả lời NGẮN GỌN 2-4 câu.`;

  return {
    prompt: row?.system_prompt?.trim() ? row.system_prompt : autoPrompt,
    workTitle: workTitle,
    author: author,
  };
}

// ─── POST /api/chat ────────────────────────────────────────────────────────────

export async function onRequestPost({ request, data, env }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const { messages, characterId, threadId, systemPrompt: customPrompt } = await request.json();
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

    // ── Build prompt: use custom override if teacher provided it, otherwise auto ─
    let effectivePrompt;
    if (customPrompt?.trim()) {
      // Teacher's custom prompt from edit form — use directly (teacher knows what they're doing)
      effectivePrompt = customPrompt.trim();
    } else {
      const charPrompt = await getCharacterPrompt(env, characterId, user);
      effectivePrompt = charPrompt.prompt;
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
    // Truncate old messages to keep context window manageable (last 10 turns).
    // Always slice to an even number so we never cut mid user/AI pair.
    const MAX_MESSAGES = 10;
    const lastN = messages.slice(-MAX_MESSAGES);
    const recentMessages = (lastN.length % 2 === 0)
      ? lastN
      : lastN.slice(1); // drop oldest if odd — preserves complete user/AI pairs
    const toSend = recentMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text || String(m.content || ''),
    }));

    // ── AI streaming response ──────────────────────────────────────────────
    // Use fullTextPromise (already built inside aiStream) for DB persistence
    // after stream is fully consumed — no tee() needed (CF Workers ReadableStream
    // tee() is unreliable for manually-constructed streams).
    const { stream: httpStream, fullText: fullTextPromise, inputTokens } =
      aiStream(env, '@cf/google/gemma-3-12b-it', {
        systemPrompt: effectivePrompt,
        messages: toSend,
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
        'Access-Control-Allow-Origin': '*',
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('chat GET error:', error);
    return jsonError('Lỗi khi tải tin nhắn.', 500);
  }
}

// DELETE /api/chat?id= — delete own chat thread (student only)
export async function onRequestDelete({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const threadId = url.searchParams.get('id');
    if (!threadId) return jsonError('Thiếu id.', 400);

    const owned = await env.DB.prepare(
      "SELECT id FROM chat_threads WHERE id = ? AND student_id = ? LIMIT 1"
    ).bind(threadId, user.id).first();
    if (!owned) return jsonError('Không có quyền xóa.', 403);

    // Delete messages first, then thread (foreign key)
    await env.DB.prepare("DELETE FROM chat_messages WHERE thread_id = ?").bind(threadId).run();
    await env.DB.prepare("DELETE FROM chat_threads WHERE id = ?").bind(threadId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('chat DELETE error:', error);
    return jsonError('Lỗi khi xóa.', 500);
  }
}

