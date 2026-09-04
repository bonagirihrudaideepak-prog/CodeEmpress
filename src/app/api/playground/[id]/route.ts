import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { id } = await params;
    const { lang, name, code } = await req.json();

    const exists = await db.codeSnippet.findFirst({ where: { id, userId: user.id } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const snippet = await db.codeSnippet.update({
      where: { id },
      data: { lang, name, code },
      select: { id: true, lang: true, name: true, updatedAt: true },
    });
    return NextResponse.json({ snippet });
  } catch (e) {
    console.error("playground update error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { id } = await params;
    const exists = await db.codeSnippet.findFirst({ where: { id, userId: user.id } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.codeSnippet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("playground delete error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
