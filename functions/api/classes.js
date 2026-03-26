export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT id, name, teacher_id AS teacherId, created_at AS createdAt FROM classes ORDER BY created_at DESC"
    ).all();
    return Response.json(result.results || []);
  } catch (e) {
    return Response.json([], { headers: { 'Content-Type': 'application/json' } });
  }
}
