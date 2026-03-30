import { cachedJson } from '../_cache.js';

export async function onRequestGet({ env, data }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Counts
    const [userCount, teacherCount, studentCount, classCount, examCount, submissionCount] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS count FROM users").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'teacher'").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM classes").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM exams").first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM submissions").first(),
    ]);

    // Submissions theo tháng (6 tháng gần nhất)
    const monthlySubmissions = await env.DB.prepare(`
      SELECT
        strftime('%Y-%m', submitted_at) AS month,
        COUNT(*) AS count
      FROM submissions
      WHERE submitted_at >= datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', submitted_at)
      ORDER BY month ASC
    `).all();

    // Users theo tháng (6 tháng gần nhất)
    const monthlyUsers = await env.DB.prepare(`
      SELECT
        strftime('%Y-%m', created_at) AS month,
        COUNT(*) AS count
      FROM users
      WHERE created_at >= datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();

    // Role distribution
    const roleDistribution = await env.DB.prepare(`
      SELECT role, COUNT(*) AS count FROM users GROUP BY role
    `).all();

    // Top teachers by exam count
    const topTeachers = await env.DB.prepare(`
      SELECT u.id, u.name, COUNT(e.id) AS examCount
      FROM users u
      JOIN exams e ON u.id = e.teacher_id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY examCount DESC
      LIMIT 5
    `).all();

    return cachedJson({
      counts: {
        total: userCount?.count || 0,
        teachers: teacherCount?.count || 0,
        students: studentCount?.count || 0,
        classes: classCount?.count || 0,
        exams: examCount?.count || 0,
        submissions: submissionCount?.count || 0,
      },
      monthlySubmissions: monthlySubmissions.results || [],
      monthlyUsers: monthlyUsers.results || [],
      roleDistribution: roleDistribution.results || [],
      topTeachers: topTeachers.results || [],
    }, { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), { status: 500 });
  }
}
