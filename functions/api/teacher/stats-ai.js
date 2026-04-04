/**
 * GET /api/teacher/stats-ai — AI review dashboard: token usage + rubric + class+student stats
 */
import { cachedJson } from '../_cache.js';
import { jsonError } from '../_utils.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');

    const [tokenRows, rubricRows, classRows, studentRows] = await Promise.all([
      // Token usage
      env.DB.prepare(`
        SELECT feature,
               SUM(input_tokens) AS totalInput,
               SUM(output_tokens) AS totalOutput,
               SUM(input_tokens + output_tokens) AS totalTokens,
               COUNT(*) AS callCount
        FROM token_logs
        WHERE teacher_id = ?
          AND created_at >= datetime('now', '-30 days')
        GROUP BY feature
        ORDER BY totalTokens DESC`
      ).bind(user.id).all(),

      // Rubric criteria
      env.DB.prepare(`
        SELECT id, name, description, weight, hint_prompt, order_index
        FROM rubric_criteria
        WHERE teacher_id = ? AND is_active = 1
        ORDER BY order_index ASC`
      ).bind(user.id).all(),

      // Class stats with avg score
      env.DB.prepare(`
        SELECT c.id, c.name,
               c.grade_level AS gradeLevel,
               COUNT(DISTINCT cs.student_id) AS studentCount,
               COUNT(DISTINCT CASE WHEN s.status IN ('submitted','ai_graded') THEN s.id END) AS pendingCount,
               COUNT(DISTINCT CASE WHEN s.status = 'returned' THEN s.id END) AS gradedCount,
               AVG(COALESCE(s.teacher_score, s.ai_score)) AS avgScore
        FROM classes c
        LEFT JOIN class_students cs ON c.id = cs.class_id
        LEFT JOIN exams e ON e.class_id = c.id
        LEFT JOIN submissions s ON s.exam_id = e.id AND s.status = 'returned'
        WHERE c.teacher_id = ?
        GROUP BY c.id
        ORDER BY c.name ASC`
      ).bind(user.id).all(),

      // Recent submissions for student stats
      (async () => {
        const where = ['e.teacher_id = ?'];
        const binds = [user.id];
        if (classId) { where.push('e.class_id = ?'); binds.push(classId); }
        const whereStr = where.join(' AND ');
        return env.DB.prepare(`
          SELECT u.id AS studentId, u.name AS studentName,
                 c.name AS className,
                 e.title AS examTitle,
                 s.status,
                 s.ai_score AS aiScore,
                 s.teacher_score AS teacherScore,
                 s.submitted_at AS submittedAt
          FROM submissions s
          JOIN exams e ON s.exam_id = e.id
          JOIN users u ON s.student_id = u.id
          JOIN classes c ON c.id = e.class_id
          WHERE ${whereStr}
          ORDER BY s.submitted_at DESC
          LIMIT 50`
        ).bind(...binds).all();
      })(),
    ]);

    const tokens = (tokenRows.results || []).map(r => ({
      feature: r.feature,
      totalInput: r.totalInput || 0,
      totalOutput: r.totalOutput || 0,
      totalTokens: r.totalTokens || 0,
      callCount: r.callCount || 0,
    }));

    const totalTokens = tokens.reduce((a, b) => a + b.totalTokens, 0);

    return cachedJson({
      tokens,
      totalTokens,
      rubrics: (rubricRows.results || []).map(r => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        weight: r.weight,
        hintPrompt: r.hint_prompt || '',
        orderIndex: r.order_index,
      })),
      classStats: (classRows.results || []).map(r => ({
        id: r.id,
        name: r.name,
        gradeLevel: r.gradeLevel,
        studentCount: r.studentCount || 0,
        pendingCount: r.pendingCount || 0,
        gradedCount: r.gradedCount || 0,
        avgScore: r.avgScore ? Math.round(r.avgScore * 10) / 10 : null,
      })),
      recentSubmissions: (studentRows.results || []).map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        className: r.className,
        examTitle: r.examTitle,
        status: r.status,
        aiScore: r.aiScore,
        teacherScore: r.teacherScore,
        submittedAt: r.submittedAt,
      })),
    }, { profile: 'dynamic' });
  } catch (e) {
    console.error('stats-ai GET error:', e);
    return jsonError('Lỗi khi tải dữ liệu AI.', 500);
  }
}
