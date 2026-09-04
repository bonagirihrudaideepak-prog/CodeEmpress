import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Map each curriculum subject (by slug) to one of the 7 PRD taxonomy areas so
// the 28 courses roll up into named, browsable categories.
const CATEGORY_BY_SLUG: Record<string, string> = {
  // 1. Frontend Development
  javascript: "Frontend Development",
  html: "Frontend Development",
  css: "Frontend Development",
  "ui-design": "Frontend Development",
  react: "Frontend Development",
  threejs: "Frontend Development",
  // 2. Backend & APIs
  nodejs: "Backend & APIs",
  sql: "Backend & APIs",
  api: "Backend & APIs",
  security: "Backend & APIs",
  // 3. Data Science & Analytics
  python: "Data Science & Analytics",
  pandas: "Data Science & Analytics",
  numpy: "Data Science & Analytics",
  matplotlib: "Data Science & Analytics",
  seaborn: "Data Science & Analytics",
  "scikit-learn": "Data Science & Analytics",
  ml: "Data Science & Analytics",
  "power-bi": "Data Science & Analytics",
  excel: "Data Science & Analytics",
  // 4. AI & LLMs
  llms: "AI & LLMs",
  rag: "AI & LLMs",
  "agentic-ai": "AI & LLMs",
  genai: "AI & LLMs",
  // 5. DevOps & Git
  devops: "DevOps & Git",
  git: "DevOps & Git",
  // 6. Mobile Development
  "react-native": "Mobile Development",
  flutter: "Mobile Development",
  // 7. Systems & Architecture
  "system-design": "Systems & Architecture",
};

const CATEGORY_COUNT = (() => Object.values(CATEGORY_BY_SLUG).reduce<Record<string, number>>((a, c) => ((a[c] = (a[c] ?? 0) + 1), a), {}))();

// Build one Course per subject (the 28 curriculum categories), grouping that
// subject's topics into Beginner / Intermediate / Advanced modules.
async function main() {
  console.log(`Seeding ${Object.keys(CATEGORY_BY_SLUG).length} courses across ${Object.keys(CATEGORY_COUNT).length} taxonomy areas…`);
  const subjects = await db.subject.findMany({
    where: { topics: { some: { isPublished: true } } },
    include: { topics: { where: { isPublished: true } } },
    orderBy: { order: "asc" },
  });

  // Map difficulty -> module title
  const moduleForDifficulty: Record<string, string> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
    EXPERT: "Advanced",
  };

  let created = 0;
  for (const s of subjects) {
    const category = CATEGORY_BY_SLUG[s.slug] ?? "Curriculum";
    const course = await db.course.upsert({
      where: { slug: `course-${s.slug}` },
      update: { title: `${s.name}`, isPublished: true, isFree: true, category, description: s.description ?? `Master ${s.name} with structured, gamified lessons.` },
      create: {
        slug: `course-${s.slug}`,
        title: s.name,
        description: s.description ?? `Master ${s.name} with structured, gamified lessons.`,
        category,
        level: "BEGINNER",
        isPublished: true,
        isFree: true,
        order: s.order,
      },
    });

    // Group topics by difficulty.
    const byDifficulty: Record<string, { id: string; title: string; order: number }[]> = {};
    for (const t of s.topics) {
      const key = t.difficulty || "BEGINNER";
      (byDifficulty[key] ??= []).push({ id: t.id, title: t.title, order: t.sequence });
    }

    // Remove old modules for this course (idempotent).
    const oldModules = await db.module.findMany({ where: { courseId: course.id } });
    for (const m of oldModules) {
      await db.topic.updateMany({ where: { moduleId: m.id }, data: { moduleId: null } });
      await db.module.delete({ where: { id: m.id } });
    }

    let mOrder = 0;
    for (const [diff, topics] of Object.entries(byDifficulty)) {
      const module = await db.module.create({
        data: { courseId: course.id, title: moduleForDifficulty[diff], order: mOrder++ },
      });
      for (const t of topics) {
        await db.topic.update({ where: { id: t.id }, data: { moduleId: module.id } });
      }
    }
    created++;
  }

  console.log(`  courses: ${await db.course.count()} (created/updated ${created})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
