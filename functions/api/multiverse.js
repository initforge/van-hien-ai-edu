/**
 * GET  /api/multiverse          — list student multiverse storylines
 * POST /api/multiverse          — create new storyline (AI generate or manual)
 *
 * Student: returns their own storylines
 * Teacher: returns storylines from students in their classes (optional classId filter)
 *
 * POST body: { workId, title?, branchPoint, content?, generationMethod }
 */
import { cachedJson } from './_cache.js';
import { aiCall } from './_ai.js';
import { logTokenUsage } from './_tokenLog.js';
import { jsonError } from './_utils.js';

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

    // Verify work exists
    const work = await env.DB.prepare(
      "SELECT id, title, author FROM works WHERE id = ? LIMIT 1"
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
      return new Response(JSON.stringify({ id, title, branchPoint: branchPoint.trim(), content, generationMethod: 'manual', depth }), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      });
    }

    // AI generation
    let generatedContent = '';
    let generatedMoral = '';

    if (generationMethod === 'ai_full') {
      const { text, inputTokens, outputTokens } = await aiCall(
        '@cf/qwen/qwen3-30b-a3b-fp8',
        {
          systemPrompt: `Bạn là nhà văn Việt Nam chuyên viết truyện ngắn. Viết một đoạn truyện ngắn sáng tạo dựa trên gợi ý "WHAT IF" cho tác phẩm "${work.title}" của ${work.author}. Đoạn truyện phải: (1) giữ đúng tinh thần tác phẩm gốc, (2) có kết cục mới hấp dẫn, (3) dài 200-400 từ. Trả lời JSON: {"content": "...đoạn truyện...", "moral": "...bài học rút ra..."}`,
          messages: [{ role: 'user', content: `WHAT IF: ${branchPoint}` }],
          maxTokens: 1024,
          temperature: 0.85,
        }
      );
      let parsed = null;
      try {
        parsed = JSON.parse(text.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}'));
      } catch { /* use raw text fallback */ }
      generatedContent = parsed?.content || text.slice(0, 2000);
      generatedMoral = parsed.moral || '';
      await logTokenUsage(env, user.id, 'multiverse', `Tạo đa vũ trụ: ${branchPoint}`, inputTokens, outputTokens);
    } else if (generationMethod === 'ai_branch') {
      if (!parentId) return jsonError('Thiếu parentId cho nhánh mới.', 400);
      const parent = await env.DB.prepare(
        "SELECT content, work_id FROM student_multiverse WHERE id = ? LIMIT 1"
      ).bind(parentId).first();
      if (!parent) return jsonError('Không tìm thấy nhánh cha.', 404);

      const { text, inputTokens, outputTokens } = await aiCall(
        '@cf/qwen/qwen3-30b-a3b-fp8',
        {
          systemPrompt: `Bạn là nhà văn Việt Nam. Viết tiếp một đoạn truyện dựa trên nội dung đã cho, theo hướng WHAT IF mới. Giữ đúng giọng văn và phong cách. Trả lời JSON: {"content": "...tiếp theo...", "moral": "...bài học..."}`,
          messages: [{ role: 'user', content: `Nội dung trước:\n${(parent.content || '').slice(0, 1500)}\n\nWHAT IF mới: ${branchPoint}` }],
          maxTokens: 768,
          temperature: 0.85,
        }
      );
      const parsed = JSON.parse(text.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}'));
      generatedContent = parsed.content || text.slice(0, 1500);
      generatedMoral = parsed.moral || '';
      await logTokenUsage(env, user.id, 'multiverse', `Nhánh đa vũ trụ: ${branchPoint}`, inputTokens, outputTokens);
    }

    await env.DB.prepare(
      `INSERT INTO student_multiverse (id, student_id, work_id, class_id, title, branch_point, content, moral, status, generation_method, parent_id, depth, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`
    ).bind(id, user.id, workId, classId, title || null, branchPoint.trim(), generatedContent, generatedMoral, generationMethod, parentId || null, depth, now, now).run();

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
