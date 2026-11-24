# Changelog

All notable changes to **Abhimanyu - AI Based StockMarket Predictor and Investment Platform** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to follow [Semantic Versioning](https://semver.org/) once the first release is tagged.

## How to use this file

- Add every user-visible or architecture-relevant change under **[Unreleased]** as you work.
- When releasing, rename **[Unreleased]** to the new version and date, then start a fresh **[Unreleased]** section.
- Group entries under these headings: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Schema changes must also reference the migration name and bump the schema version in `DATA_SCHEMA.md`.
- Changes to fraud rules or scoring must state the new `methodology_version` (see `FRAUD_DETECTION_METHODOLOGY.md`).
- Changes to agent prompts must state the new `prompt_version` (see `AI_SYSTEM_DESIGN.md`).

---

## [Unreleased]

### Added
- Website landing page (web only, never in the app) with an animated `@shadergradient/react` hero, a sample Red Flag Score report, how it works, detection domains, agents and safety rules.
- Log in, register and password reset screens; route guards with `Stack.Protected`.
- Auth with Firebase Authentication and Firestore profiles, plus a demo mode that works without Firebase keys.
- Ten-step onboarding (role, experience and explanation style, goals, markets, sectors, watchlist and holdings, red-flag domains, alert channels and timing, language, number format, DPDP consents) with progress saved after each step.
- Placeholder home screen ("Successful") on the same animated backdrop.
- Design system: ink palette, IBM Plex Sans and Mono, UI components and the evidence tag.
- `dev` team toolkit (`dev.cmd` / `dev` + `scripts/dev/`): one-command setup, start/sync/finish workflow, guided conflict resolution, safety snapshots, undo/rescue, doctor, and `dev help` manual.
- Expo universal app in `frontend/` (website + Android + iOS) with Abhimanyu design tokens, Overview and Search screens, and a live backend health check.
- FastAPI service skeleton in `backend/` (Python 3.12, uv): `GET /health`, `GET /api/v1/meta`, settings from `.env`, tests and ruff.
- CI workflow (app type-check, lint, web build; backend lint and tests; toolkit smoke test) and a pull request template.
- Pre-commit hook that blocks API keys, passwords and files over 50 MB.
- `docs/ENGINEERING_PLAN.md` and `docs/SETUP_AND_WORKFLOW.md` (every step for setup, running the scripts, and Git/GitHub on this project; also shown by `dev help`).
- Ingestion pipeline for BSE/NSE announcements, annual reports, and shareholding patterns.
- Filing parser with OCR fallback for scanned documents.
- Promoter and director relationship graph builder.
- Rule-based fraud signals (receivable divergence, CFO vs PAT mismatch, pledge increase, auditor resignation).
- Investor alerts via in-app and email channels.

### Changed
- Frontend stack: one Expo (React Native, TypeScript) codebase for the web dashboard and the Android/iOS app (see `ENGINEERING_PLAN.md`). Flutter/Dart are not used in this project; all docs updated accordingly.
- Team toolkit command renamed from `abhi` to `dev` (`dev.cmd`, `dev`, `scripts/dev/`); local state moves from `.abhi/` to `.dev/` automatically. `docs/DEVELOPER_GUIDE.md` merged into `docs/SETUP_AND_WORKFLOW.md`.

### Fixed
- Pinned `three` to ~0.186: three 0.187 removed the `cube_uv_reflection_fragment` shader chunk that `@shadergradient/react` needs, which left the gradient blank.
- Toolkit: Windows short (8.3) folder paths made a valid clone look unlinked, which could reset the branch during a sync; paths are now compared after full expansion, and an existing `.git` is never re-initialised.
- Backend: empty values in `backend/.env` no longer break settings loading.

### Security
- _Nothing yet._

---

## [0.1.0] - 2026-11-24 (Documentation baseline)

Initial planning and design documentation. No application code has been released yet.

### Added
- `README.md` with project overview: a team of AI financial detectives that reads company filings, uncovers hidden promoter relationships, and flags accounting fraud and pump-and-dump schemes in the Indian stock market.
- `docs/PRD.md` - product requirements.
- `docs/ARCHITECTTURE.md` - system architecture.
- `docs/AI_SYSTEM_DESIGN.md` - AI agent design.
- `docs/AGENT.md` - agent roles and responsibilities.
- `docs/API_SPECIFICATION.md` - API contract.
- `docs/DATA_SCHEMA.md` - relational, vector, and graph data model, covering:
  - Companies, persons, entities, auditors, and business groups
  - Filings, text chunks with embeddings, and extracted facts
  - Financial statements, line items, and derived ratios
  - Shareholding patterns, pledges, corporate actions, and related-party transactions
  - Market data, bulk/block deals, and social-promotion signals
  - Fraud signals, evidence, and company risk scores
  - Agent run audit trail, users, watchlists, portfolios, and alerts
- `docs/DATASET.md` - data sources and ingestion plan.
- `docs/FRAUD_DETECTION_METHODOLOGY.md` - detection rules and scoring.
- `docs/KNOWLEDGE_BASE.md` - domain knowledge for agents.
- `docs/FLOWCHART.md` - process flows.
- `docs/DEVELOPMENT_ROADMAP.md` - phased delivery plan.
- `docs/Tech_Stack.md` - technology choices.
- `docs/UI_UX_GUIDELINES.md` - interface guidelines.
- `docs/SECURITY.md` - security and data-protection policy.
- `docs/CHANGELOG.md` - this file.

[Unreleased]: #unreleased
[0.1.0]: #010---2026-11-24-documentation-baseline