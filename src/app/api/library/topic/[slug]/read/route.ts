import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { masteryPercent, touchStreak } from "@/lib/gamification";

const THEORY_XP = 20;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { slug } = await params;

    const topic = await db.topic.findUnique({ where: { slug } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const existing = await db.topicProgress.findUnique({
      where: { userId_topicId: { userId: session.user.id, topicId: topic.id } },
    });

    // Award theory XP only the first time it is read.
    const alreadyRead = existing?.theoryRead ?? false;

    const progress = await db.topicProgress.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: topic.id } },
      update: {
        theoryRead: true,
        theoryCompletedAt: existing?.theoryCompletedAt ?? new Date(),
        lastAccessed: new Date(),
        masteryPercent: masteryPercent(true, existing?.quizCompleted ?? false),
      },
      create: {
        userId: session.user.id,
        topicId: topic.id,
        theoryRead: true,
        theoryCompletedAt: new Date(),
        masteryPercent: masteryPercent(true, false),
      },
    });

    let xpAwarded = 0;
    if (!alreadyRead) {
      xpAwarded = THEORY_XP;
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: THEORY_XP } },
      });
    }

    const streak = await touchStreak(session.user.id);

    return NextResponse.json({ success: true, progress, xpAwarded, streak });
  } catch (e) {
    console.error("mark read error", e);
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
