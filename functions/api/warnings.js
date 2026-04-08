/**
 * GET /api/warnings — AI warnings (heuristic-based, 0 AI token)
 *
 * Runs 7 warning checks on-demand. Results are cached in KV (5 min)
 * and persisted in ai_warnings table.
 *
 * Query params: ?recompute=0|1
 */
import { kvGet, kvSet } from './_kv.js';
import { cachedJson } from './_cache.js';

const KV_CACHE_KEY = (teacherId) => `warnings:${teacherId}`;
const KV_CACHE_TTL = 300; // 5 minutes

// ─── Word analysis helpers ─────────────────────────────────────────────────────────

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Compute bigram repetition rate (0–1). Higher = more repetitive writing.
 */
function bigramRepetition(text) {
  if (!text || text.length < 4) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return 0;
  const uniq = new Set(words);
  let repeats = 0;
  for (let i = 0; i < words.length - 1; i++) {
    const bg = `${words[i]} ${words[i+1]}`;
    if (uniq.has(bg)) repeats++;
    uniq.add(bg);
  }
  return repeats / (words.length - 1);
}

/**
 * Jaccard similarity between two texts.
 */
function jaccardSimilarity(textA, textB) {
  if (!textA || !textB) return 0;
  const setA = new Set(textA.trim().split(/\s+/).filter(Boolean));
  const setB = new Set(textB.trim().split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) { if (setB.has(w)) intersection++; }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Warning generators ─────────────────────────────────────────────────────────────

async function checkW1W2(env, teacherId) {
  const rows = await env.DB.prepare(`
    SELECT sa.id, sa.submission_id, sa.question_id, sa.content,
           s.student_id, s.started_at, s.submitted_at,
           e.teacher_id, e.title,
           c.id AS classId, c.name AS className,
           u.name AS studentName,
           q.points
    FROM submission_answers sa
    JOIN submissions s ON sa.submission_id = s.id
    JOIN exams e ON s.exam_id = e.id
    JOIN classes c ON e.class_id = c.id
    JOIN users u ON s.student_id = u.id
    JOIN questions q ON q.id = sa.question_id
    WHERE e.teacher_id = ?
      AND s.status IN ('submitted','ai_graded','returned')
      AND q.type = 'essay'
      AND NOT EXISTS (
        SELECT 1 FROM ai_warnings w
        WHERE w.submission_id = sa.submission_id AND w.type IN ('W1','W2') AND w.dismissed = 0
      )
  `).bind(teacherId).all();

  const warnings = [];
  for (const row of rows.results || []) {
    const wc = wordCount(row.content);
    const threshold = Math.max(30, Math.round((row.points || 5) * 30));
    const durationSec = row.started_at && row.submitted_at
      ? (new Date(row.submitted_at) - new Date(row.started_at)) / 1000
      : null;

    if (durationSec !== null && durationSec < wc * 1.5 && wc > 20) {
      warnings.push({
        type: 'W1',
        severity: wc > 200 ? 'high' : 'medium',
        studentId: row.student_id,
        studentName: row.studentName,
        classId: row.classId,
        className: row.className,
        submissionId: row.submission_id,
        message: `Nộp quá nhanh: ${Math.round(durationSec)}s cho bài ${wc} từ`,
        metadata: JSON.stringify({ durationSec: Math.round(durationSec), wordCount: wc, threshold: Math.round(wc * 1.5) }),
      });
    }

    if (wc > 0 && wc < 100) {
      warnings.push({
        type: 'W2',
        severity: wc < 50 ? 'high' : 'medium',
        studentId: row.student_id,
        studentName: row.studentName,
        classId: row.classId,
        className: row.className,
        submissionId: row.submission_id,
        message: `Bài quá ngắn: ${wc} từ (ít hơn 100 từ`,
        metadata: JSON.stringify({ wordCount: wc, threshold: 100 }),
      });
    }
  }
  return warnings;
}

async function checkW3(env, teacherId) {
  const rows = await env.DB.prepare(`
    SELECT sa.id, sa.submission_id, sa.content,
           s.student_id, s.exam_id, e.teacher_id,
           c.id AS classId, c.name AS className,
           u.name AS studentName
    FROM submission_answers sa
    JOIN submissions s ON sa.submission_id = s.id
    JOIN exams e ON s.exam_id = e.id
    JOIN classes c ON e.class_id = c.id
    JOIN users u ON s.student_id = u.id
    JOIN questions q ON q.id = sa.question_id
    WHERE e.teacher_id = ?
      AND s.status IN ('submitted','ai_graded','returned')
      AND q.type = 'essay'
      AND LENGTH(sa.content) > 200
      AND NOT EXISTS (
        SELECT 1 FROM ai_warnings w
        WHERE w.submission_id = sa.submission_id AND w.type = 'W3' AND w.dismissed = 0
      )
  `).bind(teacherId).all();

  const warnings = [];
  for (const row of rows.results || []) {
    const rep = bigramRepetition(row.content);
    if (rep > 0.15) {
      warnings.push({
        type: 'W3',
        severity: rep > 0.25 ? 'high' : 'medium',
        studentId: row.student_id,
        studentName: row.studentName,
        classId: row.classId,
        className: row.className,
        submissionId: row.submission_id,
        message: `Từ lặp cao: ${Math.round(rep * 100)}% (ngưỡng 15%)`,
        metadata: JSON.stringify({ repetitionRate: Math.round(rep * 100) }),
      });
    }
  }
  return warnings;
}

async function checkW4W5(env, teacherId) {
  // All returned submissions for this teacher
  const rows = await env.DB.prepare(`
    SELECT s.id AS submissionId, s.student_id, s.status,
           s.teacher_score, s.ai_score,
           s.submitted_at,
           e.title AS examTitle,
           c.id AS classId, c.name AS className,
           u.name AS studentName
    FROM submissions s
    JOIN exams e ON s.exam_id = e.id
    JOIN classes c ON e.class_id = c.id
    JOIN users u ON s.student_id = u.id
    WHERE e.teacher_id = ?
      AND s.status = 'returned'
      AND (s.teacher_score IS NOT NULL OR s.ai_score IS NOT NULL)
    ORDER BY s.student_id, s.submitted_at DESC
  `).bind(teacherId).all();

  const byStudent = {};
  for (const r of rows.results || []) {
    if (!byStudent[r.student_id]) byStudent[r.student_id] = [];
    byStudent[r.student_id].push(r);
  }

  const warnings = [];
  for (const [studentId, subs] of Object.entries(byStudent)) {
    if (subs.length < 3) continue;
    const sorted = subs.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const score = current.teacher_score ?? current.ai_score;
      if (score == null) continue;
      const history = sorted.slice(i + 1, i + 6);
      const prevScores = history.map(h => h.teacher_score ?? h.ai_score).filter(s => s != null);
      if (prevScores.length < 2) continue;
      const avg = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;
      const stdDev = Math.sqrt(prevScores.reduce((a, b) => a + (b - avg) ** 2, 0) / prevScores.length);
      const diff = score - avg;
      if (diff < -2 * stdDev) {
        warnings.push({
          type: 'W4',
          severity: diff < -3 * stdDev ? 'high' : 'medium',
          studentId: current.student_id,
          studentName: current.studentName,
          classId: current.classId,
          className: current.className,
          submissionId: current.submissionId,
          message: `Điểm giảm: ${score}/10 → thấp hơn TB ${avg.toFixed(1)} của 5 bài gần nhất`,
          metadata: JSON.stringify({ score, avgScore: Math.round(avg * 10) / 10, stdDev: Math.round(stdDev * 10) / 10 }),
        });
      }
      if (diff > 2 * stdDev && avg < 7) {
        warnings.push({
          type: 'W5',
          severity: 'low',
          studentId: current.student_id,
          studentName: current.studentName,
          classId: current.classId,
          className: current.className,
          submissionId: current.submissionId,
          message: `Điểm tăng: ${score}/10, cao hơn TB ${avg.toFixed(1)} của 5 bài gần nhất`,
          metadata: JSON.stringify({ score }),
        });
      }
    }
  }
  return warnings;
}

async function checkW6(env, teacherId) {
  // Group submissions by class
  const rows = await env.DB.prepare(`
    SELECT sa.id, sa.submission_id, sa.content, s.student_id, s.submitted_at, e.class_id,
           c.id AS classId, c.name AS className,
           u.name AS studentName
    FROM submission_answers sa
    JOIN submissions s ON sa.submission_id = s.id
    JOIN exams e ON s.exam_id = e.id
    JOIN classes c ON e.class_id = c.id
    JOIN users u ON s.student_id = u.id
    JOIN questions q ON q.id = sa.question_id
    WHERE e.teacher_id = ?
      AND s.status IN ('submitted','ai_graded','returned')
      AND q.type = 'essay'
      AND LENGTH(sa.content) > 200
      AND s.submitted_at >= datetime('now', '-7 days')
      AND NOT EXISTS (
        SELECT 1 FROM ai_warnings w
        WHERE w.submission_id = sa.submission_id AND w.type = 'W6' AND w.dismissed = 0
      )
  `).bind(teacherId).all();

  const byClass = {};
  for (const r of rows.results || []) {
    if (!byClass[r.classId]) byClass[r.classId] = [];
    byClass[r.classId].push(r);
  }

  const warnings = [];
  for (const [, answers] of Object.entries(byClass)) {
    if (answers.length < 2) continue;
    for (let i = 0; i < answers.length; i++) {
      for (let j = i + 1; j < answers.length; j++) {
        const sim = jaccardSimilarity(answers[i].content, answers[j].content);
        if (sim > 0.7) {
          const later = new Date(answers[i].submitted_at) > new Date(answers[j].submitted_at) ? answers[i] : answers[j];
          warnings.push({
            type: 'W6',
            severity: sim > 0.85 ? 'high' : 'medium',
            studentId: later.student_id,
            studentName: later.studentName,
            classId: later.classId,
            className: later.className,
            submissionId: `Từ lặp ${Math.round(sim * 100)}% với bạn cùng lớp`,
            metadata: JSON.stringify({ similarity: Math.round(sim * 100) }),
          });
        }
      }
    }
  }
  return warnings;
}

// ─── Shared warning computation (called by warnings.js GET and submissions POST) ──

/**
 * Run all warning checks for a teacher and persist new ones.
 * Call this after a submission is created (non-blocking).
 */
export async function computeWarningsForTeacher(env, teacherId) {
  try {
    const recompute = true; // always recompute when triggered
    const [w1w2, w3, w4w5, w6] = await Promise.all([
      checkW1W2(env, teacherId),
      checkW3(env, teacherId),
      checkW4W5(env, teacherId),
      checkW6(env, teacherId),
    ]);

    const newWarnings = [...w1w2, ...w3, ...w4w5, ...w6];
    if (newWarnings.length) {
      const stmt = env.DB.prepare(
        `INSERT OR IGNORE INTO ai_warnings
          (id, teacher_id, type, severity, student_id, student_name, class_id, class_name,
           submission_id, message, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      );
      for (const w of newWarnings) {
        await stmt.bind(
          crypto.randomUUID(), teacherId, w.type, w.severity,
          w.studentId, w.studentName,
          w.classId, w.className,
          w.submissionId || null,
          w.message, w.metadata || null
        ).run().catch(() => {});
      }
    }
    // Invalidate KV cache so next GET gets fresh data
    try {
      const { kvDel } = await import('./_kv.js');
      await kvDel(env.VANHIEN_KV, KV_CACHE_KEY(teacherId));
    } catch (_) {}
  } catch (e) {
    console.error('computeWarningsForTeacher error:', e);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const recompute = url.searchParams.get('recompute') === '1';

    if (!recompute) {
      const cached = await kvGet(env.VANHIEN_KV, KV_CACHE_KEY(user.id));
      if (cached) {
        return cachedJson(cached, { profile: 'realtime' });
      }
    }

// Use shared computation + cache
    await computeWarningsForTeacher(env, user.id);

    const rows = await env.DB.prepare(
      `SELECT id, type, severity, student_id AS studentId, student_name, class_id AS classId, class_name, submission_id AS submissionId,
             message, metadata, dismissed, created_at AS createdAt
       FROM ai_warnings
       WHERE teacher_id = ?
       ORDER BY created_at DESC LIMIT 200`
    ).bind(user.id).all();

    const warnings = rows.results || [];
    const counts = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0, W6: 0 };
    for (const w of warnings) {
      if (w.type in counts) counts[w.type]++;
    }

    const result = { warnings, counts, total: warnings.length, generatedAt: new Date().toISOString() };
    await kvSet(env.VANHIEN_KV, KV_CACHE_KEY(user.id), result, KV_CACHE_TTL);
    return cachedJson(result, { profile: 'realtime' });
  } catch (e) {
    console.error('warnings GET error:', e);
    return cachedJson({ error: 'Lỗi khi tải cảnh báo.' }, { status: 500, profile: 'nocache' });
  }
}
