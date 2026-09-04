import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateRoadmap } from "@/lib/ai/roadmap-generator";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        skills: { include: { skill: true } },
        resumes: { where: { isActive: true }, take: 1 },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activeResume = user.resumes[0];
    const analysis = activeResume?.analysisRaw as any;

    const input = {
      targetRole: user.targetRole || "Full Stack Developer",
      currentSkills: user.skills.map((s) => s.skill.name),
      experienceLevel: analysis?.experienceLevel || "junior",
      gaps: analysis?.missingSkills || [],
      timeCommitment: "10-15 hours per week",
    };

    const roadmap = await generateRoadmap(input);

    // Save custom roadmap
    const savedRoadmap = await db.userRoadmap.create({
      data: {
        userId: user.id,
        name: roadmap.title,
        isAiGenerated: true,
        data: roadmap as any,
      },
    });

    return NextResponse.json({
      success: true,
      roadmapId: savedRoadmap.id,
      roadmap,
    });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
