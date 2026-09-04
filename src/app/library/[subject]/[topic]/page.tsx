"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { marked } from "marked";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  BookOpen,
  FlaskConical,
  Radio,
  Trophy,
  Hammer,
} from "lucide-react";

// A small starter snippet so "Practice in Code Forge" preloads relevant code.
function starterForTopic(title: string) {
  const t = title.toLowerCase();
  const base = `// ${title} — practice in Codempress Code Forge\n// Edit the code below, then hit Run. Experiment!`;
  if (t.includes("sql") || t.includes("database") || t.includes("query"))
    return `// ${title} — SQL practice (try it in the HTML live-preview)\nconsole.log("Here's a tip for ${title}: write a SELECT query with GROUP BY.");\n`;
  if (t.includes("python") || t.includes("data") || t.includes("ml") || t.includes("stat"))
    return `${base}\n\nconst topics = ["theory", "hands-on", "quiz"];\nconsole.log("Practice ${title}:", topics.join(" → "));\n`;
  if (t.includes("html") || t.includes("css") || t.includes("ui") || t.includes("design"))
    return `${base}\n\nconst el = document.createElement("div");\nconsole.log("Practicing ${title}: styled element ready.");\n`;
  return `${base}\n\nfunction hello(name) {\n  return \`Hello, \${name} 👋 — keep practicing ${title}!\`;\n}\nconsole.log(hello("Developer"));\n`;
}

type Question = {
  id: string;
  text: string;
  codeSnippet?: string | null;
  options: string[];
  points: number;
};

type Grade = {
  questionId: string;
  chosen: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string | null;
};

type QuizResult = {
  correct: number;
  total: number;
  pct: number;
  passed: boolean;
  xpAwarded: number;
  grading: Grade[];
  levelTitle: string;
  nextLevelAt: number | null;
  nextLevelTitle: string | null;
};

type TopicData = {
  topic: {
    slug: string;
    title: string;
    theory: string | null;
    summary: string;
    xpReward: number;
    difficultyRating: number;
    progression: number;
    theoryRead: boolean;
    quizCompleted: boolean;
    unlocked: boolean;
  };
  quiz: { id: string; title: string; passingScore: number; questions: Question[] } | null;
};

export default function TopicPage({ params }: { params: { subject: string; topic: string } }) {
  const { topic } = params;
  const { status } = useSession();
  const [data, setData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theoryHtml, setTheoryHtml] = useState("");
  const [answered, setAnswered] = useState<Record<number, boolean>>({});
  const [chosen, setChosen] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { subject } = params;
  const readLogged = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/library/topic/${topic}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.topic.theory) setTheoryHtml(await marked.parse(d.topic.theory));
      }
      setLoading(false);
    }
    load();
  }, [topic]);

  // Auto-log theory read (20 XP) once.
  useEffect(() => {
    if (data && !data.topic.theoryRead && !readLogged.current) {
      readLogged.current = true;
      fetch(`/api/library/topic/${data.topic.slug}/read`, { method: "POST" })
        .then((res) => res.json())
        .then((j) => {
          if (j.success) toast.success(`+${j.xpAwarded} XP (theory read)`);
        })
        .catch(() => {});
    }
  }, [data]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Topic not found.
      </div>
    );
  }

  const currentTopic = data.topic;
  const quiz = data.quiz;
  const idx = subject;

  function selectOption(qi: number, oi: number) {
    if (result) return; // locked after submit
    setChosen((prev) => ({ ...prev, [qi]: oi }));
    setAnswered((prev) => ({ ...prev, [qi]: true }));
  }

  async function submitQuiz() {
    const answers = quiz?.questions.map((_, i) => chosen[i]);
    if (!answers || answers.some((a) => a === undefined)) {
      toast("Please answer all questions first.", { icon: "⚠️" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/library/topic/${currentTopic.slug}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error || "Failed to grade quiz");
        return;
      }
      setResult(j);
    } finally {
      setSubmitting(false);
    }
  }

  const stars = "★".repeat(Math.min(5, Math.ceil(data.topic.difficultyRating)));

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/library/${idx}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-sm text-slate-400">Arcane Library</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Topic header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{data.topic.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-yellow-300">{stars}</span>
            <span className="text-slate-400">{data.topic.difficultyRating.toFixed(1)} difficulty</span>
            <span className="inline-flex items-center gap-1.5 text-yellow-300">
              <FlaskConical className="h-4 w-4" /> +{data.topic.xpReward} XP
            </span>
          </div>
        </div>

        {/* Theory reader */}
        {theoryHtml && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-400" /> Theory
            </h2>
            <div className="lesson-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6" dangerouslySetInnerHTML={{ __html: theoryHtml }} />
            {data.topic.theoryRead && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Theory read (+20 XP)
              </div>
            )}
            <div className="mt-4">
              <Link
                href={`/forge?lang=javascript&code=${encodeURIComponent(starterForTopic(data.topic.title))}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 text-sm font-medium transition"
              >
                <Hammer className="h-4 w-4" /> Practice this in Code Forge
              </Link>
            </div>
          </section>
        )}

        {/* Quiz */}
        {quiz && quiz.questions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
              <FlaskConical className="h-5 w-5 text-purple-400" /> {quiz.title}
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              Pass with ≥{quiz.passingScore}% to clear this topic. 5 questions.
            </p>

            {result && (
              <div className={`mb-6 p-5 rounded-2xl border ${result.passed ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                <div className="font-bold text-lg flex items-center gap-2">
                  {result.passed ? <Trophy className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                  {result.passed ? `Passed! ${result.correct}/${result.total} correct (${result.pct}%)` : `Failed — ${result.correct}/${result.total} correct (${result.pct}%)`}
                </div>
                <p className="text-sm mt-1">
                  {result.passed ? (
                    <>+{result.xpAwarded} XP earned. Level: {result.levelTitle}</>
                  ) : (
                    "You need at least 70% to pass. Review the theory and try again."
                  )}
                </p>
              </div>
            )}

            <div className="space-y-6">
              {quiz.questions.map((q, qi) => {
                const sel = chosen[qi];
                const graded = result?.grading[qi];
                return (
                  <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Radio className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-slate-500">Question {qi + 1}</span>
                      <span className="text-xs text-slate-600">· {q.points} pts</span>
                    </div>
                    <p className="font-medium mb-4">{q.text}</p>
                    <div className="grid gap-2">
                      {q.options.map((opt, oi) => {
                        const isSelected = sel === oi;
                        const isCorrectOpt = graded && oi === graded.correctIndex;
                        const isWrongChosen = graded && isSelected && !graded.isCorrect;
                        let cls = "border-slate-700 hover:border-slate-500 bg-slate-950/40";
                        if (!result && isSelected) cls = "border-orange-400 bg-orange-500/10 text-orange-100";
                        if (graded) {
                          if (isCorrectOpt) cls = "border-green-500 bg-green-500/10 text-green-100";
                          else if (isWrongChosen) cls = "border-red-500 bg-red-500/10 text-red-100";
                          else cls = "border-slate-800 bg-slate-950/40 text-slate-400";
                        }
                        return (
                          <button
                            key={oi}
                            onClick={() => selectOption(qi, oi)}
                            className={`text-left px-4 py-2.5 rounded-xl border text-sm transition ${cls}`}
                          >
                            <span className="text-slate-400 mr-2">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {graded && graded.explanation && (
                      <p className="mt-3 text-sm text-slate-300 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
                        <span className="text-slate-400">Why: </span>{graded.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {!result && (
              <button
                onClick={submitQuiz}
                disabled={submitting}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                Submit Quiz
              </button>
            )}
          </section>
        )}

        {/* Level progress */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-sm text-slate-400">
            {result?.nextLevelAt
              ? `Next level (${result.nextLevelTitle}) at ${result.nextLevelAt.toLocaleString()} XP.`
              : result?.levelTitle
              ? `Current level: ${result.levelTitle}.`
              : "Complete quizzes to earn XP and level up."}
          </p>
        </section>
      </main>
    </div>
  );
}
