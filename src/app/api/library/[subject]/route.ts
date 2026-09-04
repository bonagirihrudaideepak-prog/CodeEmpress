import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelForXp, levelTitle } from "@/lib/gamification";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { subject: slug } = await params;

    const subject = await db.subject.findUnique({
      where: { slug },
      include: {
        topics: {
          where: { isPublished: true },
          orderBy: { sequence: "asc" },
          include: {
            topicProgress: { where: { userId: session.user.id } },
            subject: { select: { slug: true, name: true } },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Compute completion set for unlocking: a topic unlocks when all topics in
    // this subject with a lower sequence are completed.
    const completedBySlug = new Map<string, boolean>();
    for (const t of subject.topics) {
      completedBySlug.set(t.slug, t.topicProgress.some((p) => p.quizCompleted));
    }

    // Build ordered list and track how many prior are completed.
    const ordered = [...subject.topics].sort((a, b) => a.sequence - b.sequence);
    const topics = ordered.map((t, i) => {
      const progress = t.topicProgress[0];
      const priorCompleted = ordered
        .slice(0, i)
        .every((p) => completedBySlug.get(p.slug));
      const isFirst = i === 0;
      const locked = !isFirst && !priorCompleted && !completedBySlug.get(t.slug);
      return {
        slug: t.slug,
        title: t.title,
        description: t.description,
        xpReward: t.xpReward,
        difficultyRating: t.difficultyRating,
        sequence: t.sequence,
        mastery: progress?.masteryPercent ?? 0,
        theoryRead: progress?.theoryRead ?? false,
        quizCompleted: progress?.quizCompleted ?? false,
        locked,
      };
    });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, streak: true },
    });
    const level = levelForXp(user?.xp ?? 0);

    return NextResponse.json({
      subject: { slug: subject.slug, name: subject.name, description: subject.description },
      topics,
      user: { xp: user?.xp ?? 0, level, levelTitle: levelTitle(level), streak: user?.streak ?? 0 },
    });
  } catch (e) {
    console.error("subject error", e);
    return NextResponse.json({ error: "Failed to load subject" }, { status: 500 });
  }
}
