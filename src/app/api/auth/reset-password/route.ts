import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { consumePasswordReset } from "@/lib/auth-tokens";

// POST /api/auth/reset-password  { token, password }
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const userId = await consumePasswordReset(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }
    const hashed = await hash(password, 10);
    await db.user.update({ where: { id: userId }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
