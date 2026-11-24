// Process helpers: run commands (captured, live, or with a spinner), find tools, open URLs, log.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PATHS, ROOT } from './config.mjs';
import * as ui from './ui.mjs';

export const isWin = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const isLinux = !isWin && !isMac;

// On Windows these are .cmd shims; Node refuses to spawn .cmd files without a shell.
const NEEDS_SHELL = new Set(['npm', 'npx', 'code', 'winget']);
const quoteWin = (a) => (a === '' ? '""' : /[\s"&|<>^()]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);

function prep(cmd, args) {
  if (isWin && NEEDS_SHELL.has(cmd)) return { file: [cmd, ...args.map(quoteWin)].join(' '), args: [], shell: true };
  return { file: cmd, args, shell: false };
}

// ─── Log file (.abhi/logs/abhi-YYYY-MM-DD.log) for "what exactly happened?" ─────

let logPath;
export function logFile() {
  if (!logPath) {
    fs.mkdirSync(PATHS.logs, { recursive: true });
    logPath = path.join(PATHS.logs, `abhi-${new Date().toISOString().slice(0, 10)}.log`);
  }
  return logPath;
}
export function logLine(text) {
  try {
    fs.appendFileSync(logFile(), `[${new Date().toISOString()}] ${text}\n`);
  } catch {
    /* logging must never break the tool */
  }
}

function record(cmd, args, res) {
  const tail = res.ok ? '' : '\n    ' + res.output.split('\n').slice(-15).join('\n    ');
  logLine(`$ ${cmd} ${args.join(' ')}  -> ${res.code}${tail}`);
}

/** Run and capture output. Never throws. */
export function run(cmd, args = [], { cwd = ROOT, env, input, timeout, stdin = 'pipe', quiet = false } = {}) {
  const p = prep(cmd, args);
  const r = spawnSync(p.file, p.args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    input,
    timeout,
    shell: p.shell,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
    stdio: [input !== undefined ? 'pipe' : stdin, 'pipe', 'pipe'],
  });
  const res = {
    code: r.status ?? -1,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    missing: r.error?.code === 'ENOENT',
    timedOut: r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGTERM',
  };
  res.ok = res.code === 0;
  res.output = (res.stdout + '\n' + res.stderr).trim() + (res.timedOut ? '\n(timed out)' : '');
  if (!quiet) record(cmd, args, res);
  return res;
}

/** Run with the terminal attached (dev servers, editors). Ctrl+C stops the child, not us. */
export function runLive(cmd, args = [], { cwd = ROOT, env } = {}) {
  const p = prep(cmd, args);
  logLine(`$ (live) ${cmd} ${args.join(' ')}`);
  return new Promise((resolve) => {
    const ignore = () => {};
    process.on('SIGINT', ignore);
    const child = spawn(p.file, p.args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', shell: p.shell });
    child.on('error', (e) => {
      process.off('SIGINT', ignore);
      resolve({ code: -1, error: e });
    });
    child.on('exit', (code, signal) => {
      process.off('SIGINT', ignore);
      resolve({ code: code ?? (signal ? 130 : 1) });
    });
  });
}

/** Run with a spinner showing elapsed time and the latest output line. */
export function task(title, cmd, args = [], { cwd = ROOT, env, done, showTailOnFail = true } = {}) {
  const p = prep(cmd, args);
  const spin = ui.spinner(title);
  return new Promise((resolve) => {
    let output = '';
    const child = spawn(p.file, p.args, {
      cwd,
      env: { ...process.env, CI: process.env.CI ?? '', ...env },
      shell: p.shell,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const onData = (d) => {
      const s = d.toString();
      output += s;
      const last = s.split(/\r?\n|\r/).map((l) => l.trim()).filter(Boolean).pop();
      if (last) spin.sub(last);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const finish = (code, missing = false) => {
      const res = { code, ok: code === 0, output: output.trim(), stdout: output, stderr: '', missing };
      record(cmd, args, res);
      spin.stop(res.ok, res.ok ? (done ?? title) : `${title} failed`);
      if (!res.ok && showTailOnFail && res.output) {
        const tail = res.output.split(/\r?\n/).filter((l) => l.trim()).slice(-12);
        for (const l of tail) ui.log('     ' + ui.c.gray(ui.truncate(ui.strip(l), ui.cols() - 6)));
      }
      resolve(res);
    };
    child.on('error', (e) => {
      output += String(e.message);
      finish(-1, e.code === 'ENOENT');
    });
    child.on('close', (code) => finish(code ?? -1));
  });
}

/** Path of an executable on PATH, or null. */
export function which(cmd) {
  const r = isWin
    ? spawnSync('where', [cmd], { encoding: 'utf8', windowsHide: true })
    : spawnSync('sh', ['-c', `command -v "${cmd}"`], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() || null : null;
}

/** First x.y(.z) version printed by `cmd --version` (or custom args). */
export function versionOf(cmd, args = ['--version']) {
  const r = run(cmd, args, { quiet: true, timeout: 20000 });
  if (!r.ok && !r.output) return null;
  const m = r.output.match(/(\d+\.\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}

export function cmpVer(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

/** Pick up tools installed during this run (winget/brew update PATH only for new terminals). */
export function refreshPath() {
  const extra = [];
  if (isWin) {
    const r = run(
      'powershell',
      ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"],
      { quiet: true, timeout: 20000 },
    );
    if (r.ok) extra.push(...r.stdout.trim().split(';'));
    extra.push('C:\\Program Files\\Git\\cmd', 'C:\\Program Files\\nodejs', path.join(os.homedir(), '.local', 'bin'));
  } else {
    extra.push('/opt/homebrew/bin', '/usr/local/bin', path.join(os.homedir(), '.local', 'bin'), path.join(os.homedir(), '.cargo', 'bin'));
  }
  const sep = isWin ? ';' : ':';
  const current = (process.env.PATH || '').split(sep);
  const merged = [...current, ...extra.filter((p) => p && fs.existsSync(p) && !current.includes(p))];
  process.env.PATH = merged.join(sep);
}

export function openUrl(url) {
  if (isWin) spawn('explorer.exe', [url], { detached: true, stdio: 'ignore' }).unref();
  else spawn(isMac ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
}

/** Open a new terminal window running a command (used to start the backend next to the app). */
export function openTerminal(title, cwd, command) {
  if (isWin) {
    spawn('cmd.exe', ['/c', 'start', `"${title}"`, 'cmd', '/k', command], { cwd, detached: true, stdio: 'ignore', shell: false, windowsVerbatimArguments: true }).unref();
    return true;
  }
  if (isMac) {
    const script = `tell application "Terminal" to do script "cd ${cwd.replace(/"/g, '\\"')} && ${command.replace(/"/g, '\\"')}"`;
    spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' }).unref();
    return true;
  }
  return false;
}
