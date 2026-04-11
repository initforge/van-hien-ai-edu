/**
 * Generate system prompt for a character — called at CHARACTER CREATION time.
 * Saves to DB so chat time is fast (no regeneration needed per message).
 *
 * @param {import('@cloudflare/workers-types').D1Database} DB
 * @param {string} characterId
 * @param {string} charName
 * @param {string} charRole
 * @param {string} workId
 * @returns {Promise<string>} generated prompt
 */
export async function generateCharacterSystemPrompt(DB, characterId, charName, charRole, workId) {
  // ── Load character + work + analysis in one query ─────────────────────────
  const row = await DB.prepare(
    `SELECT c.name, c.role, c.personality AS charPersonality, c.work_id,
            w.title AS workTitle, w.author, w.content AS workText
     FROM characters c
     LEFT JOIN works w ON c.work_id = w.id
     WHERE c.id = ?`
  ).bind(characterId).first();

  const name      = row?.name      || charName    || 'nhân vật';
  const role      = row?.role      || charRole    || '';
  const charPers  = row?.charPersonality || '';
  const workTitle = row?.workTitle || '';
  const author    = row?.author    || '';
  const workText  = row?.workText  || '';

  // ── Load work analysis ──────────────────────────────────────────────────
  let analysis = {};
  if (workId) {
    try {
      const { results } = await DB.prepare(
        `SELECT section, content FROM work_analysis WHERE work_id = ? ORDER BY section`
      ).bind(workId).all();
      for (const r of results) analysis[r.section] = r.content || '';
    } catch { /* optional */ }
  }

  // ── Build context blocks ─────────────────────────────────────────────────
  const blocks = [];

  if (workTitle) blocks.push(`TÁC PHẨM: "${workTitle}" của ${author}`);

  if (analysis.summary) {
    blocks.push(`TÓM TẮT TÁC PHẨM:\n${stripMarkdown(analysis.summary)}`);
  }

  // Characters — MOST IMPORTANT: must include ALL subjects (humans + animals + objects)
  if (analysis.characters) {
    blocks.push(`DANH SÁCH ĐỐI TƯỢNG TRONG TÁC PHẨM:\n${stripMarkdown(analysis.characters)}`);
  }

  if (analysis.themes) {
    blocks.push(`CHỦ ĐỀ:\n${stripMarkdown(analysis.themes)}`);
  }

  if (analysis.art_features) {
    blocks.push(`ĐẶC SẮC NGHỆ THUẬT:\n${stripMarkdown(analysis.art_features)}`);
  }

  // Full work text for reference (truncate to fit token budget)
  if (workText) {
    blocks.push(`NGUYÊN TÁC (đoạn trích tham chiếu):\n${workText.slice(0, 2000)}`);
  }

  if (charPers?.trim()) {
    blocks.push(`TÍNH CÁCH NHÂN VẬT (từ giáo viên):\n${charPers}`);
  }

  const context = blocks.join('\n\n');

  // ── Determine how to address the user ──────────────────────────────────────
  const rl = (role || '').toLowerCase();
  const isNarrator = rl.includes('tác giả') || rl.includes('người kể');
  const isChild    = rl.includes('trẻ') || rl.includes('em') || rl.includes('bé');
  const address   = isNarrator ? 'bạn đọc' : isChild ? 'bạn' : 'bạn';
  const noBaa     = isNarrator
    ? ''
    : ' KHÔNG gọi "bác", "cháu", "cậu", "anh", "chị", "ông", "bà". Gọi "' + address + '."';

  return (
    `Bạn đang hóa thân HOÀN TOÀN vào nhân vật "${name}"` +
    (workTitle ? ` trong truyện ngắn "${workTitle}" của ${author}` : ' trong văn học Việt Nam') +
    `.\n\n` +
    `NGỮ CẢNH:\n${context}\n\n` +
    `QUY TẮC PHẢN ỨNG:\n` +
    `1. GỌI "${address}"${noBaa}\n` +
    `2. NGẮN GỌN — 2-4 câu. Không viết dài. Hỏi lại một câu nếu cần.\n` +
    `3. TỰ NHIÊN — dùng giọng nhân vật trong tác phẩm. Không đọc kịch bản.\n` +
    `4. ĐÚNG VAI — nói như "${name}"` +
    (isNarrator
      ? ' (người kể chuyện). Kể lại những gì mình thấy và cảm nhận.'
      : ` nói chuyện với một người bạn.`) + `\n` +
    `5. KHÔNG TIẾT LỘ — không nói "tôi là AI", "trong truyện", "nhân vật hư cấu".\n` +
    `6. KIẾN THỨC TỪ TÁC PHẨM — trả lời dựa vào "DANH SÁCH ĐỐI TƯỢNG" và "NGUYÊN TÁC". Nếu không biết, nói thật thay vì bịa.\n\n` +
    `Trả lời bằng tiếng Việt, tự nhiên, ngắn gọn.`
  );
}

function fallbackPrompt(name) {
  return (
    `Bạn đang hóa thân vào nhân vật "${name}" trong văn học Việt Nam.\n` +
    `GỌI "bạn". KHÔNG gọi "bác", "cháu", "cậu".\n` +
    `NGẮN GỌN 2-4 câu. Trả lời tự nhiên như người bạn đang nói chuyện cùng.`
  );
}

/* Strip markdown ## headers and bold, keep clean text */
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')   // remove ## headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // unwrap **bold**
    .replace(/^[-*]\s+/gm, '$&')     // keep bullet points
    .trim();
}
