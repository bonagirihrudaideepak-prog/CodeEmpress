import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Multi-provider AI client, FREE-TIER ONLY by default.
 *
 * Codempress maps the full free-model catalog (per provider) and a proactive
 * in-memory rate-limiter that honours each provider's free-tier RPM / RPD
 * limits *before* the remote API rejects us. On a 429/limit/error we also cool
 * the provider down and move to the next active one in the chain.
 *
 * A provider only becomes ACTIVE when a real key is present in the environment.
 * Env vars: <PROVIDER>_API_KEY (or _TOKEN), optional <PROVIDER>_FAST_MODEL /
 * <PROVIDER>_SMART_MODEL overrides, optional <PROVIDER>_BASE_URL.
 */

export type TaskKind = "fast" | "smart";

export interface ProviderConfig {
  id: string;
  label: string;
  kind: "google" | "openai";
  baseURL?: string;
  apiKey?: string;
  fastModel: string;
  smartModel: string;
  freeModels: string[]; // every known free model for this provider
  enabled: boolean;
  cooldownUntil?: number;
  cooldownMs: number;
  freeTier?: boolean;
  rpm?: number; // free-tier requests / minute
  rpd?: number; // free-tier requests / day
  note?: string;
}

function isRealKey(k?: string): boolean {
  if (!k) return false;
  const v = k.trim();
  if (v.length < 16) return false;
  if (/your|placeholder|replace|example|xxxx|sk-your|your_key|here/i.test(v)) return false;
  return true;
}

const now = () => Date.now();

const ENV_PREFIX: Record<string, string> = {
  openrouter: "OPENROUTER",
  opencode: "OPENCODE",
  kilo: "KILO",
  "github-models": "GITHUB",
  groq: "GROQ",
  google: "GOOGLE",
  mistral: "MISTRAL",
  huggingface: "HF",
  nvidia: "NVIDIA",
  cerebras: "CEREBRAS",
  sambanova: "SAMBANOVA",
  cloudflare: "CLOUDFLARE",
  cohere: "COHERE",
  deepinfra: "DEEPINFRA",
  openai: "OPENAI",
};

type Spec = {
  id: string;
  label: string;
  kind: "google" | "openai";
  baseURL?: string;
  keyEnv: string;
  altKeyEnv?: string;
  fastModel: string;
  smartModel: string;
  freeModels: string[];
  freeTier: boolean;
  cooldownMs?: number;
  rpm?: number;
  rpd?: number;
  note?: string;
};

/**
 * The full catalog, in fallback priority order, with every known free model.
 * Free models / limits come from the current free-model availability table.
 */
const SPECS: Spec[] = [
  {
    id: "google",
    label: "Google Gemini",
    kind: "google",
    keyEnv: "GOOGLE_GENERATIVE_AI_API_KEY",
    altKeyEnv: "GEMINI_API_KEY",
    fastModel: "gemini-2.5-flash-lite",
    smartModel: "gemini-2.5-flash",
    freeModels: [
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-3-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemma-4-26b",
      "gemma-4-31b",
    ],
    freeTier: true,
    rpm: 15,
    rpd: 1500,
    note: "Pro models are paid-only; free tier = Flash / Flash-Lite family.",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai",
    baseURL: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY",
    fastModel: "google/gemini-2.5-flash-lite:free",
    smartModel: "openai/gpt-oss-120b:free",
    freeModels: [
      "google/gemini-2.5-flash-lite:free",
      "openai/gpt-oss-120b:free",
      "openai/gpt-oss-20b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "deepseek/deepseek-chat-v3-0324:free",
      "deepseek/deepseek-r1:free",
      "qwen/qwen3.8-flash:free",
      "qwen/qwen3-coder:free",
      "zai-org/glm-5.2:free",
      "zai-org/glm-5.3-flash:free",
      "mistralai/mistral-small-3.2-24b-instruct:free",
      "poolside/laguna-s-2.1:free",
      "cohere/north-mini-code:free",
      "google/gemma-4-31b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "openrouter/cypher-alpha:free",
      "openrouter/sonoma-dusk-alpha:free",
      "openrouter/ox-alpha:free",
      "openrouter/free",
    ],
    freeTier: true,
    rpm: 20,
    rpd: 50,
    note: ":free = $0. 20 RPM; 50/day until a one-time $10 top-up.",
  },
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    kind: "openai",
    baseURL: "https://integrate.api.nvidia.com/v1",
    keyEnv: "NVIDIA_API_KEY",
    fastModel: "meta/llama-3.1-8b-instruct",
    smartModel: "meta/llama-3.3-70b-instruct",
    freeModels: [
      "meta/llama-3.1-8b-instruct",
      "meta/llama-3.3-70b-instruct",
      "nvidia/nemotron-3-ultra-550b-a55b",
      "nvidia/nemotron-3-super-120b-a12b",
      "nvidia/nemotron-3-nano-30b-a3b",
      "mistralai/mistral-small-3.1-24b-instruct",
      "qwen/qwen-3.5-397b-a17b",
      "deepseek-ai/deepseek-r1",
    ],
    freeTier: true,
    rpm: 40,
    rpd: 1000,
    note: "Open-weight models, nvapi-... keys, no token caps.",
  },
  {
    id: "groq",
    label: "Groq",
    kind: "openai",
    baseURL: "https://api.groq.com/openai/v1",
    keyEnv: "GROQ_API_KEY",
    fastModel: "llama-3.1-8b-instant",
    smartModel: "llama-3.3-70b-versatile",
    freeModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-3.2-3b",
      "llama-3.2-1b",
      "llama-3.2-11b-vision",
      "llama-3.2-90b-vision",
      "mixtral-8x7b",
      "gemma-2-9b-it",
      "llama-guard-3-8b",
      "distil-whisper-large-v3",
      "groq/compound",
      "groq/compound-mini",
    ],
    freeTier: true,
    rpm: 30,
    rpd: 14400,
    note: "Ultra-fast LPU inference; limits are per-model.",
  },
  {
    id: "cerebras",
    label: "Cerebras",
    kind: "openai",
    baseURL: "https://api.cerebras.ai/v1",
    keyEnv: "CEREBRAS_API_KEY",
    fastModel: "meta-llama/Llama-3.1-8B-Instruct",
    smartModel: "meta-llama/Llama-3.3-70B-Instruct",
    freeModels: [
      "meta-llama/Llama-3.1-8B-Instruct",
      "meta-llama/Llama-3.3-70B-Instruct",
      "qwen/qwen-3-235b-a22b-instruct",
      "zai-org/glm-4.6",
      "openai/gpt-oss-120b",
    ],
    freeTier: true,
    rpm: 30,
    rpd: 14400,
    note: "Fastest inference; ~1M tokens/day, 8K context cap.",
  },
  {
    id: "sambanova",
    label: "SambaNova",
    kind: "openai",
    baseURL: "https://api.sambanova.ai/v1",
    keyEnv: "SAMBANOVA_API_KEY",
    fastModel: "Meta-Llama-3.1-8B-Instruct",
    smartModel: "Meta-Llama-3.1-70B-Instruct",
    freeModels: [
      "Meta-Llama-3.1-8B-Instruct",
      "Meta-Llama-3.1-70B-Instruct",
      "Meta-Llama-3.1-405B-Instruct",
      "Meta-Llama-4-Maverick-17B-128E-Instruct",
      "deepseek-ai/DeepSeek-R1",
      "Qwen/Qwen3-32B",
      "deepseek-ai/DeepSeek-V3.2",
    ],
    freeTier: true,
    rpm: 30,
    rpd: 12000,
    note: "Per-model daily resets; up to 20M tokens/day.",
  },
  {
    id: "mistral",
    label: "Mistral AI",
    kind: "openai",
    baseURL: "https://api.mistral.ai/v1",
    keyEnv: "MISTRAL_API_KEY",
    fastModel: "ministral-8b",
    smartModel: "mistral-small-latest",
    freeModels: [
      "ministral-8b",
      "mistral-small-3.1",
      "devstral-small",
      "pixtral-12b",
      "mistral-nemo",
      "codestral-mamba",
      "mathstral-7b",
      "mistral-large-3",
    ],
    freeTier: true,
    rpm: 30,
    rpd: 2000,
    note: "Free tier: ~1 req/s, up to 1B tokens/month (phone verification).",
  },
  {
    id: "cohere",
    label: "Cohere",
    kind: "openai",
    baseURL: "https://api.cohere.ai/compatibility/v1",
    keyEnv: "COHERE_API_KEY",
    fastModel: "command-r-plus",
    smartModel: "command-a",
    freeModels: [
      "command-r-plus",
      "command-r",
      "command-r7b",
      "command-a",
      "command-a-plus",
      "embed-4",
    ],
    freeTier: true,
    rpm: 20,
    rpd: 1000,
    note: "Free trial key, 1,000 calls/month, non-commercial use.",
  },
  {
    id: "opencode",
    label: "OpenCode Zen",
    kind: "openai",
    baseURL: "https://opencode.ai/zen/v1",
    keyEnv: "OPENCODE_API_KEY",
    fastModel: "deepseek-v4-flash-free",
    smartModel: "qwen3.6-plus-free",
    freeModels: [
      "deepseek-v4-flash-free",
      "mimo-v2.5-free",
      "qwen3.6-plus-free",
      "minimax-m3-free",
      "nemotron-3-ultra-free",
      "nemotron-3-super-free",
      "minimax-m2.5-free",
      "big-pickle",
    ],
    freeTier: true,
    rpm: 60,
    rpd: 1000,
    note: "Free models need a recognised client / User-Agent to avoid 429s.",
  },
  {
    id: "kilo",
    label: "Kilo Code",
    kind: "openai",
    baseURL: "https://api.kilocode.ai/v1",
    keyEnv: "KILO_API_KEY",
    fastModel: "kilo-auto/free",
    smartModel: "nvidia/nemotron-3-ultra-550b-a55b:free",
    freeModels: [
      "kilo-auto/free",
      "minimax/minimax-m2.5:free",
      "stepfun/step-3.7-flash:free",
      "stepfun/step-3.5-flash:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "poolside/laguna-s-2.1:free",
      "poolside/laguna-xs-2.1:free",
      "kilo/glm-4.5-air-free",
      "kilo/minimax-m2.5-free",
      "kilo/deepseek-r1-free",
      "x-ai/grok-code-fast-1:free",
      "mistral/devstral-2:free",
      "inclusionai/ling-2.6-1t:free",
      "tencent/hy3-preview:free",
    ],
    freeTier: true,
    rpm: 3,
    rpd: 200,
    note: "Kilo Gateway: ~200 req/hour, no card required.",
  },
  {
    id: "github-models",
    label: "GitHub Models",
    kind: "openai",
    baseURL: "https://models.inference.ai.azure.com/v1",
    keyEnv: "GITHUB_TOKEN",
    fastModel: "gpt-4o-mini",
    smartModel: "gpt-4o",
    freeModels: [
      "gpt-4o-mini",
      "gpt-4o",
      "o1",
      "o3-mini",
      "meta-llama/Llama-3.3-70B",
      "meta-llama/Llama-3.1-405B",
      "meta-llama/Llama-3.2-3B",
      "meta-llama/Llama-3.2-90B",
      "Phi-3.5",
      "Phi-4",
      "Mistral-Large-2",
      "Mistral-Small-3.1",
      "Gemma-2-27B",
      "Claude-3.5-Sonnet",
      "DeepSeek-R1",
      "Cohere-Command-R-Plus",
      "Cohere-Command-R7B",
    ],
    freeTier: true,
    rpm: 15,
    rpd: 150,
    note: "Free prototyping tier; 15 RPM, 150/day, ~8K in / 4K out tokens.",
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    kind: "openai",
    baseURL: "https://api-inference.huggingface.co/v1",
    keyEnv: "HF_TOKEN",
    fastModel: "meta-llama/Meta-Llama-3-8B-Instruct",
    smartModel: "meta-llama/Meta-Llama-3-8B-Instruct",
    freeModels: [
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "black-forest-labs/FLUX.1-schnell",
      "openai/whisper-large-v3",
      "meta-llama/Llama-Prompt-Guard-2-86M",
      "google-bert/bert-base-uncased",
      "facebook/bart-large-cnn",
      "distilbert/distilbert-base-uncased",
    ],
    freeTier: true,
    rpm: 20,
    rpd: 33,
    note: "Tiny free allocation: ~$0.10/month credits, ~1,000 req/month.",
  },
  {
    id: "cloudflare",
    label: "Cloudflare Workers AI",
    kind: "openai",
    baseURL: "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/v1",
    keyEnv: "CLOUDFLARE_API_TOKEN",
    fastModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    smartModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    freeModels: [
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      "@cf/meta/llama-3.1-8b-instruct",
      "@cf/meta/llama-3.2-1b-instruct",
      "@cf/meta/llama-3.2-3b-instruct",
      "@cf/qwen/qwen2.5-coder-32b-instruct",
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      "@cf/google/gemma-3-12b-it",
      "@cf/black-forest-labs/flux-1-schnell",
      "@cf/openai/whisper-large-v3-turbo",
      "@cf/baai/bge-base-en-v1.5",
      "@cf/deepgram/nova-3",
    ],
    freeTier: true,
    rpm: 5,
    rpd: 300,
    note: "10,000 neurons/day. Set CLOUDFLARE_BASE_URL to your account URL.",
  },
  {
    id: "deepinfra",
    label: "DeepInfra",
    kind: "openai",
    baseURL: "https://api.deepinfra.com/v1/openai",
    keyEnv: "DEEPINFRA_API_KEY",
    fastModel: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    smartModel: "meta-llama/Meta-Llama-3.3-70B-Instruct",
    freeModels: [
      "meta-llama/Meta-Llama-3.1-8B-Instruct",
      "meta-llama/Meta-Llama-3.3-70B-Instruct",
    ],
    freeTier: false,
    rpm: 30,
    rpd: 0,
    note: "Paid (pay-per-token) with $5 signup credit — not a true free tier.",
  },
  {
    id: "custom",
    label: "Custom OpenAI-compatible",
    kind: "openai",
    baseURL: "https://opencode.ai/zen/v1",
    keyEnv: "CUSTOM_OPENAI_API_KEY",
    fastModel: "gpt-4o-mini",
    smartModel: "gpt-4o",
    freeModels: ["gpt-4o-mini", "gpt-4o"],
    freeTier: false,
    note: "Point CUSTOM_OPENAI_BASE_URL at any OpenAI-compatible endpoint.",
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    keyEnv: "OPENAI_API_KEY",
    fastModel: "gpt-4o-mini",
    smartModel: "gpt-4o",
    freeModels: ["gpt-4o-mini", "gpt-4o"],
    freeTier: false,
    note: "Paid last resort — only used if explicitly keyed.",
  },
];

function modelOverride(id: string, task: TaskKind): string | undefined {
  const prefix = ENV_PREFIX[id];
  if (!prefix) return undefined;
  const key = task === "fast" ? `${prefix}_FAST_MODEL` : `${prefix}_SMART_MODEL`;
  return process.env[key];
}

function buildConfig(spec: Spec): ProviderConfig {
  const apiKey = process.env[spec.keyEnv] || (spec.altKeyEnv && process.env[spec.altKeyEnv]);
  return {
    id: spec.id,
    label: spec.label,
    kind: spec.kind,
    baseURL: spec.baseURL,
    apiKey,
    enabled: isRealKey(apiKey),
    fastModel: modelOverride(spec.id, "fast") || spec.fastModel,
    smartModel: modelOverride(spec.id, "smart") || spec.smartModel,
    freeModels: spec.freeModels,
    cooldownMs: spec.cooldownMs ?? 60_000,
    freeTier: spec.freeTier,
    rpm: spec.rpm,
    rpd: spec.rpd,
    note: spec.note,
  };
}

// --- Registry ---
function buildRegistry(): ProviderConfig[] {
  return SPECS.map(buildConfig);
}
let registryCache: ProviderConfig[] | null = null;
function registry(): ProviderConfig[] {
  return registryCache ?? (registryCache = buildRegistry());
}

/* ------------------------------------------------------------------ */
/* Proactive free-tier rate limiter (in-memory sliding window).        */
/* ------------------------------------------------------------------ */
const RPM_WINDOW = 60_000;
const RPD_WINDOW = 24 * 60 * 60 * 1000;

type Usage = { rpm: number[]; rpd: number[] };
const usage = new Map<string, Usage>();

function recordUse(id: string) {
  const t = now();
  const u = usage.get(id) ?? { rpm: [], rpd: [] };
  u.rpm.push(t);
  u.rpd.push(t);
  usage.set(id, u);
}

function windowCount(ts: number[], nowTs: number, windowMs: number): number {
  const cut = nowTs - windowMs;
  let n = 0;
  for (const t of ts) if (t > cut) n++;
  return n;
}

export type LimitStatus = {
  rpmRemaining: number | null;
  rpmUsed: number | null;
  rpdRemaining: number | null;
  rpdUsed: number | null;
  limited: boolean;
};

/** Whether a provider is within its free-tier window budget right now. */
function withinBudget(p: ProviderConfig, nowTs: number): boolean {
  const u = usage.get(p.id);
  if (!u) return true; // nothing used yet
  if (p.rpm != null && windowCount(u.rpm, nowTs, RPM_WINDOW) >= p.rpm) return false;
  if (p.rpd != null && p.rpd > 0 && windowCount(u.rpd, nowTs, RPD_WINDOW) >= p.rpd) return false;
  return true;
}

/** Current budget / limit metrics for a provider (for the status UI). */
function limitStatus(p: ProviderConfig, nowTs: number): LimitStatus {
  const u = usage.get(p.id);
  const rpmUsed = p.rpm != null ? windowCount(u?.rpm ?? [], nowTs, RPM_WINDOW) : null;
  const rpdUsed = p.rpd != null && p.rpd > 0 ? windowCount(u?.rpd ?? [], nowTs, RPD_WINDOW) : null;
  return {
    rpmRemaining: rpmUsed != null && p.rpm != null ? Math.max(0, p.rpm - rpmUsed) : null,
    rpmUsed,
    rpdRemaining: rpdUsed != null && p.rpd != null ? Math.max(0, p.rpd - rpdUsed) : null,
    rpdUsed,
    limited: !withinBudget(p, nowTs),
  };
}

// --- Active providers (enabled + not cooling down + within budget) ---
export function activeProviders(): ProviderConfig[] {
  const t = now();
  return registry().filter(
    (p) =>
      p.enabled &&
      (!p.cooldownUntil || p.cooldownUntil <= t) &&
      withinBudget(p, t)
  );
}

export interface ProviderStatus {
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
}

/** Snapshot of ALL catalog providers (whether keyed or not) for the status UI. */
export function getAIStatus(): ProviderStatus[] {
  const t = now();
  return registry().map((p) => ({
    id: p.id,
    label: p.label,
    kind: p.kind,
    enabled: p.enabled,
    baseURL: p.baseURL ?? null,
    apiKeyMasked: p.apiKey ? maskKey(p.apiKey) : null,
    fastModel: p.fastModel,
    smartModel: p.smartModel,
    freeModels: p.freeModels,
    freeTier: p.freeTier ?? false,
    rpm: p.rpm ?? null,
    rpd: p.rpd ?? null,
    note: p.note ?? null,
    coolingDownFor: p.cooldownUntil && p.cooldownUntil > t ? Math.round((p.cooldownUntil - t) / 1000) : null,
    limit: limitStatus(p, t),
  }));
}

function maskKey(key: string): string {
  if (key.length < 8) return "••••";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/** Free-tier recommendation report (what the app is configured to use). */
export function freeTierReport(): { freeMode: boolean; note: string } {
  const freeMode = process.env.FREE_TIER !== "false";
  return {
    freeMode,
    note: freeMode
      ? "FREE_TIER is on — every provider resolves to its free / open-weight models, and free-tier RPM/RPD limits are enforced before each call."
      : "FREE_TIER is off — defaults may use paid models.",
  };
}

function providerModel(p: ProviderConfig, task: TaskKind) {
  if (p.kind === "google") {
    const google = createGoogleGenerativeAI({ apiKey: p.apiKey });
    return google(task === "fast" ? p.fastModel : p.smartModel);
  }
  const openai = createOpenAI({ apiKey: p.apiKey, baseURL: p.baseURL });
  return openai(task === "fast" ? p.fastModel : p.smartModel);
}

/** Pick the first active (ready) provider for a task. */
export function pickModel(task: TaskKind): unknown {
  const chain = activeProviders();
  if (chain.length === 0) return null;
  return providerModel(chain[0], task);
}

/**
 * Run a callback against the active provider chain with automatic fallback.
 * Records usage against each provider's free-tier budget, cools down on a
 * 429/limit, and moves to the next active provider. Returns `{ provider, result }`.
 */
export async function withProviderFallback<T>(
  task: TaskKind,
  fn: (model: any) => Promise<T>
): Promise<{ provider: string; result: T }> {
  let chain = activeProviders();
  if (chain.length === 0) {
    const anyConfigured = registry().some((p) => p.enabled);
    throw new Error(
      anyConfigured
        ? "All configured AI providers are temporarily rate-limited (free-tier quota exhausted). Retry in a minute, or add another provider."
        : "No AI provider is configured. Add a real key for Google, OpenRouter, Groq, NVIDIA, etc. (see /ai-status)."
    );
  }

  let lastError: unknown = null;
  for (const p of chain) {
    try {
      recordUse(p.id);
      const result = await fn(providerModel(p, task));
      return { provider: p.label, result };
    } catch (e: any) {
      lastError = e;
      const status = e?.statusCode || e?.status || (/\b429\b|\brate\b|\bquota\b|\blimit\b|\bcooldown\b/i.test(String(e?.message || "")) ? 429 : undefined);
      if (status === 429) {
        console.warn(`[ai] rate-limited on ${p.label}; cooling down ${p.cooldownMs}ms`);
        p.cooldownUntil = now() + p.cooldownMs;
      } else {
        console.warn(`[ai] provider ${p.label} failed: ${e?.message}`);
      }
    }
  }

  // Retry pass over providers that never cooled down / aren't budget-blocked.
  chain = activeProviders();
  for (const p of chain) {
    try {
      recordUse(p.id);
      const result = await fn(providerModel(p, task));
      return { provider: p.label, result };
    } catch (e: any) {
      lastError = e;
    }
  }

  throw lastError || new Error("All AI providers failed.");
}
