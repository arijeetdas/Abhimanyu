#!/usr/bin/env node
// Abhimanyu team toolkit. Entry point for `dev` (Windows: dev.cmd, macOS/Linux: ./dev).
// Zero dependencies on purpose: it must run before `npm install` has ever happened.

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`\n  dev needs Node.js 20 or newer (you have ${process.versions.node}).`);
  console.error('  Install the LTS from https://nodejs.org and open a new terminal.\n');
  process.exit(1);
}

const ui = await import('./ui.mjs');
const { VERSION, loadState } = await import('./config.mjs');

const ALIASES = {
  s: 'start', begin: 'start', open: 'start',
  f: 'finish', save: 'finish', done: 'finish', ship: 'finish', upload: 'finish', commit: 'finish', push: 'finish',
  pull: 'sync', update: 'sync',
  st: 'status',
  check: 'doctor', dr: 'doctor',
  install: 'setup', init: 'setup',
  br: 'branch', pr: 'branch',
  stuck: 'rescue', fix: 'rescue', sos: 'rescue',
  restore: 'undo',
  h: 'help', manual: 'help', '--help': 'help', '-h': 'help', '?': 'help',
  '--version': 'version', '-v': 'version',
};

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-m' || a === '--message') opts.message = argv[++i];
    else if (a === '-y' || a === '--yes') opts.yes = true;
    else if (a === '--no-checks') opts.noChecks = true;
    else if (a === '--plain' || a === '--no-color') opts.plain = true;
    else if (a === '--deep') opts.deep = true;
    else if (a === '--all' || a === '-a') opts.all = true;
    else opts._.push(a);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
ui.flags.yes = !!opts.yes;
ui.flags.plain = !!opts.plain;
const cmd = ALIASES[opts._[0]] || opts._[0];
const arg = opts._[1];
const L = process.platform === 'win32' ? '.\\dev' : './dev';

const COMMANDS = () => {
  const { c } = ui;
  const row = (name, desc) => `   ${c.accent(name.padEnd(26))} ${desc}`;
  return [
    '',
    `  ${c.bold('Usage')}  ${c.accent(`${L} [command] [options]`)}   ${c.gray('(no command = interactive menu)')}`,
    '',
    `  ${c.bold('Every day')}`,
    row('start', 'sync with the team, update dependencies, run the app'),
    row('finish', 'commit your changes and push them        (save, done)'),
    row('sync', "pull teammates' work and push yours       (pull)"),
    row('status', 'what changed, what is unpushed, who pushed'),
    '',
    `  ${c.bold('Run')}`,
    row('run web|phone|tunnel', 'website / Expo Go on your phone'),
    row('run android|backend|all', 'emulator / FastAPI / API + website'),
    '',
    `  ${c.bold('Branches')}`,
    row('branch [name]', 'new feature branch, switch, pull request'),
    '',
    `  ${c.bold('Setup & health')}`,
    row('setup', 'install tools, SDKs, dependencies, Git settings'),
    row('doctor [--deep]', 'check everything and offer fixes (--deep tests push access)'),
    '',
    `  ${c.bold('Safety net')}`,
    row('undo', 'undo a commit, discard changes, restore a backup'),
    row('rescue', 'stuck mid-merge/rebase or confused? start here'),
    '',
    `  ${c.bold('Options')}`,
    row('-m "message"', 'commit message for finish (skips the questions)'),
    row('-y, --yes', 'accept safe defaults, no questions'),
    row('--no-checks', 'skip type-check / lint before committing'),
    row('--plain', 'no colors or special characters'),
  ].join('\n');
};

async function menu() {
  const G = await import('./git.mjs');
  const W = await import('./workflow.mjs');
  const state = loadState();
  for (;;) {
    ui.banner(`Team toolkit ${ui.sym.dot} setup ${ui.sym.dot} sync ${ui.sym.dot} ship ${ui.sym.dot} v${VERSION}`);
    const repo = G.isRepo();
    const b = repo ? G.branch() : '';
    const changes = repo ? G.status().length : 0;
    const op = repo ? G.opInProgress() : null;
    const id = repo ? G.identity() : {};
    ui.blank();
    if (repo) {
      ui.log(
        `  ${ui.c.gray('Hi')} ${ui.c.bold(id.name || 'there')}${ui.c.gray(',')} ${ui.c.gray('on')} ${ui.c.accent(b || 'detached HEAD')}` +
          ` ${ui.c.gray(ui.sym.dot)} ${changes ? ui.c.yellow(`${changes} unsaved change${changes > 1 ? 's' : ''}`) : ui.c.green('no unsaved changes')}` +
          (op ? ` ${ui.c.gray(ui.sym.dot)} ${ui.c.red(`${op} in progress`)}` : ''),
      );
    } else ui.log(`  ${ui.c.yellow('This folder is not linked to GitHub yet. Choose Setup.')}`);
    ui.blank();

    const items = [
      { value: 'start', label: 'Start working', hint: 'sync with the team, then run the app' },
      { value: 'finish', label: 'Finish & upload', hint: 'commit your changes and push to GitHub' },
      { value: 'sync', label: 'Sync only', hint: "get teammates' work, upload yours" },
      { value: 'status', label: 'Status', hint: 'what changed and who pushed what' },
      { value: 'run', label: 'Run something', hint: 'website, phone, emulator or backend' },
      { value: 'branch', label: 'Branches & pull requests' },
      { value: 'setup', label: 'Setup / reinstall', hint: 'tools, SDKs, dependencies' },
      { value: 'doctor', label: 'Doctor', hint: 'check everything is healthy' },
      { value: 'undo', label: 'Undo / restore a backup' },
      { value: 'rescue', label: "I'm stuck (rescue)", hint: 'half-finished merge, weird state' },
      { value: 'help', label: 'Help & manual steps' },
      { value: 'exit', label: 'Exit' },
    ];
    const recommended = !repo || !state.setupDone ? 'setup' : op ? 'rescue' : changes ? 'finish' : 'start';
    const initial = items.findIndex((i) => i.value === recommended);
    items[initial] = { ...items[initial], hint: `${ui.c.accent('recommended')}  ${items[initial].hint || ''}` };
    const choice = await ui.select('What do you want to do?', items, { initial });
    if (choice === 'exit') return;
    if (choice === 'run') {
      const t = await ui.select('Run what?', W.TARGETS.filter((x) => x.value !== 'none'));
      await W.runTarget(t);
    } else await dispatch(choice);
    ui.blank();
    await ui.pause('Press Enter to go back to the menu');
    state.setupDone = loadState().setupDone;
  }
}

async function dispatch(name) {
  const W = () => import('./workflow.mjs');
  switch (name) {
    case 'start':
      return (await W()).start({ ...opts, target: arg });
    case 'finish':
      return (await W()).finish(opts);
    case 'sync':
      return (await W()).sync(opts);
    case 'status':
      return (await W()).status();
    case 'branch':
      return (await W()).branchMenu(arg);
    case 'undo':
      return (await W()).undo();
    case 'rescue':
      return (await W()).rescue();
    case 'run': {
      const w = await W();
      const target = arg || (await ui.select('Run what?', w.TARGETS.filter((x) => x.value !== 'none')));
      if (!w.TARGETS.some((t) => t.value === target)) throw new Error(`Unknown target "${target}". Use: ${w.TARGETS.map((t) => t.value).join(', ')}`);
      return w.runTarget(target);
    }
    case 'setup':
      return (await import('./setup.mjs')).setup(opts);
    case 'doctor':
      return (await import('./checks.mjs')).doctor({ deep: opts.deep });
    case 'help':
      return (await import('./guide.mjs')).help(arg, COMMANDS());
    case 'hook': {
      if (arg === 'pre-commit') process.exitCode = (await import('./safety.mjs')).preCommitHook();
      return;
    }
    case 'version':
      return ui.log(`dev ${VERSION} (node ${process.versions.node})`);
    default:
      ui.fail(`Unknown command "${name}".`);
      ui.log(COMMANDS());
      process.exitCode = 1;
  }
}

try {
  if (!cmd) {
    if (ui.interactive()) await menu();
    else ui.log(COMMANDS());
  } else await dispatch(cmd);
} catch (e) {
  const { explain } = await import('./diagnose.mjs');
  const { logFile, logLine } = await import('./sh.mjs');
  logLine(`ERROR ${e.stack || e}`);
  ui.blank();
  explain(String(e.message || e), { fallbackTitle: 'dev hit an unexpected error' });
  ui.hint(`Details were written to ${logFile()}`);
  ui.hint('Your files were not harmed: risky steps always take a backup snapshot first.');
  process.exitCode = 1;
}
