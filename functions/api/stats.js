import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const url = new URL(request.url);
    const upcomingLimit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('upcomingLimit') || '3', 10) || 3));
    const recentLimit   = Math.min(20, Math.max(1, parseInt(url.searchParams.get('recentLimit')   || '5', 10) || 5));

    if (user.role === 'teacher') {
      // All 6 queries run in parallel
      const [upcomingExams, recentResults, studentCount, pendingGrading, totalExams, aiPending] = await Promise.all([
        env.DB.prepare(
          "SELECT id, title, type, deadline FROM exams WHERE teacher_id = ? AND status = 'published' ORDER BY deadline ASC LIMIT ?"
        ).bind(user.id, upcomingLimit).all(),
        env.DB.prepare(
          "SELECT s.id AS submissionId, e.title AS examTitle, e.type AS examType, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment FROM submissions s LEFT JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? AND s.status = 'returned' ORDER BY s.submitted_at DESC LIMIT ?"
        ).bind(user.id, recentLimit).all(),
        env.DB.prepare(
          "SELECT COUNT(DISTINCT cs.student_id) AS count FROM classes c JOIN class_students cs ON c.id = cs.class_id WHERE c.teacher_id = ?"
        ).bind(user.id).first(),
        env.DB.prepare(
          "SELECT COUNT(*) AS count FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? AND s.status = 'submitted'"
        ).bind(user.id).first(),
        env.DB.prepare(
          "SELECT COUNT(*) AS count FROM exams WHERE teacher_id = ?"
        ).bind(user.id).first(),
        env.DB.prepare(
          "SELECT COUNT(*) AS count FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE e.teacher_id = ? AND s.status = 'ai_graded'"
        ).bind(user.id).first(),
      ]);

      return cachedJson({
        upcomingExams: upcomingExams.results || [],
        recentResults: recentResults.results || [],
        studentCount: studentCount?.count || 0,
        pendingGrading: pendingGrading?.count || 0,
        totalExams: totalExams?.count || 0,
        aiPending: aiPending?.count || 0,
      }, { profile: 'dynamic' });
    } else {
      const [upcomingExams, recentResults] = await Promise.all([
        env.DB.prepare(
          "SELECT e.id, e.title, e.type, e.deadline FROM exams e JOIN class_students cs ON e.class_id = cs.class_id WHERE cs.student_id = ? AND e.status = 'published' ORDER BY e.deadline ASC LIMIT ?"
        ).bind(user.id, upcomingLimit).all(),
        env.DB.prepare(
          "SELECT s.id AS submissionId, e.title AS examTitle, e.type AS examType, s.ai_score AS aiScore, s.teacher_score AS teacherScore, s.teacher_comment AS teacherComment FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE s.student_id = ? AND s.status = 'returned' ORDER BY s.submitted_at DESC LIMIT ?"
        ).bind(user.id, recentLimit).all(),
      ]);

      return cachedJson({
        upcomingExams: upcomingExams.results || [],
        recentResults: recentResults.results || [],
      }, { profile: 'dynamic' });
    }
  } catch (e) {
    return cachedJson({ error: 'Failed to load stats.' }, { status: 500, profile: 'nocache' });
  }
}
