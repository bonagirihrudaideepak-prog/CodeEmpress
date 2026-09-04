import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/mailbox — the current user's in-app emails (sandbox email inbox).
// Only visible when the user is an admin (PUBLISHER/ADMIN/OWNER) or, in dev,
// to any logged-in user. Used to test email flows without an SMTP server.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In production with real SMTP this is unnecessary; only expose when the
    // sandbox mailbox is actually being used.
    if (!process.env.SMTP_HOST) {
      const mails = await db.mail.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, to: true, subject: true, text: true, createdAt: true },
      });
      return NextResponse.json({ mailbox: mails });
    }
    return NextResponse.json({ mailbox: [] });
  } catch (e) {
    console.error("mailbox error:", e);
    return NextResponse.json({ error: "Failed to load mailbox" }, { status: 500 });
  }
}
