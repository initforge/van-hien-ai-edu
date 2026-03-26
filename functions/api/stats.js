export async function onRequestGet({ env }) {
  try {
    const upcomingExams = await env.DB.prepare(
      "SELECT id, title, type, deadline FROM exams WHERE deadline >= date('now') LIMIT 3"
    ).all();
    
    return new Response(JSON.stringify({
      upcomingExams: upcomingExams.results || [],
      recentResults: []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      upcomingExams: [{ id: '1', title: 'Phân tích nhân vật Lão Hạc', type: 'exercise', deadline: '2026-03-22' }],
      recentResults: []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
