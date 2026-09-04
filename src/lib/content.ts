import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { load as loadYaml } from "js-yaml";

export const CONTENT_DIR = join(process.cwd(), "content", "topics");

// Mirror of scripts/lib/topic-spec.mjs sections (kept separate because the
// scripts run in plain Node ESM while this runs in the Next server).
export const REQUIRED_SECTIONS = [
  "Metadata",
  "Learning Objectives",
  "Prerequisites",
  "Estimated Duration",
  "ELI5 Explanation",
  "Beginner Explanation",
  "Intermediate Explanation",
  "Advanced Explanation",
  "Real-world Use Cases",
  "Worked Examples",
  "Hands-on Exercises",
  "Mini Project",
  "Common Mistakes",
  "Best Practices",
  "Cheat Sheet",
  "Quiz",
  "Interview Questions",
  "Further Reading",
  "AI Tutor Prompt",
  "Mastery Checklist",
];

export const REQUIRED_FILES = [
  "metadata.yaml",
  "lesson.md",
  "examples/",
  "exercises/",
  "project.md",
  "quiz.json",
  "interview.md",
  "ai-prompts.md",
  "assets/",
  "changelog.md",
];

export const VALID_DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
export const VALID_STATUS = [
  "DRAFT",
  "AI_REVIEW",
  "TECH_REVIEW",
  "EDITORIAL_REVIEW",
  "QA",
  "PUBLISHED",
  "ARCHIVED",
];

export interface TopicMeta {
  id: string;
  title: string;
  domain?: string;
  category?: string;
  module?: string;
  difficulty?: string;
  estimated_time?: string | number;
  tags?: string[];
  prerequisites?: string[];
  career_paths?: string[];
  last_reviewed?: string;
  version?: string;
}

export interface TopicChecklist {
  sections: { name: string; present: boolean }[];
  files: { name: string; present: boolean; isDir: boolean }[];
  quizQuestionCount: number;
  missingSections: string[];
  missingFiles: string[];
  valid: boolean;
}

interface TopicRecord {
  slug: string;
  meta: TopicMeta;
  checklist: TopicChecklist;
  lesson?: string;
  quiz?: unknown;
}

export function listTopicSlugs(): string[] {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR)
    .filter((s) => s !== ".gitkeep" && statSync(join(CONTENT_DIR, s)).isDirectory());
}

function parseMeta(slug: string): TopicMeta {
  const p = join(CONTENT_DIR, slug, "metadata.yaml");
  if (!existsSync(p)) return { id: slug, title: slug };
  try {
    return (loadYaml(readFileSync(p, "utf8")) || {}) as TopicMeta;
  } catch {
    return { id: slug, title: slug };
  }
}

function buildChecklist(slug: string): TopicChecklist {
  const dir = join(CONTENT_DIR, slug);

  const sections = REQUIRED_SECTIONS.map((name) => {
    const p = join(dir, "lesson.md");
    let present = false;
    if (existsSync(p)) {
      const md = readFileSync(p, "utf8");
      const headings = new Set(
        md
          .split("\n")
          .filter((l) => /^#{1,4}\s+/.test(l))
          .map((l) => l.replace(/^#{1,4}\s+/, "").trim().toLowerCase())
      );
      present = headings.has(name.toLowerCase());
    }
    return { name, present };
  });

  const files = REQUIRED_FILES.map((f) => {
    const isDir = f.endsWith("/");
    const target = isDir ? join(dir, f.replace(/\/$/, "")) : join(dir, f);
    const present = isDir
      ? existsSync(target) && statSync(target).isDirectory()
      : existsSync(target);
    return { name: f, present, isDir };
  });

  let quizQuestionCount = 0;
  const quizPath = join(dir, "quiz.json");
  if (existsSync(quizPath)) {
    try {
      const q = JSON.parse(readFileSync(quizPath, "utf8"));
      if (Array.isArray(q.questions)) quizQuestionCount = q.questions.length;
    } catch {
      /* invalid JSON -> count stays 0 */
    }
  }

  const missingSections = sections.filter((s) => !s.present).map((s) => s.name);
  const missingFiles = files.filter((f) => !f.present).map((f) => f.name);

  return {
    sections,
    files,
    quizQuestionCount,
    missingSections,
    missingFiles,
    valid: missingSections.length === 0 && missingFiles.length === 0,
  };
}

export function listTopics(): TopicRecord[] {
  return listTopicSlugs().map((slug) => {
    const meta = parseMeta(slug);
    return { slug, meta, checklist: buildChecklist(slug) };
  });
}

export function getTopic(slug: string): TopicRecord | null {
  if (!existsSync(join(CONTENT_DIR, slug))) return null;
  const meta = parseMeta(slug);
  const checklist = buildChecklist(slug);
  const lessonPath = join(CONTENT_DIR, slug, "lesson.md");
  const lesson = existsSync(lessonPath) ? readFileSync(lessonPath, "utf8") : undefined;
  const quizPath = join(CONTENT_DIR, slug, "quiz.json");
  const quiz = existsSync(quizPath) ? JSON.parse(readFileSync(quizPath, "utf8")) : undefined;
  return { slug, meta, checklist, lesson, quiz };
}

export function statusColor(status?: string): string {
  switch (status) {
    case "PUBLISHED":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    case "QA":
    case "EDITORIAL_REVIEW":
    case "TECH_REVIEW":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "AI_REVIEW":
      return "text-amber-300 bg-amber-500/10 border-amber-500/20";
    case "ARCHIVED":
      return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    default:
      return "text-blue-300 bg-blue-500/10 border-blue-500/20";
  }
}

export type { TopicRecord };
