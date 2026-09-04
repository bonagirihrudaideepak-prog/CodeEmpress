import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/ui/app-shell";
import { Card, SectionHeading, Badge } from "@/components/ui/primitives";
import { GraduationCap, ArrowRight, CheckCircle2, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  modules: { topics: { id: string }[] }[];
};

export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [courses, progressRows] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: { modules: { include: { topics: true } } },
    }),
    db.topicProgress.findMany({ where: { userId, quizCompleted: true }, select: { topicId: true } }),
  ]);

  const completed = new Set(progressRows.map((t) => t.topicId));

  const grouped = courses.reduce<Record<string, CourseRow[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  const categoryOrder = Object.keys(grouped);

  function CourseCard({ c }: { c: CourseRow }) {
    const all = c.modules.flatMap((m) => m.topics);
    const done = all.filter((t) => completed.has(t.id)).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    return (
      <Link key={c.id} href={`/courses/${c.slug}`} className="card card-hover group block p-5">
        <div className="mb-3 flex items-center justify-between">
          <GraduationCap className="h-6 w-6 text-accent-soft" />
          <Badge tone={pct === 100 ? "green" : pct > 0 ? "blue" : "orange"}>
            {pct}%{pct === 0 ? " · new" : ""}
          </Badge>
        </div>
        <h2 className="mb-1 text-lg font-bold group-hover:text-accent-soft transition">{c.title}</h2>
        <p className="mb-3 line-clamp-2 text-sm text-slate-400">{c.description}</p>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> {done}/{all.length} lessons
          </span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
        </div>
        <div className="progress mt-3">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </Link>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Courses"
          subtitle={`${courses.length} structured courses across ${categoryOrder.length} taxonomy areas`}
        />

        {categoryOrder.map((cat) => (
          <div key={cat} className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent-soft" />
              <h2 className="text-xl font-bold">{cat}</h2>
              <Badge tone="blue" className="ml-1">{grouped[cat].length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {grouped[cat].map((c) => (
                <CourseCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <Card className="p-8 text-center text-slate-400">No courses published yet.</Card>
        )}
      </div>
    </AppShell>
  );
}
