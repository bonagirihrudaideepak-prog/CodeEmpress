"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Target,
  ArrowLeft,
  CheckCircle2,
  Map,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { Card, SectionHeading, Badge } from "@/components/ui/primitives";

const ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "AI / Machine Learning Engineer",
  "DevOps Engineer",
  "Mobile Developer",
  "Security Engineer",
];

type RoadmapPhase = {
  title: string;
  description?: string;
  milestones?: string[];
};
type GeneratedRoadmap = {
  title: string;
  timeline: string;
  targetedSkills?: string[];
  phases?: RoadmapPhase[];
};

export default function GenerateRoadmapPage() {
  const router = useRouter();
  const [role, setRole] = useState(ROLES[0]);
  const [weeks, setWeeks] = useState("8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedRoadmap | null>(null);
  const [openPhase, setOpenPhase] = useState<number | null>(0);

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data.roadmap || data);
    } catch (e: any) {
      setError(e.message || "Could not generate a roadmap.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <a href="/roadmaps" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All Roadmaps
        </a>

        <SectionHeading
          title="Generate a Custom Roadmap"
          subtitle="AI builds a personalized learning path from your target role, skills, and resume gaps."
        />

        <Card className="mb-6 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Target role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent-soft"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Timeline (weeks)</label>
              <select
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent-soft"
              >
                {["4", "8", "12", "16", "24"].map((w) => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <Target className="h-4 w-4 text-accent-soft" />
            Uses your profile skills, uploaded resume gaps, and target role.
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="btn btn-primary mt-5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate My Roadmap"}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </Card>

        {result && (
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Map className="h-5 w-5 text-accent-soft" />
              <h2 className="text-xl font-bold">{result.title}</h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">{result.timeline}</p>

            {result.targetedSkills && result.targetedSkills.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-semibold">Targeted skills</h3>
                <div className="flex flex-wrap gap-2">
                  {result.targetedSkills.map((s) => (
                    <span key={s} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent-soft">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.phases && result.phases.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Phases</h3>
                {result.phases.map((p, i) => (
                  <div key={i} className="rounded-xl border border-line bg-surface-2/40">
                    <button
                      onClick={() => setOpenPhase(openPhase === i ? null : i)}
                      className="flex w-full items-center justify-between px-4 py-3"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-soft">
                          {i + 1}
                        </span>
                        {p.title}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openPhase === i ? "rotate-180" : ""}`} />
                    </button>
                    {openPhase === i && (
                      <div className="border-t border-line px-4 py-3">
                        {p.description && <p className="mb-2 text-sm text-slate-400">{p.description}</p>}
                        <ul className="space-y-1.5">
                          {(p.milestones || []).map((m) => (
                            <li key={m} className="flex items-start gap-2 text-sm text-slate-300">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => router.push("/dashboard")} className="btn btn-ghost mt-6">
              Save &amp; Go to Dashboard
            </button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
