import { getRequestContext } from '@cloudflare/next-on-pages';
import { createDb } from '@/db';
import * as schema from '@/db/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET() {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);

    const data = await db.select().from(schema.classes).orderBy(desc(schema.classes.createdAt)).all();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
