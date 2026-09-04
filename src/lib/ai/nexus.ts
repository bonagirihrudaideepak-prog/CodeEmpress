import { db } from "../db";
import type { ResumeAnalysis } from "./resume-analyzer";

/**
 * Nexus "Development Window" (PRD Module 5, Pillar 2).
 * Deterministic recommendations + improvement plan built from the resume
 * analysis — maps gap skills to internal Codempress courses and curated
 * external resources, and lays out short / medium / long-term next steps.
 */

type Rec = { type: "course" | "roadmap" | "project" | "video" | "article" | "book"; title: string; url: string; source: string };
type Nexus = {
  atsScore: number;
  masteryScore: number;
  gapScore: number;
  strengths: string[];
  weaknesses: { skill: string; status: "missing" | "weak"; priority: "high" | "medium" | "low" }[];
  recommendations: { internal: Rec[]; external: Rec[] };
  improvementPlan: { shortTerm: string[]; mediumTerm: string[]; longTerm: string[] };
};

const EXTERNAL_RESOURCES: Record<string, Rec> = {
  javascript: { type: "article", title: "MDN: JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", source: "MDN" },
  react: { type: "video", title: "React Official Docs", url: "https://legacy.reactjs.org/docs/getting-started.html", source: "React" },
  node: { type: "article", title: "Node.js Docs", url: "https://nodejs.org/en/docs", source: "Node.js" },
  python: { type: "article", title: "Real Python Tutorials", url: "https://realpython.com", source: "Real Python" },
  sql: { type: "article", title: "SQLBolt — Interactive SQL lessons", url: "https://sqlbolt.com", source: "SQLBolt" },
  docker: { type: "article", title: "Docker Get Started", url: "https://docs.docker.com/get-started/", source: "Docker" },
  kubernetes: { type: "article", title: "Kubernetes Tutorials", url: "https://kubernetes.io/docs/tutorials/", source: "Kubernetes" },
  aws: { type: "article", title: "AWS Skill Builder", url: "https://aws.amazon.com/training/", source: "AWS" },
  git: { type: "video", title: "Git — the simple guide", url: "https://rogerdudler.github.io/git-guide/", source: "Git Guide" },
  graphql: { type: "article", title: "HowToGraphQL", url: "https://www.howtographql.com", source: "HowToGraphQL" },
  system: { type: "book", title: "Designing Data-Intensive Applications", url: "https://dataintensive.net", source: "Martin Kleppmann" },
  typescript: { type: "article", title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/", source: "TypeScript" },
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function buildNexus(analysis: ResumeAnalysis): Promise<Nexus> {
  const missing = analysis.missingSkills ?? [];
  const weak = analysis.weaknesses ?? [];

  // Internal recommendations: find courses that cover a missing/weak skill.
  const internal: Rec[] = [];
  const keywords = [...missing, ...analysis.detectedSkills.slice(0, 4)];
  for (const skill of keywords) {
    const kw = skill.toLowerCase();
    const course = await db.course.findFirst({
      where: { isPublished: true, title: { contains: kw, mode: "insensitive" } },
      select: { slug: true, title: true },
    });
    if (course) {
      internal.push({
        type: "course",
        title: course.title,
        url: `/courses/${course.slug}`,
        source: "Codempress",
      });
    }
  }

  // External recommendations from curated resources.
  const external: Rec[] = [];
  for (const skill of missing) {
    const key = skill.toLowerCase();
    for (const [k, rec] of Object.entries(EXTERNAL_RESOURCES)) {
      if (key.includes(k) || k.includes(key)) {
        external.push(rec);
        break;
      }
    }
  }
  if (external.length === 0 && missing.length > 0) {
    external.push({
      type: "video",
      title: `Learn ${missing[0]} in 2026`,
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(missing[0] + " tutorial"),
      source: "YouTube",
    });
  }

  const masteryScore = Math.round(75 - Math.min(40, missing.length * 5) + (analysis.score ? (analysis.score - 70) / 3 : 0));
  const gapScore = Math.max(0, 100 - analysis.atsScore);

  return {
    atsScore: analysis.atsScore,
    masteryScore: Math.max(0, Math.min(100, masteryScore)),
    gapScore,
    strengths: analysis.strengths,
    weaknesses: [
      ...missing.slice(0, 6).map((skill, i) => ({ skill, status: "missing" as const, priority: (i < 2 ? "high" : "medium") as "high" | "medium" | "low" })),
      ...weak.slice(0, 3).map((w) => ({ skill: w.slice(0, 40), status: "weak" as const, priority: "low" as const })),
    ],
    recommendations: { internal: internal.slice(0, 6), external: external.slice(0, 6) },
    improvementPlan: {
      shortTerm: analysis.suggestions.slice(0, 3),
      mediumTerm: missing.slice(0, 3).map((m) => `Master ${m} — add ${m} to a small project for proof.`),
      longTerm: [
        "Ship 2–3 portfolio projects that demonstrate your target role.",
        "Practice mock interviews (use the AI Mentor) and track applications in the Career Hub.",
        "Refine your resume with quantified, outcome-driven bullets.",
      ],
    },
  };
}

export type { Nexus };
