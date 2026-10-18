# SkillPath AI

> Your skills. Your path. Your future.

An intelligent career and project recommendation platform for students. Enter what you know, choose where you want to go, and SkillPath analyzes your profile, surfaces your skill gaps, recommends projects matched to your level and draws a personalized learning roadmap — with an AI assistant that answers questions using *your* data.

## Features

- **Landing experience** — interactive example "Career DNA" network, animated comparison, 4-step journey, an honest pre-onboarding product preview, catalog project cards with detail modals, roadmap structure preview, and a transparent pre-profile assistant. No personal scores are shown before a student supplies data.
- **Onboarding** — five animated steps: identity, experience and weekly time → skill selection with confidence sliders → one primary goal → optional interests → summary and a staged "building your path" sequence.
- **Dashboard** — available only after onboarding, with the student’s exact skill inputs, overall progress, skill-gap score, learning streak, recommended next skill, role radar, matched projects, interactive roadmap, activity, and a synced assistant.
- **Two persistence modes** — account (JWT + PostgreSQL) and guest (localStorage, syncs on signup). Both use real onboarding inputs.
- **Recommendation engine** (`src/lib/engine`) — weighted gap analysis, readiness/gap scores, roadmap status computation, project match scoring and a context-aware assistant. Pure TypeScript, runs on server and client.
- **Accessibility & performance** — semantic HTML, keyboard-navigable network/roadmap/modals, `prefers-reduced-motion` support, GPU-friendly transforms, lazy-loaded charts and canvas effects.

## Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | Next.js (App Router), React, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Lucide |
| API       | Next.js route handlers under `src/app/api` (mirrors a FastAPI contract — swap via `NEXT_PUBLIC_API_BASE_URL`) |
| Database  | PostgreSQL via Drizzle ORM (`src/db/schema.ts`) |
| Auth      | JWT (HS256, `jose`) in an httpOnly cookie, bcrypt password hashing |

## Project structure

```
src/
  app/                 routes (landing, onboarding, dashboard, login, signup, projects/[slug]) + api/
  components/
    fx/                cursor glow, particles, gradient blobs, grain, AI orb
    ui/                magnetic button, tilt card, text reveal, counters, progress, modal, chips
    landing/ dashboard/ onboarding/ projects/ roadmap/ assistant/ auth/ layout/
  lib/
    engine/            analysis.ts (gaps, roadmap, project matching) · assistant.ts (rule-based coach)
    api/               client.ts (fetch wrapper) · services.ts (typed service layer)
    auth/              jwt.ts · password.ts · session.ts
    server/            catalog.ts (DB with mock fallback) · students.ts (profiles, progress, activity, chat)
    store/guest.ts     localStorage persistence for guest mode
  data/mock.ts         skills, roles, projects, demo student
  db/                  schema.ts · seed.ts
```

## API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` · `/api/auth/login` · `/api/auth/logout` | JWT auth (cookie + token in body) |
| GET | `/api/auth/me` | Current user |
| GET | `/api/catalog` · `/api/projects/:slug` | Skills, roles, projects |
| GET/PUT | `/api/profile` | Student profile + skill ratings |
| GET | `/api/dashboard` | Profile + full analysis + activity |
| PATCH | `/api/roadmap` | Update a roadmap node (`completed` / `locked`) |
| GET/POST | `/api/chat` | Assistant history / send a message (guests get demo context) |
| GET/POST | `/api/activity` | Activity feed |

## Running locally

```bash
npm install
npx drizzle-kit push        # create tables
npx tsx src/db/seed.ts      # seed skills / roles / projects
npm run dev
```

Environment variables live in `.env`: `DATABASE_URL`, `JWT_SECRET`, optional `NEXT_PUBLIC_API_BASE_URL`.
