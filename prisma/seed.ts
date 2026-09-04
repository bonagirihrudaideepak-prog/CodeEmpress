import { PrismaClient } from "@prisma/client";
import { SUBJECTS } from "./curriculum";

const db = new PrismaClient();

async function main() {
  console.log("Seeding curriculum…");

  for (const subject of SUBJECTS) {
    const subj = await db.subject.upsert({
      where: { slug: subject.slug },
      update: {
        name: subject.name,
        description: subject.description,
        icon: subject.icon,
      },
      create: {
        slug: subject.slug,
        name: subject.name,
        description: subject.description,
        icon: subject.icon,
      },
    });

    for (const t of subject.topics) {
      const topic = await db.topic.upsert({
        where: { slug: t.slug },
        update: {
          subjectId: subj.id,
          title: t.title,
          description: t.description,
          summary: t.summary,
          theory: t.theory,
          difficulty: t.difficulty as any,
          difficultyRating: t.difficultyRating,
          xpReward: t.xpReward,
          sequence: t.sequence,
          contentStatus: "PUBLISHED" as any,
          isPublished: true,
        },
        create: {
          subjectId: subj.id,
          slug: t.slug,
          title: t.title,
          description: t.description,
          summary: t.summary,
          theory: t.theory,
          difficulty: t.difficulty as any,
          difficultyRating: t.difficultyRating,
          xpReward: t.xpReward,
          sequence: t.sequence,
          contentStatus: "PUBLISHED" as any,
          isPublished: true,
        },
      });

      // Quiz per topic (idempotent: recreate questions on re-seed).
      const quiz = await db.quiz.upsert({
        where: { id: `quiz-${topic.slug}` },
        update: {
          topicId: topic.id,
          title: `${topic.title} Quiz`,
        },
        create: {
          id: `quiz-${topic.slug}`,
          topicId: topic.id,
          title: `${topic.title} Quiz`,
        },
      });

      // Replace questions idempotently.
      await db.question.deleteMany({ where: { quizId: quiz.id } });
      await db.question.createMany({
        data: t.questions.map((qn, idx) => ({
          quizId: quiz.id,
          text: qn.text,
          options: qn.options,
          correctAnswer: String(qn.correctAnswer),
          explanation: qn.explanation,
          points: qn.skillPoints,
          order: idx,
        })),
      });
    }

    console.log(`  ✔ ${subject.name} (${subject.topics.length} topics)`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
