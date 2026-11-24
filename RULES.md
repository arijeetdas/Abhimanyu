# RULES.md: rules for AI coding agents (and the humans using them)

Every AI agent that changes this repository (Claude Code, Codex, Cursor, Copilot, Gemini, or anything else)
follows these rules. They keep the project consistent no matter which teammate, or which agent, continues the
work. When a rule and a request conflict, stop and ask the human. Do not silently break a rule.

> Not to be confused with [`docs/AGENT.md`](docs/AGENT.md), which designs the **product's** AI detectives
> (DocSynthesizer, Meta CIO and so on). This file is about agents that **write code** for the project.

---

## 0. Before you change anything

1. Read this file completely.
2. Read the documents for the area you are touching:

| You are working on | Read first |
|---|---|
| Anything | [`README.md`](README.md), [`docs/ENGINEERING_PLAN.md`](docs/ENGINEERING_PLAN.md) |
| Frontend (website + app) | [`frontend/AGENTS.md`](frontend/AGENTS.md) (Expo specifics), [`docs/UI_UX_GUIDELINES.md`](docs/UI_UX_GUIDELINES.md), section 2 of this file |
| Backend / API | [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md), [`docs/ARCHITECTTURE.md`](docs/ARCHITECTTURE.md), [`docs/SECURITY.md`](docs/SECURITY.md) |
| Data, ML, agents | [`docs/DATA_SCHEMA.md`](docs/DATA_SCHEMA.md), [`docs/AI_SYSTEM_DESIGN.md`](docs/AI_SYSTEM_DESIGN.md), [`docs/FRAUD_DETECTION_METHODOLOGY.md`](docs/FRAUD_DETECTION_METHODOLOGY.md), [`docs/AGENT.md`](docs/AGENT.md) |
| Setup, Git, the `dev` script | [`docs/SETUP_AND_WORKFLOW.md`](docs/SETUP_AND_WORKFLOW.md), [`scripts/dev/`](scripts/dev/) |

3. Run `git status` and `git log --oneline -10`. Do not overwrite or revert work you did not make. If the tree has
   unrelated changes, leave them alone.
4. Look at how the existing code already does the thing you need, and do it the same way. Consistency beats
   personal preference.

---

## 1. Project identity (never change without a team decision)

- **Abhimanyu** is an AI forensic-intelligence platform for Indian listed companies (NSE/BSE). It reads filings,
  maps promoter/director links and produces an explainable **Red Flag Score (0 to 100)**. It does **not** predict
  prices or give buy/sell advice.
- **Language policy** (product copy, code comments, sample data, commit messages):
  - Findings are **risk indicators for review**, never accusations. Never write that a company "committed fraud".
  - **No flag without evidence.** Anything that looks like a finding shows its source (filing, page, metric).
  - Inferred relationships are **possible links** until verified.
  - Missing data is shown as **missing / not analysed**, never guessed or filled with plausible numbers.
  - Keep the disclaimer: not investment advice; anomalies do not prove fraud.
- **Sample and mock data use fictional companies** (e.g. "Example Textiles Ltd", `EXTEX`) and are labelled as
  sample data. Never attach red flags, scores or allegations to a real company, person or promoter. Real ticker
  symbols may appear only as neutral watchlist suggestions.
- Team: five members. Repo: https://github.com/arijeetdas/Abhimanyu (owner `arijeetdas`).

---

## 2. Stack locks

These are decided. Do not replace, duplicate or "upgrade away from" them on your own.

| Area | Locked choice | Never |
|---|---|---|
| Website + Android + iOS | **One Expo (React Native) app** in `frontend/`, TypeScript, Expo Router, React Native Web | Flutter, Dart, Next.js, a second web or mobile framework, a separate mobile repo |
| Styling | Tokens in `frontend/src/constants/theme.ts` + `StyleSheet` + components in `src/components/ui/` | Tailwind/NativeWind, styled-components or another UI kit (unless the team decides; record it in ENGINEERING_PLAN) |
| Fonts | IBM Plex Sans (interface) + IBM Plex Mono (figures, evidence tags) | Other font families |
| Icons | `lucide-react-native`, 16 to 18 px, stroke 1.5 | Emoji as icons, a second icon set |
| Auth | Firebase Authentication through `src/providers/auth-provider.tsx` (demo backend when keys are absent) | Calling Firebase directly from screens; a second auth system |
| Backend | Python 3.12, FastAPI, managed with **uv** (`backend/pyproject.toml`, `uv.lock`) | pip/requirements.txt, Poetry, another web framework |
| Product AI / data | As in `docs/Tech_Stack.md` (LangGraph, Gemini, PostgreSQL/Supabase, Neo4j, ChromaDB, Celery + Redis) | Swapping providers without updating the docs and the team |
| Pinned | `three` **~0.186** (0.187 removed a shader chunk that `@shadergradient/react` needs) | Bumping `three` without testing the landing/home backdrop |

Adding dependencies:

- Frontend: **always** `npx expo install <package>` (inside `frontend/`), never plain `npm install <package>`.
  Commit `package.json` **and** `package-lock.json`. Prefer Expo modules. Anything with native code that is not in
  Expo Go needs a development build; say so in the PR.
- Backend: `uv add <package>` (inside `backend/`). Commit `pyproject.toml` **and** `uv.lock`.
- Never upgrade the Expo SDK, React, React Native or Python version on your own. That is a team decision.
- Before writing Expo / React Native code, check the docs for the installed SDK version (see `frontend/AGENTS.md`).
  Expo changes every SDK; do not rely on memory.

---

## 3. Repository map: where things go

```text
Abhimanyu/
├── RULES.md                 this file (agents: read first)
├── AGENTS.md, CLAUDE.md, GEMINI.md, .github/copilot-instructions.md   pointers to this file
├── dev, dev.cmd             team toolkit launchers (macOS/Linux, Windows)
├── scripts/dev/             toolkit source (Node.js, zero dependencies)
├── frontend/                Expo app: website + Android + iOS
│   └── src/
│       ├── app/             ROUTES ONLY (Expo Router). Thin files that render a feature.
│       │   ├── _layout.tsx  providers, fonts, route guards (Stack.Protected)
│       │   ├── index.tsx    "/" -> features/entry/entry(.web).tsx
│       │   ├── (auth)/      login, register, forgot-password (signed-out only)
│       │   ├── onboarding/  signed in, onboarding not finished
│       │   └── (app)/       signed in and onboarded (home, later the dashboard)
│       ├── features/        screen logic by feature: landing, auth, onboarding, entry, ...
│       ├── components/      shared UI: ui/ (design system), backdrop/ (shader)
│       ├── constants/       theme.ts (design tokens)
│       ├── hooks/           use-layout, use-theme, use-api-health, ...
│       ├── lib/             api client, auth backends, profile model, storage
│       └── providers/       React context providers (auth)
├── backend/                 FastAPI service
│   ├── app/                 main.py, config.py, api/ (routers under /api/v1)
│   └── tests/               pytest
├── docs/                    design docs, ENGINEERING_PLAN, SETUP_AND_WORKFLOW, CHANGELOG
├── .github/workflows/ci.yml CI: app type-check, lint, web build; backend lint + tests; toolkit check
└── .githooks/pre-commit     blocks secrets and files over 50 MB
```

Planned (create when the work starts, following `docs/ARCHITECTTURE.md`): `backend/app/agents/`,
`backend/app/graph/`, `backend/app/ingestion/`, `backend/workers/`, `ml/`, `infra/docker-compose.yml`.

---

## 4. Frontend rules

### 4.1 Routing and platforms

- `src/app/` contains routes only. Put screen logic in `src/features/<feature>/` and keep the route file thin.
- **The landing page is website-only and must never ship in the app.** `/` re-exports
  `src/features/entry/entry`, which Metro resolves to `entry.web.tsx` (landing) on web and `entry.tsx` (redirect)
  on native. Never put `*.web.tsx` route files in `src/app/`: every file there is bundled into the app.
  The same pattern applies to any other web-only page.
- Route access is controlled only by `Stack.Protected` guards in `src/app/_layout.tsx`. New signed-in screens go
  in `(app)/`. Do not add ad-hoc redirects in screens.
- Static web rendering is on (`web.output: "static"`): no `window`, `document` or `localStorage` at module scope
  or during render. Use effects, `useMounted()` / `useLayout()` from `src/hooks/use-layout.ts`, or lazy `import()`.
- Page titles and descriptions: export `generateMetadata()` from the route file.
- Browser-only libraries (three.js, Cytoscape.js, PDF.js) go in an **Expo DOM component** (`'use dom'`, see
  `src/components/backdrop/shader-scene.tsx`), loaded lazily on web.

### 4.2 Design system (direction: exact, sober, quietly vigilant)

- Use the tokens in `src/constants/theme.ts`. No new hex colors in screens (the shader scene is the only exception).
- Use `Text`, `Button`, `TextField`, `ChoiceCard`, `Chip`, `CheckRow`, `Segmented`, `Notice`, `EvidenceTag`
  from `src/components/ui/`. Extend these instead of making look-alikes.
- **One accent** (teal `#42D6A4`) for the primary action, the selection or the one key figure. Chrome stays neutral.
- The rich moments are the shader backdrop and real product content (scores, evidence). Do not add decoration:
  no gradient text, glows, colored shadows, blobs, glassmorphism, emoji, sparkle icons or "New" badges.
- Type: weights 400 to 600, sentence case, no uppercase tracked labels, no italics for emphasis, tabular figures.
- Spacing on the 4 px grid. Radii: controls 10, cards 16, panels 20 (nested radius = outer minus padding).
- Motion: one easing curve (`Motion.easing`), short durations, no looping or bouncy animation. Respect reduced
  motion.
- **Signature detail:** the mono evidence tag (`AR FY25 · p.142`) beside claims. Use it where evidence is shown,
  not as decoration.
- Severity is always color **plus** a text label (`SeverityLabel`), never color alone.
- Copy: short, specific, no exclamation marks, no hype words (seamless, supercharge, AI-powered, ...), no trailing
  period on labels, buttons and headings, no greeting headlines. Do not invent claims, numbers or testimonials.
- Responsive: mobile-first; use `useLayout()` breakpoints (tablet 768, desktop 1024). Check phone width (390)
  and desktop width (1440) for every UI change.
- Accessibility: roles and labels on interactive elements, visible focus on web. Aim for touch targets of at least
  44 px; the compact 36 px button size is for dense navigation only.

### 4.3 Auth, profile and data

- Screens use `useAuth()` only. Firebase code lives in `src/lib/auth/`.
- The onboarding profile model is `src/lib/profile/types.ts` and mirrors `docs/DATA_SCHEMA.md` (users,
  watchlists, portfolio_holdings, alerts) and `PATCH /auth/me` in `docs/API_SPECIFICATION.md`.
  If you change it: keep old saved profiles working via `normalizeProfile()`, bump `PROFILE_VERSION`, update both
  docs, and if consent wording changes bump `CONSENT_VERSION`.
- Required consents (disclaimer, 18+) stay required. Optional consents stay **off by default**.
- Collect only what the service needs (DPDP Act 2023). Every new personal field needs a stated purpose in the UI.
- `EXPO_PUBLIC_*` variables are bundled into the website and app, so **never put secrets in them**. Read them
  with full static access (`process.env.EXPO_PUBLIC_X`), never destructuring.

---

## 5. Backend rules

- Follow `docs/API_SPECIFICATION.md`: routes under `/api/v1`, public `GET /health`, `snake_case` JSON, ISO 8601
  UTC timestamps, the documented error format. Change the spec **first**, then the code.
- Settings come from `app/config.py` (pydantic-settings, `backend/.env`). Add every new variable to
  `backend/.env.example` with an empty value and a comment.
- Long-running work (PDF parsing, LLM calls, agent runs) goes to background workers, never inside a request.
- Every endpoint gets a pytest test. `uv run ruff check .` and `uv run pytest` must pass.
- Product AI agents follow `docs/AGENT.md` and `docs/AI_SYSTEM_DESIGN.md`: structured outputs, evidence with
  every signal, prompt and methodology versions recorded (see the CHANGELOG rules).

---

## 6. The `dev` toolkit (`scripts/dev/`)

- Zero npm dependencies (it runs before `npm install`). Node built-ins only. Must work on Windows, macOS and Linux.
- `dev.cmd` stays ASCII with CRLF line endings, and the `node ... & exit /b` hand-off stays on **one line**
  (Windows re-reads `.cmd` files while they run, and a sync may replace this file).
- Safety model, do not weaken it: a snapshot before every risky Git step, never force-push, never rewrite pushed
  history, never delete user work without a snapshot, scan for secrets and large files before every commit.
- Compare paths with the real-path helper in `git.mjs` (Windows short `8.3` names broke this once).
- Every user-facing behavior change updates `docs/SETUP_AND_WORKFLOW.md` (it is also the `dev help` text; keep
  the `<!-- topic: name -->` markers).

---

## 7. Git and GitHub rules for agents

- Commit or push only when the human asks. Prefer `dev finish -m "type(scope): message"`, which runs the safety
  scan, checks, sync and push. By hand: `git pull --rebase` before `git push`.
- Commit messages: Conventional Commits, `type(scope): what changed`. Types: feat, fix, docs, style, refactor,
  test, chore. Scopes: app, api, docs, toolkit, ci.
- Small, focused commits. One logical change per commit; do not mix refactors with features.
- **Never:** `git push --force` to `main`, rewrite or squash pushed history, `--no-verify`, commit `.env` /
  `.env.local` / keys / service-account JSON / `node_modules` / `.venv` / data files, delete branches you did not
  create, or change repository settings.
- Large features go on a branch (`dev branch` creates `feature/<name>-<topic>`) and a pull request.
- Every user-visible or architecture-relevant change adds a line under `[Unreleased]` in `docs/CHANGELOG.md`.

---

## 8. Keep the docs in sync

| If you change | Also update |
|---|---|
| Stack, structure, or a major decision | `docs/ENGINEERING_PLAN.md` (record the decision and why), `docs/Tech_Stack.md`, this file |
| Routes, screens or flows | `docs/ENGINEERING_PLAN.md` section 6, `docs/UI_UX_GUIDELINES.md` if behavior changes |
| API endpoints or payloads | `docs/API_SPECIFICATION.md` (first) |
| Database tables or the profile model | `docs/DATA_SCHEMA.md` |
| Setup, environment variables, scripts, Git workflow | `docs/SETUP_AND_WORKFLOW.md`, `.env.example` files |
| Detection rules or scoring | `docs/FRAUD_DETECTION_METHODOLOGY.md` + `methodology_version` |
| Agent prompts | `docs/AI_SYSTEM_DESIGN.md` + `prompt_version` |
| Anything user-visible | `docs/CHANGELOG.md` |

---

## 9. Definition of done

Run what applies before saying a task is finished, and report the real results (including failures):

```bash
# frontend/
npx tsc --noEmit
npx expo lint
npx expo export --platform web          # routing, static rendering
npx expo export --platform android      # when touching native code, platform files or the entry split
# backend/
uv run ruff check .
uv run pytest
# repo root
for f in scripts/dev/*.mjs; do node --check "$f"; done   # when touching the toolkit
```

- UI changes: look at the result at 390 px and 1440 px wide (run `dev run web`, or take screenshots).
- Docs and CHANGELOG updated per section 8. No secrets, no debug leftovers, no commented-out code.
- CI (`.github/workflows/ci.yml`) must stay green on `main`.
- If you could not test something (for example the native app on a real phone), say so plainly.

---

## 10. Lessons already learned (do not repeat them)

- `three` 0.187 removed `cube_uv_reflection_fragment`; `@shadergradient/react` then renders nothing. Keep `~0.186`.
- A `*.web.tsx` file inside `src/app/` is still bundled into the native app. Use the `features/entry` split.
- React Native 0.88 types refs as `ComponentRef<typeof TextInput>` / `ComponentRef<typeof ScrollView>`.
- The React hooks lint rules reject `setState` directly inside effects and writing refs during render. Use
  `useSyncExternalStore` (see `useMounted`), effect-synced refs, or state.
- On web, render the mobile layout first and switch after mount (`useLayout`), or hydration will not match.
- Firebase's `getReactNativePersistence` exists only in the React Native build; it lives in
  `firebase-auth-init.native.ts` with a typed cast.
- Expo inlines `EXPO_PUBLIC_*` only with full static property access.
- Browsers report the timezone `Asia/Calcutta`; store `Asia/Kolkata`.
- Windows short (8.3) paths made a clone look "unlinked" to the toolkit; always compare real paths.

---

## 11. When unsure

- Ask the human instead of guessing on product decisions, new dependencies, data collection, legal or consent
  wording, or anything that touches real companies or people.
- Prefer the smallest change that solves the problem and matches the existing patterns.
- If you must deviate from these rules, explain why in the PR or commit body and update this file in the same
  change, so the next agent knows.
