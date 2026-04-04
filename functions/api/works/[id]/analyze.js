import { aiCall } from '../../_ai.js';
import { cachedJson } from '../../_cache.js';

const SECTIONS = ['summary', 'characters', 'art_features', 'content_value', 'themes', 'context'];

const SECTION_LABELS = {
  summary: 'Tóm tắt tác phẩm',
  characters: 'Phân tích nhân vật',
  art_features: 'Đặc sắc nghệ thuật',
  content_value: 'Giá trị nội dung',
  themes: 'Chủ đề và thông điệp',
  context: 'Bối cảnh và ngữ cảnh',
};

// POST /api/works/:id/analyze — run full AI analysis workflow
export async function onRequestPost({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2]; // /api/works/:id/analyze

    if (!id) return new Response(JSON.stringify({ error: 'Thiếu work ID' }), { status: 400 });

    // Load work
    const work = await env.DB.prepare(
      'SELECT id, title, author, content FROM works WHERE id = ? AND teacher_id = ?'
    ).bind(id, user.id).first();
    if (!work) return new Response(JSON.stringify({ error: 'Không tìm thấy tác phẩm' }), { status: 404 });

    if (!work.content || work.content.trim().length < 50) {
      return new Response(JSON.stringify({ error: 'Tác phẩm chưa có nội dung. Vui lòng nhập nội dung trước.' }), { status: 400 });
    }

    // Set processing status
    await env.DB.prepare(
      "UPDATE works SET analysis_status = 'processing' WHERE id = ?"
    ).bind(id).run();

    const text = work.content;
    const title = work.title;
    const author = work.author || 'Không rõ';

    // ── Step 1: Understand work context ───────────────────────────────────────
    let workContext = '';
    try {
      const contextResult = await aiCall('@cf/qwen/qwen2.5-coder-32b-instruct', {
        systemPrompt: `Bạn là một chuyên gia nghiên cứu văn học Việt Nam. Đọc kỹ tác phẩm sau và trả lời bằng JSON (không có gì khác ngoài JSON):

{
  "era": "thời đại tác phẩm, ví dụ: 1930-1945",
  "themes": ["chủ đề 1", "chủ đề 2"],
  "structure": "cấu trúc tác phẩm (ví dụ: 3 chương, 2 phần...)",
  "tone": "giọng điệu tác phẩm"
}

Chỉ trả về JSON, không giải thích gì thêm.`,
        messages: [{ role: 'user', content: `Tác phẩm: "${title}" của ${author}\n\n${text.slice(0, 8000)}` }],
        maxTokens: 400,
        temperature: 0.2,
      });
      const parsed = JSON.parse(contextResult.text.replace(/```json\n?/g, '').trim());
      workContext = `Thời đại: ${parsed.era}. Chủ đề chính: ${(parsed.themes || []).join(', ')}. Cấu trúc: ${parsed.structure}. Giọng điệu: ${parsed.tone}.`;
    } catch (e) {
      console.warn('Context analysis failed, continuing without:', e.message);
      workContext = '';
    }

    // Save context section
    await upsertAnalysis(env, id, 'context', workContext || 'Đang phân tích...', 1);
    await logToken(env, user.id, 'work_analysis', `Analyze context: ${title}`, 0, 0);

    // ── Step 2: Chunk text ───────────────────────────────────────────────────
    let chunks = [];
    try {
      const chunkResult = await aiCall('@cf/qwen/qwen2.5-coder-32b-instruct', {
        systemPrompt: `Bạn là chuyên gia chia nhỏ văn bản văn học Việt Nam. Chia tác phẩm thành các đoạn (chunks) có ý nghĩa tự nhiên, mỗi chunk khoảng 500-800 từ. Mỗi chunk phải tách theo ranh giới đoạn văn tự nhiên, không cắt giữa câu.

Trả về JSON array (không có gì khác ngoài JSON):
[
  {"heading": "Tiêu đề đoạn", "content": "nội dung chunk đầy đủ..."},
  ...
]

Đánh số thứ tự tự nhiên trong heading (Phần 1, Phần 2...)`,
        messages: [{ role: 'user', content: `Chia nhỏ tác phẩm "${title}" của ${author}:\n\n${text}` }],
        maxTokens: 4000,
        temperature: 0.2,
      });
      const raw = chunkResult.text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      chunks = JSON.parse(raw);
      if (!Array.isArray(chunks)) chunks = [];
    } catch (e) {
      console.warn('Chunking failed, using fallback:', e.message);
      // Fallback: split by double newlines
      const paras = text.split(/\n{2,}/).filter(p => p.trim().length > 50);
      chunks = paras.map((p, i) => ({ heading: `Phần ${i + 1}`, content: p.trim() }));
    }

    // Clear old chunks and insert new ones
    await env.DB.prepare('DELETE FROM work_chunks WHERE work_id = ?').bind(id).run();
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      await env.DB.prepare(
        'INSERT INTO work_chunks (id, work_id, sequence, heading, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), id, i + 1, c.heading || `Phần ${i + 1}`, c.content, new Date().toISOString()).run();
    }

    // Update chunk_count
    await env.DB.prepare('UPDATE works SET chunk_count = ? WHERE id = ?').bind(chunks.length, id).run();

    // ── Step 3: Analyze each section ─────────────────────────────────────────
    const chunkSummaries = chunks.map((c, i) => `[Phần ${i + 1} - ${c.heading}]: ${c.content.slice(0, 200)}...`).join('\n');

    for (const section of SECTIONS) {
      if (section === 'context') continue; // already done

      try {
        const sectionPrompt = buildSectionPrompt(title, author, workContext, chunkSummaries, section);
        const result = await aiCall('@cf/qwen/qwen2.5-coder-32b-instruct', {
          systemPrompt: `Bạn là giáo viên ngữ văn Việt Nam chuyên nghiệp. Phân tích tác phẩm theo yêu cầu. Viết ngắn gọn, rõ ràng, phù hợp học sinh cấp 2 (lớp 6-9). Nếu không đủ thông tin, ghi rõ phần nào chưa rõ.`,
          messages: [{ role: 'user', content: sectionPrompt }],
          maxTokens: 800,
          temperature: 0.4,
        });
        await upsertAnalysis(env, id, section, result.text.trim(), 1);
      } catch (e) {
        console.error(`Section "${section}" failed:`, e.message);
        await upsertAnalysis(env, id, section, '[Lỗi khi phân tích phần này. Vui lòng nhập tay.]', 0);
      }
    }

    // Mark done
    await env.DB.prepare("UPDATE works SET analysis_status = 'done' WHERE id = ?").bind(id).run();

    return cachedJson({
      success: true,
      analysisStatus: 'done',
      chunkCount: chunks.length,
    }, { profile: 'nocache' });

  } catch (e) {
    console.error('analyze error:', e);
    // Revert status
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2];
    if (id) {
      await env.DB.prepare("UPDATE works SET analysis_status = 'none' WHERE id = ?").bind(id).run();
    }
    return new Response(JSON.stringify({ error: 'Lỗi khi phân tích: ' + e.message }), { status: 500 });
  }
}

function buildSectionPrompt(title, author, context, chunks, section) {
  const base = `Tác phẩm: "${title}" của ${author}${context ? '\nBối cảnh tác phẩm: ' + context : ''}\n\nTóm tắt các phần:\n${chunks}`;

  switch (section) {
    case 'summary':
      return base + '\n\nHãy viết một bản tóm tắt ngắn gọn (150-250 từ) toàn bộ tác phẩm, bao gồm: bối cảnh, sự kiện chính, kết thúc. Phù hợp cho học sinh cấp 2.';
    case 'characters':
      return base + '\n\nLiệt kê các nhân vật chính và phụ trong tác phẩm. Với mỗi nhân vật, ghi rõ: tên, vai trò, đặc điểm tính cách, và mối quan hệ với nhân vật khác.';
    case 'art_features':
      return base + '\n\nPhân tích các đặc sắc nghệ thuật nổi bật của tác phẩm: ngôn ngữ, hình ảnh, biện pháp tu từ, cách xây dựng nhân vật, cấu trúc.';
    case 'content_value':
      return base + '\n\nNêu rõ giá trị nội dung của tác phẩm: ý nghĩa, thông điệp, bài học rút ra, liên hệ thực tế phù hợp với học sinh.';
    case 'themes':
      return base + '\n\nXác định và phân tích các chủ đề chính, chủ đề phụ của tác phẩm. Giải thích mỗi chủ đề được thể hiện qua những chi tiết nào.';
    default:
      return base;
  }
}

async function upsertAnalysis(env, workId, section, content, isAiGenerated) {
  const now = new Date().toISOString();
  const existing = await env.DB.prepare(
    'SELECT id FROM work_analysis WHERE work_id = ? AND section = ?'
  ).bind(workId, section).first();
  if (existing) {
    await env.DB.prepare(
      'UPDATE work_analysis SET content = ?, is_ai_generated = ?, updated_at = ? WHERE work_id = ? AND section = ?'
    ).bind(content, isAiGenerated, now, workId, section).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO work_analysis (id, work_id, section, content, is_ai_generated, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), workId, section, content, isAiGenerated, now, now).run();
  }
}

async function logToken(env, teacherId, feature, description, inputTokens, outputTokens) {
  try {
    await env.DB.prepare(
      'INSERT INTO token_logs (id, teacher_id, feature, description, input_tokens, output_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(crypto.randomUUID(), teacherId, feature, description, inputTokens, outputTokens).run();
  } catch (e) {
    console.error('token log failed:', e);
  }
}
