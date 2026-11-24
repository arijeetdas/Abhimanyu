# Developer Guide: Abhimanyu

How to set up your PC, work every day, and fix things when they go wrong. Everything here can be done
for you by the **`abhi`** toolkit in the project root. Each section also lists the **manual steps**
in case you want to do it by hand or the toolkit is not available.

> In the terminal, every section of this guide is available as `abhi help <topic>`
> (for example `abhi help conflicts`). Run `abhi help` to list the topics.

Windows users type `.\abhi` (PowerShell) or `abhi` (Command Prompt, or after setup added it to PATH).
macOS / Linux / Git Bash users type `./abhi`.

<!-- topic: start -->
## Getting started on a new PC

### The easy way (recommended)

**Windows**, in PowerShell:

```powershell
mkdir Abhimanyu; cd Abhimanyu
irm https://raw.githubusercontent.com/arijeetdas/Abhimanyu/main/abhi.cmd -OutFile abhi.cmd
.\abhi setup
```

**macOS / Linux**, in Terminal:

```bash
mkdir Abhimanyu && cd Abhimanyu
curl -fsSLO https://raw.githubusercontent.com/arijeetdas/Abhimanyu/main/abhi && chmod +x abhi
./abhi setup
```

The launcher installs Git and Node.js if they are missing, downloads the project into the folder,
then `setup` asks what you will work on and installs the rest. You can also double-click `abhi.cmd`
in File Explorer to get the menu.

### Before you start

1. Accept the collaborator invite: https://github.com/arijeetdas/Abhimanyu/invitations
2. Know which email your GitHub account uses (GitHub > Settings > Emails). Setup asks for it.
3. On your phone, install **Expo Go** (Play Store / App Store) to run the app without Android Studio.

### Manual steps (if you prefer)

1. Install Git: https://git-scm.com/downloads (Windows: `winget install --id Git.Git -e`)
2. Install Node.js LTS: https://nodejs.org (Windows: `winget install --id OpenJS.NodeJS.LTS -e`)
3. Clone the repo and enter it:

```bash
git clone https://github.com/arijeetdas/Abhimanyu.git
cd Abhimanyu
```

4. Set your identity (once per PC):

```bash
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"
```

5. Apply the team Git settings (inside the repo):

```bash
git config pull.rebase true
git config rebase.autoStash true
git config fetch.prune true
git config push.autoSetupRemote true
git config rerere.enabled true
git config merge.conflictStyle zdiff3
git config core.hooksPath .githooks
git config core.longpaths true        # Windows only
```

6. Install the app: `cd frontend && npm ci`
7. Backend, AI, data and ML roles: install uv (`winget install --id astral-sh.uv -e`, or
   `curl -LsSf https://astral.sh/uv/install.sh | sh`), then `cd backend && uv sync`
   and copy `backend/.env.example` to `backend/.env`.

<!-- topic: daily -->
## Daily workflow

Two commands cover most days:

| When | Command | What it does |
|---|---|---|
| You sit down to work | `abhi start` | gets the team's latest work, updates packages if teammates changed them, runs the app |
| You are done | `abhi finish` | shows your changes, blocks secrets/huge files, type-checks, commits, syncs, pushes |

When you stop the app with **Ctrl+C**, `abhi start` offers to run `finish` for you.

### Good habits

- Sync often: run `abhi start` (or `abhi sync`) at least once per session. Small, frequent syncs are
  how a team avoids conflicts.
- Commit small pieces that work. "feat(app): add search box" beats one giant commit per week.
- Tell your teammates in the group chat when you are about to change a shared file
  (e.g. `frontend/src/constants/theme.ts`, `backend/app/main.py`, API contracts).
- Never commit secrets. API keys go in `backend/.env` (ignored by Git). `abhi finish` and the Git hook
  block common key formats anyway.

### Commit message format

`type(scope): what changed`, for example:

- `feat(app): add company search screen`
- `fix(api): return 404 for unknown ticker`
- `docs: explain Beneish M-Score inputs`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. `abhi finish` asks for these step by step,
and can add feat/fix entries to `docs/CHANGELOG.md` for you.

### Manual equivalent

```bash
git pull --rebase --autostash          # get the team's work
cd frontend && npm ci                  # only if package-lock.json changed
git add -A
git commit -m "feat(app): add company search screen"
git pull --rebase                      # again, in case someone pushed meanwhile
git push
```

<!-- topic: commands -->
## Command reference

| Command | What it does |
|---|---|
| `abhi` | interactive menu (recommended action is pre-selected) |
| `abhi start` | sync + update dependencies + choose what to run |
| `abhi finish` | commit and push (`-m "message"` to skip questions, `--no-checks` to skip type-check) |
| `abhi sync` | pull the team's work and push your commits |
| `abhi status` | branch, unpushed commits, unsaved changes, recent team activity |
| `abhi run web` | website at http://localhost:8081 |
| `abhi run phone` | Expo dev server with a QR code for Expo Go |
| `abhi run tunnel` | same, but works when phone and PC are on different networks |
| `abhi run android` | open the app in the Android emulator |
| `abhi run backend` | FastAPI at http://localhost:8000/docs |
| `abhi run all` | backend in a second window + website |
| `abhi branch` | new feature branch, switch branch, open a pull request, clean up |
| `abhi setup` | install and configure everything (safe to re-run) |
| `abhi doctor` | check the setup and fix problems (`--deep` also tests push access) |
| `abhi undo` | undo last commit, discard changes, restore a backup snapshot |
| `abhi rescue` | get unstuck: half-finished merge/rebase, lock files, detached HEAD |
| `abhi help <topic>` | this guide, in the terminal |

Options that work everywhere: `--yes` (accept safe defaults), `--plain` (no colors).
VS Code users: **Terminal > Run Task** has "abhi: Start working" and "abhi: Finish & upload".

<!-- topic: run -->
## Running the project by hand

### App (website + Android + iOS), from `frontend/`

```bash
npm ci                    # install exactly what package-lock.json says
npx expo start --web      # website
npx expo start            # QR code for Expo Go on your phone
npx expo start --tunnel   # phone on a different network
npx expo start --android  # Android emulator (start it in Android Studio first)
npx tsc --noEmit          # type-check
npx expo lint             # lint
npx expo export --platform web   # production website build into dist/
```

Add packages with `npx expo install <package>`, never plain `npm install <package>`: it picks versions
that match the Expo SDK. After adding a package, commit both `package.json` and `package-lock.json`.

The app finds the backend automatically (localhost on web, your PC's Wi-Fi IP on a phone). To point it
elsewhere, create `frontend/.env.local` with `EXPO_PUBLIC_API_URL=http://192.168.1.20:8000`.
Never put secrets in `EXPO_PUBLIC_*` variables: they are bundled into the app.

### Backend, from `backend/`

```bash
uv sync                                                        # create .venv with Python 3.12
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
uv run pytest                                                  # tests
uv run ruff check .                                            # lint
uv add <package>                                               # add a dependency (updates uv.lock)
```

Open http://localhost:8000/docs for the interactive API docs.

<!-- topic: git -->
## Git by hand

### Everyday commands

```bash
git status                       # what changed
git diff                         # see the exact changes
git log --oneline -15            # recent commits
git pull --rebase --autostash    # get the team's work on top of yours
git add -A                       # stage everything (or: git add path/to/file)
git commit -m "type(scope): message"
git push                         # upload
```

### Branches

```bash
git switch -c feature/yourname-search origin/main   # new branch from fresh main
git push -u origin HEAD                             # first push of the branch
git switch main                                     # go back
git merge origin/main                               # bring main's updates into your branch
git branch -d feature/yourname-search               # delete after it is merged
```

### Stash (put unfinished work aside)

```bash
git stash push -u -m "half-done search"   # -u includes new files
git stash list
git stash pop                             # bring it back
```

### Safety rules

- Do not use `git push --force` on `main`. Ever. On your own branch use `git push --force-with-lease`.
- `git reset --hard` and `git clean -fd` delete work permanently. Use `abhi undo`, which backs up first.
- Lost something? `git reflog` lists every position HEAD has been in for the last 90 days.
  `git switch -c recovered <hash>` brings it back.

<!-- topic: github -->
## GitHub access and sign-in

### First push / sign-in

- **Windows**: Git for Windows includes Git Credential Manager. The first `git push` (or `abhi setup`)
  opens a browser window: sign in to GitHub and approve. Done.
- **macOS / Linux**: install GitHub CLI and run `gh auth login` then `gh auth setup-git`.
  (`abhi setup` -> Optional extras -> GitHub CLI does this for you.)
- Passwords do not work for Git on GitHub. If asked for a password, use a
  **personal access token**: https://github.com/settings/tokens (classic, `repo` scope).

### "Permission denied" / 403 / "Repository not found"

1. Accept the invite: https://github.com/arijeetdas/Abhimanyu/invitations
2. Check which account Git uses. Windows: open **Credential Manager** > Windows Credentials >
   remove `git:https://github.com`, then push again and sign in with the right account.
   Or: `git credential-manager github list` / `git credential-manager github logout <user>`.
3. macOS: `gh auth status`, then `gh auth login` with the right account.

### Commits show the wrong person (or no avatar)

Your `user.email` does not match your GitHub account. Fix it for future commits:

```bash
git config --global user.email "the-email-on-your-github-account@example.com"
```

### Pull requests

- `abhi branch` -> "Start a new branch", work, then `abhi finish`. It pushes the branch and opens
  the pull request page (or uses `gh pr create` when GitHub CLI is installed).
- By hand: push your branch, then open
  https://github.com/arijeetdas/Abhimanyu/compare and pick your branch.
- After it is merged on GitHub: `abhi branch` -> "Go back to main", then "Delete my merged branches".

### Optional repo settings (owner)

- Settings > Branches > add a rule for `main`: "Require status checks to pass" (the CI workflow).
  If you also require pull requests, everyone must use `abhi branch` for changes.

<!-- topic: conflicts -->
## Merge conflicts

A conflict means you and a teammate changed the **same lines** of the same file. Git cannot know which
version is right, so it asks you. It is normal and nothing is lost.

### With abhi

`abhi start`, `sync` and `finish` detect conflicts and offer:

1. **Fix it myself in the editor** (recommended): opens the files in VS Code. Above each conflict,
   click **Accept Current**, **Accept Incoming**, or **Accept Both**, or use **Resolve in Merge Editor**.
   Save, then press Enter in the terminal.
2. **Decide file by file**: keep mine / keep the team version per file.
3. **Keep MY version / Keep the TEAM version** for all files.
4. **Cancel**: goes back to exactly before the sync. Try again later or ask a teammate.
5. **Get help**: uploads your work to a `rescue/...` branch and gives you a link to share.

Before any of this, abhi saves a snapshot, so even a wrong choice can be undone (`abhi undo` -> restore).

### What the markers mean

```text
  <<<<<<< (Current)
  the version already in place
  ||||||| (original)
  the text before either of you changed it
  =======
  the version being applied
  >>>>>>> (Incoming)
```

During a **sync** (rebase), "Current" is the TEAM version and "Incoming" is YOURS.
During a **merge** of main into your branch, "Current" is YOURS and "Incoming" is the TEAM version.
Delete the marker lines, keep the right text, save.

### By hand

```bash
git status                      # lists "both modified" files
# edit the files, remove all <<<<<<< ======= >>>>>>> markers
git add <file>
git rebase --continue           # if you were syncing (rebase)
git commit                      # if you were merging
git rebase --abort              # or: give up and go back to before
git merge --abort
```

### Package lock conflicts

For `frontend/package-lock.json`: take the team version, then reinstall your package:

```bash
git checkout --ours frontend/package-lock.json     # during a rebase "ours" = team
cd frontend && npm install && cd ..
git add frontend/package-lock.json && git rebase --continue
```

For `backend/uv.lock`: take either version, then run `uv lock` in `backend/` and `git add backend/uv.lock`.

<!-- topic: undo -->
## Undo and recovery

### With abhi

`abhi undo` offers:

- **Undo my last commit**: if it is not on GitHub yet, the changes come back as unsaved changes.
  If it is on GitHub already, abhi adds a new commit that reverses it (history is never rewritten).
- **Throw away changes** to some files or all files (a snapshot is taken first).
- **Restore a backup snapshot**: abhi saves a hidden snapshot of your whole folder before every sync,
  commit, branch switch and discard. Restore puts the files back, or creates a branch to look at.

### By hand

```bash
git restore path/to/file           # discard unsaved changes to one file
git restore --staged path/to/file  # unstage (keep the change)
git reset --soft HEAD~1            # undo last commit, keep changes (only if NOT pushed)
git revert HEAD                    # undo a pushed commit with a new commit
git reflog                         # find any lost commit
git switch -c recovered <hash>     # bring it back on a branch
git for-each-ref refs/abhi/snapshots   # list abhi snapshots
git restore --source=<snapshot> --worktree -- .   # restore all files from a snapshot
```

<!-- topic: branches -->
## Branches or main?

With a five-person team, both work. The default is simple:

- **Small changes** (a fix, a doc edit, a small screen): commit straight to `main` with `abhi finish`.
  abhi syncs first, so you never overwrite anyone.
- **Bigger features** (a new agent, a new data pipeline, anything taking several days):
  `abhi branch` -> "Start a new branch". Your work stays separate; `abhi start` keeps the branch updated
  with `main`; `abhi finish` pushes it and opens a pull request for review.

Branch names are created for you: `feature/<yourname>-<feature>`.

<!-- topic: setup -->
## Setup details and manual installs

`abhi setup` asks for your areas and installs only what is needed:

| Area | Installs |
|---|---|
| Frontend | Node.js LTS, app packages (`frontend/node_modules`) |
| Backend / AI / Data / ML | uv, Python 3.12 (managed by uv), backend packages (`backend/.venv`), `backend/.env` |
| Optional | VS Code + extensions, GitHub CLI, Android Studio + JDK 17, Docker Desktop |

Re-run it any time; it skips what is already there. `abhi doctor` checks everything and fixes what it can.

### Manual installs

| Tool | Windows | macOS | Link |
|---|---|---|---|
| Git | `winget install --id Git.Git -e` | `brew install git` | https://git-scm.com |
| Node.js LTS | `winget install --id OpenJS.NodeJS.LTS -e` | `brew install node` | https://nodejs.org |
| uv | `winget install --id astral-sh.uv -e` | `brew install uv` | https://docs.astral.sh/uv |
| Python 3.12 | `uv python install 3.12` | `uv python install 3.12` | |
| VS Code | `winget install --id Microsoft.VisualStudioCode -e` | `brew install --cask visual-studio-code` | https://code.visualstudio.com |
| GitHub CLI | `winget install --id GitHub.cli -e` | `brew install gh` | https://cli.github.com |
| Android Studio | `winget install --id Google.AndroidStudio -e` | `brew install --cask android-studio` | https://developer.android.com/studio |
| JDK 17 | `winget install --id Microsoft.OpenJDK.17 -e` | `brew install --cask zulu@17` | |
| Docker | `winget install --id Docker.DockerDesktop -e` | `brew install --cask docker` | https://docker.com |

After installing a tool, **close the terminal and open a new one** so it is found on PATH.

### Android emulator (optional)

Most testing is easier on a real phone with Expo Go. For the emulator: install Android Studio, open it once,
go to **More Actions > Virtual Device Manager**, create a Pixel device and press Play. Then `abhi run android`.
If `adb` is not found, set `ANDROID_HOME` to the SDK folder (Windows: `%LOCALAPPDATA%\Android\Sdk`).

<!-- topic: troubleshoot -->
## Troubleshooting

| Symptom | Fix |
|---|---|
| `abhi` is not recognized | In PowerShell use `.\abhi`. On macOS/Linux use `./abhi` (and `chmod +x abhi` once). |
| "running scripts is disabled" | You ran a `.ps1`. Use `.\abhi` (it is a `.cmd` file and is not affected). |
| Phone cannot load the app | Phone and PC must be on the same Wi-Fi. College Wi-Fi often blocks this: use `abhi run tunnel` or a mobile hotspot. |
| App on phone says backend offline | Run `abhi run backend`; allow Python through the Windows firewall when asked. |
| "Port 8081/8000 already in use" | It is already running in another window. Close that one (Ctrl+C) or use it. |
| Strange Metro / bundler errors | `cd frontend && npx expo start --clear` |
| `npm ci` fails with EPERM / EBUSY | Stop dev servers, close extra terminals, then `abhi setup`. Still stuck: delete `frontend/node_modules`. |
| Package version errors | `cd frontend && npx expo install --fix` |
| `Filename too long` (Windows) | `git config --global core.longpaths true` |
| `dubious ownership` | `git config --global --add safe.directory <path-to-Abhimanyu>` |
| `index.lock: File exists` | Another Git program is running or crashed. `abhi rescue` removes a stale lock. |
| SSL certificate problem | Windows: `git config --global http.sslBackend schannel`. Or try a mobile hotspot. |
| Pushed a secret by mistake | Revoke the key at the provider immediately (deleting the commit is not enough), then tell the team. |
| Anything else | `abhi doctor`, then `abhi rescue`. Logs are in `.abhi/logs/`. |

### Terminate batch job (Y/N)?

On Windows, after stopping the app with Ctrl+C you may see this question at the very end. Answer `Y` or `N`; it
does not matter because abhi has already finished.
