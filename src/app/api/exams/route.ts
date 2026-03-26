import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';
import { createDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    let query = db.select().from(schema.exams).orderBy(desc(schema.exams.createdAt));
    // If a specific class is requested, filter it. Otherwise return all.
    // In a real app, we'd also filter by student's class or teacher's ownership via session.

    const exams = await query.all();
    return Response.json(exams);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch exams', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);
    const body = await request.json() as any;

    const sessionCookie = (await cookies()).get('session');
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : { userId: 'teacher-1' };

    const newExam = await db.insert(schema.exams).values({
      id: crypto.randomUUID(),
      title: body.title,
      type: body.type || 'exercise',
      workId: body.workId || null,
      classId: body.classId || null,
      teacherId: session.userId,
      duration: body.duration || 60,
      status: body.status || 'draft',
      createdAt: new Date(),
    }).returning();

    return Response.json(newExam[0]);
  } catch (error) {
    return Response.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}
