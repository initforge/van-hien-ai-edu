import { SignJWT, jwtVerify } from 'jose';
import { revokeToken } from './_kv.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { username, password, name, inviteCode } = body;

    // ── Registration ───────────────────────────────────────────────────────────
    if (inviteCode !== undefined || name !== undefined) {
      if (!name?.trim() || !inviteCode?.trim()) {
        return new Response(JSON.stringify({ error: "Vui lòng nhập họ tên và mã lớp." }), {
          status: 400, headers: { "Content-Type": "application/json" }
        });
      }

      // Find class by invite code
      const cls = await env.DB.prepare(
        "SELECT id, name FROM classes WHERE invite_code = ? COLLATE NOCASE LIMIT 1"
      ).bind(inviteCode.trim().toUpperCase()).first();
      if (!cls) {
        return new Response(JSON.stringify({ error: "Mã lớp không đúng. Vui lòng kiểm tra lại." }), {
          status: 400, headers: { "Content-Type": "application/json" }
        });
      }

      // Generate username from name
      const baseUsername = name.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '').slice(0, 20);
      let username = baseUsername;
      let counter = 1;
      while (true) {
        const existing = await env.DB.prepare(
          "SELECT id FROM users WHERE username = ? COLLATE NOCASE LIMIT 1"
        ).bind(username).first();
        if (!existing) break;
        username = `${baseUsername}${counter++}`;
      }

      // Generate password
      const pw = username + '123';
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await env.DB.prepare(
        `INSERT INTO users (id, name, email, username, password_plain, role, created_at)
         VALUES (?, ?, ?, ?, ?, 'student', ?)`
      ).bind(id, name.trim(), `${username}@vanhocai.edu.vn`, username, pw, now).run();

      await env.DB.prepare(
        "INSERT INTO class_students (id, class_id, student_id) VALUES (?, ?, ?)"
      ).bind(crypto.randomUUID(), cls.id, id).run();

      // Log registration
      await env.DB.prepare(
        `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
         VALUES (?, ?, ?, 'student', 'student_registered', 'class', ?, ?, ?)`
      ).bind(crypto.randomUUID(), id, name.trim(), cls.id, JSON.stringify({ className: cls.name }), now).run();

      return new Response(JSON.stringify({
        success: true, className: cls.name,
        username, password: pw,
      }), {
        status: 201, headers: { "Content-Type": "application/json" }
      });
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    const identifier = username?.trim();
    if (!identifier || !password) {
      return new Response(JSON.stringify({ error: "Vui lòng nhập username và mật khẩu." }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    // Validate user — check username OR email
    const user = await env.DB.prepare(
      "SELECT id, name, role, avatar, password_plain FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE"
    ).bind(identifier, identifier).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Tài khoản không tồn tại." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify password
    if (!user.password_plain || user.password_plain !== password) {
      return new Response(JSON.stringify({ error: "Mật khẩu không đúng." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Log login
    try {
      await env.DB.prepare(
        "INSERT INTO logs (action, role, ip, timestamp) VALUES (?, ?, ?, ?)"
      ).bind("login_success", user.role, request.headers.get("cf-connecting-ip") || "unknown", new Date().toISOString()).run();
    } catch (e) {
      console.error("DB log failed:", e);
    }

    // Generate JWT with unique jti for revocation support
    const jti = crypto.randomUUID();
    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(env.JWT_SECRET));

    // Redirect based on role
    const redirectMap = {
      admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard'
    };
    const redirect = redirectMap[user.role] || '/';

    const cookieName = `token_${user.role}`;
    const cookie = `${cookieName}=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`;

    return new Response(JSON.stringify({
      redirect, success: true,
      token, // sent in JSON so frontend can store in localStorage
      user: { id: user.id, name: user.name, role: user.role }
    }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Lỗi hệ thống" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// DELETE /api/auth — logout (revoke token)
export async function onRequestDelete({ request, env }) {
  // Try Authorization header first, then cookie
  let token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookieMatch = cookieHeader.match(/token_[^=]+=([^;]+)/);
    if (cookieMatch) token = cookieMatch[1];
  }

  if (token && env.VANHIEN_KV) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
      if (payload.jti) await revokeToken(env.VANHIEN_KV, payload.jti, 86400);
    } catch { /* ignore */ }
  }

  const clearCookies = ['admin', 'teacher', 'student'].map(role =>
    `token_${role}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  ).join(', ');
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearCookies
    }
  });
}
