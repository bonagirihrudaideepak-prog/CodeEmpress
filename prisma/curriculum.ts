// The 28 subjects from docs/PRODUCT_SPEC.md, plus a representative seed of
// curriculum topics + quiz questions per subject. This is the content the
// Arcane Library browse (not the full 3,100+ topics — that is generated/imported
// separately; see docs/CONTENT_GUIDE.md). The structure is fully scalable.

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface SeedQuestion {
  text: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number; // index
  explanation: string;
  difficulty: Difficulty;
  skillPoints: number;
  timeSeconds: number;
}

export interface SeedTopic {
  slug: string;
  title: string;
  description: string;
  summary: string;
  theory: string;
  difficulty: Difficulty;
  difficultyRating: number;
  xpReward: number;
  sequence: number;
  questions: SeedQuestion[];
}

export interface SeedSubject {
  slug: string;
  name: string;
  description: string;
  icon: string;
  topics: SeedTopic[];
}

const q = (
  text: string,
  options: string[],
  correctAnswer: number,
  explanation: string,
  difficulty: Difficulty = "BEGINNER"
): SeedQuestion => ({
  text,
  options,
  correctAnswer,
  explanation,
  difficulty,
  skillPoints: 10,
  timeSeconds: 30,
});

const JS_TOPICS: SeedTopic[] = [
  {
    slug: "js-variables",
    title: "Variables & Data Types",
    description: "let, const, var, and primitive vs reference types.",
    summary:
      "The building blocks of JavaScript: declaring variables and understanding the types they hold.",
    theory:
      "## Variables\nJavaScript gives you three ways to declare a variable: `var`, `let`, and `const`.\n\n- **`const`** — block-scoped, cannot be reassigned. Use it by default.\n- **`let`** — block-scoped, can be reassigned.\n- **`var`** — function-scoped, hoisted. Prefer not to use it.\n\n### Data types\nJavaScript has 7 **primitive** types: `string`, `number`, `boolean`, `undefined`, `null`, `symbol`, `bigint`.\nEverything else (objects, arrays, functions, dates) is an **object**.\n\nPrimitives are copied by value; objects are copied by reference.",
    difficulty: "BEGINNER",
    difficultyRating: 1.0,
    xpReward: 50,
    sequence: 1,
    questions: [
      q("Which keyword declares a block-scoped variable that CANNOT be reassigned?", ["var", "let", "const", "static"], 2, "`const` is block-scoped and cannot be reassigned."),
      q("How many primitive data types does JavaScript have?", ["5", "6", "7", "8"], 2, "JavaScript has 7 primitive types including string, number, boolean, etc."),
      q("Which of these is a reference (object) type in JavaScript?", ["string", "number", "array", "boolean"], 2, "Arrays are objects and are passed by reference."),
      q("What does `typeof []` return?", ["\"array\"", "\"object\"", "\"list\"", "\"undefined\""], 1, "Arrays are objects, so typeof returns \"object\"."),
      q("Which statement is TRUE about primitive values?", ["They are passed by reference", "They are copied by value", "They are always objects", "They can be mutated directly"], 1, "Primitives are copied by value."),
    ],
  },
  {
    slug: "js-functions",
    title: "Functions & Scope",
    description: "Function declarations, expressions, arrows, and scope.",
    summary: "Writing reusable functions and understanding lexical vs function scope.",
    theory:
      "## Functions\nFunctions are first-class citizens in JavaScript.\n\n```js\nfunction add(a, b) { return a + b; }      // declaration\nconst sub = (a, b) => a - b;              // arrow function\n```\n\n- **Declarations** are hoisted.\n- **Arrow functions** have no `this` of their own (they inherit lexical `this`).\n- **Scope** determines where a variable is accessible. `let`/`const` are block-scoped.",
    difficulty: "BEGINNER",
    difficultyRating: 1.3,
    xpReward: 50,
    sequence: 2,
    questions: [
      q("Which function syntax does NOT have its own `this` binding?", ["function declaration", "function expression", "arrow function", "none of these"], 2, "Arrow functions inherit `this` from their lexical scope."),
      q("What does a function declaration get at the top of its scope?", ["deferred", "hoisted", "removed", "ignored"], 1, "Function declarations are hoisted."),
      q("Which is a correct arrow function?", ["let f = (a) => { return a }", "let f = function => a", "let f = a =>", "fn = arrow(a)"], 0, "Arrow functions use => syntax."),
      q("`let` variables are…", ["function-scoped", "global", "block-scoped", "immutable"], 2, "`let` is block-scoped."),
      q("What does `add(2,3)` return in `const add = (a,b) => a+b`?", ["5", "\"23\"", "undefined", "error"], 0, "Arrow implicit return computes 5."),
    ],
  },
  {
    slug: "js-closures",
    title: "Closures",
    description: "How functions remember their outer scope.",
    summary: "A function bundling with the variables of its outer scope.",
    theory:
      "## Closures\nA closure is a function that keeps access to variables from its outer scope even after that scope finishes.\n\n```js\nfunction makeCounter() {\n  let n = 0;\n  return () => ++n;   // closure over n\n}\n```\n\nClosures capture the **binding**, not a copy. Useful for private state, callbacks, and currying.",
    difficulty: "INTERMEDIATE",
    difficultyRating: 1.8,
    xpReward: 75,
    sequence: 3,
    questions: [
      q("A closure is a function that…", ["has no arguments", "remembers its outer scope variables", "is always async", "cannot return values"], 1, "Closures retain access to their lexical scope."),
      q("What concept does a closure capture?", ["a copy of values", "the variable binding", "the call stack", "the event loop"], 1, "Closures capture bindings, so later changes are visible."),
      q("Which is a common use of closures?", ["global variables", "private state", "disabling GC", "replacing arrays"], 1, "Closures enable data encapsulation."),
      q("In the loop trap, using `let` fixes the issue because…", ["let is slower", "each iteration gets a fresh binding", "let is global", "closures are disabled"], 1, "`let` creates a new binding per iteration."),
      q("What is the purpose of the returned function in a counter factory?", ["to expose count directly", "to close over and return state", "to run on a timer", "to create a new scope only"], 1, "The returned function closes over the counter variable."),
    ],
  },
  {
    slug: "js-async",
    title: "Promises & Async/Await",
    description: "Handling asynchronous operations cleanly.",
    summary: "Promises and async/await for clean asynchronous control flow.",
    theory:
      "## Async & Await\nJavaScript is single-threaded but non-blocking. `async`/`await` is sugar over Promises.\n\n```js\nasync function getData() {\n  const res = await fetch(\"/api/data\");\n  return res.json();\n}\n```\n\nA `Promise` has three states: pending, fulfilled, rejected.\n\nUse `try/catch` with `await` to handle errors.",
    difficulty: "INTERMEDIATE",
    difficultyRating: 2.0,
    xpReward: 75,
    sequence: 4,
    questions: [
      q("What are the three states of a Promise?", ["start/middle/end", "pending/fulfilled/rejected", "open/closed/error", "sync/async/await"], 1, "Promises: pending, fulfilled, rejected."),
      q("Which keyword makes a function return a Promise?", ["sync", "function", "async", "loop"], 2, "`async` functions return a Promise."),
      q("How do you handle errors in async/await?", ["try/catch", "setTimeout", "return null", "Promise.all"], 0, "Use try/catch around awaited code."),
      q("What is the purpose of `await`?", ["stop the whole app", "pause until a Promise settles", "return undefined", "create a thread"], 1, "await pauses until the promise settles."),
      q("Which can you await?", ["any value", "only Promises (or thenables)", "only strings", "only numbers"], 1, "await works on thenables/Promises."),
    ],
  },
  {
    slug: "js-dom",
    title: "DOM Manipulation",
    description: "Interacting with the HTML document.",
    summary: "Selecting and updating elements in the browser DOM.",
    theory:
      "## DOM\nThe DOM (Document Object Model) is a tree representation of your HTML.\n\n```js\nconst el = document.querySelector(\"#title\");\nel.textContent = \"Hello\";\nel.classList.add(\"active\");\n```\n\nBe mindful of reflows/repaints when making many DOM changes — batch them.",
    difficulty: "BEGINNER",
    difficultyRating: 1.2,
    xpReward: 50,
    sequence: 5,
    questions: [
      q("What does `document.querySelector(\"#x\")` select?", ["all .x", "the element with id x", "the first tag x", "nothing"], 1, "#x selects the element with id 'x'."),
      q("Which method sets the text of an element?", ["innerText", "textContent", "appendText", "value"], 1, "textContent sets the text content."),
      q("What is the DOM?", ["a database", "a tree of the document", "a CSS file", "an event"], 1, "The DOM is a tree representation of the HTML."),
      q("What is a DOM 'reflow'?", ["a layout recalculation", "a network request", "a promise rejection", "an event"], 0, "Reflow recalculates layout when the DOM changes."),
    ],
  },
  {
    slug: "js-classes",
    title: "Classes & OOP",
    description: "Blueprints with constructors, methods, and inheritance.",
    summary: "Encapsulation, inheritance, and `this` in class-based JavaScript.",
    theory:
      "## Classes\nES2015 introduced `class` syntax.\n\n```js\nclass Animal {\n  constructor(name) { this.name = name; }\n  speak() { return this.name + \" makes a sound\"; }\n}\nclass Dog extends Animal {\n  speak() { return this.name + \" barks\"; }\n}\n```\n\nClasses are syntactic sugar over prototypes. `extends` sets up inheritance; `super` calls the parent constructor.",
    difficulty: "INTERMEDIATE",
    difficultyRating: 1.9,
    xpReward: 75,
    sequence: 6,
    questions: [
      q("What keyword defines inheritance in JS?", ["inherit", "extends", "implements", "derives"], 1, "`extends` sets up class inheritance."),
      q("What does `super()` call?", ["the parent constructor", "the global scope", "a method", "an event"], 0, "super() invokes the parent constructor."),
      q("Classes are syntactic sugar over…", ["objects", "prototypes", "arrays", "modules"], 1, "Classes are sugar over the prototype system."),
      q("What does `this` refer to inside a class method?", ["the class itself", "the instance", "global", "the parent"], 1, "In a normal method, `this` is the instance."),
    ],
  },
  {
    slug: "js-modules",
    title: "ES Modules",
    description: "Import and export reusable code across files / build.",
    summary: "ESM: named & default exports, imports, and bundlers.",
    theory:
      "## ES Modules\nModules let you split code into files.\n\n```js\n// utils.js\nexport const add = (a, b) => a + b;\nexport default function log() { console.log(\"hi\"); }\n\n// app.js\nimport log, { add } from \"./utils.js\";\n```\n\nUse **named exports** for multiple values and a **default export** for a single main value.",
    difficulty: "INTERMEDIATE",
    difficultyRating: 1.6,
    xpReward: 75,
    sequence: 7,
    questions: [
      q("Which is the syntax for a named export?", ["export default x", "export const x", "module.exports", "export = x"], 1, "`export const x` is a named export."),
      q("What does `import log from './x.js'` import?", ["the named export", "the default export", "all exports", "nothing"], 1, "The default import has no braces."),
      q("ESM imports are…", ["synchronous only", "live bindings (read-only)", "copies", "global"], 1, "ESM imports are live, read-only bindings."),
      q("Which is a main benefit of modules?", ["global scope", "encapsulation/reuse", "faster CPU", "less memory"], 1, "Modules encapsulate and enable reuse."),
    ],
  },
  {
    slug: "js-testing",
    title: "Testing Fundamentals",
    description: "Unit tests with Jest and testing best practices.",
    summary: "Writing reliable unit tests with Jest.",
    theory:
      "## Testing\nUnit tests verify a small piece of logic in isolation.\n\n```js\ntest(\"add returns the sum\", () => {\n  expect(add(2, 3)).toBe(5);\n});\n```\n\nArrange → Act → Assert. Keep tests fast, deterministic, and independent.",
    difficulty: "INTERMEDIATE",
    difficultyRating: 1.9,
    xpReward: 75,
    sequence: 8,
    questions: [
      q("What is the typical test structure?", ["AAA", "RGB", "TBD", "MVC"], 0, "Arrange, Act, Assert."),
      q("Which Jest matcher checks strict equality?", [".toBe", ".toBeEqual", ".match", ".equal"], 0, ".toBe checks strict equality."),
      q("Unit tests should be…", ["slow", "independent & deterministic", "random", "network-heavy"], 1, "Good unit tests are fast, deterministic, independent."),
      q("A test that fails occasionally is called…", ["flaky", "stable", "green", "mocked"], 0, "Non-deterministic tests are 'flaky'."),
    ],
  },
];

// Reusable question bank generator that builds topical questions per subject.
function mkQuestions(subjectName: string, concepts: string[]): SeedQuestion[] {
  const bank: SeedQuestion[] = [];
  concepts.forEach((c, i) => {
    bank.push({
      text: `Which best describes the role of ${c} in ${subjectName}?`,
      codeSnippet: undefined,
      options: [
        `${c} is a core building block used to ${subjectName.toLowerCase()} tasks.`,
        `${c} is unrelated to ${subjectName}.`,
        `${c} is a deprecated feature.`,
        "None of the above.",
      ],
      correctAnswer: 0,
      explanation: `${c} is a fundamental concept in ${subjectName}.`,
      difficulty: "BEGINNER",
      skillPoints: 10,
      timeSeconds: 30,
    });
    bank.push({
      text: `When should you use ${c}?`,
      options: [
        "When it directly solves the current problem.",
        "Whenever possible, even if unnecessary.",
        "Never.",
        "Only in tests.",
      ],
      correctAnswer: 0,
      explanation: `Use ${c} when it fits the problem at hand.`,
      difficulty: "BEGINNER",
      skillPoints: 10,
      timeSeconds: 30,
    });
    bank.push({
      text: `A common mistake when working with ${c} is…`,
      options: [
        "Ignoring edge cases and error conditions.",
        "Reading the documentation.",
        "Writing small, focused functions.",
        "Testing the behavior.",
      ],
      correctAnswer: 0,
      explanation: `Most ${c} bugs come from unhandled edge cases.`,
      difficulty: "INTERMEDIATE",
      skillPoints: 10,
      timeSeconds: 30,
    });
    bank.push({
      text: `Which principle is most relevant to ${c}?`,
      options: [
        "Separation of concerns.",
        "Using global variables.",
        "Hard-coding values.",
        "Copy-pasting code.",
      ],
      correctAnswer: 0,
      explanation: `Apply separation of concerns when using ${c}.`,
      difficulty: "INTERMEDIATE",
      skillPoints: 10,
      timeSeconds: 30,
    });
  });
  return bank.slice(0, 5);
}

function seedSubject(
  slug: string,
  name: string,
  description: string,
  icon: string,
  concepts: string[]
): SeedSubject {
  const diffs: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const topics: SeedTopic[] = concepts.map((c, i) => {
    const d = diffs[Math.min(i, 2)];
    return {
      slug: `${slug}-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      title: c,
      description: `Master ${c} in ${name}.`,
      summary: `A focused topic covering ${c}.`,
      theory: `## ${c}\n\n${c} is a key concept in ${name}. Study it, then pass the quiz to earn XP.`,
      difficulty: d,
      difficultyRating: Math.round((1 + i * 0.6) * 10) / 10,
      xpReward: d === "BEGINNER" ? 50 : d === "INTERMEDIATE" ? 75 : 100,
      sequence: i + 1,
      questions: mkQuestions(name, [c]),
    };
  });
  return { slug, name, description, icon, topics };
}

// The full 28-subject catalog. JavaScript gets the rich topic set above; the
// others get a representative set of topics (each with a question bank).
export const SUBJECTS: SeedSubject[] = [
  {
    slug: "javascript",
    name: "JavaScript",
    description: "The language of the web — from fundamentals to modern frameworks.",
    icon: "js",
    topics: JS_TOPICS,
  },
  seedSubject("html", "HTML", "Structure and semantics of web pages.", "html", [
    "Semantic Elements",
    "Forms & Inputs",
    "Accessibility",
    "Media Elements",
  ]),
  seedSubject("css", "CSS", "Styling and layout with modern CSS.", "css", [
    "Box Model",
    "Flexbox",
    "Grid Layout",
    "CSS Variables",
  ]),
  seedSubject("ui-design", "UI Design Concepts", "Principles of usable, appealing interfaces.", "ui", [
    "Color Theory",
    "Typography",
    "Spacing & Layout",
    "Design Systems",
  ]),
  seedSubject("react", "React", "Component-based UI development.", "react", [
    "Components & Props",
    "Hooks",
    "State Management",
    "Routing",
  ]),
  seedSubject("nodejs", "Node.js", "Server-side JavaScript with Node.", "node", [
    "Event Loop",
    "HTTP Server",
    "File System",
    "NPM & Packages",
  ]),
  seedSubject("sql", "SQL", "Querying and modeling relational data.", "sql", [
    "SELECT Queries",
    "JOINs",
    "Aggregations",
    "Normalization",
  ]),
  seedSubject("python", "Python", "Versatile, beginner-friendly programming.", "python", [
    "Data Types",
    "Functions",
    "Control Flow",
    "File I/O",
  ]),
  seedSubject("pandas", "Pandas", "Data analysis in Python with DataFrames.", "pandas", [
    "DataFrames",
    "Filtering",
    "GroupBy",
    "Merging",
  ]),
  seedSubject("numpy", "NumPy", "Fast numerical computing with arrays.", "numpy", [
    "Arrays",
    "Indexing",
    "Broadcasting",
    "Linear Algebra",
  ]),
  seedSubject("matplotlib", "Matplotlib", "Data visualization with Python.", "matplotlib", [
    "Line & Scatter",
    "Bar Charts",
    "Subplots",
    "Styling",
  ]),
  seedSubject("seaborn", "Seaborn", "Statistical data visualization.", "seaborn", [
    "Distributions",
    "Correlation",
    "Categorical Plots",
    "Themes",
  ]),
  seedSubject("scikit-learn", "Scikit-learn", "Classic machine learning in Python.", "sklearn", [
    "Train/Test Split",
    "Classification",
    "Regression",
    "Model Evaluation",
  ]),
  seedSubject("ml", "Machine Learning", "Core algorithms and concepts of ML.", "ml", [
    "Supervised Learning",
    "Unsupervised Learning",
    "Overfitting",
    "Feature Engineering",
  ]),
  seedSubject("llms", "LLMs", "Large language models and their use.", "llms", [
    "Tokens & Context",
    "Prompt Design",
    "Fine-tuning",
    "Inference",
  ]),
  seedSubject("rag", "RAG", "Retrieval-augmented generation pipelines.", "rag", [
    "Embeddings",
    "Vector Search",
    "Retrieval",
    "Generation",
  ]),
  seedSubject("agentic-ai", "Agentic AI", "Autonomous AI agents and tool use.", "agentic", [
    "Agents",
    "Tool Calling",
    "Planning",
    "Memory",
  ]),
  seedSubject("genai", "Generative AI", "Content generation and creative models.", "genai", [
    "Text Generation",
    "Image Synthesis",
    "Diffusion",
    "Evaluation",
  ]),
  seedSubject("power-bi", "Power BI", "Business intelligence dashboards.", "bi", [
    "Data Models",
    "DAX",
    "Visualizations",
    "Publishing",
  ]),
  seedSubject("excel", "Excel", "Spreadsheet analysis and automation.", "excel", [
    "Formulas",
    "PivotTables",
    "Charts",
    "Power Query",
  ]),
  seedSubject("threejs", "Three.js", "3D graphics in the browser.", "three", [
    "Scenes",
    "Meshes",
    "Materials",
    "Animation",
  ]),
  seedSubject("git", "Git", "Version control and collaboration.", "git", [
    "Commits",
    "Branches",
    "Merging",
    "Rebase",
  ]),
  seedSubject("api", "REST & GraphQL", "Designing and consuming APIs.", "api", [
    "HTTP Methods",
    "REST Design",
    "GraphQL Queries",
    "Authentication",
  ]),
  seedSubject("devops", "Docker & CI/CD", "Containers, orchestration, and pipelines.", "devops", [
    "Images",
    "Volumes",
    "Networks",
    "CI Pipelines",
  ]),
  seedSubject("react-native", "React Native", "Mobile apps with React.", "rn", [
    "Components",
    "Navigation",
    "Native Modules",
    "Performance",
  ]),
  seedSubject("flutter", "Flutter", "Cross-platform apps with Dart.", "flutter", [
    "Widgets",
    "Layout",
    "State",
    "Routing",
  ]),
  seedSubject("security", "Security", "Defending applications and data.", "sec", [
    "OWASP Top 10",
    "Authentication",
    "Encryption",
    "Input Validation",
  ]),
  seedSubject("system-design", "System Design", "Designing scalable systems.", "sysdes", [
    "Load Balancing",
    "Caching",
    "Databases",
    "Consistency",
  ]),
];
