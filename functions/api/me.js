export async function onRequestGet({ data }) {
  // The 'data.user' is injected by the _middleware.js
  if (!data?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  return new Response(JSON.stringify({ user: data.user }), {
    headers: { "Content-Type": "application/json" }
  });
}
