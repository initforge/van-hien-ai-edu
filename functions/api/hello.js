export async function onRequestGet({ env }) {
  return Response.json({ status: 'ok', db_bound: !!env.DB });
}
