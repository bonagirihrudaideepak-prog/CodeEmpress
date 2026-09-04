import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { sendMail, mailHtml } from "@/lib/mail";
import { createEmailVerification } from "@/lib/auth-tokens";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await hash(password, 10);

    const user = await db.user.create({
      data: {
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: hashed,
      },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    // Send an email verification (best-effort; never block registration).
    let verificationLink: string | null = null;
    try {
      const token = await createEmailVerification(user.id);
      const origin = req.headers.get("origin") || "";
      const base = origin || process.env.NEXT_PUBLIC_APP_URL || "";
      verificationLink = `${base}/verify-email?token=${token}`;
      await sendMail({
        to: user.email,
        subject: "Verify your Codempress email",
        text: `Welcome to Codempress! Confirm your email to unlock the full experience.\n\n${verificationLink}`,
        html: mailHtml(
          "Verify your email",
          `Welcome, <b>${user.name || user.email}</b>! Confirm your email to verify your account.`,
          { label: "Verify Email", url: verificationLink }
        ),
      });
    } catch (e) {
      console.error("verify email send failed:", e);
    }

    return NextResponse.json(
      { success: true, user, verificationLink },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
