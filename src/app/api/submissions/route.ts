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
    
    // Can filter by studentId, examId, classId
    const data = await db.select().from(schema.submissions).orderBy(desc(schema.submissions.submittedAt)).all();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);
    const body = await request.json() as any;
    
    const sessionCookie = (await cookies()).get('session');
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : { userId: 'student-1' };

    const newSubmission = await db.insert(schema.submissions).values({
      id: crypto.randomUUID(),
      examId: body.examId,
      studentId: session.userId,
      status: 'submitted',
      submittedAt: new Date(),
    }).returning();

    return Response.json(newSubmission[0]);
  } catch (error) {
    return Response.json({ error: 'Failed to submit exam' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const env = getRequestContext().env;
    const db = createDb(env);
    const body = await request.json() as any;

    await db.update(schema.submissions)
      .set({
        teacherScore: body.teacherScore,
        status: 'returned',
        teacherComment: body.teacherComment
      })
      .where(eq(schema.submissions.id, body.id));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to return submission' }, { status: 500 });
  }
}

