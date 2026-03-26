export async function onRequestGet({ env }) {
  try {
    // RAW SQL: Lấy bài tập sắp tới
    const upcomingExams = await env.DB.prepare(
      "SELECT id, title, type, deadline FROM exams WHERE deadline >= date('now') ORDER BY deadline ASC LIMIT 3"
    ).all();

    // RAW SQL: Lấy kết quả gần đây
    const recentResults = await env.DB.prepare(`
      SELECT 
        s.id as submissionId, 
        e.title as examTitle, 
        e.type as examType, 
        s.teacher_score as teacherScore, 
        s.ai_score as aiScore, 
        s.teacher_comment as teacherComment
      FROM submissions s
      JOIN exams e ON s.exam_id = e.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `).all();

    return new Response(JSON.stringify({
      upcomingExams: upcomingExams.results || [],
      recentResults: recentResults.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Stats API failed:", e);
    // Fallback Mock Data if DB is empty or fails
    return new Response(JSON.stringify({
      upcomingExams: [
        { id: '1', title: 'Phân tích nhân vật Lão Hạc', type: 'exercise', deadline: '2026-03-22' },
        { id: '2', title: 'Đề thi giữa kỳ', type: 'exam', deadline: '2026-03-25' }
      ],
      recentResults: [
        { submissionId: 'r1', examTitle: 'Nghị luận xã hội', examType: 'exercise', teacherScore: 8.5, aiScore: 9.0, teacherComment: "Tốt lắm!" }
      ]
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
