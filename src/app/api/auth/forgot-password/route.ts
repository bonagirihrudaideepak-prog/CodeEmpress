import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMail, mailHtml } from "@/lib/mail";
import { createPasswordReset } from "@/lib/auth-tokens";

// POST /api/auth/forgot-password  { email }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    // Never reveal whether the account exists.
    if (!user?.password) {
      return NextResponse.json({ success: true });
    }
    const token = await createPasswordReset(user.id);
    const origin = req.headers.get("origin") || "";
    const link = `${origin}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your Codempress password",
      text: `Reset your Codempress password within the next hour.\n\n${link}`,
      html: mailHtml("Reset your password", `Click below to choose a new password.`, {
        label: "Reset Password",
        url: link,
      }),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
