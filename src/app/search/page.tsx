import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/ui/app-shell";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { Search, BookOpen, Map, GraduationCap, Briefcase, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const term = q.trim();

  if (!term) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Search" subtitle="Search topics, courses, and roadmaps." />
          <Card className="p-10 text-center text-slate-400">
            Type a keyword to search the whole platform.
          </Card>
        </div>
      </AppShell>
    );
  }

  // Relevance scorer: exact title match > title contains > body/summary match.
  const rel = (label: string, text: string) => {
    const l = label.toLowerCase(), t = text.toLowerCase(), q = term.toLowerCase();
    if (l === q) return 100;
    if (l.startsWith(q) || l.includes(q)) return 80;
    if (t.includes(q)) return 50;
    return 20;
  };

  const [topics, courses, roadmaps, ownApps, ownResumes] = await Promise.all([
    db.topic.findMany({
      where: { isPublished: true, OR: [
        { title: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
        { subject: { name: { contains: term, mode: "insensitive" } } },
      ]},
      take: 24,
      select: { slug: true, title: true, summary: true, subject: { select: { slug: true, name: true } } },
    }),
    db.course.findMany({
      where: { isPublished: true, OR: [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ]},
      take: 16,
      select: { slug: true, title: true, description: true },
    }),
    db.roadmap.findMany({
      where: { isPublished: true, OR: [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { targetRole: { contains: term, mode: "insensitive" } },
      ]},
      take: 16,
      select: { slug: true, title: true, description: true, targetRole: true },
    }),
    db.jobApplication.findMany({
      where: { userId: session.user.id, OR: [{ company: { contains: term, mode: "insensitive" } }, { position: { contains: term, mode: "insensitive" } }] },
      take: 10,
      select: { id: true, company: true, position: true, status: true },
    }),
    db.resume.findMany({
      where: { userId: session.user.id, fileName: { contains: term, mode: "insensitive" } },
      take: 6,
      select: { id: true, fileName: true, score: true },
    }),
  ]);

  // Sort each group by relevance, then slice.
  const sortedTopics = [...topics].sort((a, b) => rel(b.title, b.summary ?? "") - rel(a.title, a.summary ?? "")).slice(0, 12);
  const sortedCourses = [...courses].sort((a, b) => rel(b.title, b.description ?? "") - rel(a.title, a.description ?? "")).slice(0, 8);
  const sortedRoadmaps = [...roadmaps].sort((a, b) => rel(b.title, b.description ?? "") - rel(a.title, a.description ?? "")).slice(0, 8);

  const total = sortedTopics.length + sortedCourses.length + sortedRoadmaps.length + ownApps.length + ownResumes.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <SectionHeading title="Search" subtitle={`${total} result${total === 1 ? "" : "s"} for "${term}"`} />
        {total === 0 && <Card className="p-10 text-center text-slate-400">No results for "{term}".</Card>}

        {ownApps.length > 0 && (
          <>
            <SectionHeading title="Your Applications" className="mt-8" />
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {ownApps.map((a) => (
                <Link key={a.id} href="/career" className="card card-hover flex items-center gap-3 p-4">
                  <Briefcase className="h-5 w-5 flex-shrink-0 text-accent-soft" />
                  <div className="min-w-0">
                    <div className="font-medium">{a.position} · {a.company}</div>
                    <div className="truncate text-xs capitalize text-slate-400">{a.status.replace("_", " ").toLowerCase()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {ownResumes.length > 0 && (
          <>
            <SectionHeading title="Your Resumes" className="mt-8" />
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {ownResumes.map((r) => (
                <Link key={r.id} href="/resume" className="card card-hover flex items-center gap-3 p-4">
                  <FileText className="h-5 w-5 flex-shrink-0 text-accent-soft" />
                  <div className="min-w-0">
                    <div className="font-medium">{r.fileName}</div>
                    <div className="truncate text-xs text-slate-400">ATS {r.score}/100</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {sortedCourses.length > 0 && (
          <>
            <SectionHeading title="Courses" className="mt-8" />
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {sortedCourses.map((c) => (
                <Link key={c.slug} href={`/courses/${c.slug}`} className="card card-hover flex items-center gap-3 p-4">
                  <GraduationCap className="h-5 w-5 flex-shrink-0 text-accent-soft" />
                  <div className="min-w-0">
                    <div className="font-medium">{c.title}</div>
                    <div className="truncate text-xs text-slate-400">{c.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {sortedRoadmaps.length > 0 && (
          <>
            <SectionHeading title="Roadmaps" className="mt-8" />
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {sortedRoadmaps.map((r) => (
                <Link key={r.slug} href={`/roadmaps/${r.slug}`} className="card card-hover flex items-center gap-3 p-4">
                  <Map className="h-5 w-5 flex-shrink-0 text-accent-soft" />
                  <div className="min-w-0">
                    <div className="font-medium">{r.title}</div>
                    <div className="truncate text-xs text-slate-400">{r.targetRole}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {sortedTopics.length > 0 && (
          <>
            <SectionHeading title="Topics" className="mt-8" />
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {sortedTopics.map((t) => (
                <Link
                  key={t.slug}
                  href={t.subject ? `/library/${t.subject.slug}/${t.slug}` : `/library/${t.slug}`}
                  className="card card-hover flex items-center gap-3 p-4"
                >
                  <BookOpen className="h-5 w-5 flex-shrink-0 text-accent-soft" />
                  <div className="min-w-0">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-slate-400">{t.subject?.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
