// Turns raw error output (git, npm, uv, expo...) into a plain-English explanation and next steps.
import { REPO, ROOT } from './config.mjs';
import { isWin } from './sh.mjs';
import * as ui from './ui.mjs';

const RULES = [
  {
    id: 'offline',
    test: /Could not resolve host|Failed to connect to|Couldn't connect to server|Connection timed out|Network is unreachable|getaddrinfo|ENOTFOUND|EAI_AGAIN|unable to access .*: (Recv|Send) failure|\(timed out\)/i,
    title: 'Cannot reach GitHub or the internet',
    why: 'The network request did not get through: no internet, captive Wi-Fi login, VPN/proxy, or firewall.',
    fixes: [
      'Check your internet connection (open github.com in a browser).',
      'Nothing is lost: commits stay on your PC. Run "abhi sync" when you are back online.',
      'On a college/office network with a proxy:  git config --global http.proxy http://HOST:PORT',
    ],
    topic: 'troubleshoot',
  },
  {
    id: 'auth',
    test: /Authentication failed|could not read Username|terminal prompts disabled|Invalid username or (password|token)|Support for password authentication was removed|HTTP Basic: Access denied|fatal: User cancelled/i,
    title: 'GitHub sign-in failed',
    why: 'Git could not prove who you are. GitHub needs a browser sign-in or a token, never your password.',
    fixes: [
      isWin
        ? 'Run the command again: a GitHub sign-in window should pop up (Git Credential Manager).'
        : 'Install GitHub CLI and run:  gh auth login   then:  gh auth setup-git',
      'Saved the wrong account? Clear it:  git credential-manager github logout <user>  (or remove "git:https://github.com" in Windows Credential Manager)',
      'Alternative: create a token at https://github.com/settings/tokens (repo scope) and paste it as the password.',
    ],
    topic: 'github',
  },
  {
    id: 'permission',
    test: /Permission to .+ denied|The requested URL returned error: 403|error: 403|You don't have permission|Repository not found|remote: Write access to repository not granted/i,
    title: 'Your GitHub account has no write access to the repo',
    why: 'You are signed in, but this account is not (yet) a collaborator, or you are signed in with a different account.',
    fixes: [
      `Accept the collaborator invite: ${REPO.web}/invitations  (also check your email)`,
      'Make sure you are signed in with the invited account (see "abhi help github" to switch accounts).',
      'Ask the repo owner to check Settings > Collaborators on GitHub.',
    ],
    topic: 'github',
  },
  {
    id: 'protected',
    test: /protected branch|GH006|Changes must be made through a pull request|push declined due to repository rule/i,
    title: 'main is protected: changes must go through a pull request',
    why: 'The repo settings block direct pushes to main.',
    fixes: ['Use a branch: run "abhi branch" -> "Start a new branch", then "abhi finish" opens a pull request.'],
    topic: 'git',
  },
  {
    id: 'rejected',
    test: /\[rejected\]|Updates were rejected|fetch first|non-fast-forward|failed to push some refs/i,
    title: 'GitHub has newer changes than you',
    why: 'A teammate pushed while you were working. Their work must be combined with yours first.',
    fixes: ['Run "abhi sync" (it combines both safely and then pushes).'],
    topic: 'daily',
  },
  {
    id: 'too-large',
    test: /exceeds GitHub's file size limit|GH001|Large files detected|this exceeds .* limit/i,
    title: 'A file is too big for GitHub (limit 100 MB)',
    why: 'Large files (datasets, PDFs, models, videos) cannot be pushed to a normal GitHub repo.',
    fixes: [
      'Undo the commit (keeps your files):  abhi undo  -> "Undo my last commit"',
      'Add the file or folder to .gitignore, then commit again.',
      'Share big data via Google Drive / Supabase storage, or use Git LFS.',
    ],
    topic: 'undo',
  },
  {
    id: 'lock',
    test: /index\.lock|Unable to create .*\.lock.*File exists|Another git process seems to be running/i,
    title: 'Git is locked by another program',
    why: 'Another Git operation is running (VS Code, GitHub Desktop) or a previous one crashed.',
    fixes: [
      'Wait a few seconds and try again, or close other Git tools.',
      'If nothing else is running: "abhi rescue" removes the stale lock for you.',
    ],
    topic: 'troubleshoot',
  },
  {
    id: 'dubious',
    test: /dubious ownership|safe\.directory/i,
    title: 'Git does not trust this folder (owned by another user)',
    why: 'The folder was created by a different Windows/macOS user account or copied from another drive.',
    fixes: [`git config --global --add safe.directory "${ROOT.replace(/\\/g, '/')}"`],
    topic: 'troubleshoot',
  },
  {
    id: 'local-changes',
    test: /Your local changes to the following files would be overwritten|Please commit your changes or stash them|cannot (pull|rebase) with uncommitted changes|You have unstaged changes/i,
    title: 'Your unsaved edits are in the way',
    why: 'Git will not overwrite files you have changed but not committed.',
    fixes: ['Run "abhi finish" to commit them first, or "abhi sync" (it puts them aside and back automatically).'],
    topic: 'daily',
  },
  {
    id: 'untracked',
    test: /untracked working tree files would be overwritten/i,
    title: 'A new file of yours has the same name as a teammate\'s file',
    why: 'A file you created (never committed) clashes with a file a teammate pushed.',
    fixes: ['Rename or move your file, then sync again. Or commit it first with "abhi finish".'],
    topic: 'conflicts',
  },
  {
    id: 'conflict',
    test: /CONFLICT \(|Merge conflict in|could not apply|Resolve all conflicts|unmerged files|needs merge/i,
    title: 'Merge conflict: you and a teammate edited the same lines',
    why: 'Git cannot decide which version to keep, so it asks you.',
    fixes: ['Run "abhi sync" or "abhi rescue" for a guided fix (keep yours, keep theirs, or edit).'],
    topic: 'conflicts',
  },
  {
    id: 'unrelated',
    test: /refusing to merge unrelated histories/i,
    title: 'This folder\'s history is not connected to the GitHub repo',
    why: 'The folder was initialised separately (e.g. git init on a copy) instead of cloned.',
    fixes: ['Run "abhi rescue" -> "Upload everything to a rescue branch", then clone fresh (see "abhi help start").'],
    topic: 'start',
  },
  {
    id: 'longpath',
    test: /Filename too long/i,
    title: 'Windows path length limit',
    why: 'Some files have very deep paths (common with node_modules).',
    fixes: ['git config --global core.longpaths true', 'Keep the project close to the drive root, e.g. D:\\Abhimanyu'],
    topic: 'troubleshoot',
  },
  {
    id: 'ssl',
    test: /SSL certificate problem|unable to get local issuer|schannel|certificate verify failed/i,
    title: 'Secure connection blocked (certificate problem)',
    why: 'Usually an antivirus, proxy or college network intercepting HTTPS.',
    fixes: isWin ? ['git config --global http.sslBackend schannel', 'Try another network (mobile hotspot).'] : ['Try another network (mobile hotspot).', 'Ask your network admin for the proxy certificate.'],
    topic: 'troubleshoot',
  },
  {
    id: 'identity',
    test: /Please tell me who you are|unable to auto-detect email|empty ident name/i,
    title: 'Git does not know your name and email yet',
    why: 'Every commit records an author. Use the email of your GitHub account so commits link to you.',
    fixes: ['Run "abhi setup", or:  git config --global user.name "Your Name"  and  git config --global user.email "you@example.com"'],
    topic: 'setup',
  },
  {
    id: 'ssh',
    test: /Permission denied \(publickey\)|Host key verification failed/i,
    title: 'SSH key not set up',
    why: 'The remote uses SSH (git@github.com) but your SSH key is not added to GitHub.',
    fixes: [`Switch to HTTPS (easiest):  git remote set-url origin ${REPO.url}`, 'Or add your key: https://docs.github.com/authentication/connecting-to-github-with-ssh'],
    topic: 'github',
  },
  {
    id: 'npm-sync',
    test: /npm ci.*can only install packages when your package\.json and package-lock\.json|`npm ci` can only install/i,
    title: 'package.json and package-lock.json do not match',
    why: 'Someone changed dependencies without committing the updated lock file.',
    fixes: ['Run in frontend/:  npm install   then commit both files with "abhi finish".'],
    topic: 'run',
  },
  {
    id: 'npm-resolve',
    test: /ERESOLVE|Could not resolve dependency|conflicting peer dependency/i,
    title: 'Package version conflict',
    why: 'A package needs a different version of React / Expo than the project uses.',
    fixes: ['In frontend/ always add packages with:  npx expo install <package>', 'Repair versions:  npx expo install --fix'],
    topic: 'run',
  },
  {
    id: 'busy',
    test: /EPERM|EBUSY|resource busy or locked|operation not permitted/i,
    title: 'A file is locked by another program',
    why: 'A running dev server, VS Code, or antivirus is holding a file open.',
    fixes: ['Stop running dev servers (Ctrl+C), close extra terminals, then retry.', 'Still stuck: delete frontend/node_modules and run "abhi setup".'],
    topic: 'troubleshoot',
  },
  {
    id: 'port',
    test: /EADDRINUSE|address already in use|Port \d+ is (being used|already in use)|only one usage of each socket address/i,
    title: 'That port is already in use',
    why: 'The app or API is probably already running in another terminal window.',
    fixes: ['Use the window that is already running, or close it (Ctrl+C) and start again.', isWin ? 'Find it:  netstat -ano | findstr :8000   then  taskkill /PID <pid> /F' : 'Find it:  lsof -i :8000   then  kill <pid>'],
    topic: 'run',
  },
  {
    id: 'disk',
    test: /ENOSPC|No space left on device|not enough space/i,
    title: 'Disk is full',
    why: 'Dependencies (node_modules, Python packages) need a few GB of free space.',
    fixes: ['Free up disk space, then run "abhi setup" again.'],
    topic: 'troubleshoot',
  },
  {
    id: 'python',
    test: /No interpreter found|requires-python|Python .* (not found|is not installed)|No Python at/i,
    title: 'Python 3.12 is not available',
    why: 'The backend uses Python 3.12 managed by uv.',
    fixes: ['Run:  uv python install 3.12   (or "abhi setup")'],
    topic: 'setup',
  },
  {
    id: 'network-pkg',
    test: /ECONNRESET|ETIMEDOUT|ERR_SOCKET_TIMEOUT|network request .* failed|Failed to download|error sending request/i,
    title: 'Download failed (network)',
    why: 'Package downloads timed out or were interrupted.',
    fixes: ['Retry on a stable connection. Mobile hotspots work well when college Wi-Fi blocks downloads.'],
    topic: 'troubleshoot',
  },
];

export function diagnose(text = '') {
  return RULES.filter((r) => r.test.test(text)).slice(0, 2);
}

/** Print a friendly explanation. Returns true when at least one rule matched. */
export function explain(text, { fallbackTitle = 'Something went wrong' } = {}) {
  const found = diagnose(text);
  if (!found.length) {
    ui.box(
      [
        ui.c.bold(fallbackTitle),
        '',
        ...(text ? text.split(/\r?\n/).filter((l) => l.trim()).slice(-8).map((l) => ui.c.gray(ui.truncate(ui.strip(l), ui.cols() - 10))) : []),
        '',
        `Try:  ${ui.c.accent('abhi doctor')}   or   ${ui.c.accent('abhi rescue')}`,
        `Manual steps:  ${ui.c.accent('abhi help troubleshoot')}`,
      ],
      { title: 'Problem', tone: 'red' },
    );
    return false;
  }
  for (const r of found) {
    ui.box(
      [
        ui.c.bold(r.title),
        ui.c.gray(r.why),
        '',
        ui.c.bold('What to do'),
        ...r.fixes.map((f, i) => `${ui.c.accent(`${i + 1}.`)} ${f}`),
        '',
        ui.c.gray(`More: abhi help ${r.topic}`),
      ],
      { title: 'Problem', tone: 'yellow' },
    );
  }
  return true;
}

export const matches = (text, id) => RULES.find((r) => r.id === id)?.test.test(text || '') ?? false;
