# Codempress — Complete Platform Documentation

> **Status:** Canonical product specification. This supersedes and extends
> `docs/ARCHITECTURE.md` (the earlier, partial architecture view). It defines
> the full product: vision, stack, curriculum, design system, gamification,
> offline architecture, and deployment.
>
> The currently-implemented codebase is a **Next.js + Prisma + PostgreSQL** web
> app. See `docs/ARCHITECTURE_ANALYSIS.md` for how this spec's mobile-first,
> FastAPI/SQLite/Vite/Capacitor target diverges from what is built, and the
> portability map.

---

## Executive Summary

**Codempress** is a gamified, offline-first programming education platform that
guides users from theory to practice across modern engineering domains. It
combines an **Arcane Library** (curriculum browser), **interactive code
sandboxes**, **AI-generated theory content**, and a **reward-based progression
system** to create an engaging learning experience.

## Product Vision

**Mission:** Democratize programming education by making it accessible,
engaging, and rewarding.

**Core Values:** Learn by Doing · Offline-First · AI-Powered · Open Ecosystem

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Mobile | Capacitor (Android/iOS) |
| Styling | Tailwind CSS + Light Theme |
| State | Zustand |
| Backend | FastAPI (Python 3.10+) |
| Database | SQLite (dev) / Turso (prod) / Supabase (optional) |
| Auth | Google OAuth + Email/Password |
| AI | GitHub Models (fallback chain) |
| Sandbox | JavaScript (iframe eval) + Python (Pyodide WASM) |
| Offline | Local Storage + IndexedDB + Sync Queue |

## Database Schema

> See `database/schema.sql` in the spec repo. Five core tables:
> `users`, `topics`, `questions`, `user_progress`, `user_streak`.
> (Fields documented fully in `docs/ARCHITECTURE.md` §3.)

## Curriculum — 28 Subjects (3,100+ Topics)

| Subject | Topics | | Subject | Topics |
|---|---|---|---|---|
| HTML | 105 | | ML | 110 |
| CSS | 110 | | LLMs | 105 |
| UI Design | 105 | | RAG | 105 |
| JavaScript | 120 | | Agentic AI | 105 |
| React | 120 | | Generative AI | 105 |
| Node.js | 105 | | Power BI | 105 |
| SQL | 110 | | Excel | 110 |
| Python | 120 | | Three.js | 105 |
| Pandas | 105 | | Git | 105 |
| NumPy | 105 | | REST & GraphQL | 105 |
| Matplotlib | 105 | | Docker & CI/CD | 105 |
| Seaborn | 105 | | React Native | 105 |
| Scikit-learn | 105 | | Flutter | 105 |
| System Design | 110 | | Security | 105 |

## Levels

| Level | XP Required | Title |
|---|---|---|
| 0 | 0 | Explorer |
| 1 | 500 | Apprentice |
| 2 | 1,500 | Journeyman |
| 3 | 3,500 | Master |
| 4 | 7,000 | Architect |
| 5 | 12,000 | Legend |

## Gamification Loop

- **XP**: Read theory 20 XP · Quiz completion 50 XP · milestone reward ₹500 treat every 10 cleared topics.
- **Streak**: daily login bonus.
- **Levels**: Explorer → Legend (6 tiers).
- **Quizzes**: 5 MCQs/topic from the pool, 70% pass, soft-graded selection (orange → green/red), dynamic replacement of wrong answers.

## Code Forge

- JS in isolated iframe (`eval` wrapper), Python via Pyodide WASM, template library, real-time console, mobile-responsive stacking.

## Offline-First

- Local IndexedDB cache, `localStorage` sync queue, auto-sync on `navigator.onLine`, instant cache reads.

## AI Content Generation (server-side)

- GitHub Models fallback chain: `openai/gpt-4o-mini` → `microsoft/phi-4-mini-instruct` → `microsoft/phi-4` → `openai/gpt-4o` → `microsoft/phi-4-reasoning`.
- 60-second cooldown on 429. Generates theory, examples, best practices, MCQs.

## Design System (Light Theme / lavender-violet)

**Colors:** `--bg #f7f6fb`, `--bg-panel #ffffff`, `--bg-subtle #f0eef7`,
`--ink #1a1626`, `--ink-soft #5b5570`, `--ink-faint #9c96af`,
`--primary #7c3aed`, `--primary-soft #ede7fb`, `--accent #f43f5e`,
`--success #16a34a`, `--border #e6e2f0`.

**Type:** Manrope (sans, 32/24/18/15/12px weights 800/800/700/500/600), Space Mono (mono).

**Spacing:** 8pt grid, card padding 20-24px, gaps 12-20px, radius 12px cards / 16px modals.

**Breakpoints:** >1024px full grid · 768-1024px 2-3 cols · <768px stacked · <480px icon-only nav.

## Auth & Security

- Google OAuth (GIS) + Email/Password (hashed). HS256 JWT, 7-day, stored `localStorage` (`sf_token`).
- Headers: `Cache-Control: no-store`, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CSP.
- Password: ≥8 chars, upper+lower+number+special.

## Analytics & Testing

- Metrics: DAU, topics completed/mastery %, avg quiz score, streak distribution, XP growth, mobile-vs-web.
- Jest/Pytest (unit), Supertest (integration), Playwright/Detox (E2E), Lighthouse.

## Growth & Monetization

- Growth: SEO, referral, community, content marketing.
- Monetization: Freemium core, Premium (pro content/certs/mentorship), B2B corporate training.

## Deployment & Env

- Build: `npm run build` → `npx cap sync android` → `./gradlew assembleDebug`.
- Env: `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `GITHUB_TOKEN`, `TURSO_URL`, `TURSO_TOKEN`, `ALLOWED_ORIGINS`.

## License

MIT.

---

## Mapping this spec to the existing codebase

| Spec concept | Existing implementation |
|---|---|
| Curriculum (28 subjects) | `content/topics/` files, `prisma` Course/Module/Topic/Lesson |
| Levels & XP | Prisma `User.level`, `User.xp`, `User.streak`, `longestStreak` |
| Quiz soft-grading | `Question`, `QuizAttempt`, `ProgressStatus` |
| Code Forge | `src/app/forge/page.tsx` (JS iframe + Pyodide) |
| Content browser | `src/app/content/` (+ `/content/[slug]`) |
| Design system | Not yet applied — app uses a dark theme (see next steps) |
| Offline PWA | Not yet built |
| GitHub Models fallback | Not yet wired (uses OpenAI key + heuristic fallback) |
