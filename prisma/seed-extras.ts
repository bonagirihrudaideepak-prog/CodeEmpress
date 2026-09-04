import { PrismaClient } from "@prisma/client";
import { ensureBadgeRows } from "../src/lib/badges";

const db = new PrismaClient();

type RoadmapTopicSeed = { subject: string; title: string; desc?: string };
type LevelSeed = { name: string; topics: RoadmapTopicSeed[] };
type RoadmapSeed = {
  slug: string;
  title: string;
  icon: string;
  targetRole: string;
  description: string;
  levels: LevelSeed[];
};

// 6 prebuilt roadmaps, each referencing real Arcane Library topics by
// (subject, title) so progress is computed from actual topic mastery.
const ROADMAPS: RoadmapSeed[] = [
  {
    slug: "full-stack",
    title: "Full Stack Developer",
    icon: "stack",
    targetRole: "Full Stack Developer",
    description:
      "Front to back. Build, ship, and scale web apps — the classic end-to-end developer path.",
    levels: [
      { name: "Foundations", topics: [
        { subject: "HTML", title: "Semantic Elements" },
        { subject: "CSS", title: "Flexbox" },
        { subject: "JavaScript", title: "Functions & Scope" },
        { subject: "Git", title: "Commits" },
      ]},
      { name: "Frontend", topics: [
        { subject: "React", title: "Components & Props" },
        { subject: "React", title: "Hooks" },
        { subject: "React", title: "Routing" },
        { subject: "UI Design Concepts", title: "Design Systems" },
      ]},
      { name: "Backend", topics: [
        { subject: "Node.js", title: "Event Loop" },
        { subject: "Node.js", title: "HTTP Server" },
        { subject: "SQL", title: "SELECT Queries" },
        { subject: "REST & GraphQL", title: "HTTP Methods" },
      ]},
      { name: "Deployment", topics: [
        { subject: "Docker & CI/CD", title: "Images" },
        { subject: "Docker & CI/CD", title: "Networks" },
        { subject: "Docker & CI/CD", title: "CI Pipelines" },
        { subject: "Security", title: "Authentication" },
      ]},
    ],
  },
  {
    slug: "frontend",
    title: "Frontend Developer",
    icon: "frontend",
    targetRole: "Frontend Developer",
    description:
      "Craft beautiful, responsive interfaces and master the modern JS/React ecosystem.",
    levels: [
      { name: "Foundations", topics: [
        { subject: "HTML", title: "Semantic Elements" },
        { subject: "CSS", title: "Flexbox" },
        { subject: "CSS", title: "Grid Layout" },
        { subject: "JavaScript", title: "Functions & Scope" },
      ]},
      { name: "Modern JavaScript", topics: [
        { subject: "JavaScript", title: "Closures" },
        { subject: "JavaScript", title: "Promises & Async/Await" },
        { subject: "JavaScript", title: "ES Modules" },
        { subject: "JavaScript", title: "DOM Manipulation" },
      ]},
      { name: "Frameworks", topics: [
        { subject: "React", title: "Components & Props" },
        { subject: "React", title: "Hooks" },
        { subject: "React", title: "State Management" },
        { subject: "UI Design Concepts", title: "Design Systems" },
        { subject: "Accessibility", title: "Accessibility" },
      ]},
    ],
  },
  {
    slug: "backend",
    title: "Backend Developer",
    icon: "backend",
    targetRole: "Backend Developer",
    description:
      "APIs, databases, and systems that scale. The server-side engineer's path.",
    levels: [
      { name: "Foundations", topics: [
        { subject: "JavaScript", title: "Functions & Scope" },
        { subject: "Git", title: "Branches" },
        { subject: "SQL", title: "SELECT Queries" },
        { subject: "SQL", title: "JOINs" },
      ]},
      { name: "Core Backend", topics: [
        { subject: "Node.js", title: "Event Loop" },
        { subject: "Node.js", title: "HTTP Server" },
        { subject: "REST & GraphQL", title: "HTTP Methods" },
        { subject: "REST & GraphQL", title: "Authentication" },
      ]},
      { name: "Scale & Security", topics: [
        { subject: "System Design", title: "Load Balancing" },
        { subject: "System Design", title: "Caching" },
        { subject: "Docker & CI/CD", title: "Images" },
        { subject: "Security", title: "Encryption" },
      ]},
    ],
  },
  {
    slug: "data-science",
    title: "Data Scientist",
    icon: "data",
    targetRole: "Data Scientist",
    description:
      "From raw data to models. Python, stats, and machine learning foundations.",
    levels: [
      { name: "Foundations", topics: [
        { subject: "Python", title: "Data Types" },
        { subject: "Python", title: "Functions" },
        { subject: "NumPy", title: "Arrays" },
        { subject: "Pandas", title: "DataFrames" },
      ]},
      { name: "Data Work", topics: [
        { subject: "Pandas", title: "Filtering" },
        { subject: "Pandas", title: "GroupBy" },
        { subject: "Matplotlib", title: "Line & Scatter" },
        { subject: "SQL", title: "Aggregations" },
      ]},
      { name: "Machine Learning", topics: [
        { subject: "Machine Learning", title: "Supervised Learning" },
        { subject: "Machine Learning", title: "Unsupervised Learning" },
        { subject: "Scikit-learn", title: "Train/Test Split" },
        { subject: "Scikit-learn", title: "Classification" },
      ]},
    ],
  },
  {
    slug: "ai-engineer",
    title: "AI / LLM Engineer",
    icon: "ai",
    targetRole: "AI Engineer",
    description:
      "Build LLM-powered systems: prompting, RAG, agents, and inference at scale.",
    levels: [
      { name: "Foundations", topics: [
        { subject: "Python", title: "Functions" },
        { subject: "LLMs", title: "Tokens & Context" },
        { subject: "Generative AI", title: "Text Generation" },
        { subject: "Git", title: "Branches" },
      ]},
      { name: "RAG & Prompting", topics: [
        { subject: "RAG", title: "Embeddings" },
        { subject: "RAG", title: "Vector Search" },
        { subject: "RAG", title: "Retrieval" },
        { subject: "LLMs", title: "Prompt Design" },
      ]},
      { name: "Systems & Agents", topics: [
        { subject: "LLMs", title: "Inference" },
        { subject: "Agentic AI", title: "Agents" },
        { subject: "Agentic AI", title: "Tool Calling" },
        { subject: "System Design", title: "Caching" },
      ]},
    ],
  },
  {
    slug: "devops",
    title: "DevOps Engineer",
    icon: "devops",
    targetRole: "DevOps Engineer",
    description:
      "Containerization, CI/CD, and resilient systems — the reliability engineer.",
    levels: [
      { name: "Foundations", topics: [
        { subject: "Git", title: "Commits" },
        { subject: "Git", title: "Branches" },
        { subject: "Docker & CI/CD", title: "Images" },
        { subject: "SQL", title: "SELECT Queries" },
      ]},
      { name: "Containerize & Ship", topics: [
        { subject: "Docker & CI/CD", title: "Volumes" },
        { subject: "Docker & CI/CD", title: "Networks" },
        { subject: "Docker & CI/CD", title: "CI Pipelines" },
        { subject: "Security", title: "Authentication" },
      ]},
      { name: "Scale & Secure", topics: [
        { subject: "System Design", title: "Load Balancing" },
        { subject: "System Design", title: "Consistency" },
        { subject: "System Design", title: "Caching" },
        { subject: "Security", title: "Encryption" },
      ]},
    ],
  },
];

async function main() {
  console.log("Seeding badges + prebuilt roadmaps…");
  await ensureBadgeRows();
  console.log(`  badges: ${await db.badge.count()}`);

  // Build a lookup from "subject|title" -> topicId.
  const topics = await db.topic.findMany({
    select: { id: true, title: true, subject: { select: { name: true } } },
  });
  const lookup = new Map<string, string>();
  for (const t of topics) {
    if (t.subject) lookup.set(`${t.subject.name}|${t.title}`, t.id);
  }

  for (const r of ROADMAPS) {
    const roadmap = await db.roadmap.upsert({
      where: { slug: r.slug },
      update: { title: r.title, targetRole: r.targetRole, description: r.description, icon: r.icon, isPublished: true },
      create: {
        slug: r.slug,
        title: r.title,
        targetRole: r.targetRole,
        description: r.description,
        icon: r.icon,
        isPrebuilt: true,
        isPublished: true,
      },
    });

    // Remove old levels/topics for this roadmap (idempotent reseed).
    const oldLevels = await db.roadmapLevel.findMany({ where: { roadmapId: roadmap.id } });
    for (const lv of oldLevels) {
      await db.roadmapTopic.deleteMany({ where: { levelId: lv.id } });
    }
    await db.roadmapLevel.deleteMany({ where: { roadmapId: roadmap.id } });

    for (let li = 0; li < r.levels.length; li++) {
      const level = await db.roadmapLevel.create({
        data: { roadmapId: roadmap.id, name: r.levels[li].name, order: li },
      });
      for (let ti = 0; ti < r.levels[li].topics.length; ti++) {
        const seed = r.levels[li].topics[ti];
        await db.roadmapTopic.create({
          data: {
            levelId: level.id,
            title: seed.title,
            description: seed.desc ?? `${seed.title} — ${seed.subject}`,
            order: ti,
            topicId: lookup.get(`${seed.subject}|${seed.title}`) ?? null,
          },
        });
      }
    }
    console.log(`  roadmap ${r.slug} → ${r.levels.length} levels`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
