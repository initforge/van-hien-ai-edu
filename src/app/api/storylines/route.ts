import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';
import { createDb } from '@/db';
import * as schema from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);
    // Return all storylines for the Teacher to manage
    const data = await db.select({
      id: schema.storylines.id,
      workId: schema.storylines.workId,
      branchPoint: schema.storylines.branchPoint,
      createdAt: schema.storylines.createdAt,
      workTitle: schema.works.title
    })
    .from(schema.storylines)
    .leftJoin(schema.works, eq(schema.storylines.workId, schema.works.id))
    .orderBy(desc(schema.storylines.createdAt))
    .all();

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch storylines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);
    const body = await request.json() as { workId: string; branchPoint: string };
    
    // Auth Check
    const sessionCookie = (await cookies()).get('session');
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;
    if (!session || session.role !== 'teacher') return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const newStoryline = await db.insert(schema.storylines).values({
      id: crypto.randomUUID(),
      workId: body.workId,
      branchPoint: body.branchPoint,
      createdAt: new Date(),
    }).returning();

    return Response.json(newStoryline[0]);
  } catch (error) {
    return Response.json({ error: 'Failed to construct multiverse sequence' }, { status: 500 });
  }
}
