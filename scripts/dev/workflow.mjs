// Daily workflow: start, sync, finish, status, branches, undo and rescue.
// Golden rule: before anything risky, take a snapshot (see git.mjs) so nothing can ever be lost.
import fs from 'node:fs';
import path from 'node:path';

import * as C from './checks.mjs';
import { loadState, MAIN, needsPython, PATHS, ROOT, saveState } from './config.mjs';
import { explain, matches } from './diagnose.mjs';
import * as G from './git.mjs';
import { report, scanStaged, stagedFiles } from './safety.mjs';
import { openTerminal, openUrl, run, runLive, task, which } from './sh.mjs';
import * as ui from './ui.mjs';

const { c, sym } = ui;

// ─── Presentation helpers ────────────────────────────────────────────────────

const AREAS = [
  [/^frontend\//, 'App'],
  [/^backend\//, 'Backend'],
  [/^docs\//, 'Docs'],
  [/^(scripts\/|dev(\.cmd)?$|\.githooks\/)/, 'Toolkit'],
  [/^\.github\//, 'CI'],
];
const areaOf = (p) => (AREAS.find(([re]) => re.test(p)) || [null, 'Project'])[1];
const SCOPE = { App: 'app', Backend: 'api', Docs: 'docs', Toolkit: 'toolkit', CI: 'ci', Project: '' };

const TYPES = [
  { value: 'feat', label: 'feat', hint: 'a new feature, screen or endpoint' },
  { value: 'fix', label: 'fix', hint: 'a bug fix' },
  { value: 'docs', label: 'docs', hint: 'documentation only' },
  { value: 'style', label: 'style', hint: 'look & feel or formatting, no logic change' },
  { value: 'refactor', label: 'refactor', hint: 'restructured code, same behaviour' },
  { value: 'test', label: 'test', hint: 'tests added or fixed' },
  { value: 'chore', label: 'chore', hint: 'tooling, dependencies, config' },
];

function printChanges(files, max = 16) {
  const mark = {
    new: c.green('+ new     '),
    modified: c.yellow('~ changed '),
    deleted: c.red('- deleted '),
    renamed: c.blue('> renamed '),
    conflict: c.red('! conflict'),
  };
  files.slice(0, max).forEach((f) => ui.log(`   ${mark[f.kind]} ${f.path}`));
  if (files.length > max) ui.log(c.gray(`   ... and ${files.length - max} more`));
}

function showIncoming(range, n, label) {
  const list = G.commits(range, 8);
  const authors = [...new Set(list.map((k) => k.author))];
  ui.info(`${n} new commit${n > 1 ? 's' : ''} ${label ? `from ${label}` : `by ${authors.join(', ')}`}:`);
  for (const k of list) ui.log(`     ${c.gray(k.hash)} ${ui.truncate(k.subject, ui.cols() - 40)} ${c.gray(`${sym.dot} ${k.author}, ${k.when}`)}`);
  if (n > list.length) ui.log(c.gray(`     ... and ${n - list.length} more`));
}

const launcher = process.platform === 'win32' ? '.\\dev' : './dev';

// ─── Preflight ───────────────────────────────────────────────────────────────

/** Make sure the folder, identity and Git state are sane. Returns false to stop. */
async function preflight() {
  if (!G.isRepo() || !G.isOurRemote(G.remoteUrl())) {
    ui.warn('This folder is not linked to the team repo yet.');
    if (!(await C.connectRepo())) return false;
  }
  const id = G.identity();
  if (!id.name || !id.email) {
    ui.warn('Git needs your name and email before you can commit.');
    await C.setIdentity();
  }
  if (C.missingGitConfig().length) C.applyGitConfig();
  if (G.opInProgress() || G.conflictedFiles().length) {
    ui.warn('A previous sync was left half-finished. Let\'s sort that out first.');
    await rescue();
    if (G.opInProgress() || G.conflictedFiles().length) return false;
  }
  if (!G.branch()) {
    ui.warn('You are not on a branch right now (detached HEAD).');
    await rescue();
    if (!G.branch()) return false;
  }
  return true;
}

// ─── Conflicts ───────────────────────────────────────────────────────────────

// Which "side" is yours depends on the operation (Git's ours/theirs flip during a rebase).
const SIDES = {
  rebase: { mine: '--theirs', team: '--ours', current: 'the team version', incoming: 'YOUR version' },
  merge: { mine: '--ours', team: '--theirs', current: 'YOUR version', incoming: 'the team version' },
  stash: { mine: '--theirs', team: '--ours', current: 'the team version', incoming: 'YOUR unsaved edits' },
  'cherry-pick': { mine: '--ours', team: '--theirs', current: 'YOUR version', incoming: 'the picked commit' },
  revert: { mine: '--ours', team: '--theirs', current: 'YOUR version', incoming: 'the undo' },
};

function takeSide(file, flag) {
  if (G.git(['checkout', flag, '--', file], { quiet: true }).ok) G.git(['add', '--', file]);
  else G.git(['rm', '-q', '--', file]); // that side deleted the file
}

function abortOp(mode, before) {
  if (mode === 'stash') {
    G.git(['reset', '--hard', '-q', before]);
    const pop = G.git(['stash', 'pop', '-q']);
    if (!pop.ok) ui.info('Your unsaved edits are kept safely in the Git stash (run: git stash list).');
  } else G.git([mode, '--abort']);
  ui.ok('Back to exactly how things were before. Nothing was lost.');
}

function continueOp(mode) {
  const env = { GIT_EDITOR: 'true' };
  if (mode === 'merge') return G.git(['commit', '--no-edit'], { env: { ...env, DEV_SKIP_HOOK: '1' } });
  return G.git(['-c', 'core.editor=true', mode, '--continue'], { env: { ...env, DEV_SKIP_HOOK: '1' } });
}

/**
 * Guided conflict resolution. Returns true when the operation completed, false when cancelled.
 * `target` is the team ref (for "who changed this"), `before` the commit to return to on cancel.
 */
export async function resolveConflicts(mode, target, before) {
  const side = SIDES[mode] || SIDES.merge;
  for (;;) {
    const files = G.conflictedFiles();
    if (!files.length) {
      if (mode === 'stash') {
        G.git(['reset', '-q']);
        G.git(['stash', 'drop', '-q']);
        ui.ok('Conflicts resolved. Your edits are back as unsaved changes.');
        return true;
      }
      if (G.opInProgress() !== mode) return true;
      const r = continueOp(mode);
      if (G.opInProgress() === mode) {
        if (G.conflictedFiles().length) {
          ui.info('The next commit has conflicts too. Same steps again:');
          continue;
        }
        if (mode === 'rebase' && /nothing to commit|allow-empty|No changes/i.test(r.output)) {
          G.git(['rebase', '--skip']); // that commit became empty after resolution
          continue;
        }
        explain(r.output, { fallbackTitle: `Could not finish the ${mode}` });
        return false;
      }
      ui.ok('Conflicts resolved and combined.');
      return true;
    }

    const who = (f) => (target ? G.gitOut(['log', '-1', '--format=%an', target, '--', f]) : '');
    ui.blank();
    ui.box(
      [
        c.bold(`${files.length} file${files.length > 1 ? 's were' : ' was'} changed by you AND a teammate in the same place:`),
        ...files.map((f) => {
          const w = who(f);
          return `${c.red('!')} ${f}${w ? c.gray(`  (team side by ${w})`) : ''}`;
        }),
        '',
        'Git marked both versions inside each file:',
        `${c.gray('<<<<<<<')}  ${side.current}   ${c.gray('(VS Code: "Current")')}`,
        `${c.gray('|||||||')}  the original text`,
        `${c.gray('=======')}`,
        `${c.gray('>>>>>>>')}  ${side.incoming}   ${c.gray('(VS Code: "Incoming")')}`,
      ],
      { title: 'Merge conflict', tone: 'yellow' },
    );
    const options = [
      { value: 'edit', label: 'Fix it myself in the editor (recommended)', hint: which('code') ? 'opens the files in VS Code' : 'open the files in your editor' },
      { value: 'each', label: 'Decide file by file', hint: 'keep mine or keep theirs per file' },
      { value: 'mine', label: 'Keep MY version of all of them', hint: 'teammate edits in these files are dropped' },
      { value: 'team', label: 'Keep the TEAM version of all of them', hint: 'your edits here are dropped (a backup exists)' },
      { value: 'cancel', label: 'Cancel: go back to before this sync', hint: 'safe; try later or ask a teammate' },
      { value: 'rescue', label: 'Get help: upload my work for a teammate', hint: 'creates a rescue branch on GitHub' },
    ];
    if (!ui.interactive() && !process.env.DEV_ANSWERS) ui.info('No terminal to ask you in, so playing it safe. Run dev sync in a terminal to resolve it step by step.');
    const choice = await ui.select('How do you want to fix it?', options, { initial: ui.interactive() ? 0 : 4 });

    if (choice === 'edit') {
      if (which('code')) run('code', ['-r', ROOT, ...files.map((f) => path.join(ROOT, f))], { quiet: true });
      else ui.hint(`Open these in your editor: ${files.join(', ')}`);
      ui.hint('VS Code shows buttons above each conflict: Accept Current / Accept Incoming / Accept Both.');
      ui.hint('Or click "Resolve in Merge Editor" at the bottom right of the file.');
      await ui.pause('Fix and SAVE the files, then press Enter here');
      const still = files.filter(G.hasMarkers);
      if (still.length) {
        ui.warn(`Still contains <<<<<<< / >>>>>>> markers: ${still.join(', ')}`);
        continue;
      }
      G.git(['add', '--', ...files]);
    } else if (choice === 'each') {
      for (const f of files) {
        const pick = await ui.select(f, [
          { value: 'mine', label: 'Keep mine' },
          { value: 'team', label: 'Keep the team version' },
          { value: 'edit', label: 'I will edit this one myself' },
        ]);
        if (pick !== 'edit') takeSide(f, side[pick]);
      }
    } else if (choice === 'mine' || choice === 'team') {
      files.forEach((f) => takeSide(f, side[choice]));
    } else if (choice === 'cancel') {
      abortOp(mode, before);
      return false;
    } else if (choice === 'rescue') {
      abortOp(mode, before);
      await rescueUpload();
      return false;
    }
  }
}

/** Bring `target` into the current branch. Returns 'ok' | 'cancelled' | 'failed'. */
async function integrate(target, kind) {
  const before = G.sha('HEAD');
  const r = kind === 'merge' ? G.git(['merge', '--no-edit', '--autostash', target], { env: { DEV_SKIP_HOOK: '1' } }) : G.git(['rebase', '--autostash', target]);
  const op = G.opInProgress();
  if (op === 'rebase' || op === 'merge') return (await resolveConflicts(op, target, before)) ? 'ok' : 'cancelled';
  if (G.conflictedFiles().length) {
    ui.warn('Your unsaved edits overlap with the new team changes.');
    return (await resolveConflicts('stash', target, before)) ? 'ok' : 'cancelled';
  }
  if (r.ok) return 'ok';
  explain(r.output, { fallbackTitle: 'Could not combine your work with the team\'s' });
  return 'failed';
}

// ─── Sync core ───────────────────────────────────────────────────────────────

async function pushWithRetry(b) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const own = G.upstreamRef(b);
    const ahead = own ? G.aheadBehind('HEAD', own).ahead : 1;
    if (!ahead) return { ok: true, pushed: false };
    ui.log(` ${c.gray(sym.ellipsis)} Uploading ${own ? `${ahead} commit${ahead > 1 ? 's' : ''}` : `new branch ${b}`} to GitHub...`);
    const r = G.gitNet(['push', '-u', 'origin', `HEAD:refs/heads/${b}`]);
    if (r.ok) {
      ui.ok(`Uploaded to GitHub ${c.gray(`(${b})`)}`);
      return { ok: true, pushed: true };
    }
    if (matches(r.output, 'rejected') && !matches(r.output, 'protected') && attempt < 3) {
      ui.info('A teammate pushed a moment ago. Combining their work with yours and retrying...');
      const f = G.fetchOrigin();
      if (!f.ok) break;
      if ((await integrate(`origin/${b}`, 'rebase')) !== 'ok') return { ok: false };
      continue;
    }
    explain(r.output, { fallbackTitle: 'Upload to GitHub failed' });
    ui.info('Your commits are safe on this PC. Fix the problem above, then run dev sync.');
    return { ok: false };
  }
  return { ok: false };
}

/** Fetch, combine team work into the current branch, optionally push. */
export async function syncCore({ push = true } = {}) {
  const b = G.branch();
  ui.log(` ${c.gray(sym.ellipsis)} Checking GitHub for new work...`);
  const f = G.fetchOrigin();
  if (!f.ok) {
    if (matches(f.output, 'offline')) {
      ui.warn('You are offline. Everything stays saved on this PC; run dev sync when you are back online.');
      return { offline: true, changedFiles: [] };
    }
    explain(f.output, { fallbackTitle: 'Could not check GitHub' });
    return { failed: true, changedFiles: [] };
  }
  const before = G.sha('HEAD');

  const own = G.upstreamRef(b);
  if (own) {
    const { behind } = G.aheadBehind('HEAD', own);
    if (behind) {
      showIncoming(`HEAD..${own}`, behind);
      G.snapshot('before-sync');
      const res = await integrate(own, 'rebase');
      if (res !== 'ok') return { cancelled: true, changedFiles: [] };
    }
  }
  if (b !== MAIN && G.refExists(`origin/${MAIN}`)) {
    const { behind } = G.aheadBehind('HEAD', `origin/${MAIN}`);
    if (behind) {
      showIncoming(`HEAD..origin/${MAIN}`, behind, MAIN);
      G.snapshot('before-merge-main');
      const res = await integrate(`origin/${MAIN}`, 'merge');
      if (res !== 'ok') return { cancelled: true, changedFiles: [] };
    }
  }

  const after = G.sha('HEAD');
  const changedFiles = before && after && before !== after ? G.gitOut(['diff', '--name-only', before, after]).split('\n').filter(Boolean) : [];
  if (changedFiles.length) ui.ok(`Got the latest team work ${c.gray(`(${changedFiles.length} file${changedFiles.length > 1 ? 's' : ''} updated)`)}`);
  else if (before !== after) ui.ok("Combined your work with the team's");
  else ui.ok('Up to date with the team');

  let pushed = false;
  if (push) {
    const p = await pushWithRetry(b);
    if (!p.ok) return { pushFailed: true, changedFiles };
    pushed = p.pushed;
  }
  saveState({ lastSync: new Date().toISOString() });
  return { ok: true, pushed, changedFiles };
}

/** Install packages again when teammates changed them, and add new .env settings. */
async function refreshDeps(changedFiles = []) {
  const roles = loadState().roles || ['frontend'];
  const fd = C.frontendDeps();
  const pkgChanged = changedFiles.some((f) => /^frontend\/package(-lock)?\.json$/.test(f));
  if (fd === 'stale' || (fd === 'ok' && pkgChanged) || (fd === 'missing' && roles.includes('frontend'))) {
    ui.info(fd === 'missing' ? 'App dependencies are not installed yet.' : 'Teammates changed the app packages. Updating yours...');
    await C.installFrontend();
  }
  const wantPy = needsPython(roles) || fs.existsSync(path.join(PATHS.backend, '.venv'));
  if (wantPy && fs.existsSync(path.join(PATHS.backend, 'pyproject.toml'))) {
    const pyChanged = changedFiles.some((f) => /^backend\/(pyproject\.toml|uv\.lock)$/.test(f));
    if (C.backendDeps() !== 'ok' || pyChanged) {
      ui.info('Updating the backend environment...');
      await C.installBackend();
    }
    C.syncEnvFile(PATHS.backend);
  }
}

// ─── Running the project ─────────────────────────────────────────────────────

export const TARGETS = [
  { value: 'web', label: 'Website in the browser', hint: 'opens http://localhost:8081' },
  { value: 'phone', label: 'App on my phone (Expo Go)', hint: 'scan the QR code; phone on the same Wi-Fi' },
  { value: 'tunnel', label: 'App on my phone, other network', hint: 'slower, works through any firewall' },
  { value: 'android', label: 'Android emulator', hint: 'needs Android Studio' },
  { value: 'backend', label: 'Backend API', hint: 'FastAPI at http://localhost:8000/docs' },
  { value: 'all', label: 'Backend + website together', hint: 'the API opens in a second window' },
  { value: 'none', label: 'Nothing, I only wanted to sync' },
];

const API_ARGS = ['run', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'];

export async function runTarget(target) {
  if (['web', 'phone', 'tunnel', 'android', 'all'].includes(target) && C.frontendDeps() !== 'ok') {
    if (!(await C.installFrontend())) return { code: 1 };
  }
  if (['backend', 'all'].includes(target)) {
    if (C.backendDeps() !== 'ok' && !(await C.installBackend())) return { code: 1 };
    C.syncEnvFile(PATHS.backend);
  }
  if (target === 'all') {
    if (openTerminal('Abhimanyu API', PATHS.backend, `uv ${API_ARGS.join(' ')}`)) ui.ok('Backend API started in a new window (http://localhost:8000/docs)');
    else ui.hint(`Open a second terminal and run: ${launcher} run backend`);
    target = 'web';
  }
  const tips = {
    web: ['The website opens in your browser. Edits reload automatically.'],
    phone: ['Open Expo Go on your phone and scan the QR code below.', 'Phone and PC must be on the same Wi-Fi (or choose "other network").'],
    tunnel: ['Scan the QR code with Expo Go. First run may ask to install @expo/ngrok: say yes.'],
    android: ['Start an emulator in Android Studio first (Device Manager > Play).'],
    backend: ['API docs: http://localhost:8000/docs   Health: http://localhost:8000/health'],
  }[target];
  ui.blank();
  ui.box([...tips, '', `${c.bold('Ctrl+C')} stops it. The dev script will then offer to upload your work.`], { title: TARGETS.find((t) => t.value === target).label });
  if (target === 'backend') return runLive('uv', API_ARGS, { cwd: PATHS.backend });
  const expo = { web: ['expo', 'start', '--web'], phone: ['expo', 'start'], tunnel: ['expo', 'start', '--tunnel'], android: ['expo', 'start', '--android'] }[target];
  return runLive('npx', expo, { cwd: PATHS.frontend });
}

async function afterSession(opts) {
  ui.section('Session ended');
  const b = G.branch();
  const own = b && G.upstreamRef(b);
  const unpushed = own ? G.aheadBehind('HEAD', own).ahead : 0;
  if (G.status().length) {
    if (await ui.confirm('Upload your changes to GitHub now (commit + push)?', true)) await finish(opts);
    else ui.hint(`No problem. Run ${launcher} finish whenever you are ready.`);
  } else if (unpushed) {
    if (await ui.confirm(`You have ${unpushed} commit(s) not on GitHub yet. Upload them now?`, true)) await syncCore({ push: true });
  } else ui.ok('No changes this time. See you next session!');
}

// ─── Commands ────────────────────────────────────────────────────────────────

export async function start(opts = {}) {
  const state = loadState();
  ui.section('Start working');
  if (!state.setupDone) {
    ui.warn('Setup has not been run on this PC yet.');
    if (await ui.confirm('Run setup now? (recommended, a few minutes)', true)) {
      const { setup } = await import('./setup.mjs');
      await setup();
    }
  }
  if (!(await preflight())) return;
  ui.kv('Branch', c.accent(G.branch()));

  let result = { changedFiles: [] };
  const files = G.status();
  if (files.length) {
    ui.info(`You have ${files.length} unsaved change${files.length > 1 ? 's' : ''} from last time:`);
    printChanges(files, 8);
    const pick = await ui.select('What should happen to them?', [
      { value: 'keep', label: 'Keep them and sync anyway (recommended)', hint: 'set aside during the sync and put back' },
      { value: 'finish', label: 'Upload them first (commit + push)', hint: 'if that work is finished' },
      { value: 'skip', label: 'Do not sync right now', hint: 'just run the project' },
    ]);
    if (pick === 'finish') await finish({ ...opts, keepGoing: true });
    else if (pick === 'keep') result = await syncCore({ push: true });
  } else result = await syncCore({ push: true });

  await refreshDeps(result.changedFiles);

  let target = opts.target;
  if (!target) {
    const last = TARGETS.findIndex((t) => t.value === (state.lastTarget || 'web'));
    target = await ui.select('What do you want to run?', TARGETS, { initial: ui.interactive() ? Math.max(0, last) : TARGETS.length - 1 });
  }
  saveState({ lastTarget: target, lastStart: new Date().toISOString() });
  if (target === 'none') {
    ui.ok(`All synced. When you are done:  ${c.accent(`${launcher} finish`)}`);
    return;
  }
  await runTarget(target);
  await afterSession(opts);
}

export async function sync() {
  ui.section('Sync with the team');
  if (!(await preflight())) return;
  ui.kv('Branch', c.accent(G.branch()));
  const r = await syncCore({ push: true });
  await refreshDeps(r.changedFiles);
  if (G.status().length) ui.hint(`You still have unsaved changes. Upload them with ${launcher} finish.`);
}

function addChangelogEntry(kind, text) {
  if (!fs.existsSync(PATHS.changelog)) return false;
  const lines = fs.readFileSync(PATHS.changelog, 'utf8').split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /^## \[Unreleased\]/i.test(l));
  if (startIdx < 0) return false;
  let endIdx = lines.findIndex((l, i) => i > startIdx && /^## /.test(l));
  if (endIdx < 0) endIdx = lines.length;
  const heading = kind === 'fix' ? 'Fixed' : 'Added';
  let h = lines.findIndex((l, i) => i > startIdx && i < endIdx && new RegExp(`^### ${heading}\\b`).test(l));
  if (h < 0) {
    lines.splice(startIdx + 1, 0, '', `### ${heading}`);
    h = startIdx + 2;
  }
  if (/^- _Nothing yet\._/.test(lines[h + 1] || '')) lines.splice(h + 1, 1, `- ${text}`);
  else lines.splice(h + 1, 0, `- ${text}`);
  fs.writeFileSync(PATHS.changelog, lines.join('\n'));
  return true;
}

async function maybeChangelog(msg, staged) {
  const m = msg.match(/^(feat|fix)(\(([^)]+)\))?!?: (.+)$/);
  if (!m || staged.includes('docs/CHANGELOG.md') || !ui.interactive()) return;
  if (!(await ui.confirm(`Add this to docs/CHANGELOG.md under ${m[1] === 'fix' ? 'Fixed' : 'Added'}?`, true))) return;
  const text = m[3] ? `${m[4]} (${m[3]})` : m[4];
  if (addChangelogEntry(m[1], text)) {
    G.git(['add', '--', 'docs/CHANGELOG.md']);
    ui.ok('CHANGELOG updated');
  }
}

async function commitMessage(staged) {
  const areas = [...new Set(staged.map(areaOf))];
  const onlyDocs = staged.every((f) => /^docs\//.test(f) || /\.md$/i.test(f));
  const onlyTests = staged.every((f) => /(^|\/)tests?\/|\.test\.|(^|\/)test_[^/]*\.py$/.test(f));
  const defType = onlyDocs ? 'docs' : onlyTests ? 'test' : 'feat';
  if (!ui.interactive()) {
    return `${defType === 'feat' ? 'chore' : defType}: update ${areas.join(', ').toLowerCase()} (${staged.length} file${staged.length > 1 ? 's' : ''})`;
  }
  ui.hint('Format: type(scope): what changed     e.g.  feat(app): add company search screen');
  const type = await ui.select('Type of change', TYPES, { initial: TYPES.findIndex((t) => t.value === defType) });
  const scopeDef = areas.length === 1 ? SCOPE[areas[0]] : '';
  const scopeRaw = await ui.ask(`Scope ${c.gray('(Enter to accept, "none" for no scope)')}`, {
    def: scopeDef,
    validate: (v) => (/^[a-z0-9-]*$/.test(v) ? null : 'Use lowercase letters, numbers and - only.'),
  });
  const scope = scopeRaw === 'none' ? '' : scopeRaw;
  const summary = await ui.ask('What did you do? (short)', {
    required: true,
    validate: (v) => (v.length > 72 ? `A bit long (${v.length}/72). Keep it short.` : null),
  });
  return `${type}${scope ? `(${scope})` : ''}: ${summary.replace(/\.$/, '')}`;
}

async function quickChecks(staged, b) {
  const failures = [];
  if (staged.some((f) => /^frontend\/.*\.(tsx?|jsx?)$/.test(f)) && C.frontendDeps() !== 'missing') {
    const r = await task('Type-checking the app', 'npx', ['tsc', '--noEmit'], { cwd: PATHS.frontend, done: 'App type-check passed' });
    if (!r.ok) failures.push('TypeScript errors in the app');
  }
  if (staged.some((f) => /^backend\/.*\.py$/.test(f)) && which('uv') && C.backendDeps() !== 'missing') {
    const r = await task('Checking the backend code (ruff)', 'uv', ['run', 'ruff', 'check', '.'], { cwd: PATHS.backend, done: 'Backend checks passed' });
    if (!r.ok) failures.push('Python lint errors in the backend');
  }
  if (!failures.length) return true;
  ui.warn(`${failures.join(' and ')} (details above).`);
  const onMain = b === MAIN;
  const go = await ui.select('Upload anyway?', [
    { value: false, label: 'No, I will fix them first', hint: 'nothing is committed; your changes stay as they are' },
    { value: true, label: 'Yes, upload anyway', hint: onMain ? 'teammates will pull code with errors' : 'fine on your own branch' },
  ], { initial: onMain ? 0 : 1 });
  if (!go) ui.hint(`Fix the errors, then run ${launcher} finish again. (Skip checks: ${launcher} finish --no-checks)`);
  return go;
}

function ignorePaths(paths) {
  const file = path.join(ROOT, '.gitignore');
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const have = new Set(cur.split(/\r?\n/).map((l) => l.trim()));
  const add = paths.map((p) => '/' + p).filter((p) => !have.has(p));
  if (!add.length) return;
  fs.writeFileSync(file, cur.replace(/\s*$/, '\n') + `\n# Added by dev (secrets / large files)\n${add.join('\n')}\n`);
  G.git(['add', '--', '.gitignore']);
  ui.ok(`Added to .gitignore: ${add.join(', ')}`);
}

async function openPullRequest(b) {
  if (which('gh')) {
    const existing = run('gh', ['pr', 'view', b, '--json', 'url', '--jq', '.url'], { quiet: true });
    if (existing.ok && existing.stdout.trim()) {
      ui.ok(`Pull request: ${c.accent(existing.stdout.trim())}`);
      return;
    }
  }
  if (!(await ui.confirm('Open a pull request so the team can review and merge it?', ui.interactive()))) {
    ui.hint(`Later: ${G.compareUrl(b)}`);
    return;
  }
  if (which('gh')) {
    const r = await runLive('gh', ['pr', 'create', '--fill', '--base', MAIN, '--head', b]);
    if (r.code === 0) return;
  }
  ui.info('Opening GitHub in your browser to create the pull request...');
  openUrl(G.compareUrl(b));
  ui.hint(G.compareUrl(b));
}

export async function finish(opts = {}) {
  ui.section('Finish & upload');
  if (!(await preflight())) return;
  const b = G.branch();
  const files = G.status();
  const own = G.upstreamRef(b);
  const unpushed = own ? G.aheadBehind('HEAD', own).ahead : G.hasCommits() ? 1 : 0;

  if (!files.length && !unpushed) {
    ui.ok('Nothing new to upload. Getting the latest team work instead.');
    const r = await syncCore({ push: false });
    await refreshDeps(r.changedFiles);
    return;
  }

  let committed = false;
  if (files.length) {
    ui.info(`${files.length} changed file${files.length > 1 ? 's' : ''} on ${c.accent(b)}:`);
    printChanges(files);
    let chosen = files;
    if (files.length > 1 && !opts.all) {
      const how = await ui.select('What do you want to upload?', [
        { value: 'all', label: 'Everything (recommended)' },
        { value: 'pick', label: 'Let me choose the files' },
        { value: 'cancel', label: 'Cancel' },
      ]);
      if (how === 'cancel') return;
      if (how === 'pick') {
        const keep = await ui.multiselect('Files to include', files.map((f) => ({ value: f.path, label: f.path, hint: f.kind, checked: true })), { min: 1 });
        chosen = files.filter((f) => keep.includes(f.path));
      }
    }
    const paths = chosen.flatMap((f) => (f.orig ? [f.path, f.orig] : [f.path]));
    if (chosen.length === files.length) G.git(['add', '-A']);
    else G.git(['add', '-A', '--pathspec-from-file=-', '--pathspec-file-nul'], { input: paths.join('\0') });

    // Safety: secrets and huge files never leave this PC.
    const scan = scanStaged(stagedFiles());
    if (scan.secrets.length || scan.large.length) {
      report(scan);
      const bad = [...scan.secrets.map((s) => s.file), ...scan.large.filter((l) => l.block).map((l) => l.file)];
      if (bad.length) {
        const act = await ui.select('What now?', [
          { value: 'ignore', label: 'Leave them out and add them to .gitignore (recommended)' },
          { value: 'once', label: 'Leave them out this time only' },
          { value: 'cancel', label: 'Cancel (nothing is committed)' },
        ]);
        G.git(['restore', '--staged', '--', ...new Set(bad)]);
        if (act === 'cancel') {
          G.git(['reset', '-q']);
          return;
        }
        if (act === 'ignore') ignorePaths([...new Set(bad)]);
      }
    }
    const staged = G.gitOut(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
    if (!staged.length) ui.warn('Nothing left to commit.');
    else {
      if (!opts.noChecks && !(await quickChecks(staged, b))) {
        G.git(['reset', '-q']);
        return;
      }
      const msg = opts.message || (await commitMessage(staged));
      await maybeChangelog(msg, staged);
      G.snapshot('before-commit');
      const r = G.git(['commit', '-q', '-m', msg], { env: { DEV_SKIP_HOOK: '1' } });
      if (!r.ok) {
        explain(r.output, { fallbackTitle: 'Commit failed' });
        return;
      }
      committed = true;
      ui.ok(`Saved commit ${c.gray(G.sha('HEAD', true))} ${c.bold(msg)}`);
    }
  }

  const s = await syncCore({ push: true });
  if (!s.ok) {
    if (committed) ui.info(`Your commit is saved on this PC. Run ${launcher} sync to upload it once the problem is fixed.`);
    return;
  }
  await refreshDeps(s.changedFiles);
  const head = G.commits('HEAD', 1)[0];
  if (s.pushed) {
    ui.blank();
    ui.box(
      [
        c.bold('Your work is on GitHub.'),
        '',
        `${c.muted('Branch')}   ${b}`,
        `${c.muted('Commit')}   ${head.hash}  ${ui.truncate(head.subject, ui.cols() - 30)}`,
      ],
      { title: 'Uploaded', tone: 'green' },
    );
    ui.hint(`See it on GitHub: ${G.commitUrl(G.sha('HEAD'))}`);
    saveState({ lastFinish: new Date().toISOString() });
  }
  if (b !== MAIN && s.pushed) await openPullRequest(b);
  if (G.status().length) ui.hint(`Some files were left out and are still unsaved changes (${G.status().length}).`);
}

export async function status() {
  ui.section('Status');
  if (!G.isRepo()) {
    ui.warn(`This folder is not linked to GitHub yet. Run ${launcher} setup.`);
    return;
  }
  G.git(['fetch', '--quiet', 'origin'], { timeout: 20000, stdin: 'inherit', quiet: true });
  const b = G.branch();
  const own = b && G.upstreamRef(b);
  ui.kv('Branch', b ? c.accent(b) : c.yellow('detached HEAD (not on a branch)'));
  if (own) {
    const { ahead, behind } = G.aheadBehind('HEAD', own);
    const parts = [];
    if (ahead) parts.push(c.yellow(`${ahead} commit(s) to upload`));
    if (behind) parts.push(c.blue(`${behind} new from the team`));
    ui.kv('GitHub', parts.length ? parts.join(c.gray(' · ')) : c.green('in sync'));
  } else if (b) ui.kv('GitHub', c.yellow('this branch is not on GitHub yet'));
  if (b && b !== MAIN && G.refExists(`origin/${MAIN}`)) {
    const { behind } = G.aheadBehind('HEAD', `origin/${MAIN}`);
    if (behind) ui.kv(`vs ${MAIN}`, c.blue(`${behind} commit(s) on ${MAIN} you do not have yet`));
  }
  const op = G.opInProgress();
  if (op) ui.kv('Attention', c.red(`a ${op} is half-finished -> ${launcher} rescue`));
  const files = G.status();
  ui.kv('Unsaved changes', files.length ? c.yellow(`${files.length} file(s)`) : c.green('none'));
  if (files.length) printChanges(files, 12);
  const snaps = G.listSnapshots();
  ui.kv('Backups', `${snaps.length} snapshot(s)${snaps[0] ? c.gray(`, latest ${snaps[0].when}`) : ''}`);

  if (G.refExists(`origin/${MAIN}`)) {
    ui.log(`\n  ${c.bold('Recent team activity on ' + MAIN)}`);
    for (const k of G.commits(`origin/${MAIN}`, 8)) ui.log(`   ${c.gray(k.hash)} ${ui.truncate(k.subject, ui.cols() - 42)} ${c.gray(`${sym.dot} ${k.author}, ${k.when}`)}`);
  }
  ui.blank();
  if (op) ui.hint(`Next: ${launcher} rescue`);
  else if (files.length) ui.hint(`Next: ${launcher} finish   (upload your changes)`);
  else ui.hint(`Next: ${launcher} start`);
}

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export async function branchMenu(name) {
  ui.section('Branches');
  if (!(await preflight())) return;
  const b = G.branch();
  ui.kv('You are on', c.accent(b));
  ui.hint(`Small team tip: small changes can go straight to ${MAIN}; bigger features are nicer on a branch + pull request.`);
  const choice = name
    ? 'new'
    : await ui.select('What do you want to do?', [
        { value: 'new', label: 'Start a new branch for a feature', hint: 'separate until merged via a pull request' },
        { value: 'switch', label: 'Switch to another branch' },
        ...(b !== MAIN
          ? [
              { value: 'pr', label: 'Open a pull request for this branch' },
              { value: 'main', label: `Go back to ${MAIN}` },
            ]
          : []),
        { value: 'clean', label: 'Delete my local branches that are already merged' },
        { value: 'back', label: 'Back' },
      ], { initial: ui.interactive() ? 0 : 4 });

  if (choice === 'new') {
    const raw = name || (await ui.ask('Short name for the feature (e.g. company-search)', { required: true }));
    const br = `feature/${G.userSlug()}-${slugify(raw)}`;
    G.fetchOrigin();
    G.snapshot('before-new-branch');
    const r = G.git(['switch', '--no-track', '-c', br, `origin/${MAIN}`]);
    if (!r.ok) return explain(r.output, { fallbackTitle: 'Could not create the branch' });
    ui.ok(`Now on ${c.accent(br)} ${c.gray(`(fresh copy of ${MAIN}; your unsaved changes came along)`)}`);
    ui.hint(`Work as usual. ${launcher} finish uploads this branch and offers a pull request.`);
  } else if (choice === 'switch') {
    G.fetchOrigin();
    const local = G.gitOut(['for-each-ref', '--format=%(refname:short)', 'refs/heads']).split('\n').filter(Boolean);
    const remote = G.gitOut(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin'])
      .split('\n')
      .map((r) => r.replace(/^origin\//, ''))
      .filter((r) => r && r !== 'HEAD' && r !== 'origin' && !local.includes(r));
    const opts = [...local.map((l) => ({ value: l, label: l, hint: l === b ? 'current' : '' })), ...remote.map((r) => ({ value: r, label: r, hint: 'on GitHub' }))];
    const target = await ui.select('Switch to', opts);
    if (target === b) return;
    G.snapshot('before-switch');
    const r = G.git(['switch', target]);
    if (!r.ok) return explain(r.output, { fallbackTitle: `Could not switch to ${target}` });
    ui.ok(`Now on ${c.accent(target)}`);
    await syncCore({ push: false });
  } else if (choice === 'main') {
    G.snapshot('before-switch');
    const r = G.git(['switch', MAIN]);
    if (!r.ok) return explain(r.output, { fallbackTitle: `Could not switch to ${MAIN}` });
    ui.ok(`Back on ${c.accent(MAIN)}`);
    await syncCore({ push: false });
  } else if (choice === 'pr') {
    await openPullRequest(b);
  } else if (choice === 'clean') {
    G.fetchOrigin();
    const merged = G.gitOut(['branch', '--format=%(refname:short)', '--merged', `origin/${MAIN}`])
      .split('\n')
      .filter((x) => x && x !== MAIN && x !== b);
    if (!merged.length) return ui.ok('No merged branches to clean up.');
    merged.forEach((m) => ui.log(`   ${c.gray('-')} ${m}`));
    if (await ui.confirm(`Delete these ${merged.length} local branch(es)? (their work is already in ${MAIN})`, true)) {
      merged.forEach((m) => G.git(['branch', '-d', m]));
      ui.ok('Cleaned up');
    }
  }
}

export async function undo() {
  ui.section('Undo & restore');
  if (!G.isRepo()) return ui.warn('Not a Git repo yet.');
  const files = G.status();
  const last = G.hasCommits() ? G.commits('HEAD', 1)[0] : null;
  const pushed = last && G.isPushed('HEAD');
  const snaps = G.listSnapshots();
  const choice = await ui.select('What do you want to undo?', [
    { value: 'commit', label: 'Undo my last commit', hint: last ? `"${ui.truncate(last.subject, 34)}" ${pushed ? '(on GitHub: adds an "undo" commit)' : '(not uploaded: changes come back unsaved)'}` : 'no commits yet' },
    { value: 'file', label: 'Throw away my changes to some files', hint: `${files.length} changed file(s)` },
    { value: 'all', label: 'Throw away ALL my unsaved changes', hint: 'a backup snapshot is taken first' },
    { value: 'restore', label: 'Restore a backup snapshot', hint: `${snaps.length} available` },
    { value: 'back', label: 'Back' },
  ], { initial: 4 });

  if (choice === 'commit' && last) {
    if (!pushed) {
      G.snapshot('before-undo-commit');
      G.git(['reset', '--soft', 'HEAD~1']);
      ui.ok('Last commit undone. Its changes are back as unsaved changes (nothing deleted).');
    } else {
      ui.info('That commit is already on GitHub, so it cannot be erased. Git can add a new commit that reverses it.');
      if (!(await ui.confirm('Create the reversing commit and upload it?', false))) return;
      const isMerge = G.gitOut(['rev-list', '--parents', '-n1', 'HEAD']).split(' ').length > 2;
      G.snapshot('before-revert');
      const r = G.git(['revert', '--no-edit', ...(isMerge ? ['-m', '1'] : []), 'HEAD'], { env: { DEV_SKIP_HOOK: '1' } });
      if (!r.ok && G.opInProgress() === 'revert') {
        if (!(await resolveConflicts('revert', null, G.sha('HEAD')))) return;
      } else if (!r.ok) return explain(r.output);
      ui.ok('Reversing commit created');
      await syncCore({ push: true });
    }
  } else if (choice === 'file') {
    if (!files.length) return ui.ok('No unsaved changes.');
    const pick = await ui.multiselect('Files to reset to the last commit', files.map((f) => ({ value: f.path, label: f.path, hint: f.kind })), { min: 1 });
    const snap = G.snapshot('before-discard-files');
    for (const p of pick) {
      const f = files.find((x) => x.path === p);
      if (f.untracked) fs.rmSync(path.join(ROOT, p), { force: true, recursive: true });
      else G.git(['restore', '--staged', '--worktree', '--source=HEAD', '--', p]);
    }
    ui.ok(`Reset ${pick.length} file(s). Backup: snapshot ${snap?.short}`);
  } else if (choice === 'all') {
    if (!files.length) return ui.ok('No unsaved changes.');
    if (!(await ui.confirm(`Throw away all ${files.length} unsaved change(s)? (a backup snapshot is kept)`, false))) return;
    const snap = G.snapshot('before-discard-all');
    if (!snap) return ui.fail('Could not create the backup snapshot, so nothing was discarded.');
    G.git(['reset', '--hard', '-q']);
    G.git(['clean', '-fdq']);
    ui.ok(`Clean. If you regret it: ${launcher} undo -> Restore a backup snapshot (${snap.short}).`);
  } else if (choice === 'restore') {
    if (!snaps.length) return ui.ok('No snapshots yet. They are created automatically before every sync/commit.');
    const pick = await ui.select('Which snapshot?', snaps.slice(0, 15).map((s) => ({ value: s.sha, label: s.label.replace(/^\d{8}-\d{6}-/, ''), hint: `${s.when} ${sym.dot} ${s.short}` })));
    const how = await ui.select('Restore how?', [
      { value: 'files', label: 'Put my files back exactly as they were then', hint: 'your current state is backed up first' },
      { value: 'branch', label: 'Create a branch from it (look without touching my files)' },
      { value: 'back', label: 'Back' },
    ]);
    if (how === 'files') {
      G.snapshot('before-restore');
      const r = G.git(['restore', `--source=${pick}`, '--worktree', '--', '.']);
      if (!r.ok) return explain(r.output);
      ui.ok('Files restored. Review them with dev status, then dev finish to upload.');
    } else if (how === 'branch') {
      const name = `restore/${G.userSlug()}-${pick.slice(0, 7)}`;
      G.git(['branch', '-f', name, pick]);
      ui.ok(`Branch ${c.accent(name)} created. Switch with: git switch ${name}`);
    }
  }
}

/** Push a full snapshot (incl. unsaved files) to rescue/<name>-<time> so a teammate can help. */
export async function rescueUpload() {
  const snap = G.snapshot('rescue');
  if (!snap) {
    ui.fail('Could not create a snapshot of your folder.');
    return null;
  }
  const base = G.refExists(`origin/${MAIN}`) ? `origin/${MAIN}` : null;
  const changed = base ? G.gitOut(['diff', '--name-only', base, snap.sha]).split('\n').filter(Boolean) : [];
  const scan = scanStaged(changed, snap.sha);
  if (scan.secrets.length || scan.large.some((l) => l.block)) {
    report(scan);
    ui.fail('Not uploaded, to keep those files private. Move them out of the project (or into .gitignore) and try again.');
    ui.info(`Your work is still backed up locally as snapshot ${snap.short}.`);
    return null;
  }
  const name = `rescue/${G.userSlug()}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;
  const r = G.gitNet(['push', 'origin', `${snap.sha}:refs/heads/${name}`]);
  if (!r.ok) {
    explain(r.output, { fallbackTitle: 'Could not upload the rescue branch' });
    ui.info(`Your work is still backed up locally as snapshot ${snap.short}.`);
    return null;
  }
  ui.box(
    [
      `Everything in your folder (including unsaved files) is now on GitHub as ${c.accent(name)}.`,
      `Send the link below to a teammate. ${MAIN} was not changed.`,
      c.gray(`They can open it with:  git fetch && git switch ${name}`),
    ],
    { title: 'Rescue branch created', tone: 'green' },
  );
  ui.log(`   ${c.accent(G.branchUrl(name))}`);
  return name;
}

export async function rescue() {
  ui.section("Rescue: let's get you unstuck");
  if (!G.isRepo()) {
    ui.warn('This folder is not a Git repository.');
    await C.connectRepo();
    return;
  }
  const lock = path.join(G.gitDir(), 'index.lock');
  if (fs.existsSync(lock)) {
    const age = Math.round((Date.now() - fs.statSync(lock).mtimeMs) / 1000);
    ui.warn(`Git is locked (index.lock, ${age}s old). This happens when a Git program crashed or is still running.`);
    if (await ui.confirm('Remove the lock? Only say yes if VS Code / other Git tools are not busy.', age > 60)) {
      fs.rmSync(lock, { force: true });
      ui.ok('Lock removed');
    }
  }

  const op = G.opInProgress();
  const conflicts = G.conflictedFiles();
  const b = G.branch();
  const team = b ? G.upstreamRef(b) || `origin/${MAIN}` : `origin/${MAIN}`;

  if (op) {
    const what = {
      rebase: 'combining your commits with the team\'s (a rebase)',
      merge: 'merging two lines of work (a merge)',
      'cherry-pick': 'copying a commit (a cherry-pick)',
      revert: 'reversing a commit (a revert)',
    }[op];
    ui.info(`You are in the middle of ${what}.`);
    if (conflicts.length) ui.info(`${conflicts.length} file(s) still have conflicts: ${conflicts.join(', ')}`);
    const choice = await ui.select('What do you want to do?', [
      { value: 'continue', label: conflicts.length ? 'Fix the conflicts and finish it' : 'Finish it', hint: 'guided' },
      { value: 'abort', label: 'Cancel it: back to how things were before (safe)' },
      { value: 'upload', label: 'Cancel it and upload my work for a teammate to look at' },
      { value: 'back', label: 'Leave it for now' },
    ], { initial: ui.interactive() ? 0 : 3 });
    G.snapshot(`rescue-${op}`);
    if (choice === 'continue') {
      if ((await resolveConflicts(op, team, G.sha('ORIG_HEAD') || G.sha('HEAD'))) && op === 'rebase') await pushWithRetry(G.branch());
    } else if (choice === 'abort' || choice === 'upload') {
      G.git([op, '--abort']);
      ui.ok('Cancelled. Back to safety.');
      if (choice === 'upload') await rescueUpload();
    }
    return;
  }

  if (conflicts.length) {
    ui.info('Some files still contain conflict markers from an earlier sync.');
    await resolveConflicts('stash', team, G.sha('HEAD'));
    return;
  }

  if (!b) {
    ui.info('You are "between branches" (detached HEAD), usually after checking out an old commit.');
    const lost = !G.isPushed('HEAD') && !G.gitOut(['branch', '--contains', 'HEAD']);
    const choice = await ui.select('What do you want to do?', [
      { value: 'main', label: `Go back to ${MAIN} (keeps unsaved changes)` },
      ...(lost ? [{ value: 'save', label: 'Keep the commits made here on a new branch' }] : []),
      { value: 'back', label: 'Leave it' },
    ]);
    G.snapshot('rescue-detached');
    if (choice === 'save') {
      const name = `rescue/${G.userSlug()}-detached-${G.sha('HEAD', true)}`;
      G.git(['switch', '-c', name]);
      ui.ok(`Saved on branch ${c.accent(name)}`);
    } else if (choice === 'main') {
      const r = G.git(['switch', MAIN]);
      if (!r.ok) return explain(r.output);
      ui.ok(`Back on ${MAIN}`);
    }
    return;
  }

  ui.ok('No half-finished Git operation found.');
  const choice = await ui.select('What is the problem?', [
    { value: 'sync', label: 'Sync is not working / something looks off', hint: 'try a fresh sync with diagnosis' },
    { value: 'doctor', label: 'Something on my PC seems broken', hint: 'run the doctor' },
    { value: 'upload', label: 'Upload everything so a teammate can help', hint: 'creates a rescue branch' },
    { value: 'fresh', label: `Start over: make my folder match GitHub ${MAIN} exactly`, hint: 'backs everything up first' },
    { value: 'back', label: 'Back' },
  ], { initial: 4 });
  if (choice === 'sync') await sync();
  else if (choice === 'doctor') await C.doctor({ deep: true });
  else if (choice === 'upload') await rescueUpload();
  else if (choice === 'fresh') {
    ui.warn(`This replaces your folder with the GitHub version of ${MAIN}. Ignored files (.env, node_modules) are kept.`);
    if (!(await ui.confirm('Upload a rescue copy of your current work first? (recommended)', true)) || (await rescueUpload())) {
      if (!(await ui.confirm(`Reset this folder to origin/${MAIN} now?`, false))) return;
      const snap = G.snapshot('before-start-over');
      const f = G.fetchOrigin();
      if (!f.ok) return explain(f.output);
      G.git(['switch', '-f', '-C', MAIN, `origin/${MAIN}`]);
      G.git(['clean', '-fdq']);
      ui.ok(`Done. Your folder now matches GitHub. Old state: snapshot ${snap?.short} (dev undo -> restore).`);
    }
  }
}
