import { cachedJson } from '../_cache.js';

export async function onRequestGet({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)), 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    const [rowsResult, countResult] = await Promise.all([
      env.DB.prepare(
        "SELECT id, name, email, role, username, avatar, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
      ).bind(limit, offset).all(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM users").first(),
    ]);
    return cachedJson({ data: rowsResult.results || [], total: countResult?.total || 0, limit, offset }, { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 });
  }
}

export async function onRequestPost({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, username } = body;

    if (!name || !email || !role || !username) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, name, email, role, username, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
    ).bind(id, name, email, role, username).run();

    // Activity log
    await logActivity(env, data.user, 'create_user', 'user', id, `Created user: ${username} (${role})`);

    return new Response(JSON.stringify({ id, name, email, role, username }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500 });
  }
}

export async function onRequestPut({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role, username } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
    }

    const existing = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const updates = [];
    const binds = [];
    if (name) { updates.push('name = ?'); binds.push(name); }
    if (email) { updates.push('email = ?'); binds.push(email); }
    if (role) { updates.push('role = ?'); binds.push(role); }
    if (username) { updates.push('username = ?'); binds.push(username); }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });
    }

    binds.push(id);
    await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();

    await logActivity(env, data.user, 'update_user', 'user', id, `Updated user: ${username || id}`);

    return cachedJson({ success: true }, { profile: 'dynamic' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update user' }), { status: 500 });
  }
}

// PATCH /api/admin/users — reset password
export async function onRequestPatch({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    const { id, password } = body;

    if (!id || !password) {
      return new Response(JSON.stringify({ error: 'User ID and password required' }), { status: 400 });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }), { status: 400 });
    }

    const existing = await env.DB.prepare("SELECT username FROM users WHERE id = ?").bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    await env.DB.prepare("UPDATE users SET password_plain = ? WHERE id = ?").bind(password, id).run();

    await logActivity(env, data.user, 'reset_password', 'user', id, `Đặt lại mật khẩu cho tài khoản: ${existing.username}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to reset password' }), { status: 500 });
  }
}

export async function onRequestDelete({ env, data, request }) {
  try {
    if (data?.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
    }

    if (userId === data.user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400 });
    }

    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

    await logActivity(env, data.user, 'delete_user', 'user', userId, `Deleted user: ${userId}`);

    return cachedJson({ success: true }, { profile: 'nocache' });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to delete user' }), { status: 500 });
  }
}

async function logActivity(env, user, action, targetType, targetId, details) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(crypto.randomUUID(), user.id, user.name, user.role, action, targetType, targetId, details).run();
  } catch (e) {
    console.error('activity_log failed:', e);
  }
}
