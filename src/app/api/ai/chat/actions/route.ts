import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Structured SuggestActions (PRD Module 5, Pillar 3).
 * Returns context-aware `suggestions[]` and actionable `actions[]` that the
 * chat UI renders under the assistant response (navigate / open / start).
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        targetRole: true,
        xp: true,
        _count: { select: { resumes: true, applications: true, projects: true } },
        topicProgress: { where: { quizCompleted: false }, select: { topicId: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Pick the most-pregnant next learning step.
    const inProgress = await db.topicProgress.findFirst({
      where: { userId: user.id, quizCompleted: false, theoryRead: true },
      orderBy: { lastAccessed: "desc" },
      include: { topic: { select: { slug: true, title: true, subject: { select: { slug: true } } } } },
    });

    const hasResume = user._count.resumes > 0;
    const hasApps = user._count.applications > 0;

    const actions: { label: string; href: string; icon?: string }[] = [];
    if (inProgress?.topic) {
      actions.push({
        label: `Continue "${inProgress.topic.title}"`,
        href: inProgress.topic.subject?.slug
          ? `/library/${inProgress.topic.subject.slug}/${inProgress.topic.slug}`
          : `/library/${inProgress.topic.slug}`,
      });
    } else {
      actions.push({ label: "Explore the Arcane Library", href: "/library" });
    }
    actions.push({ label: "View Roadmaps", href: "/roadmaps" });
    if (hasResume) actions.push({ label: "Review Resume Analysis", href: "/resume" });
    if (hasApps) actions.push({ label: "Career Hub", href: "/career" });
    actions.push({ label: "AI Status", href: "/ai-status" });

    const suggestions: string[] = [];
    if (user._count.projects === 0) suggestions.push("Build a small project to apply what you've learned.");
    if (!user.targetRole) suggestions.push("Set a target role in your profile for a personalized roadmap.");
    if (user.xp > 0 && user.xp < 5500) suggestions.push("Push toward Master by passing harder quizzes.");
    if (suggestions.length === 0) suggestions.push("You're on a roll — keep your streak going!");

    return NextResponse.json({ suggestions, actions });
  } catch (e) {
    console.error("chat actions error:", e);
    return NextResponse.json({ error: "Failed to load actions" }, { status: 500 });
  }
}
