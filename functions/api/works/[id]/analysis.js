import { cachedJson } from '../../_cache.js';

const SECTIONS = ['summary', 'characters', 'art_features', 'content_value', 'themes', 'context'];

// GET /api/works/:id/analysis
export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id') || request.url.split('/').slice(-2)[0];

    // Verify ownership
    const work = await env.DB.prepare(
      'SELECT id, title, content FROM works WHERE id = ? AND teacher_id = ?'
    ).bind(id, user.id).first();
    if (!work) return new Response(JSON.stringify({ error: 'Không tìm thấy' }), { status: 404 });

    const { results } = await env.DB.prepare(
      'SELECT id, work_id AS workId, section, content, is_ai_generated AS isAiGenerated, created_at AS createdAt, updated_at AS updatedAt FROM work_analysis WHERE work_id = ?'
    ).bind(id).all();

    // Sort results by SECTIONS order, fill missing with empty
    const analysisMap = {};
    (results || []).forEach(r => { analysisMap[r.section] = r; });
    const analysis = SECTIONS.map(s => ({
      workId: id,
      section: s,
      content: analysisMap[s]?.content || '',
      isAiGenerated: !!analysisMap[s],
      createdAt: analysisMap[s]?.createdAt || null,
      updatedAt: analysisMap[s]?.updatedAt || null,
    }));

    return cachedJson({ id, analysis }, { profile: 'nocache' });
  } catch (e) {
    console.error('analysis GET error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi tải phân tích' }), { status: 500 });
  }
}

// PATCH /api/works/:id/analysis — update one section
export async function onRequestPatch({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    // Extract work id from path: /api/works/:id/analysis
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2]; // second-to-last is the work id

    const body = await request.json();
    const { section, content } = body;

    if (!id) return new Response(JSON.stringify({ error: 'Thiếu work ID' }), { status: 400 });
    if (!section || !SECTIONS.includes(section)) {
      return new Response(JSON.stringify({ error: 'Section không hợp lệ' }), { status: 400 });
    }
    if (content === undefined) {
      return new Response(JSON.stringify({ error: 'Thiếu nội dung' }), { status: 400 });
    }

    // Verify ownership
    const work = await env.DB.prepare(
      'SELECT id FROM works WHERE id = ? AND teacher_id = ?'
    ).bind(id, user.id).first();
    if (!work) return new Response(JSON.stringify({ error: 'Không tìm thấy' }), { status: 404 });

    const now = new Date().toISOString();
    const existing = await env.DB.prepare(
      'SELECT id FROM work_analysis WHERE work_id = ? AND section = ?'
    ).bind(id, section).first();
    if (existing) {
      await env.DB.prepare(
        'UPDATE work_analysis SET content = ?, is_ai_generated = 0, updated_at = ? WHERE work_id = ? AND section = ?'
      ).bind(content, now, id, section).run();
    } else {
      await env.DB.prepare(
        'INSERT INTO work_analysis (id, work_id, section, content, is_ai_generated, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
      ).bind(crypto.randomUUID(), id, section, content, now, now).run();
    }

    return cachedJson({ success: true, section, content }, { profile: 'nocache' });
  } catch (e) {
    console.error('analysis PATCH error:', e);
    return new Response(JSON.stringify({ error: 'Lỗi khi cập nhật' }), { status: 500 });
  }
}
