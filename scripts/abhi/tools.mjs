// Installers for developer tools via winget (Windows), Homebrew (macOS) or official scripts (Linux).
import { isLinux, isMac, isWin, refreshPath, task, which } from './sh.mjs';
import * as ui from './ui.mjs';

export const TOOLS = {
  git: { name: 'Git', bin: 'git', winget: 'Git.Git', brew: ['git'], apt: 'git', url: 'https://git-scm.com/downloads' },
  node: { name: 'Node.js LTS', bin: 'node', winget: 'OpenJS.NodeJS.LTS', brew: ['node'], url: 'https://nodejs.org/en/download' },
  uv: {
    name: 'uv (Python manager)',
    bin: 'uv',
    winget: 'astral-sh.uv',
    brew: ['uv'],
    script: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
    url: 'https://docs.astral.sh/uv/getting-started/installation/',
  },
  code: { name: 'Visual Studio Code', bin: 'code', winget: 'Microsoft.VisualStudioCode', brew: ['--cask', 'visual-studio-code'], url: 'https://code.visualstudio.com' },
  gh: { name: 'GitHub CLI', bin: 'gh', winget: 'GitHub.cli', brew: ['gh'], apt: 'gh', url: 'https://cli.github.com' },
  docker: { name: 'Docker Desktop', bin: 'docker', winget: 'Docker.DockerDesktop', brew: ['--cask', 'docker'], url: 'https://www.docker.com/products/docker-desktop/' },
  androidStudio: { name: 'Android Studio', bin: null, winget: 'Google.AndroidStudio', brew: ['--cask', 'android-studio'], url: 'https://developer.android.com/studio' },
  jdk: { name: 'Java 17 (JDK)', bin: 'java', winget: 'Microsoft.OpenJDK.17', brew: ['--cask', 'zulu@17'], apt: 'openjdk-17-jdk', url: 'https://learn.microsoft.com/java/openjdk/download' },
};

export function manualInstall(key) {
  const t = TOOLS[key];
  ui.hint(`Install ${t.name} manually:`);
  if (isWin) ui.cmd(`winget install --id ${t.winget} -e`);
  if (isMac) ui.cmd(`brew install ${t.brew.join(' ')}`);
  if (isLinux && t.script) ui.cmd(t.script);
  if (isLinux && t.apt) ui.cmd(`sudo apt-get install -y ${t.apt}`);
  ui.hint(`or download it from ${t.url}`);
}

/** Install a tool. Returns true if it is available afterwards. */
export async function install(key) {
  const t = TOOLS[key];
  let res = null;
  if (isWin && which('winget')) {
    ui.hint('Windows may ask for permission (UAC). Click "Yes".');
    res = await task(`Installing ${t.name}`, 'winget', ['install', '--id', t.winget, '-e', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements', '--silent'], {
      done: `${t.name} installed`,
      showTailOnFail: false,
    });
  } else if (isMac && which('brew')) {
    res = await task(`Installing ${t.name}`, 'brew', ['install', ...t.brew], { done: `${t.name} installed` });
  } else if (!isWin && t.script) {
    res = await task(`Installing ${t.name}`, 'sh', ['-c', t.script], { done: `${t.name} installed` });
  } else {
    ui.warn(`Cannot install ${t.name} automatically on this system.`);
    if (isMac) ui.hint('Install Homebrew first: https://brew.sh');
    manualInstall(key);
    return false;
  }
  refreshPath();
  const available = t.bin ? !!which(t.bin) : res.ok || /already installed/i.test(res.output);
  if (!available) {
    if (/already installed/i.test(res?.output || '')) {
      ui.info(`${t.name} is installed but this terminal cannot see it yet. Close this window, open a new terminal, and run abhi again.`);
    } else manualInstall(key);
  }
  return available;
}
