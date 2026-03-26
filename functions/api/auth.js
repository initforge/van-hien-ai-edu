export async function onRequestPost({ request, env }) {
  const { role } = await request.json();
  
  // RAW SQL Log
  try {
    await env.DB.prepare(
      "INSERT INTO logs (action, role, ip, timestamp) VALUES (?, ?, ?, ?)"
    ).bind("login_attempt", role, request.headers.get("cf-connecting-ip") || "unknown", new Date().toISOString()).run();
  } catch (e) {
    console.error("DB log failed:", e);
  }

  return new Response(JSON.stringify({ redirect: "/dashboard", success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
