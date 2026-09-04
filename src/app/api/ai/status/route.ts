import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIStatus, freeTierReport, pickModel } from "@/lib/ai/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = getAIStatus();
  const active = providers.filter((p) => p.enabled);
  const hasLLM = pickModel("fast") != null;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    freeTier: freeTierReport(),
    providers,
    activeProviderCount: active.length,
    activeProviderIds: active.map((p) => p.label),
    canRunAI: hasLLM,
    note: hasLLM
      ? "An AI provider is configured and the chat/resume/roadmap features will use live inference with automatic fallback."
      : "No AI provider is configured with a real key. Chat and resume analysis will use offline/heuristic responses until you add a key.",
  });
}
