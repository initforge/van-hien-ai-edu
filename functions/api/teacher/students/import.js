/**
 * POST /api/teacher/students/import — bulk import students from Excel CSV
 */
import { jsonError } from '../../_utils.js';

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

export async function onRequestPost({ request, env, data }) {
  try {
    const user = data?.user;
    if (!user || user.role !== 'teacher') {
      return jsonError('Unauthorized', 401);
    }

    const body = await request.json();
    const { classId, students } = body;

    if (!classId) return jsonError('Thiếu classId.', 400);
    if (!Array.isArray(students) || students.length === 0) {
      return jsonError('Không có học sinh nào để nhập.', 400);
    }

    // Verify class belongs to teacher
    const cls = await env.DB.prepare(
      "SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1"
    ).bind(classId, user.id).first();
    if (!cls) return jsonError('Không tìm thấy lớp.', 404);

    const now = new Date().toISOString();
    const results = { created: 0, skipped: [], credentials: [] };

    for (const s of students) {
      if (!s.name?.trim()) { results.skipped.push({ name: s.name, reason: 'Thiếu tên' }); continue; }

      try {
        const baseSlug = s.name.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '').slice(0, 20);
        const username = await resolveUsername(env.DB, baseSlug);
        const id = crypto.randomUUID();

        // Password = ddMMyyyy if birthdate, else username + '1234'
        const password = s.birthdate
          ? String(s.birthdate).replace(/-/g, '')
          : (username + '1234');

        await env.DB.prepare(
          `INSERT INTO users (id, name, email, username, password_plain, role, gender, birthdate, created_at)
           VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?)`
        ).bind(id, s.name.trim(), `${username}@vanhocai.edu.vn`, username, password,
               s.gender || null, s.birthdate || null, now).run();

        await env.DB.prepare(
          "INSERT INTO class_students (id, class_id, student_id) VALUES (?, ?, ?)"
        ).bind(crypto.randomUUID(), classId, id).run();

        results.created++;
        results.credentials.push({ name: s.name.trim(), username, password });
      } catch (err) {
        results.skipped.push({ name: s.name, reason: String(err.message || 'Lỗi') });
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('import error:', e);
    return jsonError('Lỗi khi nhập học sinh.', 500);
  }
}
