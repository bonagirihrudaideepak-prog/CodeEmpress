import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeEmailVerification } from "@/lib/auth-tokens";

// POST /api/auth/verify-email  { token }
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
    const userId = await consumeEmailVerification(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 }
      );
    }
    await db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("verify-email error:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
