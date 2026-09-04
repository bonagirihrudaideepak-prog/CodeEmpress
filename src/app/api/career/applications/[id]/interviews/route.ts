import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const app = await db.jobApplication.findFirst({ where: { id, userId: session.user.id } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const created = await db.interview.create({
    data: {
      applicationId: id,
      userId: session.user.id,
      type: body?.type || "technical",
      scheduledAt: body?.scheduledAt ? new Date(body.scheduledAt) : null,
      durationMin: body?.durationMin ? Number(body.durationMin) : null,
      score: body?.score ? Number(body.score) : null,
      feedback: body?.feedback || null,
      notes: body?.notes || null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
