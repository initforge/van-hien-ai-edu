import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    if (user.role === 'teacher') {
      const upcomingExams = await env.DB.prepare(
        "SELECT id, title, type, deadline FROM exams WHERE teacher_id = ? AND status = 'published' ORDER BY deadline ASC LIMIT 3"
      ).bind(user.id).all();

      const recentResults = await env.DB.prepare(
        "SELECT s.id AS submissionId, e.title AS examTitle, e.type AS examType, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment FROM submissions s LEFT JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? AND s.status = 'returned' ORDER BY s.submitted_at DESC LIMIT 5"
      ).bind(user.id).all();

      const studentCount = await env.DB.prepare(
        "SELECT COUNT(DISTINCT cs.student_id) AS count FROM classes c JOIN class_students cs ON c.id = cs.class_id WHERE c.teacher_id = ?"
      ).bind(user.id).first();
      
      const pendingGrading = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? AND s.status = 'submitted'"
      ).bind(user.id).first();
      
      const totalExams = await env.DB.prepare("SELECT COUNT(*) AS count FROM exams WHERE teacher_id = ?").bind(user.id).first();
      const aiPending = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? AND s.status = 'ai_graded'"
      ).bind(user.id).first();

      return cachedJson({
        upcomingExams: upcomingExams.results || [],
        recentResults: recentResults.results || [],
        studentCount: studentCount?.count || 0,
        pendingGrading: pendingGrading?.count || 0,
        totalExams: totalExams?.count || 0,
        aiPending: aiPending?.count || 0,
      }, { profile: 'dynamic' });
    } else {
      // Student Stats
      const upcomingExams = await env.DB.prepare(
        "SELECT e.id, e.title, e.type, e.deadline FROM exams e JOIN class_students cs ON e.class_id = cs.class_id WHERE cs.student_id = ? AND e.status = 'published' ORDER BY e.deadline ASC LIMIT 3"
      ).bind(user.id).all();

      const recentResults = await env.DB.prepare(
        "SELECT s.id AS submissionId, e.title AS examTitle, e.type AS examType, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE s.student_id = ? AND s.status = 'returned' ORDER BY s.submitted_at DESC LIMIT 5"
      ).bind(user.id).all();

      return cachedJson({
        upcomingExams: upcomingExams.results || [],
        recentResults: recentResults.results || []
      }, { profile: 'dynamic' });
    }
  } catch (e) {
    return cachedJson({ error: 'Failed to load stats.' }, { status: 500, profile: 'nocache' });
  }
}
