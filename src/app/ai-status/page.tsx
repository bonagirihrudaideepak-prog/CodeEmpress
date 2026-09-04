"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, XCircle, Zap, RefreshCw, Info } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { Badge } from "@/components/ui/primitives";

type LimitStatus = {
  rpmRemaining: number | null;
  rpmUsed: number | null;
  rpdRemaining: number | null;
  rpdUsed: number | null;
  limited: boolean;
};

type ProviderStatus = {
  id: string;
  label: string;
  kind: string;
  enabled: boolean;
  baseURL: string | null;
  apiKeyMasked: string | null;
  fastModel: string;
  smartModel: string;
  freeModels: string[];
  freeTier: boolean;
  rpm: number | null;
  rpd: number | null;
  note: string | null;
  coolingDownFor: number | null;
  limit: LimitStatus;
};

type StatusData = {
  generatedAt: string;
  freeTier: { freeMode: boolean; note: string };
  providers: ProviderStatus[];
  activeProviderCount: number;
  activeProviderIds: string[];
  canRunAI: boolean;
  note: string;
};

export default function AIStatusPage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/ai-status");
  }, [status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/status");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  if (status === "loading" || (loading && !data)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <AppShell variant="page">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Zap className="h-7 w-7 text-yellow-400" />
            AI Provider Status
          </h1>
          <button
            onClick={load}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        <p className="mb-6 text-slate-400">
          Which AI providers are active, what models they use, and whether the
          fallback chain is running.
        </p>

        {!data ? (
          <p className="text-slate-400">No status data.</p>
        ) : (
          <div className="space-y-6">
            {/* Overall banner */}
            <div
              className={`card p-5 ${
                data.canRunAI
                  ? "border-green-500/30 bg-green-500/10"
                  : "bg-surface/40"
              }`}
            >
              <div className="flex items-center gap-3">
                {data.canRunAI ? (
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-slate-400" />
                )}
                <div>
                  <p className="font-semibold">
                    {data.canRunAI ? "Live AI active" : "Offline mode"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{data.note}</p>
                </div>
              </div>
            </div>

            {/* Free tier */}
            <div className="card border-yellow-500/30 bg-yellow-500/5 p-5">
              <div className="mb-1 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="font-semibold">Free tier mode</span>
                <Badge tone={data.freeTier.freeMode ? "green" : "red"} className="text-xs">
                  {data.freeTier.freeMode ? "ON" : "OFF"}
                </Badge>
              </div>
              <p className="text-sm text-slate-300">{data.freeTier.note}</p>
            </div>

            {/* Provider catalog */}
            <div className="grid gap-4">
              {data.providers.map((p) => (
                <div
                  key={p.id}
                  className={`card p-5 ${p.enabled ? "" : "opacity-70"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.label}</span>
                      <span className="text-xs capitalize text-slate-500">({p.kind})</span>
                      <Badge tone={p.freeTier ? "green" : "yellow"} className="text-xs">
                        {p.freeTier ? "Free" : "Paid"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.coolingDownFor != null && (
                        <span className="text-xs text-orange-300">
                          cooling {p.coolingDownFor}s
                        </span>
                      )}
                      {p.enabled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <XCircle className="h-4 w-4" /> Add key to enable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Fast model</dt>
                      <dd className="font-mono text-slate-200">{p.fastModel}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Smart model</dt>
                      <dd className="font-mono text-slate-200">{p.smartModel}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">API key</dt>
                      <dd className="font-mono text-slate-200">{p.apiKeyMasked ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Endpoint</dt>
                      <dd className="truncate font-mono text-slate-200">
                        {p.baseURL ?? "native provider"}
                      </dd>
                    </div>
                  </div>

                  {/* Free-tier limit status */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs">
                    {p.enabled && p.limit.limited && (
                      <span className="badge border-orange-500/30 bg-orange-500/10 px-2 py-1 text-orange-300">
                        Quota hit — skipped until window resets
                      </span>
                    )}
                    {p.rpm != null && (
                      <span className="badge border-line bg-surface-2 px-2 py-1 text-slate-300">
                        RPM {p.limit.rpmUsed ?? 0}/{p.rpm}
                      </span>
                    )}
                    {p.rpd != null && p.rpd > 0 && (
                      <span className="badge border-line bg-surface-2 px-2 py-1 text-slate-300">
                        RPD {p.limit.rpdUsed ?? 0}/{p.rpd}
                      </span>
                    )}
                    {p.note && <span className="text-slate-500">{p.note}</span>}
                  </div>

                  {/* All free models */}
                  {p.freeModels.length > 0 && (
                    <div className="mt-3 border-t border-line pt-3">
                      <div className="mb-1.5 text-xs text-slate-500">
                        Free models ({p.freeModels.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.freeModels.map((m) => (
                          <span
                            key={m}
                            className={`truncate rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${
                              m === p.fastModel || m === p.smartModel
                                ? "border-accent/40 bg-accent/10 text-accent-soft"
                                : "border-line bg-surface-2/60 text-slate-400"
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="flex items-start gap-2 text-xs text-slate-500">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Status reflects your <code>.env.local</code>. Add a real API key for
              any provider to enable it; on a 429 or error it cools down and the
              chain automatically moves to the next enabled provider.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
