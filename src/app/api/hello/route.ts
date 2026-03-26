import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: Request) {
  const env = getRequestContext().env;
  return Response.json({ status: 'ok', db_bound: !!env.DB });
}
