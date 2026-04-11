/**
 * GET  /api/multiverse          — list student multiverse storylines
 * POST /api/multiverse          — create new storyline (AI generate or manual)
 * PATCH /api/multiverse         — edit own storyline (student only)
 * DELETE /api/multiverse?id=    — delete own storyline (student only)
 *
 * Student: returns their own storylines
 * Teacher: returns storylines from students in their classes (optional classId filter)
 *
 * POST body: { workId, title?, branchPoint, content?, generationMethod }
 * PATCH body: { id, branch_point?, content?, moral? }
 */
import { cachedJson } from './_cache.js';
import { aiCall } from './_ai.js';
import { logTokenUsage } from './_tokenLog.js';
import { jsonError } from './_utils.js';

async function logActivity(env, user, action, targetType, targetId, details) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), user.id, user.name, user.role, action, targetType, targetId, details).run();
  } catch (e) {
    console.error('activity_log failed:', e);
  }
}

const MAX_DEPTH = 5;

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const studentId = url.searchParams.get('studentId');
    const workId = url.searchParams.get('workId');
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    let rows;

    if (user.role === 'student') {
      // Students see only their own storylines
      rows = await env.DB.prepare(`
        SELECT m.id, m.title, m.branch_point AS branchPoint, m.content, m.moral,
               m.generation_method AS generationMethod, m.depth, m.parent_id AS parentId,
               m.created_at AS createdAt,
               w.title AS workTitle
        FROM student_multiverse m
        JOIN works w ON m.work_id = w.id
        WHERE m.student_id = ?
          ${workId ? 'AND m.work_id = ?' : ''}
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?`
      ).bind(user.id, ...(workId ? [workId] : []), limit, offset).all();
    } else if (user.role === 'teacher') {
      // Teachers see all storylines from their students
      rows = await env.DB.prepare(`
        SELECT m.id, m.student_id AS studentId, m.title, m.branch_point AS branchPoint,
               m.content, m.moral, m.generation_method AS generationMethod,
               m.depth, m.parent_id AS parentId, m.created_at AS createdAt,
               w.title AS workTitle,
               u.name AS studentName
        FROM student_multiverse m
        JOIN works w ON m.work_id = w.id
        JOIN class_students cs ON cs.student_id = m.student_id
        JOIN classes c ON c.id = cs.class_id
        JOIN users u ON u.id = m.student_id
        WHERE c.teacher_id = ?
          ${classId ? 'AND c.id = ?' : ''}
          ${studentId ? 'AND m.student_id = ?' : ''}
          ${workId ? 'AND m.work_id = ?' : ''}
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?`
      ).bind(user.id, ...([classId, studentId, workId].filter(Boolean)), limit, offset).all();
    } else {
      return jsonError('Forbidden', 403);
    }

    return cachedJson({ data: rows.results || [] }, { profile: 'dynamic' });
  } catch (e) {
    console.error('multiverse GET error:', e);
    return jsonError('Lỗi khi tải đa vũ trụ.', 500);
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const body = await request.json();
    const { workId, title, branchPoint, content, generationMethod = 'manual', parentId } = body;

    if (!workId || !branchPoint?.trim()) {
      return jsonError('Thiếu workId hoặc branchPoint.', 400);
    }

    // Verify work exists + load full content for AI
    const work = await env.DB.prepare(
      "SELECT id, title, author, content FROM works WHERE id = ? LIMIT 1"
    ).bind(workId).first();
    if (!work) return jsonError('Không tìm thấy tác phẩm.', 404);

    // Determine depth
    let depth = 0;
    if (parentId) {
      const parent = await env.DB.prepare(
        "SELECT depth FROM student_multiverse WHERE id = ? LIMIT 1"
      ).bind(parentId).first();
      if (!parent) return jsonError('Không tìm thấy nhánh cha.', 404);
      depth = parent.depth + 1;
      if (depth > MAX_DEPTH) {
        return jsonError(`Đã đạt giới hạn độ sâu nhánh (${MAX_DEPTH}).`, 400);
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Get student's classId for future filtering
    let classId = null;
    if (user.role === 'student') {
      const enrollment = await env.DB.prepare(
        "SELECT class_id FROM class_students WHERE student_id = ? LIMIT 1"
      ).bind(user.id).first();
      classId = enrollment?.class_id || null;
    }

    if (generationMethod === 'manual') {
      // Direct save
      await env.DB.prepare(
        `INSERT INTO student_multiverse (id, student_id, work_id, class_id, title, branch_point, content, status, generation_method, parent_id, depth, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 'manual', ?, ?, ?, ?)`
      ).bind(id, user.id, workId, classId, title || null, branchPoint.trim(), content || null, parentId || null, depth, now, now).run();
      await logActivity(env, user, 'storyline_created', 'storyline', id, JSON.stringify({ workTitle: work.title, title, branchPoint: branchPoint.trim() }));
      return new Response(JSON.stringify({ id, title, branchPoint: branchPoint.trim(), content, generationMethod: 'manual', depth }), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      });
    }

    // AI generation
    let generatedContent = '';
    let generatedMoral = '';

    if (generationMethod === 'ai_full') {
      // Load work analysis for richer context
      const analysis = await (async () => {
        try {
          const { results } = await env.DB.prepare(
            `SELECT section, content FROM work_analysis WHERE work_id = ?`
          ).bind(workId).all();
          const map = {};
          for (const r of results) map[r.section] = r.content || '';
          return map;
        } catch { return {}; }
      })();

      const workText = (work.content || '').slice(0, 2000);
      const analysisContext = Object.entries(analysis)
        .filter(([, v]) => v)
        .map(([sec, v]) => `[${sec.toUpperCase()}]\n${v}`)
        .join('\n\n');

      const { text, inputTokens, outputTokens } = await aiCall(
        env,
        '@cf/qwen/qwq-32b',
        {
          systemPrompt:
            `Bạn là nhà văn Việt Nam chuyên viết truyện ngắn.\n\n` +
            `NHIỆM VỤ: viết đoạn truyện ngắn SÁNG TẠO, phản ánh tinh thần nguyên tác "${work.title}" của ${work.author}.\n\n` +
            `QUY TẮC:\n` +
            `1. Dựa TRỰC TIẾP vào nội dung truyện gốc bên dưới — không bịa thông tin ngoài nguyên tác.\n` +
            `2. Giọng văn: gần gũi, chân thực, phù hợp thể loại truyện ngắn Việt Nam hiện đại.\n` +
            `3. Kết cục: mới lạ nhưng THOÁT NGHOẢI, không bi kịch quá mức.\n` +
            `4. Dài 200-400 từ.\n\n` +
            `Trả lời CHÍNH XÁC JSON, không thêm text khác:\n` +
            `{"content": "đoạn truyện...", "moral": "bài học rút ra (ngắn gọn, 1-2 câu)"}`,
          messages: [
            { role: 'user', content:
              `NGUYÊN TÁC "${work.title}" (${work.author}):\n${workText}\n\n` +
              (analysisContext ? `PHÂN TÍCH TÁC PHẨM:\n${analysisContext}\n\n` : '') +
              `WHAT IF: ${branchPoint}\n\n` +
              `Viết đoạn truyện ngắn dựa trên gợi ý WHAT IF phía trên, bám sát nội dung và tinh thần nguyên tác.`
            }
          ],
          maxTokens: 1536,
          temperature: 0.8,
        }
      );
      let parsed = null;
      try {
        parsed = JSON.parse(text.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}'));
      } catch { /* use raw text fallback */ }
      if (!parsed?.content) {
        return jsonError('AI trả response không hợp lệ. Thử lại.', 500);
      }
      generatedContent = parsed.content.slice(0, 3000);
      generatedMoral = (parsed.moral || '').slice(0, 200);
      await logTokenUsage(env, user.id, 'multiverse', `Tạo đa vũ trụ: ${branchPoint}`, inputTokens, outputTokens);
    } else if (generationMethod === 'ai_branch') {
      if (!parentId) return jsonError('Thiếu parentId cho nhánh mới.', 400);
      const parent = await env.DB.prepare(
        "SELECT content FROM student_multiverse WHERE id = ? LIMIT 1"
      ).bind(parentId).first();
      if (!parent) return jsonError('Không tìm thấy nhánh cha.', 404);

      const workText = (work.content || '').slice(0, 1500);
      const { text, inputTokens, outputTokens } = await aiCall(
        env,
        '@cf/qwen/qwq-32b',
        {
          systemPrompt:
            `Bạn là nhà văn Việt Nam. Viết tiếp đoạn truyện dựa trên nội dung đã cho và nguyên tác.\n` +
            `Giữ đúng giọng văn, phong cách, tên nhân vật. Không bịa thêm chi tiết ngoài nguyên tác.\n` +
            `Đoạn tiếp: 150-300 từ, kết cục rõ ràng.\n` +
            `JSON: {"content": "...", "moral": "..."}`,
          messages: [{ role: 'user', content:
            `NGUYÊN TÁC:\n${workText}\n\n` +
            `ĐOẠN ĐÃ VIẾT:\n${(parent.content || '').slice(0, 1500)}\n\n` +
            `WHAT IF mới (viết tiếp từ đây):\n${branchPoint}`
          }],
          maxTokens: 768,
          temperature: 0.8,
        }
      );
      let parsed = null;
      try {
        parsed = JSON.parse(text.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}'));
      } catch { /* use raw text fallback */ }
      if (!parsed?.content) {
        return jsonError('AI trả response không hợp lệ. Thử lại.', 500);
      }
      generatedContent = parsed.content.slice(0, 2000);
      generatedMoral = (parsed.moral || '').slice(0, 200);
      await logTokenUsage(env, user.id, 'multiverse', `Nhánh đa vũ trụ: ${branchPoint}`, inputTokens, outputTokens);
    }

    await env.DB.prepare(
      `INSERT INTO student_multiverse (id, student_id, work_id, class_id, title, branch_point, content, moral, status, generation_method, parent_id, depth, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?)`
    ).bind(id, user.id, workId, classId, title || null, branchPoint.trim(), generatedContent, generatedMoral, generationMethod, parentId || null, depth, now, now).run();

    await logActivity(env, user, 'storyline_created', 'storyline', id, JSON.stringify({ workTitle: work.title, branchPoint: branchPoint.trim(), generationMethod }));

    return new Response(JSON.stringify({
      id,
      title: title || null,
      branchPoint: branchPoint.trim(),
      content: generatedContent,
      moral: generatedMoral,
      generationMethod,
      depth,
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('multiverse POST error:', e);
    return jsonError('Lỗi khi tạo đa vũ trụ.', 500);
  }
}

// DELETE /api/multiverse?id= — delete own storyline (student only)
export async function onRequestDelete({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonError('Thiếu id.', 400);

    // Students: only own. Teachers: allowed.
    if (user.role === 'student') {
      const owned = await env.DB.prepare(
        "SELECT id FROM student_multiverse WHERE id = ? AND student_id = ? LIMIT 1"
      ).bind(id, user.id).first();
      if (!owned) return jsonError('Không có quyền xóa.', 403);
    }

    await env.DB.prepare("DELETE FROM student_multiverse WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('multiverse DELETE error:', e);
    return jsonError('Lỗi khi xóa.', 500);
  }
}

// PATCH /api/multiverse — edit own storyline (student only)
export async function onRequestPatch({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'student') return jsonError('Unauthorized', 401);

    const body = await request.json();
    const { id, branch_point, content, moral, generationMethod, instruction } = body;
    if (!id) return jsonError('Thiếu id.', 400);

    const owned = await env.DB.prepare(
      "SELECT m.id, m.content, w.title AS workTitle, w.author, w.content AS workContent " +
      "FROM student_multiverse m JOIN works w ON m.work_id = w.id " +
      "WHERE m.id = ? AND m.student_id = ? LIMIT 1"
    ).bind(id, user.id).first();
    if (!owned) return jsonError('Không có quyền sửa.', 403);

    // AI-assisted edit: regenerate content using the original work + analysis
    if (generationMethod === 'ai_edit' && instruction?.trim()) {
      const workText = (owned.workContent || '').slice(0, 2000);
      const analysis = await (async () => {
        try {
          const { results } = await env.DB.prepare(
            `SELECT section, content FROM work_analysis WHERE work_id = (SELECT work_id FROM student_multiverse WHERE id = ?)`
          ).bind(id).all();
          const map = {};
          for (const r of results) map[r.section] = r.content || '';
          return map;
        } catch { return {}; }
      })();
      const analysisContext = Object.entries(analysis)
        .filter(([, v]) => v)
        .map(([sec, v]) => `[${sec.toUpperCase()}]\n${v}`)
        .join('\n\n');

      const { text, inputTokens, outputTokens } = await aiCall(
        env,
        '@cf/qwen/qwq-32b',
        {
          systemPrompt:
            `Bạn là nhà văn Việt Nam chuyên viết truyện ngắn.\n\n` +
            `NHIỆM VỤ: viết lại đoạn truyện dựa trên nguyên tác "${owned.workTitle}" của ${owned.author}.\n\n` +
            `QUY TẮC TUYỆT ĐỐI:\n` +
            `1. CHỈ dựa TRỰC TIẾP vào NỘI DUNG NGUYÊN TÁC bên dưới — không bịa thông tin ngoài nguyên tác.\n` +
            `2. KHÔNG bịa thêm chi tiết gia đình, sự kiện, cảm xúc không có trong tác phẩm.\n` +
            `3. Giọng văn: gần gũi, chân thực, phù hợp thể loại truyện ngắn Việt Nam hiện đại.\n` +
            `4. Kết cục: mới lạ nhưng THOÁT NGHOẢI, không bi kịch quá mức.\n` +
            `5. Dài 200-400 từ.\n\n` +
            `Trả lời CHÍNH XÁC JSON, không thêm text khác:\n` +
            `{"content": "đoạn truyện mới...", "moral": "bài học rút ra (ngắn gọn, 1-2 câu)"}`,
          messages: [
            { role: 'user', content:
              `NGUYÊN TÁC "${owned.workTitle}" (${owned.author}):\n${workText}\n\n` +
              (analysisContext ? `PHÂN TÍCH TÁC PHẨM:\n${analysisContext}\n\n` : '') +
              `ĐOẠN GỐC CẦN SỬA:\n${(owned.content || '').slice(0, 1500)}\n\n` +
              `YÊU CẦU CHỈNH SỬA:\n${instruction.trim()}\n\n` +
              `Viết lại đoạn truyện theo yêu cầu trên, chỉ dùng thông tin từ nguyên tác, giữ đúng tinh thần tác phẩm.`
            }
          ],
          maxTokens: 1536,
          temperature: 0.8,
        }
      );

      let parsed = null;
      try {
        parsed = JSON.parse(text.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}'));
      } catch { /* use raw text fallback */ }

      const newContent = parsed?.content?.slice(0, 3000) || owned.content;
      const newMoral   = (parsed?.moral || owned.workContent || '').slice(0, 200);

      await env.DB.prepare(
        `UPDATE student_multiverse SET content = ?, moral = ?, updated_at = ? WHERE id = ?`
      ).bind(newContent, newMoral, new Date().toISOString(), id).run();
      await logTokenUsage(env, user.id, 'multiverse', `Chỉnh sửa AI storyline: ${instruction.trim().slice(0, 50)}`, inputTokens, outputTokens);

      return new Response(JSON.stringify({
        success: true,
        content: newContent,
        moral: newMoral,
        generationMethod: 'ai_edit',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Direct field update
    const fields = [];
    const values = [];
    if (branch_point !== undefined) { fields.push('branch_point = ?'); values.push((branch_point || '').trim()); }
    if (content    !== undefined)   { fields.push('content = ?');        values.push((content || '').slice(0, 5000)); }
    if (moral      !== undefined)   { fields.push('moral = ?');          values.push((moral || '').slice(0, 300)); }

    if (fields.length === 0) return jsonError('Không có trường nào để sửa.', 400);

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await env.DB.prepare(`UPDATE student_multiverse SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('multiverse PATCH error:', e);
    return jsonError('Lỗi khi sửa.', 500);
  }
}
