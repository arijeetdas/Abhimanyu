# AGENTS.md

Instructions for AI coding agents (Codex, Cursor, Copilot agent mode, Jules, Gemini CLI and others).

**Read and follow [`RULES.md`](RULES.md) before making any change.** It is the single source of truth for how
this project is built: stack locks, where code goes, design rules, Git rules, docs to update and the definition
of done. For Expo-specific guidance inside `frontend/`, also read [`frontend/AGENTS.md`](frontend/AGENTS.md).

The essentials, in case you read nothing else:

- One Expo (React Native, TypeScript, Expo Router) app in `frontend/` builds the website **and** the Android/iOS
  app. Never add Flutter, Dart, Next.js or another frontend framework. Backend: FastAPI + Python 3.12 + uv.
- Findings are risk indicators with evidence, never accusations. Sample data uses fictional companies.
- The landing page is website-only (`src/features/entry/entry.web.tsx`); never put `*.web.tsx` routes in `src/app/`.
- Use the design tokens and `src/components/ui/` components; one accent; no gradients, glows or emoji.
- Add packages with `npx expo install` (frontend) and `uv add` (backend). Keep `three` at `~0.186`.
- Never force-push, rewrite pushed history, skip hooks or commit secrets. Commit only when the human asks.
- Done means: `npx tsc --noEmit`, `npx expo lint`, `npx expo export --platform web`, `uv run ruff check .`,
  `uv run pytest`, docs and `docs/CHANGELOG.md` updated.

`docs/AGENT.md` is a different file: it designs the product's own AI agents, not coding agents.
