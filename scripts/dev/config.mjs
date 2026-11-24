// Shared constants and the small local state file (.dev/state.json, never committed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = '1.0.0';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const REPO = {
  owner: 'arijeetdas',
  name: 'Abhimanyu',
  url: 'https://github.com/arijeetdas/Abhimanyu.git',
  web: 'https://github.com/arijeetdas/Abhimanyu',
};

export const MAIN = 'main';

export const MIN = { git: '2.30.0', node: '20.19.4', python: '3.12' };

export const PATHS = {
  frontend: path.join(ROOT, 'frontend'),
  backend: path.join(ROOT, 'backend'),
  guide: path.join(ROOT, 'docs', 'SETUP_AND_WORKFLOW.md'),
  changelog: path.join(ROOT, 'docs', 'CHANGELOG.md'),
  state: path.join(ROOT, '.dev'),
  logs: path.join(ROOT, '.dev', 'logs'),
};

const STATE_FILE = path.join(PATHS.state, 'state.json');

// The toolkit was called "abhi" before; carry over its local state folder once.
const LEGACY_STATE = path.join(ROOT, '.abhi');
if (fs.existsSync(LEGACY_STATE) && !fs.existsSync(PATHS.state)) {
  try {
    fs.renameSync(LEGACY_STATE, PATHS.state);
  } catch {
    /* folder in use; it is simply recreated */
  }
}

export function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export function saveState(patch) {
  const next = { ...loadState(), ...patch };
  fs.mkdirSync(PATHS.state, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2) + '\n');
  return next;
}

export const ROLES = [
  { value: 'frontend', label: 'Frontend', hint: 'website + Android/iOS app (Expo, React Native)' },
  { value: 'backend', label: 'Backend API', hint: 'FastAPI, PostgreSQL, Celery' },
  { value: 'ai', label: 'Agentic AI', hint: 'LangGraph, LangChain, Gemini' },
  { value: 'data', label: 'Data pipelines', hint: 'scrapers, filings, OCR' },
  { value: 'ml', label: 'ML & graph', hint: 'XGBoost, Isolation Forest, Neo4j' },
];

/** Every role except pure frontend needs the Python backend toolchain. */
export const needsPython = (roles = []) => roles.some((r) => r !== 'frontend');
