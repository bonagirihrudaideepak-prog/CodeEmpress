import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/ui/app-shell";
import { Card, Badge } from "@/components/ui/primitives";
import { ArrowLeft, GraduationCap, CheckCircle2, Play } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [course, progressRows] = await Promise.all([
    db.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { topics: { orderBy: { order: "asc" }, select: { id: true, slug: true, title: true, difficulty: true, subject: { select: { slug: true } } } } },
        },
      },
    }),
    db.topicProgress.findMany({ where: { userId, quizCompleted: true }, select: { topicId: true } }),
  ]);

  if (!course) notFound();
  const completed = new Set(progressRows.map((t) => t.topicId));

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <Link href="/courses" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All Courses
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-accent-soft" />
            <h1 className="text-3xl font-bold">{course.title}</h1>
          </div>
          <p className="mt-2 text-slate-400">{course.description}</p>
          <Badge tone="blue" className="mt-3">Free · gamified · {course.modules.length} levels</Badge>
        </div>

        {course.modules.map((mod, i) => (
          <Card key={mod.id} className="mb-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-surface-2/50 px-5 py-3">
              <h2 className="font-semibold">Level {i + 1}: {mod.title}</h2>
              <span className="text-xs text-slate-400">
                {mod.topics.filter((t) => completed.has(t.id)).length}/{mod.topics.length} complete
              </span>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {mod.topics.map((t) => {
                const isDone = completed.has(t.id);
                return (
                  <Link
                    key={t.id}
                    href={t.subject?.slug ? `/library/${t.subject.slug}/${t.slug}` : `/library/${t.slug}`}
                    className="card card-hover flex items-center gap-3 p-3"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
                    ) : (
                      <Play className="h-5 w-5 flex-shrink-0 text-slate-500" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs capitalize text-slate-400">{t.difficulty.toLowerCase()}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
