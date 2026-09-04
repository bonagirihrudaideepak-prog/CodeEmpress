import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { masteryPercent } from "@/lib/gamification";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { slug } = await params;

    const topic = await db.topic.findUnique({
      where: { slug },
      include: {
        subject: { select: { slug: true, name: true } },
        quizzes: { include: { questions: { orderBy: { order: "asc" } } } },
        topicProgress: { where: { userId: session.user.id } },
      },
    });

    if (!topic || !topic.isPublished) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const quiz = topic.quizzes[0];
    const progress = topic.topicProgress[0];

    // Unlock check: first topic in subject, or all prior in subject completed.
    const all = await db.topic.findMany({
      where: { subjectId: topic.subjectId!, isPublished: true },
      orderBy: { sequence: "asc" },
      include: { topicProgress: { where: { userId: session.user.id } } },
    });
    const idx = all.findIndex((t) => t.id === topic.id);
    const priorCompleted =
      idx <= 0
        ? true
        : all
            .slice(0, idx)
            .every((t) => t.topicProgress.some((p) => p.quizCompleted));

    // Never expose correctAnswer / explanation client-side.
    const questions = (quiz?.questions ?? []).map((qn) => ({
      id: qn.id,
      text: qn.text,
      codeSnippet: null,
      options: qn.options,
      points: qn.points,
    }));

    return NextResponse.json({
      topic: {
        slug: topic.slug,
        title: topic.title,
        theory: topic.theory,
        summary: topic.summary,
        description: topic.description,
        xpReward: topic.xpReward,
        difficultyRating: topic.difficultyRating,
        progress: progress?.masteryPercent ?? 0,
        theoryRead: progress?.theoryRead ?? false,
        quizCompleted: progress?.quizCompleted ?? false,
        unlocked: !!priorCompleted,
      },
      quiz: quiz
        ? {
            id: quiz.id,
            title: quiz.title,
            passingScore: quiz.passingScore,
            questions,
          }
        : null,
    });
  } catch (e) {
    console.error("topic error", e);
    return NextResponse.json({ error: "Failed to load topic" }, { status: 500 });
  }
}
