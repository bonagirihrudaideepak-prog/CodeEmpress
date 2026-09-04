import { generateObject } from "ai";
import { z } from "zod";
import { withProviderFallback, pickModel } from "./client";

const resumeAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experienceLevel: z.enum(["entry", "junior", "mid", "senior", "lead"]),
  detectedSkills: z.array(z.string()),
  targetRoles: z.array(z.string()),
  summary: z.string(),
});

export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;

const SLUG = /(^|\s)[a-z]+/gi;

/**
 * Deterministic, offline analysis used when no real OpenAI key is configured.
 * Produces a structurally-valid ResumeAnalysis from keywords in the resume so
 * the whole UI works without a paid key; the real AI path is used whenever
 * OPENAI_API_KEY is set.
 */
function heuristicAnalysis(resumeText: string): ResumeAnalysis {
  const text = resumeText.toLowerCase();
  const skills = [
    "javascript", "typescript", "react", "next.js", "node.js", "python",
    "java", "go", "c++", "sql", "postgresql", "mongodb", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "tailwind", "graphql", "rest", "html", "css",
    "redux", "vue", "angular", "linux", "ci/cd", "jest", "testing",
  ];
  const detected = skills.filter((s) => text.includes(s));

  const level = text.match(/senior|lead|principal|staff/)
    ? "senior"
    : text.match(/mid|intermediate|3\+|4\+|5\+ years?/)
    ? "mid"
    : text.match(/junior|0-|1-|2\+ years?|fresher|graduate|intern/)
    ? "junior"
    : "entry";

  const strengths: string[] = [];
  if (detected.length >= 5) strengths.push(`Strong breadth of skills (${detected.length} detected).`);
  if (text.includes("react")) strengths.push("Frontend experience with React.");
  if (text.includes("node") || text.includes("python")) strengths.push("Backend familiarity present.");
  if (text.includes("aws") || text.includes("docker") || text.includes("kubernetes")) strengths.push("Cloud / DevOps exposure.");
  if (strengths.length === 0) strengths.push("Has demonstrable technical experience");

  const weaknesses = [
    detected.length < 4
      ? "A limited set of technologies shown — broaden the skills section."
      : "Measurable outcomes and metrics are thin in the experience bullets.",
    /%|\d+videos|\d+ users|\d+\.\d+k/.test(text)
      ? "Some metrics exist — add more quantified impact."
      : "No clear quantified impact (metrics, % improvements) in achievements.",
  ];
  const suggestions = [
    "Quantify achievements with metrics (e.g. 'reduced load time 40%').",
    "Add a dedicated Skills section keyword-aligned to job descriptions.",
    detected.length < 6 ? "Expand tech stack to include in-demand tools (TypeScript, Docker, CI/CD)." : "Reinforce the strongest skills with project links.",
    "Tailor a summary line up top to your target role.",
  ];
  const missingSkills = ["docker", "kubernetes", "aws", "ci/cd"].filter((s) => !text.includes(s));
  const targetRoles = [
    detected.includes("react") ? "Frontend Developer" : "Frontend Developer",
    detected.includes("node") || detected.includes("python") ? "Full Stack Developer" : "Full Stack Developer",
    detected.includes("aws") || detected.includes("docker") ? "DevOps Engineer" : "Backend Developer",
  ];
  const summary = `This resume shows ${
    detected.length
  } relevant skills with a reasonable ${level}-level profile. The structure reads clearly, but impact and specificity can be strengthened.`;

  const score = Math.min(92, Math.max(30, 38 + detected.length * 3));
  const atsScore = Math.min(95, Math.max(30, 35 + detected.length * 4));

  return {
    score,
    atsScore,
    strengths,
    weaknesses,
    suggestions,
    missingSkills,
    experienceLevel: level as ResumeAnalysis["experienceLevel"],
    detectedSkills: detected,
    targetRoles,
    summary,
  };
}

function hasAnyProvider(): boolean {
  return pickModel("smart") != null;
}

const RESUME_SYSTEM = `You are an expert technical recruiter and career coach with 15+ years 
of experience reviewing developer resumes. You provide honest, constructive, 
and actionable feedback.

Analyze the resume thoroughly and provide:
- A fair overall score (0-100) based on content, formatting, and impact
- An ATS compatibility score (0-100) based on keyword optimization
- Specific strengths (what they're doing well)
- Specific weaknesses (what's holding them back)
- Actionable suggestions (concrete steps to improve)
- Missing skills (based on their target role and current market)
- Their likely experience level
- Skills you detected in the resume
- Roles they'd be a good fit for
- A brief summary of your assessment

Be specific and actionable. Don't give generic advice.`;

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  if (!hasAnyProvider()) {
    return heuristicAnalysis(resumeText);
  }
  try {
    const { result } = await withProviderFallback("smart", (model) =>
      generateObject({
        model,
        schema: resumeAnalysisSchema,
        system: RESUME_SYSTEM,
        prompt: `Analyze this developer resume:\n\n${resumeText}`,
      })
    );
    return result.object;
  } catch (e) {
    // All providers failed — fall back to the offline heuristic so the UI
    // always returns a usable analysis.
    console.warn("[ai] all providers failed in resume analysis; using heuristic", e);
    return heuristicAnalysis(resumeText);
  }
}
