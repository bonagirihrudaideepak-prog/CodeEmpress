import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/ui/app-shell";
import { StatCard, SectionHeading, Badge } from "@/components/ui/primitives";
import {
  Flame,
  Star,
  Target,
  Upload,
  Map,
  MessageSquare,
  Terminal,
  Cpu,
  Sparkles,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  FolderGit2,
  Bookmark,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const [user, roadmaps, totalCourses, roadmapCount] = await Promise.all([
    db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        targetRole: true,
        xp: true,
        level: true,
        streak: true,
        longestStreak: true,
        resumes: { select: { id: true, score: true } },
        enrollments: { select: { id: true, status: true } },
        _count: { select: { projects: true } },
        topicProgress: { select: { topicId: true, quizCompleted: true } },
        notifications: { orderBy: { createdAt: "desc" }, take: 5 },
        quizAttempts: {
          orderBy: { attemptedAt: "desc" },
          take: 5,
          select: { id: true, score: true, totalPoints: true, passed: true, attemptedAt: true, quiz: { select: { title: true, topic: { select: { slug: true } } } } },
        },
      },
    }),
    db.roadmap.findMany({
      where: { isPublished: true },
      include: { levels: { include: { topics: true } } },
    }),
    db.course.count({ where: { isPublished: true } }),
    db.roadmap.count({ where: { isPublished: true } }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const completedTopics = new Set(user.topicProgress.filter((t) => t.quizCompleted).map((t) => t.topicId));
  const roadmapsWithProgress = roadmaps.map((r) => {
    const all = r.levels.flatMap((l) => l.topics);
    const pct = all.length
      ? Math.round((all.filter((t) => t.topicId && completedTopics.has(t.topicId)).length / all.length) * 100)
      : 0;
    return { ...r, pct };
  });
  const matches = roadmapsWithProgress.filter((r) =>
    user.targetRole ? r.title.toLowerCase().includes(user.targetRole.toLowerCase().split(" ")[0]) : false
  );
  const starRoadmap = matches[0] || [...roadmapsWithProgress].sort((a, b) => b.pct - a.pct)[0];

  const aiSummary =
    user.topicProgress.filter((t) => t.quizCompleted).length > 0
      ? `Great momentum! You've completed ${user.topicProgress.filter((t) => t.quizCompleted).length} topic${user.topicProgress.filter((t) => t.quizCompleted).length === 1 ? "" : "s"} this session. ${user.targetRole ? `Keep pushing toward ${user.targetRole}.` : "Set a target role to get a personalized roadmap."}`
      : user.streak > 0
        ? `🔥 ${user.streak}-day streak — stay consistent and earn XP by reading topics and passing quizzes.`
        : "Welcome! Read your first topic and pass a quiz to start earning XP.";

  const completedCourses = user.enrollments.filter((e) => e.status === "COMPLETED").length;

  const quickStats = [
    { label: "Courses Completed", value: `${completedCourses}/${totalCourses}`, icon: GraduationCap, color: "text-green-400", href: "/courses" },
    { label: "Learning Roadmaps", value: roadmapCount, icon: Map, color: "text-purple-400", href: "/roadmaps" },
    { label: "Projects", value: user._count.projects, icon: FolderGit2, color: "text-cyan-400", href: "/forge" },
    { label: "Enrolled", value: user.enrollments.length, icon: Bookmark, color: "text-blue-400", href: "/courses" },
  ];

  const stats = [
    {
      icon: Flame,
      label: "Day Streak",
      value: user.streak,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: Star,
      label: "Total XP",
      value: user.xp,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      icon: Target,
      label: "Level",
      value: user.level,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: Upload,
      label: "Resumes Analyzed",
      value: user.resumes.length,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  const quickActions = [
    {
      icon: Upload,
      title: "Upload Resume",
      desc: "Get AI feedback on your resume",
      href: "/resume",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Map,
      title: "Generate Roadmap",
      desc: "Build a personalized learning path",
      href: "/roadmap",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: MessageSquare,
      title: "Talk to AI Mentor",
      desc: "Get career advice anytime",
      href: "/chat",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      icon: Star,
      title: "Arcane Library",
      desc: "Learn topics, earn XP, level up",
      href: "/library",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: Terminal,
      title: "Code Forge",
      desc: "Run JS & Python in the browser",
      href: "/forge",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Cpu,
      title: "AI Status",
      desc: "Check your provider chain",
      href: "/ai-status",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <AppShell user={user}>
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">
            Welcome back, {user.name?.split(" ")[0] || "Developer"} 👋
          </h1>
          <Badge tone="orange">🔥 {user.streak} day streak</Badge>
        </div>
        <p className="mt-2 text-slate-400">
          {user.targetRole
            ? `Targeting ${user.targetRole} — keep your momentum going.`
            : "Set your target role and let your AI mentor build a roadmap."}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </span>
            }
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      {/* AI summary + Star roadmap */}
      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <div className="card border-purple-500/20 bg-purple-500/5 p-6">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold">AI Mentor Summary</h3>
          </div>
          <p className="text-sm text-slate-300">{aiSummary}</p>
        </div>
        {starRoadmap && (
          <div className="card p-6">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <h3 className="font-semibold">Star Roadmap</h3>
              <span className="ml-auto text-xs text-slate-400">{starRoadmap.pct}%</span>
            </div>
            <p className="mb-3 text-lg font-bold">{starRoadmap.title}</p>
            <div className="progress mb-4">
              <div className="progress-fill" style={{ width: `${starRoadmap.pct}%` }} />
            </div>
            <a href={`/roadmaps/${starRoadmap.slug}`} className="btn btn-primary btn-sm">
              Continue Learning <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* quickStats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickStats.map((s) => (
          <Link key={s.label} href={s.href} className="card card-hover flex items-center justify-between p-5">
            <div>
              <div className="text-xs text-faint">{s.label}</div>
              <div className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
            <s.icon className={`h-7 w-7 text-faint ${s.color}`} />
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <SectionHeading
        title="Quick Actions"
        subtitle="Jump back into your dev OS"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <a
            key={action.title}
            href={action.href}
            className="card card-hover group block p-5"
          >
            <span
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${action.bg}`}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </span>
            <h3 className="mb-1 font-semibold group-hover:text-accent-soft transition">
              {action.title}
            </h3>
            <p className="text-sm text-slate-400">{action.desc}</p>
          </a>
        ))}
      </div>

      {/* Recent activity */}
      {(() => {
        const feed = [
          ...user.quizAttempts.map((a) => ({
            ts: a.attemptedAt,
            key: `q-${a.id}`,
            icon: a.passed ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4 text-orange-400" />,
            kind: "Quiz attempt",
            text: a.passed
              ? `Passed quiz: ${a.quiz.title} (${a.score}/${a.totalPoints})`
              : `Retry quiz: ${a.quiz.title} (${a.score}/${a.totalPoints})`,
            href: a.quiz.topic?.slug ? `/library/${a.quiz.topic.slug}` : undefined,
          })),
          ...user.notifications.map((n) => ({
            ts: n.createdAt,
            key: `n-${n.id}`,
            icon: <Bell className="h-4 w-4 text-accent-soft" />,
            kind: n.type.replace(/_/g, " ").toLowerCase(),
            text: n.message || n.title,
            href: n.link ?? undefined,
          })),
        ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts));

        if (feed.length === 0) return null;
        return (
          <>
            <SectionHeading title="Recent Activity" subtitle="Your latest achievements and notifications" className="mt-10" />
            <div className="card overflow-hidden">
              <ul className="divide-y divide-line">
                {feed.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2/70">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      {item.href ? (
                        <a href={item.href} className="group block">
                          <span className="block truncate text-sm text-slate-200 group-hover:text-accent-soft">{item.text}</span>
                        </a>
                      ) : (
                        <span className="block truncate text-sm text-slate-200">{item.text}</span>
                      )}
                      <span className="text-xs capitalize text-faint">{item.kind}</span>
                    </div>
                    <span className="text-xs text-faint">{new Date(item.ts).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        );
      })()}

      {/* Up next */}
      <div className="mt-10 rounded-2xl border border-dashed border-line-strong p-6 text-center text-slate-500">
        Explorers start here — dive into the Arcane Library to earn your first
        XP, or chat with your AI mentor for a personalized roadmap.
      </div>
    </AppShell>
  );
}
