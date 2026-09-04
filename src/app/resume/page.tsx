"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/ui/app-shell";
import { DevelopmentWindow } from "@/components/nexus/development-window";
import type { Nexus } from "@/lib/ai/nexus";
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Target,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
} from "lucide-react";

type Analysis = {
  score: number;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingSkills: string[];
  experienceLevel: string;
  detectedSkills: string[];
  targetRoles: string[];
  summary: string;
};

type Stage = "idle" | "uploading" | "parsing" | "analyzing" | "done" | "error";

const stepLabel: Record<Stage, string> = {
  idle: "Drop your resume to begin",
  uploading: "Uploading file…",
  parsing: "Reading document…",
  analyzing: "AI is analyzing your resume…",
  done: "Analysis complete",
  error: "Something went wrong",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function scoreRingColor(score: number) {
  if (score >= 80) return "stroke-green-400";
  if (score >= 60) return "stroke-yellow-400";
  return "stroke-red-400";
}

export default function ResumePage() {
  const router = useRouter();
  const { status } = useSession();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [nexus, setNexus] = useState<Nexus | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("strengths");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/resume");
  }, [status, router]);

  // Simulated-progress timer so the UI feels alive during parse/analyze
  useEffect(() => {
    if (stage === "uploading" || stage === "parsing" || stage === "analyzing") {
      setProgress(8);
      const timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 12 : p));
      }, 250);
      return () => clearInterval(timer);
    }
    if (stage === "done") setProgress(100);
  }, [stage]);

  async function handleFile(file: File) {
    setError("");
    setAnalysis(null);

    const okTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];
    if (!okTypes.includes(file.type)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      setStage("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is over 10 MB. Please upload a smaller file.");
      setStage("error");
      return;
    }

    setFileName(file.name);
    setStage("uploading");

    // 1) Parse
    const parseForm = new FormData();
    parseForm.append("file", file);
    let parsed: string;
    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: parseForm,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to read the file.");
      }
      parsed = data.text;
      setStage("parsing");
    } catch (e: any) {
      setError(e.message || "Failed to read the file.");
      setStage("error");
      return;
    }

    // 2) Analyze
    setStage("analyzing");
    try {
      const res = await fetch("/api/ai/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: parsed,
          fileName: fileName,
          fileUrl: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze the resume.");
      }
      setAnalysis(data.analysis);
      setNexus(data.nexus ?? null);
      setStage("done");
      toast.success("Resume analyzed!");
    } catch (e: any) {
      setError(e.message || "Failed to analyze the resume.");
      setStage("error");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Redirecting…
      </div>
    );
  }

  const busy = stage === "uploading" || stage === "parsing" || stage === "analyzing";

  return (
    <AppShell variant="page">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3">
            Resume <span className="text-blue-400">Analysis</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Upload your resume and let AI score it, identify your strengths and
            gaps, and tell you exactly what to improve.
          </p>
        </div>

        {/* Upload zone */}
        {stage === "idle" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`mx-auto max-w-2xl border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition ${
              dragOver
                ? "border-blue-400 bg-blue-500/10"
                : "border-slate-700 hover:border-slate-500 bg-slate-900/40"
            }`}
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5">
              <UploadCloud className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xl font-semibold mb-2">
              Drag & drop your resume here
            </p>
            <p className="text-slate-400 text-sm mb-4">
              or click to browse — PDF, DOCX, or TXT (max 10 MB)
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm transition">
              Choose File
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {/* Progress */}
        {busy && (
          <div className="mx-auto max-w-2xl p-8 rounded-2xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-5">
              <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
              <div>
                <p className="font-semibold">{stepLabel[stage]}</p>
                <p className="text-sm text-slate-400 truncate">{fileName}</p>
              </div>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {stage === "error" && (
          <div className="mx-auto max-w-2xl p-8 rounded-2xl border border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <p className="font-semibold">Could not process the file</p>
            </div>
            <p className="text-slate-300 mb-4">{error}</p>
            <button
              onClick={() => setStage("idle")}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
            >
              Try another file
            </button>
          </div>
        )}

        {/* Results */}
        {stage === "done" && analysis && (
          <ResumeResults
            analysis={analysis}
            nexus={nexus}
            fileName={fileName}
            onReset={() => {
              setStage("idle");
              setAnalysis(null);
              setNexus(null);
            }}
            openSection={openSection}
            setOpenSection={setOpenSection}
          />
        )}
      </div>
    </AppShell>
  );
}

function ScoreRing({ value }: { value: number }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative w-40 h-40">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className="stroke-slate-800"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={`${scoreRingColor(value)} transition-all duration-1000`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{value}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  icon,
  accent,
  children,
  open,
  onToggle,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-900/60 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
            {icon}
          </div>
          <span className="font-semibold">{title}</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-800/60 pt-4">{children}</div>
      )}
    </div>
  );
}

function ResumeResults({
  analysis,
  nexus,
  fileName,
  onReset,
  openSection,
  setOpenSection,
}: {
  analysis: Analysis;
  nexus: Nexus | null;
  fileName: string;
  onReset: () => void;
  openSection: string | null;
  setOpenSection: (s: string | null) => void;
}) {
  const levels = ["entry", "junior", "mid", "senior", "lead"];

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <ScoreRing value={analysis.score} />
        </div>
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-xs uppercase tracking-wide text-purple-400 font-medium">
              {fileName}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Overall Score:{" "}
            <span className={scoreColor(analysis.score)}>{analysis.score}/100</span>
          </h2>
          <p className="text-slate-300 mb-4">{analysis.summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="block text-xs text-slate-400">ATS Score</span>
              <span className={`text-lg font-bold ${scoreColor(analysis.atsScore)}`}>
                {analysis.atsScore}/100
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="block text-xs text-slate-400">Experience</span>
              <span className="text-lg font-bold capitalize">
                {analysis.experienceLevel}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="block text-xs text-slate-400">Best Fit</span>
              <span className="text-lg font-bold">{analysis.targetRoles.slice(0, 2).join(", ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detected skills */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="font-semibold mb-4">Detected Skills</h3>
        {analysis.detectedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {analysis.detectedSkills.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No well-known skills detected.</p>
        )}
      </div>

      {/* Expandable sections */}
      <div className="space-y-3">
        <Section
          id="strengths"
          title="Strengths"
          accent="bg-green-500/10 text-green-400"
          icon={<CheckCircle2 className="h-5 w-5" />}
          open={openSection === "strengths"}
          onToggle={() =>
            setOpenSection(openSection === "strengths" ? null : "strengths")
          }
        >
          <ul className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="weaknesses"
          title="Weaknesses"
          accent="bg-red-500/10 text-red-400"
          icon={<AlertTriangle className="h-5 w-5" />}
          open={openSection === "weaknesses"}
          onToggle={() =>
            setOpenSection(openSection === "weaknesses" ? null : "weaknesses")
          }
        >
          <ul className="space-y-2">
            {analysis.weaknesses.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-200">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="suggestions"
          title="Actionable Suggestions"
          accent="bg-blue-500/10 text-blue-400"
          icon={<Lightbulb className="h-5 w-5" />}
          open={openSection === "suggestions"}
          onToggle={() =>
            setOpenSection(openSection === "suggestions" ? null : "suggestions")
          }
        >
          <ul className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-200">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="missing"
          title="Missing Skills"
          accent="bg-purple-500/10 text-purple-400"
          icon={<Target className="h-5 w-5" />}
          open={openSection === "missing"}
          onToggle={() =>
            setOpenSection(openSection === "missing" ? null : "missing")
          }
        >
          {analysis.missingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm capitalize"
                >
                  + {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              Great — no major gaps detected for the target role.
            </p>
          )}
        </Section>
      </div>

      {/* Nexus Development Window */}
      {nexus && <DevelopmentWindow nexus={nexus} />}

      {/* Next step CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <a
          href="/roadmaps"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition"
        >
          Continue My Roadmap <ArrowRight className="h-4 w-4" />
        </a>
        <button
          onClick={onReset}
          className="px-6 py-3 border border-slate-700 hover:border-slate-500 rounded-xl text-sm font-medium transition"
        >
          Analyze Another Resume
        </button>
      </div>
    </div>
  );
}
