# Engineering Plan: Abhimanyu

> Status: adopted 2026-11-24. This plan turns the design docs into a runnable codebase and a team workflow.
> Where it differs from earlier docs (Next.js + Flutter), **this plan wins**; see section 2 for the mapping.

## 1. Decision: one React Native codebase for web, Android and iOS

The team wants a website first and an app later, with the least rework. We use **Expo (React Native) with
Expo Router and TypeScript** in `frontend/`: one codebase that builds the website and the Android/iOS apps.

| Option | Website | App later | Codebases | Verdict |
|---|---|---|---|---|
| Next.js web + Flutter app (original docs) | excellent | rewrite in Dart | 2 languages | most work |
| Next.js web + React Native app (monorepo) | excellent | share logic only, rewrite UI | 2 apps | medium |
| **Expo universal app (chosen)** | good (static export) | **same code, already done** | 1 | least work |

Why Expo:

- **Web now, app for free.** `expo export --platform web` builds the website. The same screens run on Android/iOS.
  Turning the website into an app is a build step (`eas build`), not a project.
- **File-based routing like Next.js.** Every file in `frontend/src/app/` is a page/screen (Expo Router).
- **No Android Studio needed day to day.** Teammates test on their own phone with the Expo Go app (QR code).
- **Web-only libraries still work.** Cytoscape.js (relationship graph) and PDF.js (evidence inspector) need a browser DOM.
  Expo **DOM components** (`'use dom'`) render such components on web natively and inside a web view on mobile,
  so the analyst graph and PDF viewer are written once. Platform-specific files (`graph.web.tsx` / `graph.tsx`)
  are the fallback.
- **Free, student-friendly.** EAS Build free tier for APKs; the website deploys as static files anywhere.

Trade-offs we accept: no server-side rendering/SEO (not needed for an analyst dashboard behind login), and web
layout needs some care for wide screens (we already cap content width and use responsive grids).

## 2. Mapping from the original stack

| Original doc says | We use | Notes |
|---|---|---|
| Next.js 14 web portal | Expo Router (web output) | same routes on web and mobile |
| Flutter mobile app | the same Expo app | Android + iOS builds via EAS |
| Tailwind CSS | design tokens in `frontend/src/constants/theme.ts` + `StyleSheet` | NativeWind can be added later if the team wants class names |
| BLoC state management | TanStack Query (server data) + Zustand (UI state) | add when the first real API call lands |
| Hive offline cache | TanStack Query persistence + MMKV / AsyncStorage | offline report reading |
| Firebase Cloud Messaging | `expo-notifications` (uses FCM/APNs underneath) | |
| Cytoscape.js / Vis.js | Cytoscape.js inside a DOM component | one implementation for web + mobile |
| PDF.js | PDF.js inside a DOM component | page + bounding-box highlights |

Backend, AI, data and ML choices stay exactly as in [Tech_Stack.md](Tech_Stack.md): FastAPI, LangGraph, Gemini,
PostgreSQL (Supabase), Neo4j, ChromaDB, Celery + Redis.

## 3. Repository layout

```text
Abhimanyu/
├── abhi, abhi.cmd          # team toolkit launchers (setup, sync, finish, rescue, help)
├── scripts/abhi/           # toolkit source (Node.js, zero dependencies)
├── frontend/               # Expo app: website + Android + iOS
│   └── src/
│       ├── app/            # routes / screens (Expo Router)
│       ├── components/     # shared UI (Card, StatusPill, Screen, ...)
│       ├── constants/      # theme tokens (UI_UX_GUIDELINES.md)
│       ├── hooks/
│       └── lib/            # API client
├── backend/                # FastAPI service (Python 3.12, uv)
│   ├── app/                # main.py, config.py, api/ routers
│   └── tests/
├── docs/                   # design docs + this plan + DEVELOPER_GUIDE.md
├── .github/workflows/      # CI: app type-check, lint, web build; backend lint + tests
└── .githooks/              # pre-commit safety hook (secrets, huge files)
```

Planned as each workstream starts (per ARCHITECTURE.md): `backend/app/agents/`, `backend/app/graph/`,
`backend/app/ingestion/`, `backend/workers/`, `ml/`, `infra/docker-compose.yml`.

## 4. How the team works

### 4.1 One command in, one command out

| Moment | Command | Under the hood |
|---|---|---|
| Start of a session | `abhi start` | fetch, rebase onto the team's work (autostash), reinstall packages if lock files changed, add new `.env` keys, run web/phone/backend |
| End of a session | `abhi finish` | show changes, block secrets & >50 MB files, type-check/lint changed code, guided commit message, changelog entry, sync, push with retry |
| Something is off | `abhi rescue` / `abhi undo` | resume or abort half-done operations, rescue branch for help, restore snapshots |

Full manual: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) or `abhi help`.

### 4.2 Safety model

1. **Snapshots before every risky step.** A hidden commit of the whole folder (including new, unsaved files) is
   stored under `refs/abhi/snapshots/` before sync, commit, branch switch, discard and reset. Restorable via
   `abhi undo`. They never appear in branches and are never pushed.
2. **History is never rewritten on GitHub.** No force pushes. Undoing a pushed commit creates a revert.
3. **Rebase-on-pull** keeps `main` linear and readable; conflicts get a guided resolver with a "cancel and go
   back" option that always works.
4. **Secrets and huge files cannot leave the PC**: `abhi finish` and a Git pre-commit hook (which also guards
   commits made from VS Code) block common key formats (Gemini, Groq, Anthropic, OpenAI, GitHub, AWS, private
   keys, DB URLs with passwords) and files over 50 MB.
5. **CI on every push and pull request** runs type-check, lint, web build, backend lint and tests.
6. `docs/CHANGELOG.md` uses Git's union merge so concurrent entries never conflict.

### 4.3 Branching

Trunk-based: small changes go straight to `main` through `abhi finish`. Multi-day features use
`abhi branch` -> `feature/<name>-<topic>` + pull request. Optionally protect `main` on GitHub with
"require status checks" once CI is green.

## 5. Week 1 checklist (DEVELOPMENT_ROADMAP.md, adjusted)

Everyone:

- [ ] Accept the GitHub invite, run `abhi setup`, install Expo Go, run `abhi start` -> "Backend + website".
- [ ] The Overview screen shows **Backend API: Online**. That proves app <-> API wiring on your machine.

| Member | First tasks |
|---|---|
| Frontend | Routes for Search, Company report, Graph, Alerts as placeholders; add TanStack Query; agree API types with backend |
| Data pipelines | One BSE announcement + one annual-report PDF fetched into `data/` (ignored by Git); define raw-source metadata |
| Agentic AI | LangGraph state definition; Gemini Flash hello-world behind `GEMINI_API_KEY` in `backend/.env`; DocSynthesizer output schema |
| ML & graph | Neo4j AuraDB Free (or Docker); Company/Director node model; Beneish M-Score on a hand-verified sample |
| Backend / API | `GET /api/v1/companies/search` stub per API_SPECIFICATION.md; Postgres (Supabase) connection via `DATABASE_URL` |

Exit criteria: everyone can run app + API locally, the first `feat` commits from each member are on `main`, CI is green.

## 6. Frontend architecture (next steps)

1. **Data layer**: `@tanstack/react-query` with a typed client in `src/lib/api.ts`; types mirror
   `API_SPECIFICATION.md` (later generated from FastAPI's OpenAPI schema with `openapi-typescript`).
2. **Navigation**: tabs on mobile (Overview, Search, Alerts, Reports), top bar on web; company report at
   `src/app/company/[ticker].tsx`.
3. **Graph + PDF**: `src/components/dom/RelationshipGraph.tsx` and `EvidencePdf.tsx` as DOM components.
4. **Offline + push**: persist the query cache; `expo-notifications` for alerts once FCM is configured.
5. **Auth**: JWT from the API (SECURITY.md), stored with `expo-secure-store` on mobile.
6. **Shipping**: website as a static export (EAS Hosting, Netlify or Vercel); Android APK via
   `npx eas-cli build -p android --profile preview` for demos.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| College Wi-Fi blocks phone <-> PC | `abhi run tunnel`, mobile hotspot |
| Expo SDK upgrades break APIs | stay on one SDK per semester; upgrade together with `npx expo install --fix` |
| A library has no native support | DOM component or `.web.tsx` / `.tsx` split |
| Merge conflicts in shared files | sync every session, small commits, guided resolver, branch for big features |
| Leaked API keys | hook + finish scanning, `.env` ignored, revoke immediately if it happens |
| Free-tier limits (Supabase, AuraDB, Gemini) | keep providers configurable via `.env`; local Docker fallbacks |
