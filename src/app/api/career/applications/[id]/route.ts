import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const app = await db.jobApplication.findFirst({ where: { id, userId: session.user.id } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.jobApplication.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      notes: body.notes ?? undefined,
      location: body.location ?? undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await db.jobApplication.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
