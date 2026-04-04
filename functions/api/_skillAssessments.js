/**
 * _skillAssessments.js
 * Shared utility: compute + write skill_assessments after a submission is returned.
 * Called from submissions.js (PATCH) and ai-grade.js (grade-approve).
 *
 * Also updates student_profiles.avg_score and grade_label.
 */

const GRADE_MAP = [
  { max: 5.0,  label: 'yếu' },
  { max: 6.5,  label: 'trung_bình' },
  { max: 8.0,  label: 'khá' },
  { max: 8.5,  label: 'giỏi' },
  { max: 999,  label: 'xuất_sắc' },
];

function computeGradeLabel(score) {
  if (score == null) return 'chưa_xếp';
  for (const g of GRADE_MAP) {
    if (score < g.max) return g.label;
  }
  return 'xuất_sắc';
}

/**
 * Compute and upsert skill_assessments for a returned submission.
 * Also updates student_profiles.
 *
 * @param {object} env
 * @param {string} submissionId
 */
export async function computeAndSaveSkillAssessments(env, submissionId) {
  // Get submission details
  const sub = await env.DB.prepare(
    `SELECT s.student_id, s.exam_id, e.class_id,
            s.ai_score, s.teacher_score
     FROM submissions s
     JOIN exams e ON s.exam_id = e.id
     WHERE s.id = ? LIMIT 1`
  ).bind(submissionId).first();
  if (!sub) return;

  const studentId = sub.student_id;
  const period = new Date().toISOString().slice(0, 7); // yyyy-mm

  // Get teacher's rubric criteria
  const criteria = await env.DB.prepare(
    `SELECT rc.id, rc.name, rc.weight, rc.hint_prompt
     FROM rubric_criteria rc
     JOIN exams e ON e.teacher_id = rc.teacher_id
     WHERE e.id = ? AND rc.is_active = 1
     ORDER BY rc.order_index ASC`
  ).bind(sub.exam_id).all();
  const criteriaList = criteria.results || [];

  // Get per-question scores from submission_answers
  const answers = await env.DB.prepare(
    `SELECT q.id AS questionId, q.type, q.points,
            COALESCE(sa.teacher_score, sa.ai_score) AS score
     FROM questions q
     LEFT JOIN submission_answers sa ON sa.question_id = q.id AND sa.submission_id = ?
     WHERE q.exam_id = ?`
  ).bind(submissionId, sub.exam_id).all();
  const answerMap = {};
  for (const a of (answers.results || [])) {
    answerMap[a.questionId] = a;
  }

  // Map questions → rubric criteria
  // If submission_answers.criteria_id is set, use it; otherwise distribute evenly by order
  let critIdx = 0;
  const essayAnswers = (answers.results || []).filter(a => a.type === 'essay');

  for (const row of (answers.results || [])) {
    if (row.type !== 'essay') continue;
    const crit = criteriaList[critIdx % criteriaList.length] || criteriaList[0];
    if (!crit) continue;

    const score = row.score;
    if (score == null) { critIdx++; continue; }

    // Normalise to 0-10
    const normalized = Math.max(0, Math.min(10,
      crit.weight >= 20 ? score : score * (10 / (crit.weight >= 20 ? 10 : 5))
    ));

    await env.DB.prepare(
      `INSERT INTO skill_assessments
       (id, student_id, submission_id, exam_id, class_id, criteria_id, score, period, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      crypto.randomUUID(), studentId, submissionId,
      sub.exam_id, sub.class_id, crit.id,
      Math.round(normalized * 10) / 10,
      period
    ).run().catch(() => {}); // ignore duplicate / FK errors

    critIdx++;
  }

  // Update student_profiles
  const allScores = await env.DB.prepare(
    `SELECT COALESCE(teacher_score, ai_score) AS score
     FROM submissions
     WHERE student_id = ? AND status = 'returned' AND COALESCE(teacher_score, ai_score) IS NOT NULL`
  ).bind(studentId).all();
  const scores = (allScores.results || []).map(r => r.score).filter(s => s != null);
  const avgScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;
  const gradeLabel = computeGradeLabel(avgScore);

  await env.DB.prepare(
    `INSERT INTO student_profiles (student_id, avg_score, grade_label, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(student_id) DO UPDATE SET
       avg_score = excluded.avg_score,
       grade_label = excluded.grade_label,
       updated_at = excluded.updated_at`
  ).bind(studentId, avgScore, gradeLabel).run().catch(() => {});
}
