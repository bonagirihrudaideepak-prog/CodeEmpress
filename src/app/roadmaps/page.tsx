import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/ui/app-shell";
import { Card, SectionHeading, Badge } from "@/components/ui/primitives";
import { Map, Star, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RoadmapsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, roadmaps, customRoadmaps] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, targetRole: true, topicProgress: { select: { topicId: true, quizCompleted: true } } },
    }),
    db.roadmap.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        levels: { include: { topics: true } },
      },
    }),
    db.userRoadmap.findMany({
      where: { userId, isAiGenerated: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, progress: true, data: true, createdAt: true },
    }),
  ]);

  const completed = new Set(
    (user?.topicProgress ?? []).filter((t) => t.quizCompleted).map((t) => t.topicId)
  );

  function progressOf(r: (typeof roadmaps)[number]): number {
    const all = r.levels.flatMap((l) => l.topics);
    if (all.length === 0) return 0;
    return Math.round((all.filter((t) => t.topicId && completed.has(t.topicId)).length / all.length) * 100);
  }

  // Star roadmap: best fit to the user's target role, else best progress.
  const matches = roadmaps.filter((r) =>
    user?.targetRole ? r.title.toLowerCase().includes(user.targetRole.toLowerCase().split(" ")[0]) : false
  );
  const starRoadmap = matches[0] || [...roadmaps].sort((a, b) => progressOf(b) - progressOf(a))[0];

  return (
    <AppShell user={user ? { name: user.name, targetRole: user.targetRole } : undefined}>
      <div className="mx-auto max-w-6xl">
        {starRoadmap && (
          <Card className="mb-8 border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/5 p-6">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-400" />
              <span className="font-semibold">Star Roadmap — tailored for you</span>
            </div>
            <div className="mb-1 text-lg font-bold">{starRoadmap.title}</div>
            <p className="mb-3 text-sm text-slate-300">{starRoadmap.description}</p>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="text-slate-400">{progressOf(starRoadmap)}%</span>
            </div>
            <div className="progress mb-4">
              <div className="progress-fill" style={{ width: `${progressOf(starRoadmap)}%` }} />
            </div>
            <Link href={`/roadmaps/${starRoadmap.slug}`} className="btn btn-primary">
              Continue Learning <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        )}

        <div className="mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
          <SectionHeading
            title="Roadmaps"
            subtitle={`${roadmaps.length} role roadmaps · ${Object.keys(grouped(roadmaps)).length} categories`}
          />
          <Link href="/roadmaps/new" className="btn btn-primary">
            <Sparkles className="h-4 w-4" /> Generate Custom Roadmap
          </Link>
        </div>

        {customRoadmaps.length > 0 && (
          <>
            <SectionHeading
              title="My Generated Roadmaps"
              subtitle="AI-crafted paths from your resume, skills, and target role"
              className="mt-4"
            />
            <div className="mb-8 grid gap-3 md:grid-cols-2">
              {customRoadmaps.map((c) => (
                <Card key={c.id} className="card-hover flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-400">
                      Generated {new Date(c.createdAt).toLocaleDateString()} · {c.progress}% complete
                    </div>
                  </div>
                  <Link href="/roadmaps/new" className="btn btn-ghost btn-sm ml-3">
                    View <ArrowRight className="h-4 w-4" />
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((r) => {
            const pct = progressOf(r);
            const total = r.levels.flatMap((l) => l.topics).length;
            const done = r.levels.flatMap((l) => l.topics).filter((t) => t.topicId && completed.has(t.topicId)).length;
            return (
              <Link key={r.id} href={`/roadmaps/${r.slug}`} className="card card-hover group block p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Map className="h-6 w-6 text-accent-soft" />
                  <Badge tone={pct === 100 ? "green" : pct > 0 ? "blue" : "orange"}>
                    {pct}% {pct === 0 ? "· not started" : ""}
                  </Badge>
                </div>
                <h2 className="mb-1 text-lg font-bold group-hover:text-accent-soft transition">{r.title}</h2>
                <p className="mb-3 line-clamp-2 text-sm text-slate-400">{r.description}</p>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-400" /> {done}/{total} topics
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                </div>
                <div className="progress mt-3">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>

        {roadmaps.length === 0 && (
          <Card className="p-8 text-center text-slate-400">No roadmaps published yet.</Card>
        )}
      </div>
    </AppShell>
  );
}

function grouped(r: any[]) {
  // Bucket roadmaps by the first word of their target role for the subtitle.
  const out: Record<string, number> = {};
  for (const it of r) {
    const key = it.targetRole.split(" ")[0] || "role";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}
