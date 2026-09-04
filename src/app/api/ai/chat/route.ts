import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { chatStream } from "@/lib/ai/chat";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        skills: { include: { skill: true } },
        resumes: { where: { isActive: true }, take: 1 },
        roadmaps: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const { messages } = await req.json();
    const analysis = user.resumes[0]?.analysisRaw as any;

    const context = {
      userName: user.name || "Developer",
      currentRole: user.currentRole || undefined,
      targetRole: user.targetRole || undefined,
      skills: user.skills.map((s) => ({
        name: s.skill.name,
        level: s.level,
      })),
      weakAreas: analysis?.weaknesses || [],
      currentRoadmap: user.roadmaps[0]?.name,
      recentActivity: [], // TODO: fetch from progress
    };

    const stream = await chatStream(messages, context);

    // Persist the human + assistant messages (assistant is recorded by caller
    // via its own write; we store the user turn here).
    try {
      const last = messages[messages.length - 1];
      if (last && last.role === "user") {
        await db.chatMessage.create({
          data: { userId: user.id, role: "USER", content: last.content },
        });
      }
    } catch {
      // non-fatal
    }

    // Return a plain-text streaming response so the client can render
    // token-by-token without depending on a specific provider protocol.
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch {
          // ignore mid-stream errors
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
