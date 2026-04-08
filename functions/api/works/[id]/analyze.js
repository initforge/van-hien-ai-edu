import { aiCall } from '../../_ai.js';
import { cachedJson } from '../../_cache.js';

const SECTIONS = ['summary', 'characters', 'art_features', 'content_value', 'themes', 'context'];

// POST /api/works/:id/analyze
export async function onRequestPost({ env, data, request }) {
  const user = data?.user;
  if (!user || user.role !== 'teacher') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const id = segments[segments.length - 2];
  if (!id) return new Response(JSON.stringify({ error: 'Thieu ID' }), { status: 400 });

  const work = await env.DB.prepare(
    'SELECT id, title, author, content FROM works WHERE id = ? AND teacher_id = ?'
  ).bind(id, user.id).first();
  if (!work) return new Response(JSON.stringify({ error: 'Khong tim thay' }), { status: 404 });
  if (!work.content || work.content.trim().length < 50) {
    return new Response(JSON.stringify({ error: 'Noi dung qua ngan' }), { status: 400 });
  }

  // Mark as processing immediately so UI reflects live state
  await env.DB.prepare(
    "UPDATE works SET analysis_status = 'processing' WHERE id = ?"
  ).bind(id).run();

  try {
    const wordCount = work.content.trim().split(/\s+/).filter(Boolean).length;
    // Chỉ phân tích những gì CÓ TRONG văn bản, không bịa kiến thức bên ngoài
    // Độ dài tỉ lệ với lượng text thực tế
    const isVeryShort = wordCount < 200;
    const isShort     = wordCount >= 200 && wordCount < 400;
    const isMedium    = wordCount >= 400 && wordCount < 800;
    const isLong       = wordCount >= 800;

    const result = await aiCall(env, '@cf/mistralai/mistral-small-3.1-24b-instruct', {
      systemPrompt:
        `Bạn là giáo viên ngữ văn Việt Nam.\n` +
        `Chỉ phân tích những gì CÓ TRONG văn bản bên dưới. KHÔNG suy diễn hay bịa thêm thông tin bên ngoài.\n` +
        `Trả lời markdown, mỗi phần bắt đầu bằng heading ## <tên tiếng Anh>.\n` +
        `Bắt buộc đủ 6 phần theo thứ tự:\n` +
        `## summary\n## characters\n## art_features\n## content_value\n## themes\n## context\n\n` +
        `Quy tắc viết:\n` +
        `- **Summary**: tóm tắt cốt truyện bằng ngôn ngữ mình, đủ rõ để người đọc hình dung được toàn bộ.\n` +
        `- **Characters**: nhân vật nào, nói gì/làm gì, thái độ ra sao, quan hệ với ai.\n` +
        `- **Art features**: từ ngữ đặc sắc, câu văn đặc biệt, giọng văn, hình ảnh, nhịp điệu — chỉ những gì xuất hiện trong text.\n` +
        `- **Content value**: thông điệp tác giả MUỐN truyền tải qua tác phẩm này, dựa trên những gì viết trong text.\n` +
        `- **Themes**: chủ đề nào xuất hiện trong text, cách tác giả đặt ra và triển khai.\n` +
        `- **Context**: bối cảnh ĐƯỢC NHẮC ĐẾN trong tác phẩm (năm, nơi chốn, sự kiện, hoàn cảnh) — KHÔNG phải kiến thức bên ngoài.\n` +
        `- Dùng gạch đầu dòng (-) cho các ý nhỏ. Bôi đậm từ/cụm quan trọng bằng **...**.\n` +
        `- KHÔNG trả lời gì khác ngoài 6 phần trên.`,
      messages: [{ role: 'user', content: 'Phân tích tác phẩm ("' + work.title + '" của ' + (work.author || '?') + ', ' + wordCount + ' từ):\n\n' + work.content.slice(0, 3000) }],
      maxTokens: isVeryShort ? 1000 : isShort ? 1500 : isMedium ? 2000 : 2500,
      temperature: 0.3,
    });

    const raw = (result || '').text || '';
    if (!raw.trim()) {
      await env.DB.prepare("UPDATE works SET analysis_status = 'none' WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ error: 'AI tra ve rong' }), { status: 500 });
    }

    const text = raw.trim();
    // Parse sections and upsert (removed DEBUG row insert)

    const textLower = text.toLowerCase();
    const now = new Date().toISOString();

    for (const section of SECTIONS) {
      const headingLower = '## ' + section;
      const idx = textLower.indexOf(headingLower);
      let content = '[Đang chờ — nếu thấy dòng này sau khi bấm Phân tích AI, hãy bấm lại]';
      if (idx >= 0) {
        const start = idx + headingLower.length;
        let end = text.length;
        for (const s2 of SECTIONS) {
          if (s2 === section) continue;
          const p = textLower.indexOf('## ' + s2, start);
          if (p > start && p < end) end = p;
        }
        content = text.slice(start, end).trim();
      }
      const ex = await env.DB.prepare(
        'SELECT id FROM work_analysis WHERE work_id = ? AND section = ?'
      ).bind(id, section).first();
      if (ex) {
        await env.DB.prepare(
          'UPDATE work_analysis SET content=?, is_ai_generated=1, updated_at=? WHERE work_id=? AND section=?'
        ).bind(content, now, id, section).run();
      } else {
        await env.DB.prepare(
          'INSERT INTO work_analysis (id,work_id,section,content,is_ai_generated,created_at,updated_at) VALUES (?,?,?,?,1,?,?)'
        ).bind(crypto.randomUUID(), id, section, content, now, now).run();
      }
    }

    // Mark as done only after all sections are saved
    await env.DB.prepare(
      "UPDATE works SET analysis_status = 'done' WHERE id = ?"
    ).bind(id).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('analyze error:', e);
    await env.DB.prepare("UPDATE works SET analysis_status = 'none' WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ error: 'Loi: ' + (e?.message || 'khong ro') }), { status: 500 });
  }
}
