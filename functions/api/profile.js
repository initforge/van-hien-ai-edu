/**
 * GET /api/profile  — student profile with skill radar + score history
 *
 * Returns:
 *   - avgScore, gradeLabel, skillData (radar)
 *   - scoreHistory: last N submissions with scores
 */
import { cachedJson } from './_cache.js';
import { jsonError } from './_utils.js';

const GRADE_LABELS = [
  { max: 5.0,  label: 'yếu' },
  { max: 6.5,  label: 'trung_bình' },
  { max: 8.0,  label: 'khá' },
  { max: 8.5,  label: 'giỏi' },
  { max: 999,  label: 'xuất_sắc' },
];

function computeGradeLabel(score) {
  if (score == null) return 'chưa_xếp';
  for (const g of GRADE_LABELS) {
    if (score < g.max) return g.label;
  }
  return 'xuất_sắc';
}

export async function onRequestGet({ env, data }) {
  try {
    const user = data?.user;
    if (!user) return jsonError('Unauthorized', 401);

    if (user.role === 'student') {
      return getStudentProfile(env, user.id);
    }
    return jsonError('Forbidden', 403);
  } catch (e) {
    console.error('profile GET error:', e);
    return jsonError('Lỗi khi tải hồ sơ.', 500);
  }
}

async function getStudentProfile(env, studentId) {
  // Get skill assessments for radar (latest period per criteria)
  const skillRows = await env.DB.prepare(`
    SELECT criteria_id, score, period
    FROM skill_assessments
    WHERE student_id = ?
    ORDER BY period DESC
  `).bind(studentId).all();

  // Aggregate skill data: average per criteria (latest period wins)
  const skillMap = {};
  const seenCriteria = new Set();
  for (const r of (skillRows.results || [])) {
    if (!seenCriteria.has(r.criteria_id)) {
      skillMap[r.criteria_id] = r.score;
      seenCriteria.add(r.criteria_id);
    }
  }

  // Get submission history
  const historyRows = await env.DB.prepare(`
    SELECT s.id, s.submitted_at AS submittedAt,
           e.title AS examTitle, e.type,
           s.ai_score AS aiScore,
           s.teacher_score AS teacherScore,
           s.teacher_comment AS teacherComment
    FROM submissions s
    JOIN exams e ON s.exam_id = e.id
    WHERE s.student_id = ? AND s.status = 'returned'
    ORDER BY s.submitted_at DESC
    LIMIT 50
  `).bind(studentId).all();

  // Compute avg from history
  const scores = (historyRows.results || [])
    .map(r => r.teacherScore ?? r.aiScore)
    .filter(s => s != null);
  const avgScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;
  const gradeLabel = computeGradeLabel(avgScore);

  // Skill radar: get criteria names
  const criteriaIds = Object.keys(skillMap);
  let criteriaNames = {};
  if (criteriaIds.length > 0) {
    const placeholders = criteriaIds.map(() => '?').join(',');
    const nameRows = await env.DB.prepare(
      `SELECT id, name FROM rubric_criteria WHERE id IN (${placeholders})`
    ).bind(...criteriaIds).all();
    for (const r of (nameRows.results || [])) {
      criteriaNames[r.id] = r.name;
    }
  }

  const skillData = {};
  for (const [criteriaId, score] of Object.entries(skillMap)) {
    const name = criteriaNames[criteriaId] || criteriaId;
    skillData[name] = Math.round(score * 10) / 10;
  }

  return cachedJson({
    studentId,
    avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
    gradeLabel,
    skillData,
    scoreHistory: (historyRows.results || []).map(r => ({
      id: r.id,
      examTitle: r.examTitle,
      type: r.type,
      aiScore: r.aiScore,
      teacherScore: r.teacherScore,
      teacherComment: r.teacherComment,
      submittedAt: r.submittedAt,
    })),
  }, { profile: 'dynamic' });
}
