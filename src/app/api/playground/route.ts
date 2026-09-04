import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const snippets = await db.codeSnippet.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, lang: true, name: true, code: true, updatedAt: true },
    });
    return NextResponse.json({ snippets });
  } catch (e) {
    console.error("playground list error:", e);
    return NextResponse.json({ error: "Failed to load snippets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { lang, name, code } = await req.json();
    if (!["javascript","typescript","python","sql","html"].includes(lang)) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }
    if (!name || !name.trim() || !code || code.trim().length < 5) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    const snippet = await db.codeSnippet.create({
      data: { userId: user.id, lang, name: name.trim(), code },
      select: { id: true, lang: true, name: true, updatedAt: true },
    });
    return NextResponse.json({ snippet });
  } catch (e) {
    console.error("playground create error:", e);
    return NextResponse.json({ error: "Failed to save snippet" }, { status: 500 });
  }
}
