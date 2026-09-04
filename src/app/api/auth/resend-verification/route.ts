import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMail, mailHtml } from "@/lib/mail";
import { createEmailVerification } from "@/lib/auth-tokens";

// POST /api/auth/resend-verification  { email }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    // Don't reveal account existence; always respond success.
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }
    const token = await createEmailVerification(user.id);
    const origin = req.headers.get("origin") || "";
    const link = `${origin}/verify-email?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Verify your Codempress email",
      text: `Confirm your email to verify your Codempress account.\n\n${link}`,
      html: mailHtml("Verify your email", `Click below to confirm your email.`, {
        label: "Verify Email",
        url: link,
      }),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("resend-verification error:", e);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
