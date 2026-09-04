import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelForXp, levelTitle } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subjects, user] = await Promise.all([
      db.subject.findMany({
        orderBy: { order: "asc" },
        include: {
          topics: {
            where: { isPublished: true },
            include: {
              topicProgress: { where: { userId: session.user.id } },
            },
          },
        },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { xp: true, streak: true },
      }),
    ]);

    const data = subjects.map((s) => {
      const total = s.topics.length;
      const completed = s.topics.filter((t) => t.topicProgress.some((p) => p.quizCompleted)).length;
      const avgMastery =
        total === 0
          ? 0
          : Math.round(
              s.topics.reduce((acc, t) => acc + (t.topicProgress[0]?.masteryPercent ?? 0), 0) / total
            );
      return {
        slug: s.slug,
        name: s.name,
        description: s.description,
        icon: s.icon,
        topicCount: total,
        completedCount: completed,
        mastery: avgMastery,
      };
    });

    const level = levelForXp(user?.xp ?? 0);
    return NextResponse.json({
      subjects: data,
      user: {
        xp: user?.xp ?? 0,
        level,
        levelTitle: levelTitle(level),
        streak: user?.streak ?? 0,
      },
    });
  } catch (e) {
    console.error("library error", e);
    return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
  }
}
