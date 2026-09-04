# Codempress — Architecture Analysis & Recommendation

**Date:** 2026-08-30
**Scope:** Compare the incoming *Architectural Design Specification*
(`docs/ARCHITECTURE.md`) against the currently-implemented app
(Next.js + Prisma + PostgreSQL), and recommend a direction.

> TL;DR — the spec and the current build are two different products.
> The spec targets an **offline-first mobile education app**; the current build
> is a **server-first web SaaS**. For the mobile/offline vision the spec is the
> better architecture; for a web-first product the current stack is better. The
> good news: the two share a lot of *feature* DNA, and most of the spec's value
> (sandboxes, gamification, quiz UX, streak/XP) ports cleanly into the existing
> app. The Forge sandbox is now built as a demonstration of that.

---

## 1. Big picture: two different products

| Dimension | **The Spec** | **Current build** |
|---|---|---|
| Target platform | Mobile-first (Capacitor + Web) | Web-first (Next.js/React) |
| Offline | **First-class** (local cache + sync queue + WASM sandboxes) | Not designed for it |
| Backend | FastAPI (Python), embedded SQLite | Next.js API routes, PostgreSQL + Prisma |
| Auth | Google only, HS256 JWT in `localStorage` | NextAuth v5, httpOnly cookie JWT, Google + GitHub + Credentials |
| Content source | Hardcoded seed + server AI (GitHub Models / Pollinations) | `content/topics/` files + OpenAI (with offline heuristic fallback) |
| Sandbox | JavaScript + Pyodide WASM in-browser | *(not yet — now added as Forge)* |
| Rendering | SPA (Vite) | Server components + client components |
| Data model | Flat: `users / topics / questions / user_progress / user_streak` | Rich, normalized: courses→modules→topics→lessons, skills graph, quizzes, badges, notifications |

**The single most important question to settle:** is Codempress a **mobile,
offline-first app** (the spec) or a **web-first SaaS** (the current build)?
Everything else follows from that answer. See §6.

---

## 2. Where the spec is genuinely stronger

1. **Offline-first is the right model for a learner app.** Real learners use
   this on buses/planes/commutes with poor connectivity. The spec's
   local-cache + sync-queue + client-side WASM runtimes mean *the app works
   with no network at all*. The current Next.js app breaks without a network.

2. **Embedded SQLite + local-first data** is far simpler to deploy and reason
   about than PostgreSQL for this workload. No connection pool, no managed
   DB, no data-region concerns. For a single-user-per-device learning app this
   is a much better fit.

3. **Client-side WASM sandboxes (JS `eval` + Pyodide) are the standout
   feature** and are platform-agnostic — they work in a browser *or* a
   Capacitor WebView without a compile server. This is the most portable and
   valuable piece of the spec and is now demonstrated in the current app
   (`src/app/forge/page.tsx`).

4. **Tokenless/fallback AI (GitHub Models, Pollinations)**: the spec's
   availability chain (try model A, cool down on 429, move to model B) and
   *no-API-key-needed* providers drastically lower cost and unlock the app
   without billing. The current app depends on an `OPENAI_API_KEY` (it has a
   heuristic fallback, but not a real LLM without a key).

5. **Soft-graded quiz UX** (select → orange, then green/red on resolve) is a
   nice, measurable detail that reduces perceived error and is easy to adopt.

6. **Explicit streak / XP / mastery model** is already largely in the current
   Prisma schema (`User.xp/level/streak/longestStreak`, `Enrollment`,
   `UserProgress.mastery_percent` equivalent, `QuizAttempt`, `Badge`), so the
   *mechanism* exists; the spec just makes it the product's spine.

---

## 3. Where the spec has limitations / risks

1. **Internal contradiction: "generate on demand" vs "offline integrity."** The
   spec says `/api/topics/{id}/generate` produces theory+questions on demand
   (server-side AI), *while also* requiring offline reads of `getTopic`. You
   cannot AI-generate content offline. Resolution: **static/curated topics
   must be bundled with the client** (or shipped in a Content-Local asset),
   and AI generation is a network-only enhancement. "Arcane Library" content
   should be versioned, seeded, and shipped; AI fills optional depth.

2. **SQLite as "production" DB** has single-writer limits and no multiregion
   story. Fine for one FastAPI instance / small scale, but the label
   "production SQLite" overstates it. Also note: the *server's* SQLite does
   not give the *client* offline — offline comes from the client's own
   IndexedDB/localStorage, so SQLite buys nothing for offline. SQLite is really
   the right choice for the **client** (or server for a tiny deployment).

3. **`localStorage` JWT (`sf_token`)** is exposed to XSS (any injected script
   can read it), has no rotation/refresh, and a fixed 7-day lifetime. For a
   native app, prefer Capacitor's secure storage / Keychain; for web, an
   httpOnly cookie (as NextAuth does) is safer. Google-only auth also excludes
   users without a Google account (and is blocked in some networks).

4. **`eval`-based JS sandbox** is an XSS vector unless the evaluation runs in a
   fully isolated `srcdoc` iframe with `sandbox="allow-scripts"` and **no
   same-origin access to the parent**. Must be engineered carefully (see the
   Forge implementation).

5. **Flat content model conflates concepts.** `topics` bundles category, level,
   sequence, theory, examples, and best practices into one row with JSON blobs.
   Works for a lean mobile app; the current normalized schema (Course→Module→
   Topic→Lesson, Question, Skill graph) is better for analytics, references,
   prerequisite gating, and reuse ("Single Source of Truth" from the content
   guide). Trade meaningful modeling for ship-speed and small bundle.

6. **Scale of the sync queue** is simple (JSON array in `localStorage`) and has
   no conflict resolution or per-item retry/backoff. Fine for MVP; add idempotent
   keys + retry + last-write-wins later.

---

## 4. Feature-by-feature portability map (spec → current app)

| Spec feature | Port to Next.js? | Where it lands |
|---|---|---|
| JS + Pyodide Forge sandbox | ✅ Great | `src/app/forge/page.tsx` (now built) |
| XP / level / streak / badges | ✅ Already present | Prisma `User`, `Badge`, `QuizAttempt` |
| Quiz with 70% threshold + soft grading | ✅ Easy | `QuizAttempt`, `Question`, `ProgressStatus` |
| Theory read → mastery gating | ✅ Easy | `UserProgress.status`/mastery, `Enrollment` |
| Library / subject / topic browsing | ✅ Easy | `/content` (already built) |
| Offline queue + local-first | ⚠️ Different approach needed (PWA/service worker + local DB) | new |
| Google-JWKS HS256 localStorage JWT | ❌ Inferior to NextAuth | keep NextAuth |
| SQLite | ✅ Fine in a mobile/embedded context | not needed for web server |
| GitHub Models / Pollinations fallback AI | ✅ Good idea (no API key) | `src/lib/ai/client.ts` |
| Capacitor native shell | ⚠️ Requires the Vite/Capacitor client (next) | new / mobile phase |

---

## 5. Recommendation

### Primary recommendation (if the vision is mobile-first + offline-first)
**Adopt the spec's architecture for the client, and keep the current backend as
an optional data source.**

Build a **Vite + React (+ Capacitor) client** that is the real product:
- **Local-first data layer** (IndexedDB via Dexie, or SQLite WASM) as the
  source of truth; server is a sync target.
- **Client-side WASM sandboxes** (JS + Pyodide) — the killer feature.
- **Bundled curated content** so it works fully offline; AI generation is a
  network-only enhancement.
- **Secure native auth storage**, not `localStorage`.

The existing Next.js app then becomes either (a) an **admin/content backend**
(write/edit topics, generate with AI, seed content bundles) or (b) the web
companion. This is "best of both": rich schema + AI authoring server-side, and
a fast offline-first mobile client.

### Secondary (if keeping the Next.js web app as the primary product)
**Keep Next.js + Prisma + Postgres, and adopt the spec's features aggressively:**
- ✅ Add the **Forge** sandbox (JS + Pyodide) — *done this round*.
- ✅ Wire **gamification + mastery** through the existing schema.
- Add a **PWA/service-worker offline cache + sync queue** for the web app.
- Add a **GitHub-Models/Pollinations fallback** AI chain so the app works
  without an OpenAI key (mirroring the spec's availability chain).
- Adopt the **soft-graded quiz** UX.

> **On the mobile APK specifically:** a Capacitor client is the right call, but
> I can't reliably produce an installable `CodeEmpress-debug.apk` in this
> sandbox — it requires Android SDK + JDK 17 + Gradle, and only JDK 11 with no
> SDK/Gradle are present here. The correct sequence is: build the Capacitor
> client → `npx cap add android` → run the Gradle build locally/in CI. I can
> scaffold the Capacitor config and wiring, but the final APK compile should run
> in a proper Android build environment.

---

## 6. Decision checklist

To settle the direction, ask:

1. Is Codempress used **primarily on phones with poor wifi**? → yes = pivot to
   spec architecture (mobile-first, local-first, WASM).
2. Do we need **web search-ability, SEO, and non-mobile desktop users**? → yes =
   keep Next.js web tier.
3. Can we tolerate **Google-only auth**? → if not, keep NextAuth multi-provider.
4. Are we OK depending on an **externally-managed Postgres**, or do we want
   **zero-dependency embedded data**? → embedded wins for mobile.

**My recommendation:** The spec's strongest ideas — offline-first, in-browser
WASM sandboxes, and lean local data — are the right direction for the stated
product ("offline-first... mobile"). I recommend an **incremental bridge**:
build the Vite+React+Capacitor client with local-first data and ship a content
bundle, while folding the current Next.js app into an **authoring/AI backend**.
The Forge sandbox below is the first concrete step in that direction and works
in both worlds.
