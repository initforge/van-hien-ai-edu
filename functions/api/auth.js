import { SignJWT } from 'jose';

function verifyPassword(inputPw, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    const inputHash = crypto.pbkdf2Sync(inputPw, salt, 100000, 64, 'sha512').toString('hex');
    return inputHash === hash;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const identifier = username?.trim();

    if (!identifier || !password) {
      return new Response(JSON.stringify({ error: "Vui lòng nhập username và mật khẩu." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate user — check username OR email
    const user = await env.DB.prepare(
      "SELECT id, name, role, avatar, password_hash FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE"
    ).bind(identifier, identifier).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Tài khoản không tồn tại." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify password
    if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
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

    // Generate JWT
    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    })
      .setProtectedHeader({ alg: 'HS256' })
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

    const cookie = `token=${token}; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Strict`;

    return new Response(JSON.stringify({ redirect, success: true, user: { id: user.id, name: user.name, role: user.role } }), {
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

// DELETE /api/auth — logout
export async function onRequestDelete({ request, env }) {
  const cookie = `token=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Strict`;
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie
    }
  });
}
