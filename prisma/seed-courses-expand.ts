import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type CourseDef = {
  slug: string;
  title: string;
  category: string;
  order: number;
  courses: {
    title: string;
    slug: string;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    sequence: number;
    summary: string;
    theory: string;
    quiz: { text: string; options: string[]; correct: number; points: number; explanation: string }[];
  }[];
};

// 10 additional courses spanning all 7 taxonomy areas (28 → 38).
const NEW_COURSES: CourseDef[] = [
  {
    slug: "course-nextjs", title: "Next.js & App Router", category: "Frontend Development", order: 7,
    courses: [
      { title: "App Router & Routing", slug: "nextjs-app-router", difficulty: "BEGINNER", sequence: 1,
        summary: "Next.js App Router uses a file-system convention where folders and files define routes.",
        theory: "## App Router & Routing\n\nThe **App Router** (Next.js 13+) uses a `app/` directory where the folder structure maps to URL paths. A `page.tsx` file exports a React component that renders the route. Layouts (via `layout.tsx`) wrap child pages and persist navigation state.\n\nServer Components are the default, reducing client JS. Nested layouts and loading/error boundaries are file-based.",
        quiz: [
          { text: "Which file defines a page's UI in the App Router?", options: ["layout.tsx", "page.tsx", "route.ts", "app.tsx"], correct: 1, points: 10, explanation: "page.tsx is the file convention that renders the route UI." },
          { text: "The App Router prioritizes which component type by default?", options: ["Client Components", "Server Components", "Web Components", "Class Components"], correct: 1, points: 10, explanation: "Server Components are the default in the App Router." },
        ] },
      { title: "Server Components & Data Fetching", slug: "nextjs-data-fetching", difficulty: "INTERMEDIATE", sequence: 2,
        summary: "Server Components fetch data directly and stream it to the client without extra hydration.",
        theory: "## Server Components & Data Fetching\n\nServer Components `async function` can `await` database or API calls directly in the component. Next.js forms `loading.tsx` and `error.tsx` boundaries around them.\n\n`fetch` requests are cached by default and can be revalidated. Dynamic APIs such as `cookies()` and `searchParams` opt a route into dynamic rendering.",
        quiz: [
          { text: "Server Components can directly do what?", options: ["Run in the browser only", "Await async data fetches in the component", "Only render static HTML", "Access localStorage"], correct: 1, points: 10, explanation: "Server Components are async and can await data directly." },
          { text: "Which API forces a route to be dynamic?", options: ["revalidate", "cookies()", "static export", "metadata"], correct: 1, points: 10, explanation: "Calling cookies() opts a route into dynamic rendering." },
        ] },
    ],
  },
  {
    slug: "course-typescript", title: "TypeScript in Depth", category: "Frontend Development", order: 8,
    courses: [
      { title: "Types, Interfaces & Aliases", slug: "typescript-interfaces", difficulty: "BEGINNER", sequence: 1,
        summary: "Interfaces and type aliases define the shape of data for compile-time safety.",
        theory: "## Types & Interfaces\n\n`interface` and `type` both describe object shapes. Use `interface` for objects you may extend; use a `type` alias for unions, tuples, or primitives.\n\n```ts\ninterface User { id: number; name: string }\ntype ID = string | number;\n```\n\nType checking catches data-shape mistakes at compile time and improves autocomplete.",
        quiz: [
          { text: "Which is best for a union of primitives (string | number)?", options: ["interface", "type alias", "class", "enum"], correct: 1, points: 10, explanation: "type aliases express unions; interfaces describe extendable object shapes." },
          { text: "Compile-time type checking primarily prevents…", options: ["runtime crashes", "wrong data shapes reaching consumers", "slow builds", "bundle size"], correct: 1, points: 10, explanation: "Types catch mismatched data shapes before runtime." },
        ] },
      { title: "Generics & Utility Types", slug: "typescript-generics", difficulty: "ADVANCED", sequence: 2,
        summary: "Generics let functions and components work over many types while keeping full type safety.",
        theory: "## Generics & Utility Types\n\nA generic `<T>` lets a function return the same type it receives:\n\n```ts\nfunction first<T>(arr: T[]): T | undefined { return arr[0]; }\n```\n\nBuilt-in utilities (`Partial`, `Pick`, `Omit`, `Record`) transform types. `Pick<User, 'id' | 'name'>` creates a type with only those fields.",
        quiz: [
          { text: "Generic <T> is a placeholder that is filled with…", options: ["a fixed type", "the calling type at the call site", "string only", "any always"], correct: 1, points: 10, explanation: "The call site supplies the concrete type for T." },
          { text: "Which utility picks a subset of fields?", options: ["Partial", "Pick", "Omit", "Record"], correct: 1, points: 10, explanation: "Pick<T, K> returns only the listed keys of T." },
        ] },
    ],
  },
  {
    slug: "course-webperf", title: "Web Performance", category: "Frontend Development", order: 9,
    courses: [
      { title: "Core Web Vitals", slug: "webperf-vitals", difficulty: "INTERMEDIATE", sequence: 1,
        summary: "LCP, INP, and CLS are the user-centered Core Web Vitals that drive ranking and UX.",
        theory: "## Core Web Vitals\n\nGoogle's user-centered metrics:\n- **LCP** — when main content loads (ideally < 2.5s).\n- **INP** — responsiveness to input (ideally < 200ms).\n- **CLS** — visual stability (ideally < 0.1).\n\nFix LCP by preloading the hero image and using a CDN; reduce main-thread work for INP; reserve space for images to avoid CLS.",
        quiz: [
          { text: "Which metric measures visual stability?", options: ["LCP", "INP", "CLS", "TTFB"], correct: 2, points: 10, explanation: "CLS (Cumulative Layout Shift) measures layout stability." },
          { text: "Good LCP is ideally under…", options: ["2.5s", "5s", "10s", "0.1s"], correct: 0, points: 10, explanation: "LCP under 2.5s is considered good." },
        ] },
    ],
  },
  {
    slug: "course-express", title: "Express REST APIs", category: "Backend & APIs", order: 10,
    courses: [
      { title: "Routing & Middleware", slug: "express-middleware", difficulty: "BEGINNER", sequence: 1,
        summary: "Express routes handle URLs; middleware functions run before handlers to process requests.",
        theory: "## Routing & Middleware\n\nExpress is a minimal Node.js web framework. `app.get('/users', handler)` defines a route. **Middleware** (`app.use(fn)`) runs in order and calls `next()` to pass control.\n\n```js\napp.use(express.json());\napp.get('/users', (req, res) => res.json([]));\n```\n\nMiddleware is the backbone for logging, auth, CORS, body parsing, and error handling.",
        quiz: [
          { text: "What must middleware call to continue to the next handler?", options: ["return()", "next()", "done()", "pass()"], correct: 1, points: 10, explanation: "Middleware calls next() to forward the request." },
          { text: "express.json() is middleware that parses…", options: ["query strings", "JSON request bodies", "cookies", "headers only"], correct: 1, points: 10, explanation: "express.json() parses incoming JSON bodies." },
        ] },
      { title: "Error Handling & Validation", slug: "express-errors", difficulty: "INTERMEDIATE", sequence: 2,
        summary: "Centralized error middleware and request validation keep APIs safe and predictable.",
        theory: "## Error Handling & Validation\n\nA 4-argument error handler `(err, req, res, next)` catches errors passed to `next(err)`. Keep it at the end of the middleware chain.\n\nValidate inputs (e.g. with Zod) before touching data, returning 400 for invalid input.",
        quiz: [
          { text: "Express error handlers are defined with how many parameters?", options: ["2", "3", "4", "1"], correct: 2, points: 10, explanation: "Error handlers take (err, req, res, next)." },
          { text: "What status is returned for invalid input?", options: ["200", "400", "500", "404"], correct: 1, points: 10, explanation: "Client-side validation failures return 400 Bad Request." },
        ] },
    ],
  },
  {
    slug: "course-api-security", title: "API Security & Auth", category: "Backend & APIs", order: 11,
    courses: [
      { title: "JWT & Sessions", slug: "security-jwt", difficulty: "INTERMEDIATE", sequence: 1,
        summary: "JSON Web Tokens are stateless signed credentials; sessions store state server-side.",
        theory: "## JWT & Sessions\n\nJWT = `header.payload.signature`. It's signed (HS256/RS256) so it can't be tampered with. Tokens are sent via `Authorization: Bearer <token>`.\n\nSessions keep state in a server store referencing a cookie ID. JWTs are stateless (scalable) but can't be revoked easily — use short expiry + refresh tokens.",
        quiz: [
          { text: "A JWT can be tampered with unless…", options: ["it's short", "it's signed", "it's base64", "it's in a cookie"], correct: 1, points: 10, explanation: "The signature prevents tampering." },
          { text: "JWTs are best described as…", options: ["server-side stateful", "stateless signed credentials", "encrypted passwords", "only for HTTPS"], correct: 1, points: 10, explanation: "JWTs are stateless, self-contained signed credentials." },
        ] },
      { title: "OAuth 2.0 & Rate Limiting", slug: "security-oauth", difficulty: "ADVANCED", sequence: 2,
        summary: "OAuth 2.0 delegates authorization; rate limiting protects APIs from abuse.",
        theory: "## OAuth 2.0 & Rate Limiting\n\nOAuth 2.0 lets a user grant third-party access via **Authorization Code flow** (with PKCE for SPAs) without sharing a password. The client exchanges a code for tokens.\n\n**Rate limiting** caps requests per client (RPM/RPD) to prevent abuse and brute-force. Use token buckets or sliding windows.",
        quiz: [
          { text: "Which OAuth flow is recommended for single-page apps?", options: ["Implicit", "Password grant", "Authorization Code + PKCE", "Client credentials"], correct: 2, points: 10, explanation: "SPAs use Authorization Code flow with PKCE." },
          { text: "Rate limiting primarily prevents…", options: ["slow queries", "abuse/brute-force", "data loss", "SQL injection"], correct: 1, points: 10, explanation: "Rate limiting throttles abusive request volume." },
        ] },
    ],
  },
  {
    slug: "course-sql-analysis", title: "SQL for Data Analysis", category: "Data Science & Analytics", order: 12,
    courses: [
      { title: "Joins & Aggregation", slug: "sql-analysis-joins", difficulty: "INTERMEDIATE", sequence: 1,
        summary: "Joins combine tables; aggregate functions with GROUP BY summarize data.",
        theory: "## Joins & Aggregation\n\n`INNER JOIN` keeps only matching rows; `LEFT JOIN` keeps all left rows. Aggregate functions `SUM`, `COUNT`, `AVG`, `MAX`, `MIN` combine with `GROUP BY`.\n\n```sql\nSELECT department, COUNT(*) AS employees, AVG(salary) AS avg_salary\nFROM employees GROUP BY department;\n```\n\n`HAVING` filters groups.",
        quiz: [
          { text: "Which clause filters groups after aggregation?", options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], correct: 1, points: 10, explanation: "HAVING filters aggregated results." },
          { text: "A LEFT JOIN keeps…", options: ["only matches", "all left-table rows", "only right rows", "only null rows"], correct: 1, points: 10, explanation: "LEFT JOIN preserves all rows from the left table." },
        ] },
      { title: "Window Functions", slug: "sql-analysis-window", difficulty: "ADVANCED", sequence: 2,
        summary: "Window functions compute over a window of rows without collapsing them.",
        theory: "## Window Functions\n\nWindow functions use `OVER (PARTITION BY ... ORDER BY ...)` to compute over a *window* while keeping each row:\n\n```sql\nSELECT name, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk\nFROM employees;\n```\n\nCommon: `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`/`LEAD`.",
        quiz: [
          { text: "Which keyword defines the window for an OVER() function?", options: ["GROUP BY", "PARTITION BY", "HAVING", "LIMIT"], correct: 1, points: 10, explanation: "OVER(PARTITION BY ...) defines the window group." },
          { text: "Window functions differ from GROUP BY because they…", options: ["remove rows", "keep each row while computing", "only count", "only sort"], correct: 1, points: 10, explanation: "Window functions do not collapse rows." },
        ] },
    ],
  },
  {
    slug: "course-linux", title: "Linux & Shell", category: "DevOps & Git", order: 13,
    courses: [
      { title: "Bash Essentials", slug: "linux-bash", difficulty: "BEGINNER", sequence: 1,
        summary: "The Bash shell drives navigation, file ops, and automation on Linux servers.",
        theory: "## Bash Essentials\n\nUseful commands: `ls`, `cd`, `pwd`, `cp`, `mv`, `rm`, `mkdir`, `grep`, `find`, `cat`.\n\nPipes chain commands: `ps aux | grep node | wc -l`. Variables: `NAME=value`; read with `$NAME`.",
        quiz: [
          { text: "Which command searches file contents for a pattern?", options: ["find", "grep", "ls", "cat"], correct: 1, points: 10, explanation: "grep searches text using patterns." },
          { text: "The pipe | does what?", options: ["sorts output", "feeds one command's output into another", "deletes a file", "counts lines"], correct: 1, points: 10, explanation: "A pipe passes stdout to the next command." },
        ] },
      { title: "Permissions & Processes", slug: "linux-processes", difficulty: "INTERMEDIATE", sequence: 2,
        summary: "File permissions and process management are core to secure Linux administration.",
        theory: "## Permissions & Processes\n\nPermissions are `rwx` for owner/group/others (`chmod 755`). `chown` changes ownership.\n\nProcesses: `ps`, `top`, `kill <pid>`, `kill -9`. `systemctl` manages services.",
        quiz: [
          { text: "chmod 755 grants the owner…", options: ["read only", "read+write+execute", "no access", "write only"], correct: 1, points: 10, explanation: "7 = rwx for the owner." },
          { text: "Which command forcibly kills a process?", options: ["kill -9", "stop", "end", "systemctl stop service"], correct: 0, points: 10, explanation: "kill -9 sends SIGKILL." },
        ] },
    ],
  },
  {
    slug: "course-kubernetes", title: "Kubernetes", category: "DevOps & Git", order: 14,
    courses: [
      { title: "Pods, Deployments & Services", slug: "k8s-pods", difficulty: "INTERMEDIATE", sequence: 1,
        summary: "Deployments manage pods; Services expose them with a stable network endpoint.",
        theory: "## Pods, Deployments & Services\n\nA **Pod** is the smallest unit (one+ containers). A **Deployment** declares desired replicas and handles rollout. A **Service** provides a stable ClusterIP and load-balances across pods.",
        quiz: [
          { text: "The smallest deployable K8s unit is a…", options: ["Node", "Pod", "Service", "Namespace"], correct: 1, points: 10, explanation: "A Pod wraps one or more containers." },
          { text: "Which resource gives pods a stable network endpoint?", options: ["Deployment", "Service", "ConfigMap", "StatefulSet"], correct: 1, points: 10, explanation: "A Service exposes pods with a stable virtual IP." },
        ] },
      { title: "Ingress & Scaling", slug: "k8s-scaling", difficulty: "ADVANCED", sequence: 2,
        summary: "Ingress routes external traffic; HPA autoscales pods on CPU or custom metrics.",
        theory: "## Ingress & Scaling\n\n**Ingress** exposes HTTP(S) routes to services. **Horizontal Pod Autoscaler (HPA)** watches metrics and adjusts replicas to a target utilization.",
        quiz: [
          { text: "Ingress is primarily for…", options: ["internal storage", "external HTTP/S routing", "secret management", "pod scheduling"], correct: 1, points: 10, explanation: "Ingress routes external traffic into services." },
          { text: "HPA automatically adjusts…", options: ["pod replicas", "image tags", "namespaces", "volumes"], correct: 0, points: 10, explanation: "HPA scales the number of pods." },
        ] },
    ],
  },
  {
    slug: "course-prompt-engineering", title: "AI Prompt Engineering", category: "AI & LLMs", order: 15,
    courses: [
      { title: "Prompt Structure & Clarity", slug: "prompt-structure", difficulty: "BEGINNER", sequence: 1,
        summary: "Clear, structured prompts — with role, task, and constraints — get far better LLM results.",
        theory: "## Prompt Structure\n\nA strong prompt includes: **role**, **task**, **context**, and **constraints/format**. Be specific, provide examples (few-shot), and ask the model to reason step-by-step for complex tasks.",
        quiz: [
          { text: "Which component best steers tone/behavior?", options: ["role", "length", "temperature always max", "emojis"], correct: 0, points: 10, explanation: "A role primes the model's behavior and tone." },
          { text: "Few-shot prompting works by…", options: ["increasing tokens only", "providing input-output examples", "disabling safety", "using image input"], correct: 1, points: 10, explanation: "Examples (few-shot) demonstrate the desired output." },
        ] },
      { title: "Prompt Evaluation & Patterns", slug: "prompt-patterns", difficulty: "ADVANCED", sequence: 2,
        summary: "Evaluating outputs and chaining structured patterns improve reliability of LLM apps.",
        theory: "## Prompt Patterns & Evaluation\n\n**RAG** retrieves relevant context before generation. **Chain-of-thought** asks the model to reason. **Structured outputs** (JSON schema) make results programmatic. Evaluate deterministically with golden answers and rubrics.",
        quiz: [
          { text: "RAG improves answers by…", options: ["growing the model", "retrieving relevant context to ground the answer", "using more GPUs", "training on new data"], correct: 1, points: 10, explanation: "RAG grounds generation in retrieved context." },
          { text: "For programmatic use, prompts should request…", options: ["free prose only", "structured output like JSON", "long essays", "minimal tokens"], correct: 1, points: 10, explanation: "Structured (JSON) output is machine-consumable." },
        ] },
    ],
  },
  {
    slug: "course-advanced-system-design", title: "Advanced System Design", category: "Systems & Architecture", order: 16,
    courses: [
      { title: "Caching & CDNs", slug: "sysdesign-cache", difficulty: "INTERMEDIATE", sequence: 1,
        summary: "Caches and CDNs cut latency and load by serving repeated requests from the edge.",
        theory: "## Caching & CDNs\n\n**Caching** stores results close to the caller (in-memory, Redis, browser, edge). Use cache-aside or write-through patterns with TTLs and invalidation.\n\nA **CDN** serves static assets from edge nodes, reducing latency and origin load.",
        quiz: [
          { text: "A CDN primarily reduces…", options: ["database writes", "latency for static assets", "code complexity", "authentication"], correct: 1, points: 10, explanation: "CDNs deliver static content from the nearest edge." },
          { text: "Cache-aside means the app…", options: ["always writes through", "checks cache first, then falls back to source", "never invalidates", "stores in the DB only"], correct: 1, points: 10, explanation: "Cache-aside: read cache, on miss read source and repopulate." },
        ] },
      { title: "Queues, Sharding & Durability", slug: "sysdesign-queues", difficulty: "ADVANCED", sequence: 2,
        summary: "Message queues decouple services; sharding and replication scale data stores.",
        theory: "## Queues & Sharding\n\n**Message queues** decouple producers/consumers, absorb bursts, and retry failed work.\n\n**Sharding** splits data across nodes by a partition key; **replication** copies data for durability. Design for idempotent consumers.",
        quiz: [
          { text: "A primary benefit of a message queue is…", options: ["faster sort", "decoupling + burst absorption", "less storage", "stronger typing"], correct: 1, points: 10, explanation: "Queues decouple producers from consumers and buffer bursts." },
          { text: "Sharding splits data across nodes by…", options: ["a partition key", "file size", "query count", "index length"], correct: 0, points: 10, explanation: "Sharding uses a partition key to distribute data." },
        ] },
    ],
  },
];

// Ensure a TEXT lesson per published topic to complete the Lesson chain.
async function ensureLessonChain() {
  const topics = await db.topic.findMany({ where: { isPublished: true }, select: { id: true, title: true, theory: true, slug: true, order: true } });
  let created = 0;
  for (const t of topics) {
    const existing = await db.lesson.findFirst({ where: { topicId: t.id } });
    if (existing) continue;
    await db.lesson.create({
      data: { topicId: t.id, title: t.title, slug: `${slugify(t.title)}-lesson`, content: t.theory ?? `# ${t.title}`, type: "TEXT", order: t.order ?? 0 },
    });
    created++;
  }
  return created;
}

async function main() {
  console.log("Completing the Course → Module → Lesson → Topic chain…");
  const lessons = await ensureLessonChain();
  console.log(`  lessons created for existing topics: ${lessons}`);

  console.log(`Ensuring ${28 + NEW_COURSES.length}-course taxonomy (${NEW_COURSES.length} new)…`);
  for (const c of NEW_COURSES) {
    const subject = await db.subject.upsert({
      where: { slug: c.slug.replace("course-", "") },
      update: { name: c.title },
      create: { slug: c.slug.replace("course-", ""), name: c.title, description: c.title, order: c.order },
    });

    const course = await db.course.upsert({
      where: { slug: c.slug },
      update: { title: c.title, category: c.category, isPublished: true, isFree: true },
      create: { slug: c.slug, title: c.title, description: `Master ${c.title}.`, category: c.category, level: "BEGINNER", isPublished: true, isFree: true, order: c.order },
    });

    // Build modules by difficulty band, idempotently.
    const bands = ["BEGINNER", "ADVANCED"] as const;
    const modules: Record<string, string> = {};
    for (const band of bands) {
      const items = c.courses.filter((x) => (x.difficulty === "BEGINNER") === (band === "BEGINNER"));
      if (items.length === 0) continue;
      const existing = await db.module.findFirst({ where: { courseId: course.id, title: band === "BEGINNER" ? "Beginner" : "Advanced" } });
      const module = existing ?? await db.module.create({ data: { courseId: course.id, title: band === "BEGINNER" ? "Beginner" : "Advanced", order: band === "BEGINNER" ? 0 : 1 } });
      modules[band] = module.id;
    }

    for (const item of c.courses) {
      const band = item.difficulty === "BEGINNER" ? "BEGINNER" : "ADVANCED";
      const topic = await db.topic.upsert({
        where: { slug: item.slug },
        update: { subjectId: subject.id, moduleId: modules[band], title: item.title, isPublished: true },
        create: {
          subjectId: subject.id, moduleId: modules[band], title: item.title,
          slug: item.slug, summary: item.summary, description: item.summary, theory: item.theory,
          difficulty: item.difficulty, sequence: item.sequence, xpReward: 50,
          difficultyRating: item.difficulty === "ADVANCED" ? 3 : 1.5, isPublished: true, contentStatus: "PUBLISHED",
        },
      });

      // Lesson for the chain.
      const lessonExists = await db.lesson.findFirst({ where: { topicId: topic.id } });
      if (!lessonExists) {
        await db.lesson.create({ data: { topicId: topic.id, title: topic.title, slug: `${topic.slug}-lesson`, content: item.theory, type: "TEXT", order: item.sequence } });
      }

      // Quiz + questions (idempotent).
      let quiz = await db.quiz.findFirst({ where: { topicId: topic.id } });
      if (!quiz) {
        quiz = await db.quiz.create({ data: { topicId: topic.id, title: `${item.title} Check`, type: "MULTIPLE_CHOICE", passingScore: 70 } });
        let qOrder = 0;
        for (const q of item.quiz) {
          await db.question.create({ data: { quizId: quiz.id, text: q.text, options: q.options, correctAnswer: String(q.correct), explanation: q.explanation, points: q.points, order: qOrder++ } });
        }
      }
    }
  }

  const total = await db.course.count({ where: { isPublished: true } });
  const lessonsTotal = await db.lesson.count();
  const byCat = await db.course.groupBy({ by: ["category"], where: { isPublished: true }, _count: true });
  console.log(`  courses: ${total} · lessons in chain: ${lessonsTotal}`);
  console.log("  by category:", byCat.map((c) => `${c.category}=${c._count}`).join(" · "));
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
