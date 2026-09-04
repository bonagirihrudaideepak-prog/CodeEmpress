import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelForXp, levelTitle } from "@/lib/gamification";
import { Lock, CheckCircle2, Star, FlaskConical, ArrowLeft } from "lucide-react";
import * as subjectIcons from "../subject-icons";

export const dynamic = "force-dynamic";

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { subject: slug } = await params;

  const subject = await db.subject.findUnique({
    where: { slug },
    include: {
      topics: {
        where: { isPublished: true },
        orderBy: { sequence: "asc" },
        include: { topicProgress: { where: { userId: session.user.id } } },
      },
    },
  });
  if (!subject) notFound();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, streak: true },
  });
  const level = levelForXp(user?.xp ?? 0);
  const Icon = subjectIcons.byIcon(subject.icon);

  // Completion set for unlocking.
  const ordered = [...subject.topics].sort((a, b) => a.sequence - b.sequence);
  const isCompleted = (t: (typeof ordered)[number]) => t.topicProgress.some((p) => p.quizCompleted);

  return (
    <>
      <Link href="/library" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition">
        <ArrowLeft className="h-4 w-4" /> Arcane Library
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-300">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{subject.name}</h1>
          <p className="text-slate-400">{subject.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {ordered.map((t, i) => {
          const progress = t.topicProgress[0];
          const completed = isCompleted(t);
          const priorCompleted = ordered.slice(0, i).every(isCompleted);
          const locked = i !== 0 && !priorCompleted && !completed;
          const mastery = progress?.masteryPercent ?? 0;

          const card = (
            <div
              className={`p-5 rounded-2xl border transition ${
                locked
                  ? "border-slate-800 bg-slate-900/20 opacity-60"
                  : completed
                  ? "border-green-500/30 bg-slate-900/40 hover:border-green-500/50"
                  : "border-slate-800 bg-slate-900/40 hover:border-blue-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${i === 0 ? "text-blue-300 bg-blue-500/10" : "text-slate-500 bg-slate-800"}`}>
                    Topic {t.sequence}
                  </span>
                  {completed && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                    </span>
                  )}
                </div>
                {locked && <Lock className="h-4 w-4 text-slate-600 flex-shrink-0" />}
              </div>

              <h2 className="text-lg font-bold mt-2 flex items-center gap-2">
                {t.title}
                <span className="inline-flex items-center gap-1 text-xs text-yellow-300">
                  <Star className="h-3.5 w-3.5" />
                  {t.difficultyRating.toFixed(1)}
                </span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">{t.description}</p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-yellow-300">
                  <FlaskConical className="h-3.5 w-3.5" /> +{t.xpReward} XP
                </span>
                {!locked && (
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    {completed ? "Revisit" : "Start"}
                  </span>
                )}
              </div>

              <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${completed ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${mastery}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">{mastery}% mastery</div>
            </div>
          );

          return locked ? (
            card
          ) : (
            <Link key={t.id} href={`/library/${subject.slug}/${t.slug}`} className="block">
              {card}
            </Link>
          );
        })}
      </div>
    </>
  );
}
