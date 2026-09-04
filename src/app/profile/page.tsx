import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelForXp, levelTitle, nextLevel } from "@/lib/gamification";
import { AppShell } from "@/components/ui/app-shell";
import { Card, StatCard, SectionHeading, Badge } from "@/components/ui/primitives";
import { ShareBadges } from "@/components/profile/share-badges";
import {
  Flame,
  Sparkles,
  Star,
  Trophy,
  FileText,
  Briefcase,
  ChevronRight,
  Target,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      targetRole: true,
      currentRole: true,
      experienceYears: true,
      xp: true,
      level: true,
      streak: true,
      longestStreak: true,
      resumes: { select: { score: true, atsScore: true }, orderBy: { createdAt: "desc" } },
      topicProgress: { select: { masteryPercent: true, topic: { select: { subject: { select: { name: true } } } } } },
      badges: {
        select: { id: true, earnedAt: true, badge: true },
        orderBy: { earnedAt: "desc" },
      },
      projects: { select: { id: true } },
    },
  });

  if (!user) redirect("/login");

  // ── Two numbers: Resume Evidence vs Code Impress Mastery ──
  const resumeEvidence = user.resumes.reduce(
    (m, r) => Math.max(m, r.score ?? 0, r.atsScore ?? 0),
    0
  );
  const progressed = user.topicProgress.filter((t) => t.masteryPercent > 0);
  const codeImpress = progressed.length
    ? Math.round(progressed.reduce((a, t) => a + t.masteryPercent, 0) / progressed.length)
    : 0;
  const gap = Math.max(0, codeImpress - resumeEvidence);
  const needsUpdate = resumeEvidence > 0 && gap > 10;

  // ── Skill bars (per subject) ──
  const bySubject = new Map<string, number[]>();
  for (const t of progressed) {
    const name = t.topic.subject?.name;
    if (!name) continue;
    bySubject.set(name, [...(bySubject.get(name) ?? []), t.masteryPercent]);
  }
  const skillBars = [...bySubject.entries()]
    .map(([name, vals]) => ({ name, pct: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  const level = levelForXp(user.xp);
  const nl = nextLevel(level);
  const xpInLevel = level > 0 ? user.xp - levelThreshold(level) : user.xp;
  const xpToNext = nl ? Math.max(0, nl.xp - user.xp) : 0;

  // ── AI insight (heuristic, offline) ──
  const jobReadiness = Math.round(
    codeImpress * 0.6 + resumeEvidence * 0.3 + (user.streak > 0 ? 10 : 0)
  );
  const nextAction = !resumeEvidence
    ? "Upload your resume to get a personalized assessment."
    : codeImpress < 40
      ? "Keep leveling up in the Arcane Library — you're building your evidence."
      : "Great foundation. Focus on projects and interview prep next.";

  const stats = [
    { icon: <Flame className="h-5 w-5 text-orange-400" />, label: "Day Streak", value: user.streak },
    { icon: <Sparkles className="h-5 w-5 text-yellow-400" />, label: "Total XP", value: user.xp },
    { icon: <Star className="h-5 w-5 text-purple-400" />, label: "Level", value: `${levelTitle(level)} (${level + 1})` },
    { icon: <Trophy className="h-5 w-5 text-blue-400" />, label: "Badges", value: user.badges.length },
    { icon: <FileText className="h-5 w-5 text-green-400" />, label: "Resumes", value: user.resumes.length },
    { icon: <Briefcase className="h-5 w-5 text-cyan-400" />, label: "Projects", value: user.projects.length },
  ];

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-5xl">
        {/* Identity */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-2xl font-bold text-accent-soft">
            {(user.name || "U")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.name || "Developer"}</h1>
            <p className="text-slate-400">
              {user.currentRole || "Developer"}
              {user.targetRole ? ` → targeting ${user.targetRole}` : ""}
              {user.experienceYears ? ` · ${user.experienceYears}y exp` : ""}
            </p>
          </div>
        </div>

        {/* Two numbers */}
        <SectionHeading
          title="The Two Numbers"
          subtitle="Resume Evidence vs what your learning actually proves"
        />
        <Card className={`mb-8 p-6 ${needsUpdate ? "border-amber-500/30" : ""}`}>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="stat-label mb-1">📄 Resume Evidence</div>
              <div className="text-3xl font-bold">{resumeEvidence || "—"}/100</div>
              {resumeEvidence > 0 && (
                <p className="text-xs text-slate-500">Best ATS / analysis score</p>
              )}
            </div>
            <div>
              <div className="stat-label mb-1">🏆 Code Impress Mastery</div>
              <div className="text-3xl font-bold">{codeImpress}/100</div>
              <p className="text-xs text-slate-500">Avg mastery across {progressed.length} topics</p>
            </div>
            <div>
              <div className="stat-label mb-1">⚠️ Gap</div>
              <div className="text-3xl font-bold text-amber-400">{gap} pts</div>
              <p className="text-xs text-slate-500">
                {needsUpdate ? "Your resume is behind your skills — update it!" : "Handily aligned."}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>

        {/* AI Insights */}
        <Card className="mb-8 border-purple-500/20 bg-purple-500/5 p-6">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold">AI Insights</h3>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="purple">🎯 Job readiness {jobReadiness}%</Badge>
            {user.targetRole && <Badge tone="blue">Target: {user.targetRole}</Badge>}
          </div>
          <p className="mt-3 text-slate-300">{nextAction}</p>
        </Card>

        {/* Level progress */}
        <Card className="mb-8 p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>
              {levelTitle(level)}
              {nl ? ` → ${nl.title}` : " · Max level"}
            </span>
            <span className="text-slate-400">
              {nl ? `${user.xp} / ${nl.xp} XP` : `${user.xp} XP`}
            </span>
          </div>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${nl ? Math.min(100, (user.xp / nl.xp) * 100) : 100}%` }}
            />
          </div>
        </Card>

        {/* Skill bars */}
        {skillBars.length > 0 && (
          <>
            <SectionHeading title="Skill Bars" subtitle="Your mastery by area" />
            <div className="mb-8 space-y-3">
              {skillBars.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="text-slate-400">{s.pct}%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Badge collection */}
        <div className="flex items-end justify-between gap-3">
          <SectionHeading title="Badge Collection" subtitle={`${user.badges.length} earned`} />
          {user.badges.length > 0 && (
            <ShareBadges
              user={user.name || "Developer"}
              levelTitle={levelTitle(level)}
              levelNumber={level + 1}
              xp={user.xp}
              badges={user.badges.map((ub) => ({ icon: ub.badge.icon, name: ub.badge.name }))}
            />
          )}
        </div>
        {user.badges.length === 0 ? (
          <Card className="mb-8 p-8 text-center text-slate-400">
            No badges yet — complete topics and quizzes to start earning achievements.
            <div className="mt-4">
              <Link href="/library" className="btn btn-primary">Explore the Arcane Library</Link>
            </div>
          </Card>
        ) : (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {user.badges.map((ub) => (
              <div key={ub.id} className="card card-hover p-4 text-center">
                <div className="text-3xl">{ub.badge.icon}</div>
                <div className="mt-2 text-sm font-semibold">{ub.badge.name}</div>
                <div className="text-xs text-slate-400">{ub.badge.description}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {new Date(ub.earnedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-wrap items-center justify-center gap-3 pb-6">
          <Link href="/resume" className="btn btn-primary">
            Update Resume <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/career" className="btn btn-ghost">
            <Target className="h-4 w-4" /> Career Hub
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

// Matches the levels table in gamification.ts.
function levelThreshold(index: number): number {
  const t = [0, 500, 1500, 3500, 7000, 12000];
  return t[Math.min(index, t.length - 1)];
}
