# Copilot instructions

Follow [`RULES.md`](../RULES.md) at the repository root for every change: it is the single source of truth for AI
agents in this project. Key points:

- One Expo (React Native, TypeScript, Expo Router) app in `frontend/` builds the website and the Android/iOS app.
  Never suggest Flutter, Dart, Next.js or another frontend framework. Backend: FastAPI, Python 3.12, uv.
- Routes in `frontend/src/app/` stay thin; logic goes in `src/features/`. The landing page is website-only via
  `src/features/entry/entry.web.tsx`.
- Use `src/constants/theme.ts` tokens and `src/components/ui/` components (Text, Button, TextField, ...).
  One teal accent, IBM Plex fonts, sentence case, no gradients, glows, emoji or exclamation marks.
- Screens use `useAuth()`; never call Firebase directly. `EXPO_PUBLIC_*` values are public: no secrets.
- Product copy: findings are risk indicators with evidence, never accusations; sample data is fictional.
- Packages: `npx expo install` in `frontend/`, `uv add` in `backend/`. Keep `three` at `~0.186`.
- Commits: Conventional Commits (`feat(app): ...`). Never force-push or commit `.env` files or keys.
