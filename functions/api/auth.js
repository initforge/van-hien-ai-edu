export async function onRequestPost({ request, env }) {
  const { role } = await request.json();
  
  // RAW SQL Example: Track login attempt
  try {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    await env.DB.prepare(
      "INSERT INTO logs (action, role, ip, timestamp) VALUES (?, ?, ?, ?)"
    ).bind("login_attempt", role, ip, new Date().toISOString()).run();
  } catch (e) {
    console.error("Database log failed:", e);
  }

  return new Response(JSON.stringify({ 
    redirect: role === "teacher" ? "/teacher" : "/student",
    success: true 
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
