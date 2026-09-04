// Gamification engine (docs/PRODUCT_SPEC.md §Gamification + Levels).
import { db } from "./db";

// Level table from the spec — 8 tiers ending at Mythical (PRD §Gamification).
export const LEVELS = [
  { xp: 0, title: "Explorer" },
  { xp: 500, title: "Apprentice" },
  { xp: 1500, title: "Journeyman" },
  { xp: 3000, title: "Craftsman" },
  { xp: 5500, title: "Master" },
  { xp: 9000, title: "Architect" },
  { xp: 14000, title: "Legend" },
  { xp: 21000, title: "Mythical" },
] as const;

export function levelForXp(xp: number): number {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) idx = i;
  }
  return idx;
}

export function levelTitle(index: number): string {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))].title;
}

export function nextLevel(index: number) {
  if (index >= LEVELS.length - 1) return null;
  return LEVELS[index + 1];
}

// Mastery = theory (50%) + quiz passed (50%). Returns 0-100.
export function masteryPercent(theoryRead: boolean, quizCompleted: boolean): number {
  return (theoryRead ? 50 : 0) + (quizCompleted ? 50 : 0);
}

// Touch the daily streak. Call on meaningful activity (theory read / quiz).
// Returns the updated streak & longestStreak.
export async function touchStreak(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, streak: true, longestStreak: true, lastActiveAt: true },
  });
  if (!user) return { streak: 0, longest: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
  const lastDay = last ? new Date(last).setHours(0, 0, 0, 0) : null;

  let streak = user.streak;
  if (lastDay === today.getTime()) {
    // already active today — same streak
  } else if (lastDay === yesterday.getTime()) {
    streak += 1;
  } else {
    streak = 1; // reset
  }

  const longest = Math.max(user.longestStreak, streak);

  await db.user.update({
    where: { id: userId },
    data: { streak, longestStreak: longest, lastActiveAt: new Date() },
  });

  return { streak, longest };
}
