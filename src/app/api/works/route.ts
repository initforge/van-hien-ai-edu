import { getRequestContext } from '@cloudflare/next-on-pages';
import { createDb } from '@/db';
import * as schema from '@/db/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET() {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);

    const data = await db.select().from(schema.works).orderBy(desc(schema.works.createdAt)).all();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);
    const body = await request.json() as any;

    const newWork = await db.insert(schema.works).values({
      id: crypto.randomUUID(),
      title: body.title,
      author: body.author,
      grade: body.grade || null,
      genre: body.genre || null,
      content: body.content || null,
      status: 'pending',
      teacherId: 'teacher-1',
      createdAt: new Date(),
    }).returning();

    return Response.json(newWork[0]);
  } catch (error) {
    return Response.json({ error: 'Failed to create work' }, { status: 500 });
  }
}
