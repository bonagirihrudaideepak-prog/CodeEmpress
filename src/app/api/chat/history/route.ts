import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/chat/history — the user's persisted mentor conversation (last 30).
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const messages = await db.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      take: 40,
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json({ messages });
  } catch (e) {
    console.error("chat history error:", e);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
