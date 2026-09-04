import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelForXp, levelTitle } from "@/lib/gamification";
import { StatCard } from "@/components/ui/primitives";
import { Flame, Sparkles, Trophy, ArrowRight, Bookmark } from "lucide-react";
import * as subjectIcons from "./subject-icons";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [subjects, user] = await Promise.all([
    db.subject.findMany({
      orderBy: { order: "asc" },
      include: {
        topics: {
          where: { isPublished: true },
          include: { topicProgress: { where: { userId: session.user.id } } },
        },
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, streak: true, longestStreak: true },
    }),
  ]);

  const level = levelForXp(user?.xp ?? 0);
  const totalTopics = subjects.reduce((a, s) => a + s.topics.length, 0);
  const totalCompleted = subjects.reduce(
    (a, s) => a + s.topics.filter((t) => t.topicProgress.some((p) => p.quizCompleted)).length,
    0
  );
  const mastery = totalTopics === 0 ? 0 : Math.round((totalCompleted / totalTopics) * 100);

  return (
    <>
      {/* Gamification header */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-1">The Arcane Library</h1>
        <p className="text-slate-400 mb-6">
          Conquer topics to earn XP, keep your streak, and climb from Explorer to Legend.
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Flame className="h-5 w-5 text-orange-400" />} label="Day Streak" value={String(user?.streak ?? 0)} />
          <StatCard icon={<Sparkles className="h-5 w-5 text-yellow-400" />} label="Total XP" value={String(user?.xp ?? 0)} />
          <StatCard icon={<Trophy className="h-5 w-5 text-purple-400" />} label="Level" value={`${levelTitle(level)} (${level})`} />
          <StatCard icon={<Bookmark className="h-5 w-5 text-blue-400" />} label="Mastery" value={`${mastery}%`} />
        </div>
      </section>

      {/* Subjects grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((s) => {
          const Icon = subjectIcons.byIcon(s.icon);
          const done = s.topics.filter((t) => t.topicProgress.some((p) => p.quizCompleted)).length;
          const pct = s.topics.length === 0 ? 0 : Math.round((done / s.topics.length) * 100);
          return (
            <Link
              key={s.id}
              href={`/library/${s.slug}`}
              className="group block p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-blue-500/40 hover:bg-slate-900/70 transition"
            >
              <div className="mb-4 w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-300">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold group-hover:text-blue-300 transition mb-1">
                {s.name}
              </h2>
              <p className="text-sm text-slate-400 line-clamp-2 mb-3">{s.description}</p>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>{done}/{s.topics.length} topics</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </div>
              <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}


