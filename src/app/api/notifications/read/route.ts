import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/notifications/read
//   body: {}            → mark ALL of the user's notifications read
//   body: { id }        → mark that single notification read
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let id: string | undefined;
  try {
    const body = await req.json();
    id = body?.id;
  } catch {
    // no body → mark all
  }

  if (id) {
    const existing = await db.notification.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ success: true, id });
  }

  await db.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
