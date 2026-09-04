import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { masteryPercent, touchStreak, levelForXp, levelTitle, nextLevel } from "@/lib/gamification";
import { evaluateAndAward } from "@/lib/badges";

const QUIZ_XP = 50;
const PERFECT_BONUS = 15;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { slug } = await params;
    const body = await req.json();
    const answers: number[] = body?.answers;

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const topic = await db.topic.findUnique({
      where: { slug },
      include: { quizzes: { include: { questions: { orderBy: { order: "asc" } } } } },
    });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    const quiz = topic.quizzes[0];
    if (!quiz) {
      return NextResponse.json({ error: "No quiz for this topic" }, { status: 404 });
    }

    const questions = quiz.questions;
    let correct = 0;
    const grading = questions.map((qn, i) => {
      const chosen = answers[i];
      const isCorrect = chosen === Number(qn.correctAnswer);
      if (isCorrect) correct++;
      return {
        questionId: qn.id,
        chosen,
        correctIndex: Number(qn.correctAnswer),
        isCorrect,
        explanation: qn.explanation,
      };
    });

    const total = questions.length;
    const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
    const passed = pct >= quiz.passingScore;
    const totalPoints = questions.reduce((a, q) => a + q.points, 0);
    const earnedPoints = questions.reduce(
      (a, q, i) => a + (answers[i] === Number(q.correctAnswer) ? q.points : 0),
      0
    );

    const existing = await db.topicProgress.findUnique({
      where: { userId_topicId: { userId: session.user.id, topicId: topic.id } },
    });

    const quizAttempts = (existing?.quizAttempts ?? 0) + 1;
    const quizCorrect = (existing?.quizCorrect ?? 0) + correct;

    // Award quiz XP only the first time it is passed (spec: 50 XP completion),
    // plus a perfect-score bonus (spec "perfect-quiz bonus").
    const firstPass = passed && !(existing?.quizCompleted ?? false);
    const perfectBonus = firstPass && correct === total ? PERFECT_BONUS : 0;
    const xpAwarded = firstPass ? QUIZ_XP + perfectBonus : 0;

    const progress = await db.topicProgress.upsert({
      where: { userId_topicId: { userId: session.user.id, topicId: topic.id } },
      update: {
        quizAttempts,
        quizCorrect,
        quizCompleted: passed || existing?.quizCompleted ? true : false,
        masteryPercent: masteryPercent(
          existing?.theoryRead ?? false,
          passed || existing?.quizCompleted ? true : false
        ),
        lastAccessed: new Date(),
      },
      create: {
        userId: session.user.id,
        topicId: topic.id,
        quizAttempts,
        quizCorrect,
        quizCompleted: passed,
        masteryPercent: masteryPercent(false, passed),
      },
    });

    // Persist the attempt record.
    await db.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
        score: pct,
        totalPoints,
        passed,
        answers: grading as any,
      },
    });

    let user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, streak: true },
    });
    if (xpAwarded > 0) {
      user = await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: xpAwarded } },
        select: { xp: true, streak: true },
      });
    }

    const streak = await touchStreak(session.user.id);
    const badgesEarned = await evaluateAndAward(session.user.id);
    const xp = user?.xp ?? 0;
    const level = levelForXp(xp);
    const nl = nextLevel(level);

    return NextResponse.json({
      success: true,
      correct,
      total,
      pct,
      passed,
      earnedPoints,
      xpAwarded,
      perfectBonus,
      mastery: progress.masteryPercent,
      grading,
      level,
      levelTitle: levelTitle(level),
      nextLevelAt: nl ? nl.xp : null,
      nextLevelTitle: nl ? nl.title : null,
      streak,
      badgesEarned,
    });
  } catch (e) {
    console.error("quiz error", e);
    return NextResponse.json({ error: "Failed to grade quiz" }, { status: 500 });
  }
}
