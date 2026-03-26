import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { role } = await request.json() as { role: string };
    
    // Hackathon Auth: Just trust the role requested
    const userId = role === "teacher" ? "teacher-1" : "student-1";
    
    // Set Next.js HTTP-only cookie
    (await cookies()).set("session", JSON.stringify({ role, userId }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({ success: true, redirect: `/${role}/dashboard` });
  } catch (err) {
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}

export async function DELETE() {
  (await cookies()).delete("session");
  return NextResponse.json({ success: true });
}
