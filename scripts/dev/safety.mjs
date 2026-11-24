// Blocks the classic team accidents: committing API keys / passwords, and files too big for GitHub.
// Used by "dev finish" and by the Git pre-commit hook (so commits from VS Code are protected too).
import { git } from './git.mjs';
import * as ui from './ui.mjs';

const SECRET_FILES = [
  [/(^|\/)\.env$/, 'environment file with secrets'],
  [/(^|\/)\.env\.(?!example$|sample$|template$)[^/]+$/, 'environment file with secrets'],
  [/\.(pem|p12|pfx|key|keystore|jks|p8|mobileprovision)$/i, 'private key / certificate'],
  [/(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/, 'SSH private key'],
  [/(service[-_]?account|firebase-adminsdk)[^/]*\.json$/i, 'cloud service-account key'],
  [/(^|\/)credentials\.json$/i, 'credentials file'],
];

const SECRET_CONTENT = [
  [/AIza[0-9A-Za-z_-]{35}/, 'Google / Gemini API key'],
  [/\bgsk_[0-9A-Za-z]{20,}/, 'Groq API key'],
  [/\bsk-ant-[0-9A-Za-z_-]{20,}/, 'Anthropic API key'],
  [/\bsk-(proj-)?[0-9A-Za-z_-]{32,}/, 'OpenAI-style API key'],
  [/\bgh[pousr]_[0-9A-Za-z]{36,}/, 'GitHub token'],
  [/\bgithub_pat_[0-9A-Za-z_]{40,}/, 'GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\bxox[abprs]-[0-9A-Za-z-]{10,}/, 'Slack token'],
  [/\b(postgres(ql)?|mongodb(\+srv)?|redis|neo4j(\+s)?|bolt):\/\/[^\s:@/'"]+:[^\s@/'"]{3,}@/, 'database URL with a password'],
];

export const WARN_BYTES = 10 * 1024 * 1024;
export const BLOCK_BYTES = 50 * 1024 * 1024; // GitHub warns at 50 MB and rejects at 100 MB

/** Scan files as staged (rev = "") or as stored in a commit (rev = sha). Returns { secrets, large }. */
export function scanStaged(files, rev = "") {
  const secrets = [];
  const large = [];
  for (const file of files) {
    const nameHit = SECRET_FILES.find(([re]) => re.test(file));
    if (nameHit) secrets.push({ file, what: nameHit[1] });

    const sizeRes = git(["cat-file", "-s", `${rev}:${file}`], { quiet: true });
    if (!sizeRes.ok) continue; // deleted file
    const size = Number(sizeRes.stdout.trim());
    if (size >= WARN_BYTES) large.push({ file, size, block: size >= BLOCK_BYTES });
    if (nameHit || size > 2 * 1024 * 1024) continue;

    const blob = git(["cat-file", "-p", `${rev}:${file}`], { quiet: true });
    if (!blob.ok || blob.stdout.includes('\0')) continue; // binary
    const contentHit = SECRET_CONTENT.find(([re]) => re.test(blob.stdout));
    if (contentHit) secrets.push({ file, what: contentHit[1] });
  }
  return { secrets, large };
}

export const stagedFiles = () =>
  git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { quiet: true })
    .stdout.split('\0')
    .filter(Boolean);

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export function report({ secrets, large }) {
  if (secrets.length) {
    ui.box(
      [
        ui.c.bold('These look like secrets (API keys, passwords, private keys):'),
        ...secrets.map((s) => `${ui.c.red(ui.sym.fail)} ${s.file}  ${ui.c.gray(s.what)}`),
        '',
        'Secrets pushed to GitHub are public forever, even if deleted later.',
        'Keep them in backend/.env (ignored by Git) and use .env.example for empty placeholders.',
      ],
      { title: 'Blocked: possible secrets', tone: 'red' },
    );
  }
  if (large.length) {
    ui.box(
      [
        ui.c.bold('Large files:'),
        ...large.map((l) => `${l.block ? ui.c.red(ui.sym.fail) : ui.c.yellow(ui.sym.warn)} ${l.file}  ${ui.c.gray(mb(l.size))}`),
        '',
        'GitHub rejects files over 100 MB and slows down for everyone with big files.',
        'Put datasets / PDFs / models in a data/ folder (ignored) or shared storage instead.',
      ],
      { title: large.some((l) => l.block) ? 'Blocked: files too large' : 'Heads up: large files', tone: large.some((l) => l.block) ? 'red' : 'yellow' },
    );
  }
}

/** Git pre-commit hook entry. Exit code 1 blocks the commit. */
export function preCommitHook() {
  const result = scanStaged(stagedFiles());
  const blocked = result.secrets.length || result.large.some((l) => l.block);
  if (result.secrets.length || result.large.length) report(result);
  if (blocked) {
    ui.log(ui.c.gray('  Unstage with:  git restore --staged <file>    (add it to .gitignore to stop this for good)'));
    ui.log(ui.c.gray('  False alarm? Commit once with:  git commit --no-verify'));
    return 1;
  }
  return 0;
}
