// Thin, safe wrappers around git. Messages are forced to English so errors can be diagnosed.
import fs from 'node:fs';
import path from 'node:path';

import { MAIN, REPO, ROOT } from './config.mjs';
import { isWin, run } from './sh.mjs';

const BASE_ENV = { LANG: 'C', LC_ALL: 'C', GIT_TERMINAL_PROMPT: '1', GIT_MERGE_AUTOEDIT: 'no' };
const NET = { timeout: 180000, stdin: 'inherit' };

export function git(args, opts = {}) {
  return run('git', ['-c', 'core.quotepath=false', '-c', 'color.ui=false', ...args], {
    ...opts,
    env: { ...BASE_ENV, ...(opts.env || {}) },
  });
}
export const gitOut = (args, opts) => {
  const r = git(args, { quiet: true, ...opts });
  return r.ok ? r.stdout.trim() : '';
};
export const gitNet = (args, opts = {}) => git(args, { ...NET, ...opts });

const norm = (p) => {
  // realpath.native expands Windows 8.3 short names (C:\Users\ARIJEE~1) and resolves symlinks/junctions,
  // so the same folder always compares equal however it was reached.
  let r = path.resolve(p);
  try {
    r = fs.realpathSync.native(r);
  } catch {
    /* keep the resolved path */
  }
  return isWin ? r.toLowerCase() : r;
};

export function isRepo() {
  const top = gitOut(['rev-parse', '--show-toplevel']);
  return !!top && norm(top) === norm(ROOT);
}

/** True when this folder itself has a .git (even if Git cannot read it right now). */
export const hasOwnGitDir = () => fs.existsSync(path.join(ROOT, '.git'));
export const gitDir = () => gitOut(['rev-parse', '--absolute-git-dir']);
export const branch = () => gitOut(['symbolic-ref', '--short', '-q', 'HEAD']);
export const hasCommits = () => git(['rev-parse', '--verify', '-q', 'HEAD'], { quiet: true }).ok;
export const refExists = (ref) => git(['rev-parse', '--verify', '-q', ref], { quiet: true }).ok;
export const sha = (ref = 'HEAD', short = false) => gitOut(['rev-parse', ...(short ? ['--short'] : []), ref]);
export const remoteUrl = () => gitOut(['remote', 'get-url', 'origin']);
// DEV_REPO_URL lets a mirror/fork (or the toolkit's own tests) count as the team remote.
export const isOurRemote = (url) =>
  new RegExp(`github\\.com[/:]${REPO.owner}/${REPO.name}(\\.git)?/?$`, 'i').test(url || '') ||
  (!!process.env.DEV_REPO_URL && url === process.env.DEV_REPO_URL);

export function identity() {
  return { name: gitOut(['config', 'user.name']), email: gitOut(['config', 'user.email']) };
}

/** Short, lowercase name used for branch names: "Arijeet Das" -> "arijeet". */
export function userSlug() {
  const n = identity().name || process.env.USERNAME || process.env.USER || 'me';
  return (n.split(/\s+/)[0] || 'me').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'me';
}

const isConflict = (x, y) => x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D');

/** Parsed `git status`. Each entry: { x, y, path, orig, kind, untracked, conflicted }. */
export function status() {
  const r = git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], { quiet: true });
  const parts = r.stdout.split('\0');
  const files = [];
  for (let i = 0; i < parts.length; i++) {
    const e = parts[i];
    if (!e || e.length < 4) continue;
    const x = e[0];
    const y = e[1];
    const p = e.slice(3);
    let orig;
    if (x === 'R' || x === 'C') orig = parts[++i];
    const conflicted = isConflict(x, y);
    const kind = conflicted
      ? 'conflict'
      : x === '?' || x === 'A'
        ? 'new'
        : x === 'D' || y === 'D'
          ? 'deleted'
          : x === 'R'
            ? 'renamed'
            : 'modified';
    files.push({ x, y, path: p, orig, kind, untracked: x === '?', conflicted });
  }
  return files;
}

/** 'rebase' | 'merge' | 'cherry-pick' | 'revert' | null */
export function opInProgress() {
  const d = gitDir();
  if (!d) return null;
  const has = (p) => fs.existsSync(path.join(d, p));
  if (has('rebase-merge') || has('rebase-apply')) return 'rebase';
  if (has('MERGE_HEAD')) return 'merge';
  if (has('CHERRY_PICK_HEAD')) return 'cherry-pick';
  if (has('REVERT_HEAD')) return 'revert';
  return null;
}

export function aheadBehind(a, b) {
  const o = gitOut(['rev-list', '--left-right', '--count', `${a}...${b}`]);
  const [ahead, behind] = o.split(/\s+/).map(Number);
  return { ahead: ahead || 0, behind: behind || 0 };
}

/** Commits in a range, newest first: [{ hash, author, when, subject }]. */
export function commits(range, n = 20) {
  const o = gitOut(['log', `-n${n}`, '--format=%h%x1f%an%x1f%ar%x1f%s', range]);
  return o
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [hash, author, when, subject] = l.split('\x1f');
      return { hash, author, when, subject };
    });
}

export const conflictedFiles = () => gitOut(['diff', '--name-only', '--diff-filter=U']).split(/\r?\n/).filter(Boolean);

export function hasMarkers(file) {
  try {
    return /^(<{7}|>{7})( |$)/m.test(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  } catch {
    return false;
  }
}

export const fetchOrigin = () => gitNet(['fetch', '--prune', 'origin']);

/** Remote tracking ref for a branch if it exists on GitHub, e.g. origin/main. */
export function upstreamRef(b) {
  const ref = `origin/${b}`;
  return refExists(ref) ? ref : null;
}

/** Is this commit already on GitHub (contained in any origin/* branch)? */
export const isPushed = (rev = 'HEAD') => !!gitOut(['branch', '-r', '--contains', rev]);

// ─── Safety snapshots ────────────────────────────────────────────────────────
// A snapshot is a hidden commit of EVERYTHING in the folder (tracked, modified and new files,
// minus ignored ones) stored under refs/dev/snapshots/. It never touches your files, index or
// branches, and is taken before every risky operation, so nothing can be lost.

const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');

export function snapshot(label) {
  const d = gitDir();
  if (!d) return null;
  const tmp = path.join(d, 'dev-snapshot.index');
  const env = { GIT_INDEX_FILE: tmp };
  const id = identity();
  const who = id.name && id.email ? {} : { GIT_AUTHOR_NAME: 'dev', GIT_AUTHOR_EMAIL: 'dev@localhost', GIT_COMMITTER_NAME: 'dev', GIT_COMMITTER_EMAIL: 'dev@localhost' };
  try {
    const realIndex = path.join(d, 'index');
    if (fs.existsSync(realIndex)) fs.copyFileSync(realIndex, tmp);
    if (!git(['add', '-A'], { env, quiet: true }).ok) return null;
    const tree = gitOut(['write-tree'], { env });
    if (!tree) return null;
    const parent = hasCommits() ? ['-p', 'HEAD'] : [];
    const commit = gitOut(['commit-tree', tree, ...parent, '-m', `dev snapshot: ${label}`], { env: who });
    if (!commit) return null;
    const ref = `refs/dev/snapshots/${stamp()}-${label.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`;
    git(['update-ref', ref, commit], { quiet: true });
    pruneSnapshots();
    return { ref, sha: commit, short: commit.slice(0, 8) };
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

export function listSnapshots() {
  const o = gitOut(['for-each-ref', '--sort=-refname', '--format=%(refname)%1f%(objectname)%1f%(creatordate:relative)%1f%(creatordate:unix)', 'refs/dev/snapshots']);
  return o
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [ref, full, when, unix] = l.split('\x1f');
      return { ref, sha: full, short: full.slice(0, 8), when, unix: Number(unix), label: ref.split('/').pop() };
    });
}

/** Keep the newest 40 snapshots plus anything younger than 21 days (hard cap 200). */
function pruneSnapshots() {
  const cutoff = Date.now() / 1000 - 21 * 86400;
  listSnapshots().forEach((s, i) => {
    if ((i >= 40 && s.unix < cutoff) || i >= 200) git(['update-ref', '-d', s.ref], { quiet: true });
  });
}

export const commitUrl = (h) => `${REPO.web}/commit/${h}`;
export const branchUrl = (b) => `${REPO.web}/tree/${encodeURI(b)}`;
export const compareUrl = (b) => `${REPO.web}/compare/${MAIN}...${encodeURI(b)}?expand=1`;
