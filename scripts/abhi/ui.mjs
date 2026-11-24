// Terminal UI: colors, symbols, boxes, spinners and keyboard-driven prompts. No dependencies.
import readline from 'node:readline';

const out = process.stdout;
const env = process.env;

/** Set from the command line in index.mjs. */
export const flags = { yes: false, plain: false };

const ttyOut = !!out.isTTY;
export const interactive = () => !flags.yes && !!process.stdin.isTTY && ttyOut;

const colorOn = () =>
  !flags.plain && !('NO_COLOR' in env) && env.TERM !== 'dumb' && (ttyOut || !!env.FORCE_COLOR);
const unicodeOn = () => !flags.plain && env.ABHI_ASCII !== '1' && env.TERM !== 'dumb';
const truecolor =
  process.platform === 'win32' ||
  /truecolor|24bit/i.test(env.COLORTERM || '') ||
  ['vscode', 'iTerm.app', 'WezTerm', 'Hyper', 'ghostty'].includes(env.TERM_PROGRAM || '');

const esc = (open, close) => (s) => (colorOn() ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));
const rgb = (r, g, b, c256) => (s) => {
  if (!colorOn()) return String(s);
  return truecolor ? `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m` : `\x1b[38;5;${c256}m${s}\x1b[39m`;
};

// Palette mirrors docs/UI_UX_GUIDELINES.md so the toolkit feels like the product.
export const c = {
  bold: esc(1, 22),
  dim: esc(2, 22),
  italic: esc(3, 23),
  underline: esc(4, 24),
  accent: rgb(66, 214, 164, 79),
  blue: rgb(98, 181, 247, 75),
  green: rgb(85, 201, 138, 78),
  yellow: rgb(244, 197, 106, 221),
  orange: rgb(240, 138, 114, 209),
  red: rgb(227, 93, 106, 167),
  white: rgb(232, 238, 243, 255),
  muted: rgb(166, 180, 192, 250),
  gray: rgb(120, 136, 149, 245),
};

const U = {
  ok: '✔', fail: '✖', warn: '▲', info: 'ℹ', arrow: '›', pointer: '❯', bullet: '•',
  on: '◉', off: '○', line: '─', vline: '│', tl: '╭', tr: '╮', bl: '╰', br: '╯',
  heavy: '━', dot: '·', ellipsis: '…', up: '↑', down: '↓',
  spin: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};
const A = {
  ok: '+', fail: 'x', warn: '!', info: 'i', arrow: '>', pointer: '>', bullet: '*',
  on: '(*)', off: '( )', line: '-', vline: '|', tl: '+', tr: '+', bl: '+', br: '+',
  heavy: '=', dot: '-', ellipsis: '...', up: 'up', down: 'down',
  spin: ['-', '\\', '|', '/'],
};
export const sym = new Proxy({}, { get: (_, k) => (unicodeOn() ? U : A)[k] });

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;
export const strip = (s) => String(s).replace(ANSI, '');
export const vwidth = (s) => [...strip(s)].length;
export const cols = () => Math.max(50, Math.min(out.columns || 80, 104));

/** Truncate plain (uncolored) text to a visible width. */
export function truncate(s, max) {
  const chars = [...String(s)];
  if (max <= 1) return '';
  return chars.length <= max ? String(s) : chars.slice(0, max - 1).join('') + sym.ellipsis;
}

/** Word-wrap plain text. */
export function wrap(text, width) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      if (line && vwidth(line + ' ' + word) > width) {
        lines.push(line);
        line = word;
      } else line = line ? line + ' ' + word : word;
    }
    lines.push(line);
  }
  return lines;
}

// ─── Output ──────────────────────────────────────────────────────────────────

export const log = (...a) => out.write(a.join(' ') + '\n');
export const blank = () => out.write('\n');
export const ok = (m) => log(` ${c.green(sym.ok)} ${m}`);
export const fail = (m) => log(` ${c.red(sym.fail)} ${m}`);
export const warn = (m) => log(` ${c.yellow(sym.warn)} ${m}`);
export const info = (m) => log(` ${c.blue(sym.info)} ${m}`);
export const hint = (m) => log(`   ${c.gray(sym.arrow)} ${c.gray(m)}`);
export const cmd = (m) => log(`     ${c.accent('$')} ${c.white(m)}`);
export const kv = (k, v, w = 16) => log(`   ${c.muted(String(k).padEnd(w))} ${v}`);

export function section(title) {
  const t = ` ${title} `;
  blank();
  log(c.accent(sym.heavy.repeat(2)) + c.bold(t) + c.gray(sym.line.repeat(Math.max(4, cols() - vwidth(t) - 4))));
}

export function step(i, n, text) {
  log(`\n ${c.accent(c.bold(`[${i}/${n}]`))} ${c.bold(text)}`);
}

/**
 * Draw a rounded box. `lines` may contain colored strings; long plain lines are wrapped.
 * tone: 'accent' | 'green' | 'yellow' | 'red' | 'blue'
 */
export function box(lines, { title, tone = 'accent' } = {}) {
  const color = c[tone] || c.accent;
  const max = cols() - 6;
  const body = [];
  for (const l of [].concat(lines)) {
    if (l === '') body.push('');
    else if (vwidth(l) > max) body.push(...wrap(strip(l), max));
    else body.push(l);
  }
  const inner = Math.min(max, Math.max(...body.map(vwidth), title ? vwidth(title) + 2 : 0)) + 2;
  const t = title ? ` ${c.bold(title)} ` : '';
  log(`  ${color(sym.tl + sym.line)}${t}${color(sym.line.repeat(Math.max(0, inner - vwidth(t) - 1)) + sym.tr)}`);
  for (const l of body) log(`  ${color(sym.vline)} ${l}${' '.repeat(Math.max(0, inner - vwidth(l) - 1))}${color(sym.vline)}`);
  log(`  ${color(sym.bl + sym.line.repeat(inner) + sym.br)}`);
}

export function banner(subtitle = '') {
  blank();
  if (!unicodeOn()) {
    log(`  ${c.bold(c.accent('A B H I M A N Y U'))}  ${c.gray(subtitle)}`);
    return;
  }
  const rows = ['▄▀█ █▄▄ █ █ █ █▀▄▀█ ▄▀█ █▄ █ █▄█ █ █', '█▀█ █▄█ █▀█ █ █ ▀ █ █▀█ █ ▀█  █  █▄█'];
  const from = [66, 214, 164];
  const to = [98, 181, 247];
  for (const row of rows) {
    const chars = [...row];
    const painted = chars
      .map((ch, i) => {
        if (!colorOn() || ch === ' ') return ch;
        const t = i / (chars.length - 1);
        const [r, g, b] = from.map((f, k) => Math.round(f + (to[k] - f) * t));
        return truecolor ? `\x1b[38;2;${r};${g};${b}m${ch}` : `\x1b[38;5;79m${ch}`;
      })
      .join('');
    log('  ' + painted + (colorOn() ? '\x1b[39m' : ''));
  }
  if (subtitle) log('  ' + c.gray(subtitle));
}

/** Simple aligned table. rows: string[][] (cells may be colored). */
export function table(rows, { indent = 3, gap = 2 } = {}) {
  const widths = [];
  for (const r of rows) r.forEach((cell, i) => (widths[i] = Math.max(widths[i] || 0, vwidth(cell))));
  for (const r of rows) {
    log(' '.repeat(indent) + r.map((cell, i) => (i === r.length - 1 ? cell : cell + ' '.repeat(widths[i] - vwidth(cell) + gap))).join(''));
  }
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

const sanitize = (s) => strip(s).replace(/[\x00-\x1f\x7f]/g, ' ').trim();

export function spinner(text) {
  const t0 = Date.now();
  const secs = () => Math.round((Date.now() - t0) / 1000);
  if (!ttyOut || !colorOn()) {
    log(` ${c.gray(sym.ellipsis)} ${text}`);
    return {
      update() {},
      sub() {},
      stop(success = true, final) {
        (success ? ok : fail)(final ?? text);
      },
    };
  }
  let i = 0;
  let msg = text;
  let sub = '';
  out.write('\x1b[?25l');
  const draw = () => {
    const head = ` ${c.accent(sym.spin[i++ % sym.spin.length])} ${msg} ${c.gray(secs() + 's')}`;
    const room = cols() - vwidth(head) - 4;
    const tail = sub && room > 10 ? '  ' + c.gray(truncate(sub, room)) : '';
    out.write('\r\x1b[2K' + head + tail);
  };
  draw();
  const timer = setInterval(draw, 90);
  return {
    update(m) {
      msg = m;
    },
    sub(s) {
      sub = sanitize(s);
    },
    stop(success = true, final) {
      clearInterval(timer);
      out.write('\r\x1b[2K\x1b[?25h');
      (success ? ok : fail)((final ?? msg) + c.gray(` ${secs()}s`));
    },
  };
}

if (ttyOut) process.on('exit', () => out.write('\x1b[?25h'));

// ─── Prompts ─────────────────────────────────────────────────────────────────

// Automated tests can pre-answer prompts: ABHI_ANSWERS="mine|y|some text" (one entry per prompt, in order).
const scripted = process.env.ABHI_ANSWERS ? process.env.ABHI_ANSWERS.split('|') : null;
const nextScripted = () => (scripted && scripted.length ? scripted.shift() : undefined);
const echo = (q, a) => log(` ${c.green(sym.ok)} ${c.bold(q)} ${c.gray(sym.arrow)} ${c.accent(a)} ${c.gray('(scripted)')}`);

function abort() {
  out.write('\x1b[?25h\n');
  log(c.gray('  Cancelled. Nothing else was changed.'));
  process.exit(130);
}

/** Free-text question. */
export async function ask(question, { def = '', required = false, validate } = {}) {
  const s = nextScripted();
  if (s !== undefined) {
    echo(question, s || def);
    return s || def;
  }
  if (!interactive()) {
    if (def || !required) return def;
    throw new Error(`"${question}" needs an answer. Run this in a terminal, or pass it as an option (see: abhi help).`);
  }
  const rl = readline.createInterface({ input: process.stdin, output: out });
  rl.on('SIGINT', () => {
    rl.close();
    abort();
  });
  try {
    for (;;) {
      const prompt = ` ${c.accent('?')} ${c.bold(question)}${def ? c.gray(` (${def})`) : ''} ${c.gray(sym.arrow)} `;
      const answer = await new Promise((res) => rl.question(prompt, res));
      const v = answer.trim() || def;
      const err = required && !v ? 'This one is required.' : validate?.(v);
      if (!err) return v;
      log(`   ${c.red(err)}`);
    }
  } finally {
    rl.close();
  }
}

function keySession(onKey) {
  const stdin = process.stdin;
  readline.emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  const handler = (str, key = {}) => {
    if (key.ctrl && key.name === 'c') {
      end();
      abort();
    }
    onKey(str, key);
  };
  const end = () => {
    stdin.removeListener('keypress', handler);
    stdin.setRawMode(false);
    stdin.pause();
  };
  stdin.on('keypress', handler);
  return end;
}

/** Yes/no with a single key press. */
export async function confirm(question, def = true) {
  const s = nextScripted();
  if (s !== undefined) {
    const v = s === '' ? def : /^y/i.test(s);
    echo(question, v ? 'Yes' : 'No');
    return v;
  }
  if (!interactive()) return def;
  return new Promise((resolve) => {
    out.write(` ${c.accent('?')} ${c.bold(question)} ${c.gray(def ? '[Y/n]' : '[y/N]')} `);
    const end = keySession((str, key) => {
      let v;
      if (key.name === 'return' || key.name === 'enter') v = def;
      else if (/^[yY]$/.test(str || '')) v = true;
      else if (/^[nN]$/.test(str || '')) v = false;
      else if (key.name === 'escape') v = false;
      else return;
      end();
      out.write((v ? c.green('Yes') : c.gray('No')) + '\n');
      resolve(v);
    });
  });
}

function renderList(question, help, lines) {
  const width = cols() - 1;
  let q = ` ${c.accent('?')} ${c.bold(question)}`;
  if (vwidth(q) + vwidth(help) + 2 <= width) q += '  ' + c.gray(help);
  return [q, ...lines];
}

function optionLine(o, active, prefix) {
  const width = cols() - 1;
  const lead = ` ${active ? c.accent(sym.pointer) : ' '} ${prefix}`;
  const label = active ? c.accent(c.bold(o.label)) : o.label;
  const room = width - vwidth(lead) - vwidth(o.label) - 3;
  const hint = o.hint && room > 8 ? '  ' + c.gray(truncate(o.hint, room)) : '';
  return lead + label + hint;
}

/**
 * Arrow-key menu. options: [{ label, value, hint? }]. Number keys 1-9 pick directly.
 * Falls back to the `initial` option when not interactive.
 */
export async function select(question, options, { initial = 0 } = {}) {
  const s = nextScripted();
  const hit = s !== undefined && options.find((o) => String(o.value) === s);
  if (hit) {
    echo(question, hit.label);
    return hit.value;
  }
  if (!interactive()) return options[initial].value;
  return new Promise((resolve) => {
    let idx = initial;
    let drawn = 0;
    const render = () => {
      const lines = renderList(
        question,
        `${sym.up}${sym.down} move · Enter choose`,
        options.map((o, i) => optionLine(o, i === idx, options.length <= 9 ? c.gray(`${i + 1}.`) + ' ' : '')),
      );
      out.write((drawn ? `\x1b[${drawn}A\x1b[0J` : '') + lines.join('\n') + '\n');
      drawn = lines.length;
    };
    const finish = () => {
      end();
      out.write(`\x1b[${drawn}A\x1b[0J\x1b[?25h`);
      log(` ${c.green(sym.ok)} ${c.bold(question)} ${c.gray(sym.arrow)} ${c.accent(options[idx].label)}`);
      resolve(options[idx].value);
    };
    out.write('\x1b[?25l');
    const end = keySession((str, key) => {
      if (key.name === 'up' || key.name === 'k') idx = (idx - 1 + options.length) % options.length;
      else if (key.name === 'down' || key.name === 'j' || key.name === 'tab') idx = (idx + 1) % options.length;
      else if (key.name === 'return' || key.name === 'enter') return finish();
      else if (/^[1-9]$/.test(str || '') && Number(str) <= options.length) {
        idx = Number(str) - 1;
        return finish();
      } else return;
      render();
    });
    render();
  });
}

/** Checkbox list. Space toggles, A toggles all, Enter confirms. Returns selected values. */
export async function multiselect(question, options, { min = 0 } = {}) {
  const picked = new Set(options.filter((o) => o.checked).map((o) => o.value));
  const s = nextScripted();
  if (s !== undefined) {
    const vals = s ? s.split(',') : [...picked].map(String);
    const chosen = options.filter((o) => vals.includes(String(o.value)));
    echo(question, chosen.map((o) => o.label).join(', ') || 'none');
    return chosen.map((o) => o.value);
  }
  if (!interactive()) return [...picked];
  return new Promise((resolve) => {
    let idx = 0;
    let drawn = 0;
    let note = '';
    const render = () => {
      const lines = renderList(
        question,
        `Space select · A all · Enter done`,
        options.map((o, i) => optionLine(o, i === idx, (picked.has(o.value) ? c.accent(sym.on) : c.gray(sym.off)) + ' ')),
      );
      if (note) lines.push('   ' + c.yellow(note));
      out.write((drawn ? `\x1b[${drawn}A\x1b[0J` : '') + lines.join('\n') + '\n');
      drawn = lines.length;
    };
    out.write('\x1b[?25l');
    const end = keySession((str, key) => {
      note = '';
      const v = options[idx].value;
      if (key.name === 'up' || key.name === 'k') idx = (idx - 1 + options.length) % options.length;
      else if (key.name === 'down' || key.name === 'j' || key.name === 'tab') idx = (idx + 1) % options.length;
      else if (key.name === 'space') picked.has(v) ? picked.delete(v) : picked.add(v);
      else if (/^[aA]$/.test(str || '')) {
        if (picked.size === options.length) picked.clear();
        else options.forEach((o) => picked.add(o.value));
      } else if (key.name === 'return' || key.name === 'enter') {
        if (picked.size < min) note = `Pick at least ${min}.`;
        else {
          end();
          out.write(`\x1b[${drawn}A\x1b[0J\x1b[?25h`);
          const labels = options.filter((o) => picked.has(o.value)).map((o) => o.label);
          log(` ${c.green(sym.ok)} ${c.bold(question)} ${c.gray(sym.arrow)} ${c.accent(labels.join(', ') || 'none')}`);
          return resolve(options.filter((o) => picked.has(o.value)).map((o) => o.value));
        }
      } else return;
      render();
    });
    render();
  });
}

export async function pause(message = 'Press Enter to continue') {
  if (!interactive()) return;
  return new Promise((resolve) => {
    out.write(`   ${c.gray(message)} `);
    const end = keySession((_s, key) => {
      if (key.name === 'return' || key.name === 'enter') {
        end();
        out.write('\n');
        resolve();
      }
    });
  });
}
