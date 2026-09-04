import { db } from "./db";

/**
 * Badge engine (PRD Module 7 §11.3). Auto-awards badges when a user meets a
 * milestone, and fires an achievement notification. Awards give a small XP bump.
 */

export type BadgeDef = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: "LEARNING" | "STREAK" | "ACHIEVEMENT" | "SPECIAL";
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  xpReward: number;
  requirement: string;
  test: (s: UserStats) => boolean;
};

export type UserStats = {
  topicsCompleted: number;
  quizzesPassed: number;
  perfectQuizzes: number;
  theoryRead: number;
  resumesUploaded: number;
  projects: number;
  xp: number;
  streak: number;
  longestStreak: number;
};

// Canonical set of computable badges (aligned with the PRD's categories).
export const BADGES: BadgeDef[] = [
  { slug: "first-step", name: "First Step", description: "Complete your first topic.", icon: "🌱", category: "LEARNING", rarity: "COMMON", xpReward: 10, requirement: "Complete 1 topic", test: (s) => s.topicsCompleted >= 1 },
  { slug: "learner", name: "Learner", description: "Pass 5 quizzes.", icon: "✨", category: "LEARNING", rarity: "COMMON", xpReward: 25, requirement: "Pass 5 quizzes", test: (s) => s.quizzesPassed >= 5 },
  { slug: "student", name: "Student", description: "Read 10 theory lessons.", icon: "📚", category: "LEARNING", rarity: "COMMON", xpReward: 15, requirement: "Read 10 topics", test: (s) => s.theoryRead >= 10 },
  { slug: "code-ninja", name: "Code Ninja", description: "Master 10 topics.", icon: "🚀", category: "ACHIEVEMENT", rarity: "RARE", xpReward: 50, requirement: "Complete 10 topics", test: (s) => s.topicsCompleted >= 10 },
  { slug: "scholar", name: "Scholar", description: "Master 25 topics.", icon: "🎓", category: "ACHIEVEMENT", rarity: "EPIC", xpReward: 100, requirement: "Complete 25 topics", test: (s) => s.topicsCompleted >= 25 },
  { slug: "growth", name: "Growth", description: "Reach a 5-day streak.", icon: "🌼", category: "STREAK", rarity: "COMMON", xpReward: 20, requirement: "5-day streak", test: (s) => s.longestStreak >= 5 },
  { slug: "on-fire", name: "On Fire", description: "Reach a 15-day streak.", icon: "🔥", category: "STREAK", rarity: "RARE", xpReward: 50, requirement: "15-day streak", test: (s) => s.longestStreak >= 15 },
  { slug: "perfectionist", name: "Perfectionist", description: "Score 100% on any quiz.", icon: "🎯", category: "ACHIEVEMENT", rarity: "EPIC", xpReward: 60, requirement: "Perfect quiz", test: (s) => s.perfectQuizzes >= 1 },
  { slug: "resume-ready", name: "Job Seeker", description: "Upload your first resume.", icon: "📄", category: "ACHIEVEMENT", rarity: "COMMON", xpReward: 15, requirement: "Upload a resume", test: (s) => s.resumesUploaded >= 1 },
  { slug: "elite", name: "Elite", description: "Earn 1,000 XP.", icon: "👑", category: "ACHIEVEMENT", rarity: "EPIC", xpReward: 100, requirement: "1,000 XP", test: (s) => s.xp >= 1000 },
  { slug: "legend", name: "Legend", description: "Earn 5,000 XP.", icon: "🎖️", category: "ACHIEVEMENT", rarity: "LEGENDARY", xpReward: 250, requirement: "5,000 XP", test: (s) => s.xp >= 5000 },
  { slug: "builder", name: "Builder", description: "Create your first project.", icon: "⚙️", category: "ACHIEVEMENT", rarity: "RARE", xpReward: 40, requirement: "1 project", test: (s) => s.projects >= 1 },
];

/** Compute a user's milestone stats. */
export async function userStats(userId: string): Promise<UserStats> {
  const [tp, attempts, user, resumes, projects] = await Promise.all([
    db.topicProgress.findMany({
      where: { userId },
      select: { quizCompleted: true, theoryRead: true },
    }),
    db.quizAttempt.findMany({
      where: { userId },
      select: { score: true, totalPoints: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { xp: true, streak: true, longestStreak: true },
    }),
    db.resume.count({ where: { userId } }),
    db.project.count({ where: { userId } }),
  ]);

  return {
    topicsCompleted: tp.filter((t) => t.quizCompleted).length,
    quizzesPassed: attempts.filter((a) => a.score >= a.totalPoints * 0.7).length,
    perfectQuizzes: attempts.filter((a) => a.score >= a.totalPoints && a.totalPoints > 0).length,
    theoryRead: tp.filter((t) => t.theoryRead).length,
    resumesUploaded: resumes,
    projects,
    xp: user?.xp ?? 0,
    streak: user?.streak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
  };
}

/**
 * Evaluate all badges and award any newly-earned ones. Returns the IDs earned
 * in this call (empty if none). Idempotent (unique user+badge). Also fires a
 * notification and grants the badge's XP reward.
 */
export async function evaluateAndAward(userId: string): Promise<string[]> {
  const [stats, earned] = await Promise.all([
    userStats(userId),
    db.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    ensureBadgeRows(),
  ]);

  const earnedSlugs = new Set(
    (await db.badge.findMany({ where: { id: { in: earned.map((e) => e.badgeId) } }, select: { slug: true } })).map((b) => b.slug)
  );

  const newly: string[] = [];
  for (const def of BADGES) {
    if (earnedSlugs.has(def.slug)) continue;
    if (def.test(stats)) {
      const row = await db.badge.findUnique({ where: { slug: def.slug } });
      if (!row) continue;
      await db.$transaction([
        db.userBadge.create({ data: { userId, badgeId: row.id } }),
        db.notification.create({
          data: {
            userId,
            title: `Badge earned: ${def.name}`,
            message: `${def.icon} ${def.description} (+${def.xpReward} XP)`,
            type: "ACHIEVEMENT",
            link: "/profile",
          },
        }),
      ]);
      if (def.xpReward > 0) {
        await db.user.update({
          where: { id: userId },
          data: { xp: { increment: def.xpReward } },
        });
      }
      newly.push(def.slug);
    }
  }
  return newly;
}

// Upsert the badge definitions so the DB always has rows to reference.
export async function ensureBadgeRows() {
  for (const def of BADGES) {
    await db.badge.upsert({
      where: { slug: def.slug },
      update: {
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category as any,
        rarity: def.rarity as any,
        xpReward: def.xpReward,
        requirement: def.requirement,
      },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category as any,
        rarity: def.rarity as any,
        xpReward: def.xpReward,
        requirement: def.requirement,
      },
    });
  }
}
