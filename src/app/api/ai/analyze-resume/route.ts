import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { buildNexus } from "@/lib/ai/nexus";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { resumeText, fileUrl, fileName } = await req.json();

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Resume text is too short to analyze" },
        { status: 400 }
      );
    }

    // Analyze with AI
    const analysis = await analyzeResume(resumeText);
    const nexus = await buildNexus(analysis);

    // Save to database
    const resume = await db.resume.create({
      data: {
        userId: user.id,
        fileName: fileName || "resume.pdf",
        fileUrl: fileUrl || "",
        rawText: resumeText,
        score: analysis.score,
        atsScore: analysis.atsScore,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        missingSkills: analysis.missingSkills,
        analysisRaw: analysis as any,
      },
    });

    // Deactivate previous resumes
    await db.resume.updateMany({
      where: { userId: user.id, id: { not: resume.id } },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      analysis,
      nexus,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
