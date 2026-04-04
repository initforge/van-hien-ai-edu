import { cachedJson } from '../../_cache.js';

// GET /api/works/:id/chunks
export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2]; // /api/works/:id/chunks

    const work = await env.DB.prepare(
      'SELECT id FROM works WHERE id = ? AND teacher_id = ?'
    ).bind(id, user.id).first();
    if (!work) return new Response(JSON.stringify({ error: 'Không tìm thấy' }), { status: 404 });

    const { results } = await env.DB.prepare(
      'SELECT id, work_id AS workId, sequence, heading, content, summary, created_at AS createdAt FROM work_chunks WHERE work_id = ? ORDER BY sequence ASC'
    ).bind(id).all();

    return cachedJson({ id, chunks: results || [] }, { profile: 'dynamic' });
  } catch (e) {
    console.error('chunks GET error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi tải chunks' }), { status: 500 });
  }
}

// POST /api/works/:id/chunks — add chunk
export async function onRequestPost({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2];

    const body = await request.json();
    const { heading, content, sequence } = body;

    if (!id) return new Response(JSON.stringify({ error: 'Thiếu work ID' }), { status: 400 });
    if (!content) return new Response(JSON.stringify({ error: 'Thiếu nội dung chunk' }), { status: 400 });

    const work = await env.DB.prepare(
      'SELECT id FROM works WHERE id = ? AND teacher_id = ?'
    ).bind(id, user.id).first();
    if (!work) return new Response(JSON.stringify({ error: 'Không tìm thấy' }), { status: 404 });

    // Auto-assign sequence if not provided
    let seq = sequence;
    if (!seq) {
      const maxSeq = await env.DB.prepare(
        'SELECT MAX(sequence) AS maxSeq FROM work_chunks WHERE work_id = ?'
      ).bind(id).first();
      seq = (maxSeq?.maxSeq ?? 0) + 1;
    }

    const chunkId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO work_chunks (id, work_id, sequence, heading, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(chunkId, id, seq, heading || null, content, now).run();

    // Update chunk_count on work
    await env.DB.prepare(
      'UPDATE works SET chunk_count = (SELECT COUNT(*) FROM work_chunks WHERE work_id = ?) WHERE id = ?'
    ).bind(id, id).run();

    return new Response(JSON.stringify({ id: chunkId, workId: id, sequence: seq, heading: heading || null, content, createdAt: now }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('chunks POST error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi thêm chunk' }), { status: 500 });
  }
}

// PATCH /api/works/:id/chunks — update chunk
export async function onRequestPatch({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { chunkId, heading, content, sequence } = body;

    if (!chunkId) return new Response(JSON.stringify({ error: 'Thiếu chunk ID' }), { status: 400 });

    // Verify ownership via work
    const chunk = await env.DB.prepare(
      'SELECT c.id FROM work_chunks c JOIN works w ON c.work_id = w.id WHERE c.id = ? AND w.teacher_id = ?'
    ).bind(chunkId, user.id).first();
    if (!chunk) return new Response(JSON.stringify({ error: 'Không tìm thấy' }), { status: 404 });

    const updates = [];
    const binds = [];
    if (heading !== undefined) { updates.push('heading = ?'); binds.push(heading ?? null); }
    if (content !== undefined) { updates.push('content = ?'); binds.push(content ?? null); }
    if (sequence !== undefined) { updates.push('sequence = ?'); binds.push(sequence); }

    if (updates.length === 0) {
      return cachedJson({ error: 'Không có gì để cập nhật' }, { status: 400, profile: 'nocache' });
    }

    binds.push(chunkId);
    await env.DB.prepare(`UPDATE work_chunks SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('chunks PATCH error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi cập nhật' }), { status: 500 });
  }
}

// DELETE /api/works/:id/chunks — delete chunk
export async function onRequestDelete({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const chunkId = url.searchParams.get('chunkId');

    if (!chunkId) return new Response(JSON.stringify({ error: 'Thiếu chunk ID' }), { status: 400 });

    // Verify ownership
    const chunk = await env.DB.prepare(
      'SELECT c.work_id FROM work_chunks c JOIN works w ON c.work_id = w.id WHERE c.id = ? AND w.teacher_id = ?'
    ).bind(chunkId, user.id).first();
    if (!chunk) return new Response(JSON.stringify({ error: 'Không tìm thấy' }), { status: 404 });

    await env.DB.prepare('DELETE FROM work_chunks WHERE id = ?').bind(chunkId).run();

    // Update chunk_count
    await env.DB.prepare(
      'UPDATE works SET chunk_count = (SELECT COUNT(*) FROM work_chunks WHERE work_id = ?) WHERE id = ?'
    ).bind(chunk.work_id, chunk.work_id).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('chunks DELETE error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi xóa' }), { status: 500 });
  }
}
