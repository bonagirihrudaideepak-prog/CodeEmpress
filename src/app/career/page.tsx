"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/ui/app-shell";
import { Card, Badge, SectionHeading } from "@/components/ui/primitives";
import { Briefcase, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";

const STATUSES = ["APPLIED", "PHONE_SCREEN", "TECHNICAL", "ONSITE", "OFFER", "REJECTED", "WITHDRAWN"] as const;

// Sequenced funnel used to render progress through the hiring process.
const STAGES = ["APPLIED", "PHONE_SCREEN", "TECHNICAL", "ONSITE", "OFFER"] as const;

function stageIndex(s: string) {
  const i = STAGES.indexOf(s as (typeof STAGES)[number]);
  return i;
}
function reachedStage(status: string, stage: string) {
  // REJECTED/WITHDRAWN don't advance the funnel; otherwise compare indices.
  if (status === "REJECTED" || status === "WITHDRAWN") return false;
  const si = stageIndex(status);
  const gi = stageIndex(stage);
  return si >= gi && si >= 0;
}

type Interview = { id: string; type: string; scheduledAt: string | null; score: number | null; feedback: string | null };
type Application = {
  id: string;
  company: string;
  position: string;
  status: string;
  location: string | null;
  salaryRange: string | null;
  notes: string | null;
  interviews: Interview[];
};
type CareerData = { applications: Application[]; interviews: Interview[]; readiness: number };

export default function CareerPage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [url, setUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/career");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/career");
    else if (status === "authenticated") load();
  }, [status, router, load]);

  async function addApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;
    const res = await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, position, jobUrl: url }),
    });
    if (res.ok) {
      toast.success("Application added");
      setCompany(""); setPosition(""); setUrl("");
      load();
    } else {
      toast.error("Could not add application");
    }
  }

  async function setStatus(id: string, next: string) {
    const res = await fetch(`/api/career/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) load();
  }

  async function remove(id: string) {
    await fetch(`/api/career/applications/${id}`, { method: "DELETE" });
    load();
  }

  async function addInterview(app: Application) {
    // Curated interview-type templates (sequenced role progression).
    const type = window.prompt(
      "Interview type — pick from a template:\n" +
        "phone_screen · technical · behavioral · system_design · onsite · final_round",
      "technical"
    );
    if (!type) return;
    const score = prompt("Score (0-100). Leave blank to mark as scheduled:", "");
    const res = await fetch(`/api/career/applications/${app.id}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, score: score ? Number(score) : undefined, feedback: score ? undefined : "scheduled" }),
    });
    if (res.ok) toast.success("Interview recorded");
    load();
  }

  if (status === "loading" || (loading && !data)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title="Career Hub"
          subtitle="Track applications and interviews, and see your job readiness."
          action={
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Readiness</span>
              <Badge tone={data && data.readiness >= 70 ? "green" : data && data.readiness >= 35 ? "yellow" : "orange"}>
                {data ? `${data.readiness}%` : "—"}
              </Badge>
            </div>
          }
        />

        {/* Add application */}
        <Card className="mb-8 p-5">
          <form onSubmit={addApplication} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input className="input" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            <input className="input" placeholder="Position" value={position} onChange={(e) => setPosition(e.target.value)} />
            <input className="input" placeholder="Job URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
            <button type="submit" className="btn btn-primary">
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
        </Card>

        {/* Applications */}
        <SectionHeading title="Applications" subtitle={`${data?.applications.length ?? 0} tracked`} />
        {data && data.applications.length === 0 ? (
          <Card className="mb-8 p-8 text-center text-slate-400">
            No applications yet — add your first to start tracking your job search.
          </Card>
        ) : (
          <div className="mb-8 space-y-3">
            {data?.applications.map((app) => (
              <Card key={app.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                      <Briefcase className="h-5 w-5 text-accent-soft" />
                    </div>
                    <div>
                      <div className="font-semibold">{app.position}</div>
                      <div className="text-sm text-slate-400">
                        {app.company}
                        {app.location ? ` · ${app.location}` : ""}
                        {app.salaryRange ? ` · ${app.salaryRange}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => setStatus(app.id, e.target.value)}
                      className="input !w-auto !py-1.5 text-sm"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                    <button onClick={() => remove(app.id)} className="btn btn-ghost btn-sm" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Application sequencing funnel */}
                <div className="mt-4 border-t border-line pt-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {STAGES.map((stage, i) => {
                      const reached = reachedStage(app.status, stage);
                      const isCurrent = app.status === stage;
                      return (
                        <div key={stage} className="flex items-center gap-1.5">
                          <span
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              reached
                                ? "bg-green-500/15 text-green-300"
                                : isCurrent
                                ? "bg-accent/15 text-accent-soft"
                                : "bg-surface-2 text-slate-500"
                            }`}
                          >
                            {reached && i < STAGES.length - 1 ? <CheckCircle2 className="h-3 w-3" /> : null}
                            {stage.replace("_", " ")}
                          </span>
                          {i < STAGES.length - 1 && <span className="text-slate-600">→</span>}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Advance via the status dropdown. Offer = stage {STAGES.length}/{STAGES.length}.
                  </p>
                </div>

                {app.interviews.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {app.interviews.map((iv) => (
                      <div key={iv.id} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="capitalize">{iv.type.replace("_", " ")}</span>
                        {iv.score != null && <span className="text-slate-400">· score {iv.score}/100</span>}
                        {iv.scheduledAt && <span className="text-slate-500">· {new Date(iv.scheduledAt).toLocaleDateString()}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => addInterview(app)} className="mt-3 text-xs text-slate-400 hover:text-white">
                  + Log interview
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* All interviews */}
        {data && data.interviews.length > 0 && (
          <>
            <SectionHeading title="All Interviews" subtitle={`${data.interviews.length} total`} />
            <div className="grid gap-3 sm:grid-cols-2">
              {data.interviews.map((iv) => (
                <Card key={iv.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm capitalize">{iv.type.replace("_", " ")}</span>
                    {iv.score != null && <Badge tone={iv.score >= 70 ? "green" : "yellow"}>{iv.score}/100</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{iv.feedback || "Scheduled"}</p>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
