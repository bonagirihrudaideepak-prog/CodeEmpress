import type { JSX } from "react";
import {
  Sparkles,
  Compass,
  BookOpen,
  ExternalLink,
  TrendingUp,
  CalendarClock,
  Flag,
  AlertTriangle,
  Target,
} from "lucide-react";
import type { Nexus } from "@/lib/ai/nexus";

function scoreColor(v: number) {
  if (v >= 75) return "text-green-400";
  if (v >= 50) return "text-yellow-400";
  return "text-red-400";
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    course: { label: "Course", cls: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
    roadmap: { label: "Roadmap", cls: "bg-green-500/10 text-green-300 border-green-500/20" },
    project: { label: "Project", cls: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
    video: { label: "Video", cls: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
    article: { label: "Article", cls: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
    book: { label: "Book", cls: "bg-slate-500/10 text-slate-300 border-slate-500/20" },
  };
  const m = map[type] ?? map.article;
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${m.cls}`}>{m.label}</span>
  );
}

const PLAN_ICONS: Record<string, JSX.Element> = {
  shortTerm: <CalendarClock className="h-4 w-4 text-blue-400" />,
  mediumTerm: <TrendingUp className="h-4 w-4 text-green-400" />,
  longTerm: <Flag className="h-4 w-4 text-purple-400" />,
};

export function DevelopmentWindow({ nexus }: { nexus: Nexus }) {
  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center gap-2">
        <Compass className="h-5 w-5 text-accent-soft" />
        <h3 className="text-xl font-bold">Nexus · Development Window</h3>
        <Sparkles className="ml-1 h-4 w-4 text-accent-soft" />
      </div>

      {/* Confidence scores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card !bg-surface-2/60 p-4 text-center">
          <span className="block text-xs text-faint">ATS Score</span>
          <span className={`text-2xl font-bold ${scoreColor(nexus.atsScore)}`}>{nexus.atsScore}</span>
        </div>
        <div className="card !bg-surface-2/60 p-4 text-center">
          <span className="block text-xs text-faint">Job Mastery</span>
          <span className={`text-2xl font-bold ${scoreColor(nexus.masteryScore)}`}>{nexus.masteryScore}</span>
        </div>
        <div className="card !bg-surface-2/60 p-4 text-center">
          <span className="block text-xs text-faint">Skills Gap</span>
          <span className={`text-2xl font-bold ${scoreColor(100 - nexus.gapScore)}`}>{nexus.gapScore}</span>
        </div>
      </div>

      {/* Strengths */}
      {nexus.strengths.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold text-green-400">Your edge</h4>
          <div className="flex flex-wrap gap-2">
            {nexus.strengths.map((s, i) => (
              <span key={i} className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-300">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses / gaps */}
      {nexus.weaknesses.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-yellow-400">
            <AlertTriangle className="h-4 w-4" /> Gap radar
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {nexus.weaknesses.map((w, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-surface-2/40 px-3 py-2">
                <span className="text-sm text-slate-300">{w.skill}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] capitalize ${w.status === "missing" ? "text-red-400" : "text-orange-300"}`}>
                    {w.status}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    w.priority === "high" ? "bg-red-500/15 text-red-300" : w.priority === "medium" ? "bg-orange-500/15 text-orange-300" : "bg-slate-500/15 text-slate-400"
                  }`}>
                    {w.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Internal recommendations */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-accent-soft" /> Recommended on Codempress
          </h4>
          {nexus.recommendations.internal.length > 0 ? (
            <ul className="space-y-2">
              {nexus.recommendations.internal.map((r, i) => (
                <li key={i}>
                  <a href={r.url} className="card card-hover flex items-center gap-3 p-3">
                    <BookOpen className="h-4 w-4 flex-shrink-0 text-accent-soft" />
                    <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                    <TypeBadge type={r.type} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-faint">No internal matches yet — upload a richer resume.</p>
          )}
        </div>

        {/* External resources */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ExternalLink className="h-4 w-4 text-accent-soft" /> Curated external resources
          </h4>
          {nexus.recommendations.external.length > 0 ? (
            <ul className="space-y-2">
              {nexus.recommendations.external.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card card-hover flex items-center gap-3 p-3"
                  >
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-faint" />
                    <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                    <TypeBadge type={r.type} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-faint">Increase detected skills to unlock curated matches.</p>
          )}
        </div>
      </div>

      {/* Improvement plan */}
      <div className="mt-6">
        <h4 className="mb-3 text-sm font-semibold">Improvement plan</h4>
        <div className="grid gap-4 md:grid-cols-3">
          {(["shortTerm", "mediumTerm", "longTerm"] as const).map((phase) => (
            <div key={phase} className="rounded-xl border border-line bg-surface-2/40 p-4">
              <h5 className="mb-2 flex items-center gap-2 text-xs font-semibold capitalize text-faint">
                {PLAN_ICONS[phase]} {phase === "shortTerm" ? "This week" : phase === "mediumTerm" ? "This month" : "Quarter ahead"}
              </h5>
              <ul className="space-y-2">
                {nexus.improvementPlan[phase].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-soft" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
