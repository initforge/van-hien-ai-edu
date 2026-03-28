import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode("V4nHocA1_SuperS3cretKey_2026!");

export async function onRequestPost({ request, env }) {
  try {
    const { email, role } = await request.json();
    
    // Validate user against DB (email only, as requested no password hashing)
    const user = await env.DB.prepare(
      "SELECT id, name, role, avatar FROM users WHERE email = ? AND role = ?"
    ).bind(email, role).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Email không tồn tại hoặc sai vai trò!" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Log the attempt
    try {
      await env.DB.prepare(
        "INSERT INTO logs (action, role, ip, timestamp) VALUES (?, ?, ?, ?)"
      ).bind("login_success", role, request.headers.get("cf-connecting-ip") || "unknown", new Date().toISOString()).run();
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
      .sign(JWT_SECRET);

    // Set HttpOnly Cookie
    const cookie = `token=${token}; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Strict`;

    return new Response(JSON.stringify({ redirect: `/${role}/dashboard`, success: true, user }), {
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
