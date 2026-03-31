import { cachedJson } from './_cache.js';

export async function onRequestGet({ env, data, request }) {
  try {
    const user = data?.user;
    if (!user) return cachedJson({ error: 'Unauthorized' }, { status: 401, profile: 'nocache' });

    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    let rowsResult, countResult;

    if (user.role === 'teacher') {
      [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          "SELECT id, name, teacher_id AS teacherId, created_at AS createdAt FROM classes WHERE teacher_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM classes WHERE teacher_id = ?").bind(user.id).first(),
      ]);
    } else {
      // student — enrolled classes only
      [rowsResult, countResult] = await Promise.all([
        env.DB.prepare(
          "SELECT c.id, c.name, c.teacher_id AS teacherId, c.created_at AS createdAt FROM classes c JOIN class_students cs ON c.id = cs.class_id WHERE cs.student_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?"
        ).bind(user.id, limit, offset).all(),
        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM classes c JOIN class_students cs ON c.id = cs.class_id WHERE cs.student_id = ?"
        ).bind(user.id).first(),
      ]);
    }

    return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
  } catch (e) {
    console.error('classes GET error:', e);
    return cachedJson({ error: 'Lỗi khi tải lớp học.' }, { status: 500, profile: 'nocache' });
  }
}
