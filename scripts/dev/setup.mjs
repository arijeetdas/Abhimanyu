// "dev setup": one guided pass that installs and configures everything for this PC.
import fs from 'node:fs';
import path from 'node:path';

import * as C from './checks.mjs';
import { loadState, MIN, needsPython, PATHS, REPO, ROLES, ROOT, saveState, VERSION } from './config.mjs';
import * as G from './git.mjs';
import { cmpVer, isWin, run, task, which } from './sh.mjs';
import { install } from './tools.mjs';
import * as ui from './ui.mjs';

const EXTRAS = [
  { value: 'code', label: 'VS Code + recommended extensions', hint: 'the team editor' },
  { value: 'gh', label: 'GitHub CLI', hint: 'sign in to GitHub and open pull requests from the terminal' },
  { value: 'android', label: 'Android emulator tools', hint: 'Android Studio + JDK 17 (~5 GB, optional: phones can use Expo Go)' },
  { value: 'docker', label: 'Docker Desktop', hint: 'run Postgres/Redis/Neo4j locally (optional)' },
];

async function installVsCodeExtensions() {
  if (!which('code')) return;
  let recs = [];
  try {
    recs = JSON.parse(fs.readFileSync(path.join(ROOT, '.vscode', 'extensions.json'), 'utf8')).recommendations || [];
  } catch {
    return;
  }
  const installed = new Set(run('code', ['--list-extensions'], { quiet: true }).stdout.toLowerCase().split(/\r?\n/));
  const todo = recs.filter((r) => !installed.has(r.toLowerCase()));
  if (!todo.length) return ui.ok('VS Code extensions already installed');
  for (const ext of todo) await task(`VS Code extension ${ext}`, 'code', ['--install-extension', ext, '--force'], { done: `Installed ${ext}` });
}

async function addAbhiToPath() {
  if (isWin) {
    const p = ROOT.replace(/'/g, "''");
    const r = run('powershell', [
      '-NoProfile',
      '-Command',
      `$p=[Environment]::GetEnvironmentVariable('Path','User'); if (-not $p) { $p='' }; if (-not (($p -split ';') -contains '${p}')) { [Environment]::SetEnvironmentVariable('Path', ($p.TrimEnd(';') + ';${p}'), 'User'); 'added' } else { 'present' }`,
    ]);
    if (r.ok) ui.ok(`"dev" works from any new terminal ${ui.c.gray('(you can type dev instead of .\\dev)')}`);
    else ui.warn('Could not update PATH. You can always run .\\dev from the project folder.');
  } else {
    const rc = process.env.SHELL?.includes('zsh') ? '~/.zshrc' : '~/.bashrc';
    ui.info('To type "dev" from anywhere, add this line to ' + rc + ':');
    ui.cmd(`alias dev="${ROOT}/dev"`);
  }
}

export async function setup() {
  ui.banner(`Setup ${ui.sym.dot} v${VERSION}`);
  ui.box(
    [
      'This prepares this PC for the Abhimanyu project:',
      `${ui.c.accent(ui.sym.bullet)} checks Git and Node.js, links the folder to GitHub`,
      `${ui.c.accent(ui.sym.bullet)} installs the app (website + mobile) and/or backend toolchain`,
      `${ui.c.accent(ui.sym.bullet)} applies safe team Git settings and a secret-blocking commit hook`,
      '',
      ui.c.gray('Nothing is deleted. You are asked before anything is installed. Safe to re-run anytime.'),
    ],
    { title: 'Welcome' },
  );

  const state = loadState();
  const TOTAL = 7;

  // 1 ─ Roles
  ui.step(1, TOTAL, 'What will you work on?');
  const roles = await ui.multiselect(
    'Pick your areas',
    ROLES.map((r) => ({ ...r, checked: (state.roles || ['frontend']).includes(r.value) })),
    { min: 1 },
  );
  saveState({ roles });

  // 2 ─ Core tools
  ui.step(2, TOTAL, 'Core tools');
  ui.ok(`Node.js ${process.versions.node}`);
  if (cmpVer(process.versions.node, MIN.node) < 0) {
    ui.warn(`Node.js ${MIN.node} or newer is required.`);
    if (await ui.confirm('Install the latest Node.js LTS now?', true)) await install('node');
    ui.info('Close this terminal, open a new one, and run dev setup again.');
    return;
  }
  ui.ok(`Git ${run('git', ['--version'], { quiet: true }).stdout.replace(/[^\d.]+/g, ' ').trim().split(' ')[0]}`);

  // 3 ─ Identity
  ui.step(3, TOTAL, 'Your Git identity');
  const id = G.identity();
  if (id.name && id.email) {
    ui.ok(`${id.name} <${id.email}>`);
    if (ui.interactive() && !(await ui.confirm('Is this the account you use on GitHub?', true))) await C.setIdentity();
  } else await C.setIdentity();

  // 4 ─ Repo
  ui.step(4, TOTAL, 'GitHub repository');
  if (!(await C.connectRepo())) {
    ui.fail('Setup cannot continue without the repository. See: dev help start');
    return;
  }
  ui.ok(`Linked to ${REPO.web}`);
  C.applyGitConfig();
  ui.hint('Checking that GitHub lets you in (a sign-in window may open)...');
  const ls = G.git(['ls-remote', '--heads', 'origin'], { timeout: 120000, stdin: 'inherit' });
  if (ls.ok) ui.ok('GitHub access works');
  else {
    const { explain } = await import('./diagnose.mjs');
    explain(ls.output, { fallbackTitle: 'Could not reach the GitHub repo' });
  }

  // 5 ─ App
  ui.step(5, TOTAL, 'App: website + Android/iOS (Expo)');
  const wantApp = roles.includes('frontend') || (await ui.confirm('Also install the app so you can run it locally?', true));
  if (wantApp) {
    const st = C.frontendDeps();
    if (st === 'ok') ui.ok('App dependencies already installed');
    else await C.installFrontend();
    C.syncEnvFile(PATHS.frontend, '.env.local');
    ui.hint('Firebase keys go in frontend/.env.local (empty = demo mode). See: dev help firebase');
    ui.hint('To test on your phone: install "Expo Go" from the Play Store / App Store.');
  } else ui.info('Skipped. Run dev setup again anytime to add it.');

  // 6 ─ Backend
  ui.step(6, TOTAL, 'Backend: Python 3.12 + FastAPI');
  if (needsPython(roles)) {
    if (await C.installBackend()) C.syncEnvFile(PATHS.backend);
  } else ui.info('Skipped (frontend only). Choose a backend/AI/data/ML area to add it.');

  // 7 ─ Extras
  ui.step(7, TOTAL, 'Optional extras');
  const picks = await ui.multiselect(
    'Install any of these?',
    EXTRAS.map((e) => ({ ...e, checked: e.value === 'code' && !which('code') })),
  );
  for (const p of picks) {
    if (p === 'code') {
      if (!which('code')) await install('code');
      await installVsCodeExtensions();
    }
    if (p === 'gh') {
      if (!which('gh')) await install('gh');
      if (which('gh') && !run('gh', ['auth', 'status'], { quiet: true }).ok) {
        ui.info('Sign in to GitHub (a browser window opens):');
        run('gh', ['auth', 'login', '--web', '--git-protocol', 'https'], { stdin: 'inherit' });
        run('gh', ['auth', 'setup-git'], { quiet: true });
      }
    }
    if (p === 'android') {
      if (!which('java')) await install('jdk');
      await install('androidStudio');
      ui.hint('Open Android Studio once > More Actions > Virtual Device Manager > create a Pixel device.');
    }
    if (p === 'docker') await install('docker');
  }
  if (await ui.confirm('Let me type "dev" from any terminal (adds this folder to your PATH)?', isWin)) await addAbhiToPath();

  saveState({ setupDone: true, setupVersion: VERSION, setupAt: new Date().toISOString() });

  ui.section('Final check');
  const results = C.collect();
  C.printChecks(results);
  const problems = results.filter((r) => r.status === 'fail');
  ui.blank();
  ui.box(
    problems.length
      ? [ui.c.bold('Almost there.'), `Fix the ${problems.length} problem(s) above with ${ui.c.accent('dev doctor')}.`]
      : [
          ui.c.bold('You are all set!'),
          '',
          `Every time you sit down to work:   ${ui.c.accent(isWin ? '.\\dev start' : './dev start')}`,
          `When you are done:                 ${ui.c.accent(isWin ? '.\\dev finish' : './dev finish')}`,
          `Stuck or curious:                  ${ui.c.accent('dev help')}`,
        ],
    { title: problems.length ? 'Setup finished with problems' : 'Setup complete', tone: problems.length ? 'yellow' : 'green' },
  );
}
