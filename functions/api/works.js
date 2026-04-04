import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return cachedJson({ error: 'Unauthorized' }, { status: 401, profile: 'nocache' });

    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
    const grade = url.searchParams.get('grade');
    const genre = url.searchParams.get('genre');
    const analysisStatus = url.searchParams.get('analysisStatus');

    const binds = [];
    let where = user.role === 'teacher' ? 'WHERE teacher_id = ?' : 'WHERE status = ?';
    if (user.role === 'teacher') binds.push(user.id);
    else binds.push('analyzed');

    if (grade) {
      where += ' AND grade = ?';
      binds.push(parseInt(grade, 10));
    }
    if (genre) {
      where += ' AND genre = ?';
      binds.push(genre);
    }
    if (analysisStatus) {
      where += ' AND analysis_status = ?';
      binds.push(analysisStatus);
    }

    const [rowsResult, countResult] = await Promise.all([
      env.DB.prepare(`
        SELECT id, title, author, grade, genre, content, status,
               analysis_status AS analysisStatus,
               chunk_count AS chunkCount,
               word_count AS wordCount,
               file_name AS fileName,
               created_at AS createdAt
        FROM works ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`
      ).bind(...binds, limit, offset).all(),
      env.DB.prepare(`SELECT COUNT(*) AS total FROM works ${where}`).bind(...binds).first(),
    ]);
    return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
  } catch (e) {
    console.error('works GET error:', e);
    return cachedJson({ error: 'Lỗi khi tải tác phẩm.' }, { status: 500, profile: 'nocache' });
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();
    const {
      title, author, grade, genre, content,
      fileName, fileData, analysisStatus,
    } = body;

    if (!title || !author) {
      return new Response(JSON.stringify({ error: 'Thiếu tiêu đề hoặc tác giả' }), { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : null;

    await env.DB.prepare(`
      INSERT INTO works (id, title, author, grade, genre, content, status, teacher_id,
                         file_name, file_data, word_count, analysis_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, title, author, grade || null, genre || null,
      content || null, content ? 'pending' : 'none',
      user.id,
      fileName || null, fileData || null, wordCount, analysisStatus || 'none', now
    ).run();

    return cachedJson({ id, title, author, status: 'pending', analysisStatus: 'none', createdAt: now }, { status: 201, profile: 'nocache' });
  } catch (e) {
    console.error('works POST error:', e);
    return cachedJson({ error: 'Lỗi khi tạo tác phẩm.' }, { status: 500, profile: 'nocache' });
  }
}

export async function onRequestPatch({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await request.json();
    const { id, title, author, grade, genre, content, analysisStatus } = body;

    if (!id) return new Response(JSON.stringify({ error: 'Thiếu ID' }), { status: 400 });

    // Verify ownership
    const existing = await env.DB.prepare(
      'SELECT id FROM works WHERE id = ? AND teacher_id = ?'
    ).bind(id, user.id).first();
    if (!existing) return new Response(JSON.stringify({ error: 'Không tìm thấy tác phẩm' }), { status: 404 });

    const updates = [];
    const binds = [];
    if (title !== undefined) { updates.push('title = ?'); binds.push(title); }
    if (author !== undefined) { updates.push('author = ?'); binds.push(author); }
    if (grade !== undefined) { updates.push('grade = ?'); binds.push(grade ?? null); }
    if (genre !== undefined) { updates.push('genre = ?'); binds.push(genre ?? null); }
    if (content !== undefined) {
      updates.push('content = ?');
      binds.push(content ?? null);
      const wc = content ? content.trim().split(/\s+/).filter(Boolean).length : null;
      updates.push('word_count = ?');
      binds.push(wc);
    }
    if (analysisStatus !== undefined) {
      updates.push('analysis_status = ?');
      binds.push(analysisStatus);
    }

    if (updates.length === 0) {
      return cachedJson({ error: 'Không có gì để cập nhật' }, { status: 400, profile: 'nocache' });
    }

    binds.push(id);
    await env.DB.prepare(`UPDATE works SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('works PATCH error:', e);
    return cachedJson({ error: 'Lỗi khi cập nhật.' }, { status: 500, profile: 'nocache' });
  }
}

export async function onRequestDelete({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Thiếu ID' }), { status: 400 });

    const existing = await env.DB.prepare(
      'SELECT id FROM works WHERE id = ? AND teacher_id = ?'
    ).bind(id, user.id).first();
    if (!existing) return new Response(JSON.stringify({ error: 'Không tìm thấy tác phẩm' }), { status: 404 });

    // Cascade handled by FK ON DELETE CASCADE — work_analysis and work_chunks auto-delete
    await env.DB.prepare('DELETE FROM works WHERE id = ?').bind(id).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('works DELETE error:', e);
    return cachedJson({ error: 'Lỗi khi xóa.' }, { status: 500, profile: 'nocache' });
  }
}
