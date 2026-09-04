import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [applications, interviews] = await Promise.all([
    db.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { interviews: { orderBy: { createdAt: "desc" } } },
    }),
    db.interview.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Job readiness heuristic: presence of applications + interviews + a resume.
  const [resumeCount, xp] = await Promise.all([
    db.resume.count({ where: { userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { xp: true } }),
  ]);
  const offers = applications.filter((a) => a.status === "OFFER").length;
  const activeCount = applications.filter((a) => !["REJECTED", "WITHDRAWN"].includes(a.status)).length;
  const readiness = Math.min(
    100,
    Math.round((resumeCount > 0 ? 20 : 0) + Math.min(30, (xp?.xp ?? 0) / 100) + Math.min(30, applications.length * 3) + (offers > 0 ? 20 : 0))
  );

  return NextResponse.json({ applications, interviews, readiness });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.company || !body?.position) {
    return NextResponse.json({ error: "company and position are required" }, { status: 400 });
  }

  const created = await db.jobApplication.create({
    data: {
      userId: session.user.id,
      company: String(body.company),
      position: String(body.position),
      location: body.location || null,
      salaryRange: body.salaryRange || null,
      jobUrl: body.jobUrl || null,
      notes: body.notes || null,
      status: body.status || "APPLIED",
    },
  });

  await db.notification.create({
    data: {
      userId: session.user.id,
      title: "Application tracked",
      message: `You added ${body.position} at ${body.company} to your Career Hub.`,
      type: "SYSTEM",
      link: "/career",
    },
  });

  return NextResponse.json(created, { status: 201 });
}
