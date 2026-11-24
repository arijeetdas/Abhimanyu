// Health checks ("abhi doctor") and the fixers shared with "abhi setup" and "abhi start".
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadState, MAIN, MIN, needsPython, PATHS, REPO, ROOT, saveState } from './config.mjs';
import { explain } from './diagnose.mjs';
import * as G from './git.mjs';
import { cmpVer, isWin, run, task, versionOf, which } from './sh.mjs';
import { install } from './tools.mjs';
import * as ui from './ui.mjs';

const exists = (p) => fs.existsSync(p);
const mtime = (p) => (exists(p) ? fs.statSync(p).mtimeMs : 0);

// ─── State helpers ───────────────────────────────────────────────────────────

/** 'na' | 'missing' | 'stale' | 'ok' for frontend/node_modules vs package-lock.json */
export function frontendDeps() {
  if (!exists(path.join(PATHS.frontend, 'package.json'))) return 'na';
  const marker = path.join(PATHS.frontend, 'node_modules', '.package-lock.json');
  if (!exists(marker)) return 'missing';
  return mtime(path.join(PATHS.frontend, 'package-lock.json')) > mtime(marker) + 2000 ? 'stale' : 'ok';
}

const backendLockHash = () => {
  const lock = path.join(PATHS.backend, 'uv.lock');
  const proj = path.join(PATHS.backend, 'pyproject.toml');
  const h = createHash('sha1');
  for (const f of [lock, proj]) if (exists(f)) h.update(fs.readFileSync(f));
  return h.digest('hex');
};

/** 'na' | 'missing' | 'stale' | 'ok'. uv does not touch .venv when nothing changed, so we remember the lock hash. */
export function backendDeps() {
  if (!exists(path.join(PATHS.backend, 'pyproject.toml'))) return 'na';
  if (!exists(path.join(PATHS.backend, '.venv', 'pyvenv.cfg'))) return 'missing';
  return loadState().backendLock === backendLockHash() ? 'ok' : 'stale';
}

const zdiff = () => (cmpVer(versionOf('git') || '0', '2.35.0') >= 0 ? 'zdiff3' : 'diff3');

/** Repo-local Git settings that make team syncing smooth (never touches your global config). */
export function recommendedGitConfig() {
  return [
    ['pull.rebase', 'true', 'pull replays your commits on top of the team\'s (clean history)'],
    ['rebase.autoStash', 'true', 'unsaved edits are put aside and restored during a sync'],
    ['fetch.prune', 'true', 'deleted GitHub branches disappear locally too'],
    ['push.autoSetupRemote', 'true', 'first push of a new branch just works'],
    ['rerere.enabled', 'true', 'Git remembers how you solved a conflict and reuses it'],
    ['merge.conflictStyle', zdiff(), 'conflicts also show the original text (easier to decide)'],
    ['core.hooksPath', '.githooks', 'safety hook blocks secrets and huge files in every commit'],
    ...(isWin ? [['core.longpaths', 'true', 'avoids "Filename too long" on Windows']] : []),
  ];
}

export function missingGitConfig() {
  return recommendedGitConfig().filter(([k, v]) => G.gitOut(['config', '--local', '--get', k]) !== v);
}

export function applyGitConfig() {
  for (const [k, v] of recommendedGitConfig()) G.git(['config', '--local', k, v]);
  ui.ok('Git settings for this project applied (local to this folder only)');
}

// ─── Fixers ──────────────────────────────────────────────────────────────────

export async function setIdentity() {
  const cur = G.identity();
  ui.info('Git stamps every commit with a name and email.');
  ui.hint('Use the SAME email as your GitHub account so commits show your profile picture.');
  ui.hint('Private option: GitHub > Settings > Emails shows a "...@users.noreply.github.com" address.');
  const name = await ui.ask('Your full name', { def: cur.name || '', required: true });
  const email = await ui.ask('Your GitHub email', {
    def: cur.email || '',
    required: true,
    validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'That does not look like an email address.'),
  });
  G.git(['config', '--global', 'user.name', name]);
  G.git(['config', '--global', 'user.email', email]);
  ui.ok(`Git identity: ${name} <${email}>`);
  return true;
}

/** Connect a plain folder (e.g. downloaded ZIP) or a wrongly-wired clone to the team repo. */
export async function connectRepo() {
  if (!G.isRepo()) {
    ui.info(`This folder is not linked to GitHub yet. Linking it to ${REPO.web}`);
    ui.hint('Your existing files are kept; Git will just compare them with the team version.');
    G.git(['init', '-q']);
    G.git(['symbolic-ref', 'HEAD', `refs/heads/${MAIN}`]);
    G.git(['remote', 'add', 'origin', REPO.url]);
    const f = G.fetchOrigin();
    if (!f.ok) {
      explain(f.output, { fallbackTitle: 'Could not download the project from GitHub' });
      return false;
    }
    G.git(['reset', '-q', `origin/${MAIN}`]);
    G.git(['branch', '-q', `--set-upstream-to=origin/${MAIN}`, MAIN]);
    ui.ok('Folder linked to GitHub');
    const changed = G.status().length;
    if (changed) ui.info(`${changed} file(s) here differ from the team version. Review them with "abhi status".`);
    return true;
  }
  const url = G.remoteUrl();
  if (G.isOurRemote(url)) return true;
  if (!url) {
    G.git(['remote', 'add', 'origin', REPO.url]);
    ui.ok('Added the GitHub remote "origin"');
    return true;
  }
  ui.warn(`"origin" points to ${url}, not ${REPO.url}`);
  if (await ui.confirm('Point origin to the team repo?', true)) {
    G.git(['remote', 'set-url', 'origin', REPO.url]);
    ui.ok('origin updated');
    return true;
  }
  return false;
}

export async function installFrontend() {
  if (frontendDeps() === 'na') return true;
  let r = await task('Installing app dependencies (npm ci, first time takes a few minutes)', 'npm', ['ci', '--no-audit', '--no-fund'], {
    cwd: PATHS.frontend,
    done: 'App dependencies installed',
  });
  if (!r.ok && /in sync|can only install/i.test(r.output)) {
    ui.warn('Lock file is out of date, falling back to npm install');
    r = await task('Installing app dependencies (npm install)', 'npm', ['install', '--no-audit', '--no-fund'], { cwd: PATHS.frontend, done: 'App dependencies installed' });
  }
  if (!r.ok) explain(r.output, { fallbackTitle: 'npm could not install the app dependencies' });
  return r.ok;
}

export async function ensureUv() {
  if (which('uv')) return true;
  ui.info('The backend uses uv to manage Python 3.12 and packages (fast, no admin rights needed).');
  return install('uv');
}

export async function installBackend() {
  if (backendDeps() === 'na') return true;
  if (!(await ensureUv())) return false;
  const r = await task('Installing Python 3.12 + backend packages (uv sync)', 'uv', ['sync'], { cwd: PATHS.backend, done: 'Backend environment ready' });
  if (r.ok) saveState({ backendLock: backendLockHash() });
  else explain(r.output, { fallbackTitle: 'uv could not set up the backend' });
  return r.ok;
}

const envKeys = (text) => new Set([...text.matchAll(/^\s*([A-Z0-9_]+)\s*=/gm)].map((m) => m[1]));

/** Create .env from .env.example, or append keys that teammates added to the example. */
export function syncEnvFile(dir, target = '.env') {
  const example = path.join(dir, '.env.example');
  const envFile = path.join(dir, target);
  if (!exists(example)) return;
  const rel = path.relative(ROOT, envFile).replace(/\\/g, '/');
  if (!exists(envFile)) {
    fs.copyFileSync(example, envFile);
    ui.ok(`Created ${rel} from .env.example ${ui.c.gray('(fill in your keys; it is never committed)')}`);
    return;
  }
  const have = envKeys(fs.readFileSync(envFile, 'utf8'));
  const exampleText = fs.readFileSync(example, 'utf8');
  const missing = [...envKeys(exampleText)].filter((k) => !have.has(k));
  if (!missing.length) return;
  const lines = exampleText.split(/\r?\n/).filter((l) => missing.some((k) => l.startsWith(k + '=')));
  fs.appendFileSync(envFile, `\n# Added by abhi from .env.example on ${new Date().toISOString().slice(0, 10)}\n${lines.join('\n')}\n`);
  ui.info(`New settings added to ${rel}: ${missing.join(', ')} ${ui.c.gray('(fill them in if you need them)')}`);
}

// ─── Doctor ──────────────────────────────────────────────────────────────────

function androidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    isWin ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : null,
    process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Android', 'sdk') : path.join(os.homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);
  return candidates.find((p) => exists(path.join(p, 'platform-tools')));
}

/** Gather all checks. Each: { group, label, status: ok|warn|fail|info, detail, fix?, manual? } */
export function collect({ deep = false } = {}) {
  const roles = loadState().roles || ['frontend'];
  const res = [];
  const add = (group, label, status, detail, extra = {}) => res.push({ group, label, status, detail, ...extra });

  // Core tools
  const gv = versionOf('git');
  add('Core tools', 'Git', gv && cmpVer(gv, MIN.git) >= 0 ? 'ok' : 'fail', gv ? `${gv}${cmpVer(gv, MIN.git) < 0 ? ` (need ${MIN.git}+)` : ''}` : 'not found', {
    fix: { label: 'Install Git', run: () => install('git') },
  });
  const nv = process.versions.node;
  add('Core tools', 'Node.js', cmpVer(nv, MIN.node) >= 0 ? 'ok' : 'fail', cmpVer(nv, MIN.node) >= 0 ? nv : `${nv} (need ${MIN.node}+)`, {
    fix: { label: 'Install Node.js LTS (then reopen the terminal)', run: () => install('node') },
  });
  const npmv = versionOf('npm');
  add('Core tools', 'npm', npmv ? 'ok' : 'fail', npmv || 'not found (comes with Node.js)');
  const id = G.identity();
  add('Core tools', 'Git identity', id.name && id.email ? 'ok' : 'fail', id.name && id.email ? `${id.name} <${id.email}>` : 'name/email not set', {
    fix: { label: 'Set your Git name and email', run: setIdentity },
  });

  // Project
  const repo = G.isRepo();
  const url = repo ? G.remoteUrl() : '';
  add('Project', 'Repository', repo && G.isOurRemote(url) ? 'ok' : 'fail', repo ? (G.isOurRemote(url) ? `linked to ${REPO.owner}/${REPO.name}` : `origin = ${url || 'missing'}`) : 'folder is not a Git repo', {
    fix: { label: 'Link this folder to the GitHub repo', run: connectRepo },
  });
  if (repo) {
    const op = G.opInProgress();
    if (op) add('Project', 'Unfinished operation', 'warn', `a ${op} is half-done`, { manual: 'Run: abhi rescue' });
    const b = G.branch();
    add('Project', 'Branch', b ? 'ok' : 'warn', b || 'detached HEAD (not on a branch)', b ? {} : { manual: 'Run: abhi rescue' });
    const ls = G.git(['ls-remote', '--heads', 'origin', MAIN], { timeout: 25000, stdin: 'inherit' });
    add('Project', 'GitHub access', ls.ok ? 'ok' : 'fail', ls.ok ? 'can read the repo' : 'cannot reach the repo', { output: ls.ok ? '' : ls.output });
    if (deep && ls.ok) {
      const p = G.git(['push', '--dry-run', '--porcelain', 'origin', `HEAD:refs/heads/abhi-access-check-${G.userSlug()}`], { timeout: 60000, stdin: 'inherit' });
      add('Project', 'Push permission', p.ok ? 'ok' : 'fail', p.ok ? 'you can push' : 'push was refused', { output: p.ok ? '' : p.output });
    }
    const missing = missingGitConfig();
    add('Project', 'Team Git settings', missing.length ? 'warn' : 'ok', missing.length ? `${missing.length} not applied (${missing.map((m) => m[0]).join(', ')})` : 'applied', {
      fix: { label: 'Apply team Git settings', run: async () => (applyGitConfig(), true) },
    });
    add('Project', 'Safety snapshots', 'info', `${G.listSnapshots().length} saved (abhi undo -> restore)`);
  }

  // App
  const fd = frontendDeps();
  if (fd !== 'na') {
    add('App (frontend)', 'Dependencies', fd === 'ok' ? 'ok' : fd === 'missing' ? 'fail' : 'warn', { ok: 'installed', missing: 'not installed', stale: 'out of date (teammates changed packages)' }[fd], {
      fix: { label: 'Install app dependencies', run: installFrontend },
    });
    add('App (frontend)', 'Phone testing', 'info', 'install "Expo Go" from the Play Store / App Store');
  }

  // Backend
  const wantPy = needsPython(roles) || exists(path.join(PATHS.backend, '.venv'));
  if (exists(PATHS.backend)) {
    const uvv = which('uv') ? versionOf('uv') : null;
    add('Backend', 'uv', uvv ? 'ok' : wantPy ? 'fail' : 'info', uvv || (wantPy ? 'not installed' : 'not installed (only needed for backend work)'), {
      fix: wantPy ? { label: 'Install uv', run: ensureUv } : undefined,
    });
    if (uvv) {
      const py = run('uv', ['python', 'find', MIN.python], { quiet: true, cwd: PATHS.backend });
      add('Backend', `Python ${MIN.python}`, py.ok ? 'ok' : wantPy ? 'warn' : 'info', py.ok ? py.stdout.trim() : 'not installed yet (uv sync downloads it)');
      const bd = backendDeps();
      add('Backend', 'Environment', bd === 'ok' ? 'ok' : wantPy ? 'warn' : 'info', { ok: 'backend/.venv ready', missing: 'not created', stale: 'out of date' }[bd], {
        fix: wantPy || bd !== 'missing' ? { label: 'Set up backend environment (uv sync)', run: installBackend } : undefined,
      });
    }
    const hasEnv = exists(path.join(PATHS.backend, '.env'));
    add('Backend', 'backend/.env', hasEnv ? 'ok' : wantPy ? 'warn' : 'info', hasEnv ? 'present' : 'missing', {
      fix: wantPy ? { label: 'Create backend/.env from the example', run: async () => (syncEnvFile(PATHS.backend), true) } : undefined,
    });
  }

  // Optional
  const optional = (label, present, detail, note) => add('Optional', label, present ? 'ok' : 'info', present ? detail : note);
  optional('VS Code', !!which('code'), 'installed', 'not on PATH (recommended editor)');
  optional('GitHub CLI', !!which('gh'), 'installed', 'not installed (handy for pull requests)');
  optional('Docker', !!which('docker'), 'installed', 'not installed (only for local Postgres/Redis/Neo4j)');
  const sdk = androidSdk();
  optional('Android SDK', !!sdk, sdk || '', 'not found (only for the Android emulator)');
  const jv = which('java') ? versionOf('java', ['-version']) : null;
  optional('Java (JDK 17)', !!jv, jv || '', 'not found (only for local Android builds)');
  return res;
}

const ICON = {
  ok: () => ui.c.green(ui.sym.ok),
  warn: () => ui.c.yellow(ui.sym.warn),
  fail: () => ui.c.red(ui.sym.fail),
  info: () => ui.c.gray(ui.sym.off),
};

export function printChecks(results) {
  let group = '';
  for (const r of results) {
    if (r.group !== group) {
      group = r.group;
      ui.log(`\n  ${ui.c.bold(group)}`);
    }
    const detail = r.status === 'ok' ? ui.c.muted(r.detail) : r.status === 'info' ? ui.c.gray(r.detail) : r.status === 'fail' ? ui.c.red(r.detail) : ui.c.yellow(r.detail);
    ui.log(`   ${ICON[r.status]()} ${r.label.padEnd(22)} ${detail}`);
  }
  const n = (s) => results.filter((r) => r.status === s).length;
  ui.log(`\n  ${ui.c.green(n('ok') + ' ok')} ${ui.c.gray(ui.sym.dot)} ${ui.c.yellow(n('warn') + ' warnings')} ${ui.c.gray(ui.sym.dot)} ${ui.c.red(n('fail') + ' problems')}`);
}

export async function doctor({ deep = false } = {}) {
  ui.section('Doctor: checking your setup');
  let results = collect({ deep });
  printChecks(results);

  for (const r of results.filter((x) => x.output)) explain(r.output, { fallbackTitle: `${r.label}: failed` });

  const fixable = results.filter((r) => (r.status === 'fail' || r.status === 'warn') && r.fix);
  const manual = results.filter((r) => (r.status === 'fail' || r.status === 'warn') && !r.fix && r.manual);
  for (const m of manual) ui.hint(`${m.label}: ${m.manual}`);
  if (!fixable.length) {
    if (!results.some((r) => r.status === 'fail')) ui.ok(ui.c.bold('Everything needed is in place.'));
    return results;
  }
  ui.blank();
  for (const f of fixable) ui.hint(`${f.label}: ${f.fix.label}`);
  if (!(await ui.confirm(`Fix ${fixable.length === 1 ? 'this' : `these ${fixable.length}`} automatically now?`, true))) return results;
  for (const f of fixable) {
    ui.log(`\n  ${ui.c.bold(f.fix.label)}`);
    try {
      await f.fix.run();
    } catch (e) {
      ui.fail(e.message);
    }
  }
  ui.section('Doctor: after fixes');
  results = collect({ deep: false });
  printChecks(results);
  return results;
}
