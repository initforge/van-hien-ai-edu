import { cachedJson } from './_cache.js';

export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT id, name, teacher_id AS teacherId, created_at AS createdAt FROM classes ORDER BY created_at DESC"
    ).all();
    return cachedJson(result.results || [], { profile: 'static' });
  } catch (e) {
    return cachedJson([], { profile: 'static' });
  }
}
