import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/ui/app-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { InlineTopic } from "@/components/topic/inline-topic";
import { ArrowLeft, Lock, Map } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RoadmapDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [roadmap, userProgress] = await Promise.all([
    db.roadmap.findUnique({
      where: { slug },
      include: {
        levels: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
              include: { topic: { select: { slug: true, title: true, subject: { select: { slug: true, name: true } } } } },
            },
          },
        },
      },
    }),
    db.topicProgress.findMany({
      where: { userId, quizCompleted: true },
      select: { topicId: true },
    }),
  ]);

  if (!roadmap) notFound();

  const completed = new Set(userProgress.map((t) => t.topicId));
  const allTopics = roadmap.levels.flatMap((l) => l.topics);
  const total = allTopics.length;
  const done = allTopics.filter((t) => t.topicId && completed.has(t.topicId)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <Link href="/roadmaps" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All Roadmaps
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Map className="h-7 w-7 text-accent-soft" />
            <h1 className="text-3xl font-bold">{roadmap.title}</h1>
          </div>
          <p className="mt-2 text-slate-400">{roadmap.description}</p>
        </div>

        <Card className="mb-8 p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>
              {done}/{total} topics · {pct}%
            </span>
            <Badge tone={pct === 100 ? "green" : "blue"}>{pct}% complete</Badge>
          </div>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </Card>

        {roadmap.levels.map((level, i) => {
          const levelTopics = level.topics;
          const levelDone = levelTopics.filter((t) => t.topicId && completed.has(t.topicId)).length;
          const unlocked = i === 0 || (roadmap.levels[i - 1]?.topics.every((t) => !t.topicId || completed.has(t.topicId)) ?? true);
          return (
            <Card key={level.id} className="mb-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-surface-2/50 px-5 py-3">
                <h2 className="font-semibold">
                  Phase {i + 1}: {level.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{levelDone}/{levelTopics.length} topics</span>
                  {unlocked ? (
                    <Badge tone={levelDone === levelTopics.length ? "green" : "blue"}>
                      {levelDone === levelTopics.length ? "Done" : "In progress"}
                    </Badge>
                  ) : (
                    <Badge tone="orange"><Lock className="h-3 w-3" /> Locked</Badge>
                  )}
                </div>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                {levelTopics.map((t) => {
                  const isDone = !!t.topicId && completed.has(t.topicId);
                  return t.topic?.slug ? (
                    <InlineTopic
                      key={t.id}
                      topicSlug={t.topic.slug}
                      title={t.title}
                      subjectName={t.topic.subject?.name ?? t.description}
                      initialDone={isDone}
                      disabled={!unlocked}
                    />
                  ) : null;
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
