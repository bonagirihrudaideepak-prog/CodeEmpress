import { generateObject } from "ai";
import { z } from "zod";
import { withProviderFallback, pickModel } from "./client";

const roadmapSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedDuration: z.string(),
  levels: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      topics: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          subtopics: z.array(z.string()),
          estimatedHours: z.number(),
          priority: z.enum(["must-know", "good-to-know", "optional"]),
          resources: z.array(
            z.object({
              title: z.string(),
              type: z.enum(["video", "article", "documentation", "course"]),
              url: z.string(),
            })
          ),
        })
      ),
    })
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      skills: z.array(z.string()),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    })
  ),
});

export type GeneratedRoadmap = z.infer<typeof roadmapSchema>;

interface RoadmapInput {
  targetRole: string;
  currentSkills: string[];
  experienceLevel: string;
  gaps: string[];
  timeCommitment?: string;
}

// Deterministic offline fallback so custom-roadmap generation works even with
// no AI key configured (mirrors the grade/structure the LLM path returns).
function heuristicRoadmap(input: RoadmapInput): GeneratedRoadmap {
  const role = input.targetRole || "Developer";
  const gaps = (input.gaps || []).filter(
    (g) => !(input.currentSkills || []).some((s) => s.toLowerCase() === g.toLowerCase())
  );
  const gapTopics: GeneratedRoadmap["levels"][number]["topics"] = [
    ...gaps.slice(0, 3).map((g, i) => ({
      title: g,
      description: `Build hands-on proficiency in ${g}, the key gap for this role.`,
      subtopics: [`Core ${g} fundamentals`, `Daily ${g} workflows`, `Common pitfalls in ${g}`],
      estimatedHours: 6 + i * 2,
      priority: "must-know" as const,
      resources: [
        { title: `${g} official docs`, type: "documentation" as const, url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(g)}` },
        { title: `Intro to ${g}`, type: "video" as const, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(g + " tutorial")}` },
      ],
    })),
  ];

  const genericTopics: GeneratedRoadmap["levels"][number]["topics"] = [
    {
      title: "Fundamentals & Tooling",
      description: "Set up your environment and master the daily drivers of the role.",
      subtopics: ["Git & version control", "Debugging techniques", "Terminal & editor fluency"],
      estimatedHours: 8,
      priority: "must-know",
      resources: [{ title: "Git book", type: "documentation", url: "https://git-scm.com/book/en/v2" }],
    },
    {
      title: "Problem Solving",
      description: "Sharpen the pattern-recognition skills tested in interviews.",
      subtopics: ["Data structures", "System design basics", "Algorithmic thinking"],
      estimatedHours: 10,
      priority: "good-to-know",
      resources: [{ title: "Algorithm tutorials", type: "video", url: "https://www.youtube.com/results?search_query=data+structures+tutorial" }],
    },
    {
      title: "Interview Readiness",
      description: "Turn knowledge into offers with real practice and polish.",
      subtopics: ["Behavioral stories", "Technical mock interviews", "Resume & portfolio optimization"],
      estimatedHours: 6,
      priority: "must-know",
      resources: [{ title: "Interview prep", type: "article", url: "https://www.freecodecamp.org/news/technical-interview-prep/" }],
    },
  ];

  const levels: GeneratedRoadmap["levels"] = [
    {
      name: "Foundation",
      description: "Establish the base skills every role needs.",
      topics: [...genericTopics.slice(0, 1), ...(gapTopics.length ? [gapTopics[0]] : [])],
    },
    {
      name: "Core Competency",
      description: "Build the in-demand skills for the target role.",
      topics: [...gapTopics.slice(1), ...genericTopics.slice(1, 2)],
    },
    {
      name: "Job Ready",
      description: "Polish your profile and prepare to interview.",
      topics: [genericTopics[2]],
    },
  ];

  return {
    title: `${role} Goal Roadmap`,
    description: `A personalized ${input.timeCommitment || "10-15 hours/week"} learning path from your current level to job-ready ${role}.`,
    estimatedDuration: `${Math.max(4, Math.round(24 / Math.max(2, Number(/\d+/.exec(input.timeCommitment || "12")?.[0] || 12))))} weeks`,
    levels,
    projects: [
      {
        title: `Capstone: Real ${role} Portfolio Piece`,
        description: "Ship a production-quality project that demonstrates the skills in this roadmap.",
        skills: gaps.length ? gaps.slice(0, 3) : ["Core skills"],
        difficulty: "intermediate",
      },
    ],
  };
}

export async function generateRoadmap(
  input: RoadmapInput
): Promise<GeneratedRoadmap> {
  if (!pickModel("smart")) {
    return heuristicRoadmap(input);
  }
  const { result } = await withProviderFallback("smart", (model) =>
    generateObject({
      model,
      schema: roadmapSchema,
      system: `You are a senior engineering manager and career mentor who has helped 
    hundreds of developers transition into new roles. You create highly specific, 
    practical learning roadmaps.

    Rules:
    1. Skip topics the user already knows (based on currentSkills)
    2. Focus heavily on gaps (based on missing skills)
    3. Include real, specific resource links (prefer free resources)
    4. Be realistic about time estimates
    5. Prioritize job-ready skills over academic knowledge
    6. Include portfolio projects that demonstrate the skills
    7. Structure from fundamentals to advanced progressively`,
      prompt: `Create a personalized learning roadmap with these parameters:

    Target Role: ${input.targetRole}
    Current Skills: ${input.currentSkills.join(", ")}
    Experience Level: ${input.experienceLevel}
    Skill Gaps: ${input.gaps.join(", ")}
    Time Commitment: ${input.timeCommitment || "10-15 hours per week"}

    Create a complete roadmap from their current level to job-ready.`,
    })
  );
  return result.object;
}
