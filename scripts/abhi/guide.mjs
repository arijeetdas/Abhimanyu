// "abhi help <topic>": renders sections of docs/DEVELOPER_GUIDE.md in the terminal.
// Sections are marked in the Markdown with  <!-- topic: name -->  so the guide stays the single source.
import fs from 'node:fs';

import { PATHS } from './config.mjs';
import * as ui from './ui.mjs';

const { c } = ui;

function loadTopics() {
  const text = fs.readFileSync(PATHS.guide, 'utf8');
  const topics = [];
  const re = /<!--\s*topic:\s*([a-z0-9-]+)\s*-->/g;
  const marks = [...text.matchAll(re)];
  marks.forEach((m, i) => {
    const body = text.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : text.length).trim();
    const title = (body.match(/^#+\s+(.+)$/m) || [null, m[1]])[1];
    topics.push({ name: m[1], title, body });
  });
  return topics;
}

const inline = (s) =>
  s
    .replace(/`([^`]+)`/g, (_, x) => c.accent(x))
    .replace(/\*\*([^*]+)\*\*/g, (_, x) => c.bold(x))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => (u.startsWith('http') ? `${t} ${c.gray(`(${u})`)}` : t));

function render(md) {
  let inCode = false;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (/^```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      ui.log(`     ${c.gray(ui.sym.vline)} ${c.white(line)}`);
      continue;
    }
    if (/^<!--/.test(line) || /^\|[\s:-]+\|/.test(line)) continue;
    let m;
    if ((m = line.match(/^#{1,2}\s+(.+)/))) ui.section(m[1]);
    else if ((m = line.match(/^#{3,}\s+(.+)/))) ui.log(`\n  ${c.accent(c.bold(m[1]))}`);
    else if ((m = line.match(/^(\s*)[-*]\s+(.+)/))) ui.log(`  ${m[1]}  ${c.accent(ui.sym.bullet)} ${inline(m[2])}`);
    else if ((m = line.match(/^(\s*)(\d+)\.\s+(.+)/))) ui.log(`  ${m[1]}  ${c.accent(m[2] + '.')} ${inline(m[3])}`);
    else if ((m = line.match(/^>\s?(.*)/))) ui.log(`   ${c.yellow(ui.sym.vline)} ${inline(m[1])}`);
    else if (/^\|/.test(line)) {
      const cells = line.split('|').slice(1, -1).map((x) => x.trim());
      ui.log(`   ${inline(cells[0]).padEnd(0)}  ${c.gray(ui.sym.arrow)}  ${cells.slice(1).map(inline).join(c.gray('  |  '))}`);
    } else ui.log(line ? `  ${inline(line)}` : '');
  }
}

export function help(topic, commandsText) {
  let topics = [];
  try {
    topics = loadTopics();
  } catch {
    ui.warn('docs/DEVELOPER_GUIDE.md not found. Run abhi sync to get it.');
  }
  if (!topic) {
    ui.log(commandsText);
    if (topics.length) {
      ui.section('Manual (step-by-step, also for doing things by hand)');
      ui.table(topics.map((t) => [c.accent(`abhi help ${t.name}`), c.gray(t.title)]));
      ui.blank();
      ui.hint('The same manual is in docs/DEVELOPER_GUIDE.md (nicer to read on GitHub).');
    }
    return;
  }
  if (topic === 'all') return topics.forEach((t) => render(t.body));
  const t = topics.find((x) => x.name === topic) || topics.find((x) => x.name.startsWith(topic)) || topics.find((x) => x.title.toLowerCase().includes(topic.toLowerCase()));
  if (!t) {
    ui.warn(`No help topic "${topic}". Available: ${topics.map((x) => x.name).join(', ')}`);
    return;
  }
  render(t.body);
  ui.blank();
}
