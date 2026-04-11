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

  await env.DB.prepare(
    "UPDATE works SET analysis_status = 'processing' WHERE id = ?"
  ).bind(id).run();

  try {
    const wordCount = work.content.trim().split(/\s+/).filter(Boolean).length;
    const workText = work.content.slice(0, 3500);

    const { text } = await aiCall(env, '@cf/mistralai/mistral-small-3.1-24b-instruct', {
      systemPrompt:
        `Bạn là giáo viên ngữ văn Việt Nam chuyên sâu. Phân tích tác phẩm "${work.title}" của ${work.author || '?'}.\n` +
        `CHỈ dựa trên văn bản bên dưới. KHÔNG suy diễn, KHÔNG bịa, KHÔNG dùng kiến thức bên ngoài.\n\n` +

        `## summary\n` +
        `Tóm tắt cốt truyện đầy đủ. Ghi rõ: ai, ở đâu, xảy ra chuyện gì, kết cuộc ra sao.\n` +
        `Nếu truyện dùng ngôi kể (tôi/ta) → dùng ngôi đó trong tóm tắt để giữ đúng giọng.\n` +
        `Nếu ngôi thứ ba → dùng ngôi thứ ba.\n` +
        `Viết 5-10 gạch đầu dòng, mỗi gạch 1-2 câu.\n\n` +

        `## characters\n` +
        `Liệt kê TẤT CẢ đối tượng CÓ TÊN TRONG TÁC PHẨM: con người, con vật.\n` +
        `KHÔNG ghi: đồ vật không tên ("những quyển sách", "cái bát"), ngôi kể ("tôi", "ta")\n` +
        `Mỗi nhân vật (CÓ TÊN TRONG TÁC PHẨM) ghi đủ 4 dòng theo thứ tự:\n` +
        `- **Tên đầy đủ**: (ghi đúng tên trong văn bản)\n` +
        `- **Vai trò**: vai trò trong tác phẩm\n` +
        `- **Hành động tiêu biểu + Lời nói**: trích nguyên văn trong dấu "" từ tác phẩm\n` +
        `- **Quan hệ**: quan hệ với các nhân vật khác trong tác phẩm\n` +
        `- Nếu nhân vật KHÔNG có lời nói → ghi đúng: "Không có lời nói trong tác phẩm."\n` +
        `- Nếu nhân vật KHÔNG có quan hệ rõ → ghi: "Không được đề cập quan hệ cụ thể."\n` +
        `Ví dụ đúng:\n` +
        `- **Lão Hạc**: già nghèo ở làng quê. "Có lẽ tôi bán con chó đấy, ông giáo ạ!" Cha của thằng con, nuôi Cậu Vàng.\n` +
        `- **Ông giáo**: người trẻ có học trong làng. Không có lời nói. Người kể chuyện (tác giả nhập vai).\n` +
        `- **Cậu Vàng** (con chó): con chó vàng của Lão Hạc. Không có lời nói. Vật nuôi được Lão Hạc quý.\n\n` +
        `Con vật có tên → ghi đúng 4 dòng. Con vật không tên → KHÔNG ghi.\n` +
        `Ngôi kể (tôi/ta/tớ) → ghi: ngôi kể, vai trò trong tác phẩm. Không ghi làm đối tượng riêng.\n` +
        `Đồ vật không tên (sách, vườn) → KHÔNG ghi.\n\n` +

        `## art_features\n` +
        `Mỗi gạch đầu dòng phải có đủ 3 phần:\n` +
        `(1) tên kỹ thuật/từ ngữ/giọng văn/hình ảnh/nhịp điệu\n` +
        `(2) trích nguyên văn trong dấu "" chính xác từ tác phẩm\n` +
        `(3) giải thích ngắn gọn tác dụng/trẻ thuật\n` +
        `Ví dụ đúng:\n` +
        `- Từ địa phương "hời hợt": "lão Hạc hời hợt nhìn ra ngoài" → thái độ hờ hững, không thật sự chú ý.\n` +
        `- Hình ảnh "đom đóm": "đom đóm lập lòe" → không gian tối tăm, cô đơn.\n` +
        `- Nhịp điệu chậm: mô tả dài, nhiều chi tiết → tạo không khí trầm buồn.\n\n` +

        `## content_value\n` +
        `Mỗi gạch đầu dòng phải có đủ 2 phần:\n` +
        `(1) thông điệp hoặc giá trị là gì\n` +
        `(2) tác giả truyền tải bằng cách nào (dụng ý nghệ thuật cụ thể)\n` +
        `Ví dụ đúng:\n` +
        `- Tác giả muốn nói thất bại không phải kết thúc: nhân vật chấp nhận mất mát nhưng vẫn tiếp tục sống, bình thản uống rượu và hút thuốc.\n` +
        `- Giá trị của sự mất mát: mất đi thứ quý giá buộc nhân vật nhìn lại đời mình, trân trọng điều đã qua.\n\n` +

        `## themes\n` +
        `Mỗi gạch đầu dòng phải có đủ 2 phần:\n` +
        `(1) tên chủ đề\n` +
        `(2) tác giả đặt ra và triển khai qua chi tiết nào trong tác phẩm (tên nhân vật, tình huống cụ thể)\n` +
        `Ví dụ đúng:\n` +
        `- Sự nghèo khó: Lão Hạc phải bán chó vì ốm nặng, ông giáo phải bán sách vì ốm ở Sài Gòn.\n` +
        `- Tình cha con: Lão Hạc không cho con bán vườn vì muốn giữ tài sản cuối cùng cho con, dù chính mình sắp chết.\n\n` +

        `## context\n` +
        `Chỉ ghi bối cảnh ĐƯỢC NHẮC TRONG tác phẩm.\n` +
        `Nếu tác phẩm không nhắc rõ thời gian/địa điểm/sự kiện → ghi đúng: "Không được đề cập rõ ràng trong nguyên tác."\n` +
        `Mỗi gạch: tên bối cảnh + trích dẫn nguyên văn chứng minh.\n` +
        `Ví dụ đúng:\n` +
        `- Thời gian: khoảng trước 1945, không nói rõ năm. Trong tác phẩm: "Hồi tôi mới về, nó đã hết một hạn công-ta."\n` +
        `- Không gian: nông thôn Bắc Bộ, nhà Lão Hạc. Trong tác phẩm: "nhà lão Hạc", "đồng", "làng này".\n\n` +

        `QUY TẮC:\n` +
        `- Dùng gạch đầu dòng (-). Không viết đoạn văn liền.\n` +
        `- **Tên nhân vật** và **chi tiết quan trọng** bôi đậm.\n` +
        `- Trích dẫn nguyên văn bằng dấu "".\n` +
        `- Có bao nhiêu nhân vật, đặc điểm, chủ đề ghi bấy nhiêu. KHÔNG bịa thêm.\n` +
        `- KHÔNG trả lời gì ngoài 6 phần trên.`,

      messages: [{
        role: 'user',
        content: `VĂN BẢN NGUYÊN TÁC "${work.title}" (${work.author}):\n${workText}`,
      }],
      maxTokens: wordCount < 200 ? 1200 : wordCount < 400 ? 1800 : wordCount < 800 ? 2400 : 3000,
      temperature: 0.3,
    });

    const raw = (text || '').trim();
    if (!raw) {
      await env.DB.prepare("UPDATE works SET analysis_status = 'none' WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ error: 'AI tra ve rong — thu lai.' }), { status: 500 });
    }

    const now = new Date().toISOString();

    for (const section of SECTIONS) {
      const heading = '## ' + section;
      const textLower = raw.toLowerCase();
      const idx = textLower.indexOf(heading);
      let content = '[Phần trống — thử phân tích lại.]';
      if (idx >= 0) {
        const start = idx + heading.length;
        let end = raw.length;
        for (const s of SECTIONS) {
          if (s === section) continue;
          const p = textLower.indexOf('## ' + s, start);
          if (p > start && p < end) end = p;
        }
        content = raw.slice(start, end).trim();
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
