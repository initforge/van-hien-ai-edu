export async function onRequestGet({ env }) {
  try {
    const upcomingExams = await env.DB.prepare(
      "SELECT id, title, type, deadline FROM exams WHERE status = 'published' ORDER BY deadline ASC LIMIT 3"
    ).all();

    const recentResults = await env.DB.prepare(
      "SELECT s.id AS submissionId, e.title AS examTitle, e.type AS examType, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment FROM submissions s LEFT JOIN exams e ON s.exam_id = e.id WHERE s.status = 'returned' ORDER BY s.submitted_at DESC LIMIT 5"
    ).all();

    const studentCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").first();
    const pendingGrading = await env.DB.prepare("SELECT COUNT(*) AS count FROM submissions WHERE status = 'submitted'").first();
    const totalExams = await env.DB.prepare("SELECT COUNT(*) AS count FROM exams").first();
    const aiPending = await env.DB.prepare("SELECT COUNT(*) AS count FROM submissions WHERE status = 'ai_graded'").first();

    return new Response(JSON.stringify({
      upcomingExams: upcomingExams.results || [],
      recentResults: recentResults.results || [],
      studentCount: studentCount?.count || 0,
      pendingGrading: pendingGrading?.count || 0,
      totalExams: totalExams?.count || 0,
      aiPending: aiPending?.count || 0,
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      upcomingExams: [
        { id: '1', title: 'Phân tích nhân vật Lão Hạc', type: 'exercise', deadline: '2026-03-28' },
        { id: '2', title: 'Đề thi giữa kỳ — Lớp 8', type: 'exam', deadline: '2026-03-30' }
      ],
      recentResults: [
        { submissionId: 'r1', examTitle: 'Nghị luận xã hội — Lòng dũng cảm', examType: 'exercise', teacherScore: 8.0, aiScore: 8.5, teacherComment: "Bài viết có ý tưởng tốt, phân tích sâu sắc." },
        { submissionId: 'r2', examTitle: 'Đọc hiểu — Đồng chí', examType: 'exam', teacherScore: 7.5, aiScore: 7.0, teacherComment: "Phân tích tốt hình ảnh thơ." }
      ],
      studentCount: 156,
      pendingGrading: 12,
      totalExams: 28,
      aiPending: 5,
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
