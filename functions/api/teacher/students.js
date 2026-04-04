/**
 * GET  /api/teacher/students?classId= — list students in a class with stats
 * POST /api/teacher/students/import  — bulk import students from Excel CSV
 * DELETE /api/teacher/students/:id  — remove student from class
 */
import { cachedJson } from '../_cache.js';
import { jsonError } from '../_utils.js';

/**
 * Parse Excel CSV — expects columns: STT, Họ tên, Giới tính, Ngày sinh
 * Returns { students: [{name, gender, birthdate, username, password}], skipped: [] }
 */
function parseStudentExcel(csvText) {
  const lines = csvText.trim().split('\n');
  const results = [];
  const skipped = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 4) { skipped.push({ line: i + 1, reason: 'Thiếu cột' }); continue; }

    const rawName = cols[1];
    const rawGender = cols[2];
    const rawBirthdate = cols[3];

    if (!rawName) { skipped.push({ line: i + 1, reason: 'Thiếu tên' }); continue; }

    // Normalize name: "Nguyễn Xuân Lĩnh" → "nguyenxuanlinh"
    const slug = rawName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '')
      .slice(0, 20);

    // Normalize birthdate: "16/03/2011" → "2011-03-16"
    let birthdate = '';
    if (rawBirthdate) {
      const parts = rawBirthdate.split('/');
      if (parts.length === 3) {
        birthdate = `${parts[2].padStart(4,'0')}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      }
    }

    // Password = yyyyMMdd or yymmdd if birthdate known
    const password = birthdate ? birthdate.replace(/-/g, '') : slug + '1234';

    results.push({
      name: rawName.trim(),
      gender: rawGender === 'Nam' ? 'male' : 'female',
      birthdate,
      username: slug,
      password,
    });
  }

  return { students: results, skipped };
}

/**
 * Generate unique username by slug + suffix
 */
async function resolveUsername(db, baseSlug) {
  let username = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.prepare(
      "SELECT id FROM users WHERE username = ? LIMIT 1"
    ).bind(username).first();
    if (!existing) return username;
    username = `${baseSlug}${counter++}`;
  }
}

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    if (!classId) return jsonError('Thiếu classId.', 400);

    // Verify class belongs to teacher
    const cls = await env.DB.prepare(
      "SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(classId, user.id).first();
    if (!cls) return jsonError('Không tìm thấy lớp.', 404);

    const rows = await env.DB.prepare(`
      SELECT u.id, u.name, u.gender, u.birthdate, u.username,
             sp.avg_score AS avgScore, sp.grade_label AS gradeLabel,
             COUNT(s.id) AS submissionCount,
             AVG(COALESCE(s.teacher_score, s.ai_score)) AS recentAvg
      FROM class_students cs
      JOIN users u ON cs.student_id = u.id
      LEFT JOIN student_profiles sp ON sp.student_id = u.id
      LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'returned'
      WHERE cs.class_id = ?
      GROUP BY u.id
      ORDER BY u.name ASC
    `).bind(classId).all();

    return cachedJson({ data: rows.results || [], classId }, { profile: 'dynamic' });
  } catch (e) {
    console.error('teacher/students GET error:', e);
    return jsonError('Lỗi khi tải học sinh.', 500);
  }
}

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    // route: /api/teacher/students/import
    if (url.pathname.endsWith('/import')) {
      return handleImport({ request, env, data });
    }
    return jsonError('Not found.', 404);
  } catch (e) {
    console.error('teacher/students POST error:', e);
    return jsonError('Lỗi khi tạo học sinh.', 500);
  }
}

async function handleImport({ request, env, data }) {
  const user = data.user;
  const body = await request.json();
  const { classId, students } = body;

  if (!classId) return jsonError('Thiếu classId.', 400);
  if (!Array.isArray(students) || students.length === 0) {
    return jsonError('Không có học sinh nào để nhập.', 400);
  }

  const now = new Date().toISOString();
  const results = { created: 0, skipped: [] };

  for (const s of students) {
    if (!s.name?.trim()) { results.skipped.push({ name: s.name, reason: 'Thiếu tên' }); continue; }

    try {
      const username = await resolveUsername(env.DB, s.username || s.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '').slice(0, 20));
      const id = crypto.randomUUID();

      // Hash password
      const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const saltBytes = new TextEncoder().encode(salt);
      const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(s.password || '123456'),
        { name: 'PBKDF2' }, false, ['deriveBits']
      );
      const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-512' },
        key, 512
      );
      const derivedHex = Array.from(new Uint8Array(derived))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const hash = `${salt}:${derivedHex}`;

      await env.DB.prepare(
        `INSERT INTO users (id, name, email, username, password_hash, role, gender, birthdate, created_at)
         VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?)`
      ).bind(id, s.name.trim(), `${username}@vanhocai.edu.vn`, username, hash,
             s.gender || null, s.birthdate || null, now).run();

      await env.DB.prepare(
        "INSERT INTO class_students (id, class_id, student_id) VALUES (?, ?, ?)"
      ).bind(crypto.randomUUID(), classId, id).run();

      results.created++;
    } catch (err) {
      results.skipped.push({ name: s.name, reason: err.message });
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestDelete({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') return jsonError('Unauthorized', 401);

    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const classId = url.searchParams.get('classId');
    if (!studentId || !classId) return jsonError('Thiếu tham số.', 400);

    // Verify class ownership
    const cls = await env.DB.prepare(
      "SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(classId, user.id).first();
    if (!cls) return jsonError('Không tìm thấy lớp.', 404);

    await env.DB.prepare(
      "DELETE FROM class_students WHERE class_id = ? AND student_id = ?"
    ).bind(classId, studentId).run();

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    console.error('teacher/students DELETE error:', e);
    return jsonError('Lỗi khi xóa học sinh.', 500);
  }
}
