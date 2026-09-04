"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import {
  ChevronDown,
  CheckCircle2,
  Play,
  Loader2,
  BookOpenCheck,
  Target,
  Trophy,
  Sparkles,
  X,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";

type TopicData = {
  topic: {
    slug: string;
    title: string;
    theory: string;
    summary: string;
    xpReward: number;
    difficultyRating: string;
    progress: number;
    theoryRead: boolean;
    quizCompleted: boolean;
    unlocked: boolean;
  };
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    questions: { id: string; text: string; codeSnippet: string | null; options: string[]; points: number }[];
  } | null;
};

type QuizResult = {
  correct: number;
  total: number;
  pct: number;
  passed: boolean;
  xpAwarded: number;
  mastery: number;
  grading: { correctIndex: number; isCorrect: boolean; explanation?: string }[];
  badgesEarned: { slug: string; name: string; icon: string }[];
};

export function InlineTopic({
  topicSlug,
  title,
  subjectName,
  initialDone,
  disabled = false,
}: {
  topicSlug: string;
  title: string;
  subjectName?: string | null;
  initialDone: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopicData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [theoryRead, setTheoryRead] = useState(initialDone);
  const [readXp, setReadXp] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const quizCompleted = result ? result.passed : initialDone;
  const score = result?.pct ?? data?.topic.progress ?? 0;

  async function openDrawer() {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (data) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/library/topic/${topicSlug}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setData(j);
      setTheoryRead(j.topic.theoryRead);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function markRead() {
    setMarking(true);
    try {
      const res = await fetch(`/api/library/topic/${topicSlug}/read`, { method: "POST" });
      const j = await res.json();
      if (res.ok) {
        setReadXp(j.xpAwarded);
        setTheoryRead(true);
        router.refresh();
      }
    } catch {
      /* non-fatal */
    } finally {
      setMarking(false);
    }
  }

  function choose(qid: string, idx: number) {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  }

  async function submitQuiz() {
    if (!data?.quiz) return;
    const qs = data.quiz.questions;
    if (Object.keys(answers).length < qs.length) return;
    setSubmitting(true);
    try {
      const ans = qs.map((q) => answers[q.id]);
      const res = await fetch(`/api/library/topic/${topicSlug}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans }),
      });
      const j = await res.json();
      if (res.ok) setResult(j);
      else setError(j.error || "Quiz failed");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Row */}
      <button onClick={openDrawer} className={`flex w-full items-start gap-3 p-3 text-left ${disabled ? "opacity-60" : "card-hover"}`}>
        {disabled ? (
          <Play className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-600" />
        ) : quizCompleted ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
        ) : (
          <Play className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="truncate text-xs text-slate-400">
            {disabled ? "Complete the previous phase to unlock this topic" : subjectName || "Topic"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quizCompleted && <Badge tone="green">Passed</Badge>}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Drawer body */}
      {open && (
        <div className="border-t border-line">
          {loading && (
            <div className="flex items-center justify-center gap-2 p-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading topic…
            </div>
          )}
          {error && !data && <div className="p-6 text-sm text-red-400">Could not load this topic: {error}</div>}

          {data && (
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent-soft" />
                  <span className="capitalize text-xs text-slate-400">
                    {data.topic.difficultyRating} · {data.topic.xpReward} XP
                  </span>
                </div>
                <Badge tone={score >= 70 ? "green" : "blue"}>Mastery {score}%</Badge>
              </div>

              {/* Theory */}
              <div
                className="lesson-md mb-4 rounded-xl border border-line bg-surface-2/40 p-5"
                dangerouslySetInnerHTML={{ __html: marked.parse(data.topic.theory) as string }}
              />

              {/* Mark read */}
              {!theoryRead && (
                <button onClick={markRead} disabled={marking} className="btn btn-primary mb-6">
                  {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}
                  Mark as read {readXp != null ? `(+${readXp} XP)` : ""}
                </button>
              )}
              {theoryRead && (
                <div className="mb-6 flex items-center gap-2 text-sm text-green-300">
                  <CheckCircle2 className="h-4 w-4" /> Theory read {readXp ? `(+${readXp} XP)` : ""}
                </div>
              )}

              {/* Quiz */}
              {data.quiz ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">{data.quiz.title}</h4>
                  {data.quiz.questions.map((q, qi) => (
                    <div key={q.id} className="rounded-xl border border-line bg-surface-2/30 p-4">
                      <p className="mb-3 text-sm font-medium">{qi + 1}. {q.text}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {q.options.map((opt, oi) => {
                          const chosen = answers[q.id] === oi;
                          const graded = result?.grading[qi];
                          const isCorrectChoice = graded?.correctIndex === oi;
                          const showGrade = !!graded;
                          let ring = "";
                          if (showGrade) {
                            if (graded?.correctIndex === oi) ring = "border-green-500/60 bg-green-500/10 text-green-200";
                            else if (chosen) ring = "border-red-500/60 bg-red-500/10 text-red-200";
                          } else if (chosen) {
                            ring = "border-accent-soft bg-accent-soft/10";
                          }
                          return (
                            <button
                              key={oi}
                              onClick={() => !graded && choose(q.id, oi)}
                              disabled={!!graded}
                              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${ring} ${!graded ? "border-line hover:border-slate-500" : ""}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {result?.grading[qi]?.explanation && (
                        <p className="mt-2 text-xs text-slate-400">
                          {result.grading[qi].isCorrect ? "✓" : "✗"} {result.grading[qi].explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {!result ? (
                    <button
                      onClick={submitQuiz}
                      disabled={submitting || Object.keys(answers).length < data.quiz.questions.length}
                      className="btn btn-primary"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                      Submit Quiz ({Object.keys(answers).length}/{data.quiz.questions.length})
                    </button>
                  ) : (
                    <div className={`rounded-xl border p-4 ${result.passed ? "border-green-500/30 bg-green-500/10" : "border-orange-500/30 bg-orange-500/10"}`}>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4 text-accent-soft" />
                        {result.passed ? `Passed! ${result.correct}/${result.total} correct (+${result.xpAwarded} XP)` : `Scored ${result.pct}% — needs ${data.quiz.passingScore}% to pass`}
                      </div>
                      {result.badgesEarned?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          {result.badgesEarned.map((b) => (
                            <span key={b.slug} className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-200">
                              {b.icon} {b.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-faint">No quiz for this topic.</p>
              )}

              <button onClick={() => setOpen(false)} className="mt-5 flex items-center gap-1.5 text-xs text-faint hover:text-slate-300">
                <X className="h-3.5 w-3.5" /> Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
