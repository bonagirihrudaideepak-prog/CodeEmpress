# ⚡ Codempress

An AI-powered **developer career operating system**. Upload your resume → get a
personalized learning roadmap → master the skills you need → land the job you
want.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + `lucide-react`
- **Database:** PostgreSQL + Prisma (27 tables)
- **Auth:** NextAuth v5 (Auth.js) — Credentials + Google/GitHub OAuth
- **AI:** Vercel AI SDK v7 (`ai` + `@ai-sdk/openai`)
- **State:** Zustand · **Toasts:** react-hot-toast · **Uploads:** UploadThing

## Project structure

```
prisma/schema.prisma        # Full DB schema (27 models/enums)
src/lib/db.ts               # Prisma singleton
src/lib/auth.ts             # NextAuth v5 config (adapter + providers)
src/lib/ai/                 # AI service layer
  ├─ client.ts              # Model routing (fast / smart / embedding)
  ├─ resume-analyzer.ts     # generateObject → structured resume feedback (+ offline heuristic fallback)
  ├─ roadmap-generator.ts   # generateObject → personalized learning roadmap
  └─ chat.ts                # streamText with a context-aware system prompt
src/lib/utils.ts            # cn() helper
src/app/api/ai/             # POST routes: analyze-resume, generate-roadmap, chat
src/app/api/auth/           # [...nextauth]/route.ts + register/route.ts
src/app/api/resume/parse    # POST route: extracts text from PDF / DOCX / TXT
src/app/page.tsx            # Landing page
src/app/login|signup        # Auth UI
src/app/dashboard/page.tsx  # Protected dashboard (server component)
src/app/resume/page.tsx     # Upload + AI analysis UI (drag-drop, score ring, insights)
src/app/roadmap|chat|courses # Placeholders (ComingSoon)
src/components/             # SignOutButton, icons, Providers, ComingSoon
src/proxy.ts                # Route protection (Next.js 16 "proxy")
```

## Getting started

```bash
npm install
npx prisma generate
npx prisma db push          # create/update tables
npm run dev                 # http://localhost:3000
```

### Environment variables

Copy into `.env` / `.env.local`. See `.env.local` for a working local setup.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/codempress"
AUTH_SECRET="..."
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OAuth (optional — app still runs with Credentials login)
GOOGLE_CLIENT_ID=...  GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...  GITHUB_CLIENT_SECRET=...

# AI (required for the /api/ai/* routes)
OPENAI_API_KEY=...

# Uploads
UPLOADTHING_SECRET=...  UPLOADTHING_APP_ID=...
```

> **Note:** OAuth providers are only registered when real credentials are
> present (placeholders in `.env` are skipped). Credentials (email + password)
> sign-up/login always work.
>
> **AI without OpenAI:** Codempress uses a **multi-provider fallback chain**
> (`src/lib/ai/client.ts`). Configure any of these with a real key and it becomes
> the active provider — on a 429/limit/error it cools down and automatically
> moves to the next. When no provider is configured, the chat and resume
> analysis degrade gracefully to offline/heuristic responses (never hard-fail).
>
> **Provider order:** Google (Gemini) → OpenRouter → NVIDIA NIM → OpenCode/Kilo
> Code/custom (OpenAI-compatible) → OpenAI (last resort).
>
> | Provider | Env vars | Notes |
> |---|---|---|
> | Google Gemini | `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_FAST_MODEL`, `GOOGLE_SMART_MODEL` | native `@ai-sdk/google` |
> | OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_FAST_MODEL` | OpenAI-compatible, `https://openrouter.ai/api/v1` |
> | NVIDIA NIM | `NVIDIA_API_KEY`, `NVIDIA_BASE_URL` | OpenAI-compatible, `https://integrate.api.nvidia.com/v1` |
> | OpenCode / Kilo Code | `OPENCODE_BASE_URL`+`OPENCODE_API_KEY` / `KILO_BASE_URL`+`KILO_API_KEY` | these are coding-agent clients; point at an OpenAI-compatible endpoint |
> | Custom | `CUSTOM_OPENAI_BASE_URL`+`CUSTOM_OPENAI_API_KEY` | any OpenAI-compatible endpoint |
> | OpenAI | `OPENAI_API_KEY` | optional last resort |

## Auth design

- Credentials provider uses the optional `User.password` field, hashed with
  `bcryptjs` (`src/app/api/auth/register/route.ts`).
- OAuth providers (Google, GitHub) use `@auth/prisma-adapter` with JWT sessions.
- `types/next-auth.d.ts` augments `Session.user.id`.
- `src/proxy.ts` redirects unauthenticated users away from `/dashboard`.

## Content production

The content standard lives in [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md).
Topics are authored as plain files under `content/topics/<slug>/` (see the guide
Appendix for the structure) and surfaced in a browser UI at `/content`.

**Workflow:**

```bash
# Scaffold a new topic (full 20-section template)
npm run topic:new <slug> "Title" --domain "Web Development" --category "JavaScript" \
  --module "JS Fundamentals" --difficulty INTERMEDIATE --time 45

# Validate one topic against the guide's metadata + 20 required sections + files
npm run topic:validate <slug>

# Validate every topic
npm run topic:validate:all
```

Edit `lesson.md`, drop examples into `examples/`, fill `quiz.json`, etc. The
`/content` page re-reads the filesystem on every request and shows a live
checklist of sections, files, and quiz questions.

**Schema:** the guide's hierarchy is modelled in Prisma as
`Course → Module → Topic → Lesson`. The `Topic` model carries the guide's
metadata (`difficulty`, `estimatedTime`, `tags`, `prerequisites`, `careerPaths`)
plus `contentStatus` (the review workflow enum) and `version` for versioning.

## Architecture docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the incoming target spec
  (offline-first mobile-ish app; FastAPI/SQLite/Vite/Capacitor).
- [`docs/ARCHITECTURE_ANALYSIS.md`](docs/ARCHITECTURE_ANALYSIS.md) —
  **comparison + recommendation** of that spec vs this Next.js build, with a
  portability map.
- [`docs/MOBILE_RUNBOOK.md`](docs/MOBILE_RUNBOOK.md) — exact steps to build the
  Capacitor mobile client + `CodeEmpress-debug.apk` (needs Java 17/Gradle 8/SDK).

## Arcane Library & gamification

The spec's core progression loop (docs/PRODUCT_SPEC.md) is implemented:

- **28 subjects** seeded (`prisma/curriculum.ts`, `npm run db:seed`) → 116 topics,
  116 quizzes, 468 questions.
- **XP / levels / streak / mastery** via `src/lib/gamification.ts`
  (Explorer → Apprentice → Journeyman → Master → Architect → Legend).
- **Sequential unlocking** — a topic unlocks only when all prior topics in its
  subject are completed (`/api/library/[subject]`).
- **Theory read (+20 XP)** and **quiz pass (+50 XP, ≥70%)** — soft-graded quiz
  UI with green/red reveal and explanations.
- **Routes:** `/library`, `/library/[subject]`, `/library/[subject]/[topic]`.

## Next steps

1. ✅ Resume upload & AI analysis UI (drag-drop, parse, score + insights)
2. ✅ Content production guide + scaffolding/validation + reference topic + library UI
3. ✅ Code Forge sandbox — run JS (isolated iframe) & Python (Pyodide WASM) in-browser
4. ✅ Arcane Library + gamification (subjects, XP, levels, streak, mastery, unlocking, quiz)
5. ✅ AI Mentor chat (streaming, context-aware, works offline via fallback)
6. Dashboard 2.0 (progress, streaks, notifications)
7. Offline PWA layer (service worker cache + sync queue) for the web app
8. GitHub-Models/Pollinations fallback AI chain (no API key required)

## Notes for real deployment

- `pdf-parse` / `pdfjs-dist` are listed in `next.config.ts` →
  `serverExternalPackages` so pdfjs can resolve its own worker at runtime.
- `allowedDevOrigins` in `next.config.ts` is only for the sandboxed live
  preview; remove it for local/self-hosted use.
