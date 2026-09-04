import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULTS = {
  achievements: true,
  careerUpdates: true,
  streakReminders: true,
  aiInsights: true,
};

// GET /api/notifications/preferences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { notificationPrefs: true } });
    return NextResponse.json({ prefs: { ...DEFAULTS, ...((user?.notificationPrefs as object) || {}) } });
  } catch (e) {
    console.error("prefs get error:", e);
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

// PATCH /api/notifications/preferences  { achievements?, careerUpdates?, streakReminders?, aiInsights? }
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    const current: Record<string, boolean> = { ...DEFAULTS, ...((user?.notificationPrefs as object) || {}) };
    const allowed = ["achievements", "careerUpdates", "streakReminders", "aiInsights"];
    for (const k of allowed) {
      if (k in body) current[k] = Boolean(body[k]);
    }
    await db.user.update({
      where: { id: session.user.id },
      data: { notificationPrefs: current as any },
    });
    return NextResponse.json({ success: true, prefs: current });
  } catch (e) {
    console.error("prefs patch error:", e);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
