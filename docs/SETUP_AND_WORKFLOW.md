# Setup & Workflow Guide: Abhimanyu

Every step for **setting up your PC**, **running the `dev` scripts**, and **using Git and GitHub** on this
project, from zero to your first pushed change and beyond.

> The same guide is available in the terminal: `dev help` lists the topics, `dev help <topic>` shows one
> (for example `dev help conflicts`). Every automatic step also lists the manual commands, so you can do
> it by hand if you prefer.

**Contents**

1. [What you need](#1-what-you-need)
2. [First-time setup](#2-first-time-setup)
3. [Your first day: from setup to first push](#3-your-first-day-from-setup-to-first-push)
4. [Daily workflow](#4-daily-workflow)
5. [The dev scripts: every command](#5-the-dev-scripts-every-command)
6. [Running the project by hand](#6-running-the-project-by-hand)
7. [Git by hand](#7-git-by-hand)
8. [GitHub: access, sign-in and pull requests](#8-github-access-sign-in-and-pull-requests)
9. [Branches or main?](#9-branches-or-main)
10. [Merge conflicts](#10-merge-conflicts)
11. [Undo and recovery](#11-undo-and-recovery)
12. [Manual installs and tool details](#12-manual-installs-and-tool-details)
13. [Troubleshooting](#13-troubleshooting)
14. [Cheat sheet](#14-cheat-sheet)
15. [Firebase: sign-in and profiles](#15-firebase-sign-in-and-profiles)

**How to type the command on your system**

| System | Terminal | Type |
|---|---|---|
| Windows | PowerShell (default in VS Code) | `.\dev <command>` |
| Windows | Command Prompt, or after setup added dev to PATH | `dev <command>` |
| macOS / Linux | Terminal | `./dev <command>` |
| Windows | Git Bash | `./dev <command>` |

This guide writes plain `dev <command>`; add `.\` or `./` as shown above.

<!-- topic: needs -->
## 1. What you need

- A **GitHub account**, invited as a collaborator to https://github.com/arijeetdas/Abhimanyu
  (accept the invite at https://github.com/arijeetdas/Abhimanyu/invitations or from the email).
- The **email address of your GitHub account** (GitHub > Settings > Emails). Commits are linked to your
  profile through this email.
- Windows 10/11, macOS, or Linux with about **5 GB free disk space** (app and Python packages).
- Internet access. On restrictive college Wi-Fi, a mobile hotspot often works better.
- Optional: an Android or iPhone with the **Expo Go** app (Play Store / App Store) to run the app on your phone.

You do **not** need to install anything else in advance. The launcher installs Git and Node.js if they are
missing, and `dev setup` installs the rest.

<!-- topic: start -->
## 2. First-time setup

### 2.1 Automatic setup (recommended)

**Windows**: open **PowerShell** in the place where you keep projects (for example `D:\Projects`) and run:

```powershell
mkdir Abhimanyu; cd Abhimanyu
irm https://raw.githubusercontent.com/arijeetdas/Abhimanyu/main/dev.cmd -OutFile dev.cmd
.\dev setup
```

**macOS / Linux**: open **Terminal** and run:

```bash
mkdir Abhimanyu && cd Abhimanyu
curl -fsSLO https://raw.githubusercontent.com/arijeetdas/Abhimanyu/main/dev && chmod +x dev
./dev setup
```

Already cloned the repo with Git? Just open a terminal in the `Abhimanyu` folder and run `dev setup`.
You can also double-click `dev.cmd` in File Explorer to open the menu.

### 2.2 What happens during setup

The **launcher** (`dev.cmd` / `dev`) first makes sure the basics exist:

1. Checks for **Git**; installs it with winget (Windows) or Homebrew/apt (macOS/Linux) if missing.
2. Checks for **Node.js**; installs the LTS version the same way if missing.
3. If the folder does not contain the project yet, downloads it from GitHub into the folder
   (it asks first if the folder is not empty).

Then **`dev setup`** walks through seven steps. Use the arrow keys, Space to tick boxes, and Enter to confirm.

| Step | What it does | What you do |
|---|---|---|
| 1. What will you work on? | Picks what to install: Frontend, Backend API, Agentic AI, Data pipelines, ML & graph | Tick your areas (Space), press Enter |
| 2. Core tools | Confirms Node.js 22.13+ and Git are available | Nothing, unless Node is too old (it offers to update) |
| 3. Your Git identity | Sets `user.name` and `user.email` for your commits | Type your full name and your **GitHub email** |
| 4. GitHub repository | Links the folder to GitHub, applies team Git settings, tests access | A **browser sign-in window** may open: sign in to GitHub and approve |
| 5. App | Installs the app packages (`npm ci` in `frontend/`) | Wait a few minutes the first time |
| 6. Backend | Installs **uv**, Python 3.12 and backend packages, creates `backend/.env` | Only for backend/AI/data/ML areas |
| 7. Optional extras | VS Code + extensions, GitHub CLI, Android emulator tools, Docker | Tick what you want; asks to add `dev` to PATH |

At the end you see a check list (the same as `dev doctor`) and a **Setup complete** box.
Setup is safe to run again at any time; it skips what is already installed.

### 2.3 Manual setup (if you prefer doing it yourself)

1. Install **Git**: https://git-scm.com/downloads
   (Windows: `winget install --id Git.Git -e`, macOS: `brew install git`).
2. Install **Node.js LTS**: https://nodejs.org
   (Windows: `winget install --id OpenJS.NodeJS.LTS -e`, macOS: `brew install node`).
3. **Close and reopen** the terminal so the new tools are found.
4. Clone the repository and enter it:

```bash
git clone https://github.com/arijeetdas/Abhimanyu.git
cd Abhimanyu
```

5. Tell Git who you are (once per PC):

```bash
git config --global user.name "Your Full Name"
git config --global user.email "your-github-email@example.com"
```

6. Apply the team Git settings (run inside the `Abhimanyu` folder):

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

7. Install the app packages:

```bash
cd frontend
npm ci
cd ..
```

8. Backend, AI, data and ML areas only: install **uv**
   (Windows: `winget install --id astral-sh.uv -e`, macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`),
   reopen the terminal, then:

```bash
cd backend
uv sync                                   # downloads Python 3.12 and installs packages into backend/.venv
cp .env.example .env                      # Windows PowerShell: Copy-Item .env.example .env
cd ..
```

9. Optional: install **VS Code** (https://code.visualstudio.com) and open the `Abhimanyu` folder. Accept the
   "install recommended extensions" prompt.

### 2.4 Check that everything works

```bash
dev doctor          # every line should be a green tick or a grey circle (optional)
dev doctor --deep   # also checks that GitHub lets you push
```

<!-- topic: first-day -->
## 3. Your first day: from setup to first push

1. Run `dev start` and choose **Backend + website together**.
   The API opens in a second window and the website opens in your browser on the **landing page**.
2. Click **Register**, create an account, and walk through the short onboarding. Without Firebase keys the
   app runs in **demo mode**: accounts are stored only in that browser (see [section 15](#15-firebase-sign-in-and-profiles)).
3. The placeholder **home** screen says **Successful**. Its **Backend API** row should say **Online**: that
   proves the app and the API work together on your PC. (Frontend-only? Choose **Website in the browser**;
   the row shows Offline, which is fine.)
4. Optional: choose **App on my phone (Expo Go)** next time and scan the QR code with Expo Go (Android) or the
   Camera app (iPhone). Phone and PC must be on the same Wi-Fi. The app has no landing page: it opens on
   **Log in**.
5. Make a small change, for example edit a line of copy in `frontend/src/features/landing/landing-page.tsx`,
   and save. The browser reloads automatically.
6. Press **Ctrl+C** in the terminal. The script asks **"Upload your changes to GitHub now?"**: press Enter.
7. Answer the commit questions: type **feat**, scope **app**, description "add my name".
8. The script checks your code, commits, syncs and pushes. The **Uploaded** box shows the commit and a GitHub link.

You have now done the full cycle. Every day after this is `dev start` ... work ... `dev finish`.

<!-- topic: daily -->
## 4. Daily workflow

| When | Command | What it does for you |
|---|---|---|
| You sit down to work | `dev start` | Gets the team's latest work, updates packages if teammates changed them, adds new `.env` settings, runs the app |
| You finish (or Ctrl+C the app) | `dev finish` | Shows your changes, blocks secrets and huge files, type-checks/lints, guides the commit message, syncs, pushes |
| Anytime | `dev status` | What changed, what is not uploaded, who pushed recently |
| Something is off | `dev rescue` | Fixes half-finished syncs, removes stale locks, uploads your work for a teammate |

### Good habits

- **Sync every session.** Run `dev start` (or `dev sync`) when you begin. Small, frequent syncs are how a
  team avoids conflicts.
- **Commit small working pieces.** "feat(app): add search box" is better than one huge commit per week.
- **Say it in the group chat** before changing shared files: `frontend/src/constants/theme.ts`,
  `frontend/src/lib/api.ts`, `backend/app/main.py`, API contracts in `docs/API_SPECIFICATION.md`.
- **Never commit secrets.** API keys go in `backend/.env` (ignored by Git). The dev script and the Git hook block
  common key formats anyway.
- **Big features go on a branch** (see [section 9](#9-branches-or-main)).
- **Using an AI assistant** (Claude Code, Codex, Cursor, Copilot, Gemini)? It reads [`RULES.md`](../RULES.md)
  automatically through `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` or `.github/copilot-instructions.md`. If your tool
  does not, tell it: "Read RULES.md and follow it". Review what it changes before running `dev finish`.

### Commit message format

`type(scope): what changed`, for example:

- `feat(app): add company search screen`
- `fix(api): return 404 for unknown ticker`
- `docs: explain Beneish M-Score inputs`

| Type | Use it for |
|---|---|
| `feat` | a new feature, screen or endpoint |
| `fix` | a bug fix |
| `docs` | documentation only |
| `style` | look & feel or formatting, no logic change |
| `refactor` | restructured code, same behaviour |
| `test` | tests added or fixed |
| `chore` | tooling, dependencies, config |

Scopes in use: `app` (frontend), `api` (backend), `docs`, `toolkit` (dev scripts), `ci`.
`dev finish` asks for type, scope and description one by one, and offers to add `feat`/`fix` entries to
`docs/CHANGELOG.md`.

<!-- topic: commands -->
## 5. The dev scripts: every command

The toolkit lives in the repo: `dev.cmd` (Windows launcher), `dev` (macOS/Linux launcher) and
`scripts/dev/` (the program, Node.js, no extra packages needed). It updates itself whenever you sync.

### 5.1 The menu: `dev`

Running `dev` with no command opens a menu. The **recommended** action is pre-selected:
Setup (if this PC is not set up), I'm stuck (if a sync was left half-done), Finish & upload (if you have
unsaved changes) or Start working. Move with the arrow keys or press the number, then Enter.
After each action, press Enter to return to the menu; choose **Exit** to close.

### 5.2 `dev start`

1. Runs setup first if this PC has never been set up (asks).
2. Checks the folder is linked to GitHub, your Git identity is set, and no half-finished sync is pending.
3. If you have unsaved changes from last time, asks what to do:
   **Keep them and sync anyway** (recommended), **Upload them first**, or **Do not sync right now**.
4. Fetches GitHub, lists the new commits from teammates, takes a **backup snapshot**, and combines their work
   with yours. On a feature branch it also brings in the latest `main`.
5. Uploads any of your commits that are not on GitHub yet.
6. Reinstalls app packages if `package-lock.json` changed, runs `uv sync` if backend dependencies changed, and
   adds new keys from `backend/.env.example` to your `backend/.env`.
7. Asks what to run: **Website**, **App on my phone (Expo Go)**, **App on my phone, other network** (tunnel),
   **Android emulator**, **Backend API**, **Backend + website together**, or **Nothing**.
8. When you stop the app with **Ctrl+C**, offers to run `finish` for you.

Shortcut: `dev start web`, `dev start phone`, `dev start backend`, ... skips the question in step 7.

### 5.3 `dev finish` (aliases: `save`, `done`)

1. Lists your changed files (`+ new`, `~ changed`, `- deleted`).
2. Asks **Everything (recommended)**, **Let me choose the files**, or **Cancel**.
3. **Safety scan**: blocks files that look like secrets (Gemini/Groq/Anthropic/OpenAI/GitHub/AWS keys, private
   keys, database URLs with passwords, `.env` files) and files over 50 MB. You can leave them out and add them
   to `.gitignore` with one choice.
4. **Quick checks**: type-checks the app (`tsc`) if you changed frontend code and lints the backend (`ruff`) if
   you changed Python. On `main`, if checks fail it recommends fixing first; nothing is committed.
5. **Commit message**: type, scope and a short description (or pass `-m "..."`).
6. Offers to add the change to `docs/CHANGELOG.md` (for `feat` and `fix`).
7. Takes a backup snapshot, commits, then syncs with the team (same as `dev sync`).
8. Pushes. If a teammate pushed a moment earlier, it combines and retries automatically (up to 3 times).
9. Shows an **Uploaded** box with the commit and its GitHub link. On a feature branch it offers to open a
   **pull request**.

Options: `dev finish -m "feat(app): add search box"` (no questions about the message),
`--no-checks` (skip type-check/lint), `--all` (include every file without asking).

### 5.4 `dev sync` (aliases: `pull`, `update`)

Gets the team's work and uploads your commits, without making a new commit. Unsaved edits are set aside and
put back automatically. Use it when you only want to be up to date.

### 5.5 `dev status`

Shows your branch, how many commits you need to upload or download, your unsaved files, the number of backup
snapshots, the last 8 commits on `main` with authors, and the suggested next command.

### 5.6 `dev run <target>`

Runs something without syncing first. Targets:

| Target | Runs | Open |
|---|---|---|
| `web` | `npx expo start --web` in `frontend/` | http://localhost:8081 |
| `phone` | `npx expo start` (QR code) | Expo Go on your phone |
| `tunnel` | `npx expo start --tunnel` | Expo Go, any network |
| `android` | `npx expo start --android` | Android emulator |
| `backend` | `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` in `backend/` | http://localhost:8000/docs |
| `all` | backend in a second window + website | both |

Stop with **Ctrl+C**.

### 5.7 `dev branch [name]`

Menu: **Start a new branch for a feature** (creates `feature/<yourname>-<name>` from the latest `main`,
your unsaved changes come along), **Switch to another branch** (local or on GitHub), **Open a pull request**,
**Go back to main**, **Delete my local branches that are already merged**.
`dev branch company-search` creates the branch directly.

### 5.8 `dev setup`

The guided installer from [section 2.2](#22-what-happens-during-setup). Re-run it to add areas (for example
when you start backend work) or after reinstalling your PC.

### 5.9 `dev doctor [--deep]`

Checks Core tools (Git, Node.js, npm, identity), Project (repo link, branch, GitHub access, team Git settings,
snapshots), App (packages, Expo Go reminder), Backend (uv, Python 3.12, environment, `.env`) and Optional tools
(VS Code, GitHub CLI, Docker, Android SDK, Java). Problems it can fix are listed and fixed after one "Yes".
`--deep` also verifies that GitHub accepts pushes from your account.

### 5.10 `dev undo` (alias: `restore`)

- **Undo my last commit**: if not uploaded, the changes come back as unsaved changes; if already on GitHub,
  creates a new commit that reverses it.
- **Throw away my changes to some files** / **ALL my unsaved changes**: a backup snapshot is taken first.
- **Restore a backup snapshot**: put files back as they were, or create a branch from the snapshot.

### 5.11 `dev rescue` (aliases: `stuck`, `fix`, `sos`)

Detects and fixes:

- a stale Git lock (`index.lock`) left by a crashed program,
- a half-finished rebase/merge: **Fix and finish it**, **Cancel it (back to before, safe)**, or
  **Cancel and upload my work for a teammate**,
- leftover conflict markers from an earlier sync,
- "detached HEAD" (not on a branch),
- otherwise: try a fresh sync, run the doctor, **upload everything to a rescue branch**, or
  **start over** (make the folder match GitHub `main`, after backing everything up).

A **rescue branch** (`rescue/<name>-<time>`) is a full copy of your folder, including unsaved files, pushed
to GitHub so a teammate can look at it. `main` is never touched. Secrets and huge files are refused.

### 5.12 `dev help [topic]`

Shows this guide in the terminal. Topics: `needs`, `start`, `first-day`, `daily`, `commands`, `run`, `git`,
`github`, `branches`, `conflicts`, `undo`, `setup`, `troubleshoot`, `cheatsheet`, `firebase`. `dev help all` prints everything.

### 5.13 Options for every command

| Option | Effect |
|---|---|
| `-y`, `--yes` | accept the safe default for every question (no prompts) |
| `--plain` | no colors or special characters (old terminals, logs) |
| `-m "message"` | commit message for `finish` |
| `--no-checks` | skip type-check / lint in `finish` |
| `--deep` | extra checks in `doctor` |
| `--version` | show the toolkit version |

### 5.14 What the scripts never do

- **Force-push** or rewrite history on GitHub.
- Delete your work without a backup: a hidden **snapshot** of the whole folder (including new, unsaved files)
  is saved before every sync, commit, branch switch, discard and reset. Snapshots stay on your PC
  (inside `.git`, under `refs/dev/snapshots`) and are never uploaded.
- Change your global Git settings (other than name/email when you ask): team settings are local to this repo.
- Upload `.env` files, API keys, or files over 50 MB.

### 5.15 Files the scripts use

| Path | Purpose |
|---|---|
| `dev.cmd`, `dev` | launchers (Windows, macOS/Linux) |
| `scripts/dev/` | the toolkit code |
| `.githooks/pre-commit` | blocks secrets/huge files, also for commits made from VS Code |
| `.dev/` | your local state and logs (`.dev/logs/`), never committed |
| `.vscode/tasks.json` | VS Code: **Terminal > Run Task > dev: Start working / Finish & upload / Sync / Menu** |

<!-- topic: run -->
## 6. Running the project by hand

### 6.1 App (website + Android + iOS), from `frontend/`

```bash
npm ci                           # install exactly what package-lock.json says
npx expo start --web             # website at http://localhost:8081
npx expo start                   # QR code for Expo Go on your phone
npx expo start --tunnel          # phone on a different network
npx expo start --android         # Android emulator (start it in Android Studio first)
npx expo start --clear           # same, after clearing the bundler cache
npx tsc --noEmit                 # type-check
npx expo lint                    # lint
npx expo export --platform web   # production website build into dist/
npx expo-doctor                  # check Expo package versions
```

Adding a package: always `npx expo install <package>` (never plain `npm install <package>`), so the version
matches the Expo SDK. Then commit both `package.json` and `package-lock.json`.

The app finds the backend automatically: `localhost` on web, your PC's Wi-Fi IP on a phone. To point it
somewhere else, create `frontend/.env.local` with `EXPO_PUBLIC_API_URL=http://192.168.1.20:8000`.
Never put secrets in `EXPO_PUBLIC_*` variables: they are bundled into the website and the app.

### 6.2 Backend, from `backend/`

```bash
uv sync                                                          # create/update .venv (Python 3.12)
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # start the API
uv run pytest                                                    # tests
uv run ruff check .                                              # lint
uv run ruff format .                                             # format
uv add <package>                                                 # add a dependency (updates uv.lock)
```

Open http://localhost:8000/docs for the interactive API docs and http://localhost:8000/health for the health
check. Settings come from `backend/.env` (see `backend/.env.example`).

<!-- topic: git -->
## 7. Git by hand

### 7.1 The ideas in one minute

- Your folder is a **local repository**; GitHub holds the **remote** called `origin`.
- A **commit** is a saved snapshot of your changes with a message. It exists only on your PC until you **push**.
- **Pull** (fetch + rebase) brings teammates' commits to your PC and puts yours on top.
- A **branch** is a separate line of work; `main` is the shared one.

### 7.2 Everyday commands

```bash
git status                        # what changed
git diff                          # exact changes not yet staged
git diff --staged                 # exact changes staged for the next commit
git log --oneline --graph -15     # recent history
git pull --rebase --autostash     # get the team's work, keep yours on top
git add -A                        # stage everything (or: git add path/to/file)
git commit -m "type(scope): what changed"
git push                          # upload
```

### 7.3 The full manual cycle

```bash
git pull --rebase --autostash           # 1. start of session
# ... work ...
git status                              # 2. review
git add -A                              # 3. stage
git commit -m "feat(app): add search"   # 4. commit
git pull --rebase                       # 5. combine with anything pushed meanwhile
git push                                # 6. upload
```

If step 6 says **rejected (fetch first)**, a teammate pushed in between: repeat steps 5 and 6.
If `package-lock.json` changed in step 1 or 5, run `npm ci` in `frontend/`. If `uv.lock` changed, run `uv sync` in `backend/`.

### 7.4 Branches

```bash
git fetch origin
git switch -c feature/yourname-search origin/main   # new branch from the latest main
git push -u origin HEAD                             # first push of the branch
git merge origin/main                               # bring main's updates into your branch
git switch main                                     # go back to main
git branch -d feature/yourname-search               # delete it after it is merged
```

### 7.5 Stash (put unfinished work aside)

```bash
git stash push -u -m "half-done search"   # -u includes new files
git stash list
git stash pop                             # bring it back
```

### 7.6 Safety rules

- Never `git push --force` to `main`. On your own branch, if you must, use `git push --force-with-lease`.
- `git reset --hard` and `git clean -fd` delete work permanently. Prefer `dev undo`, which backs up first.
- Lost a commit? `git reflog` lists every place you have been for the last 90 days;
  `git switch -c recovered <hash>` brings it back.

<!-- topic: github -->
## 8. GitHub: access, sign-in and pull requests

### 8.1 Join the repository

1. The owner invites you: GitHub repo > **Settings > Collaborators > Add people**.
2. You accept: https://github.com/arijeetdas/Abhimanyu/invitations (or the email link).

### 8.2 Sign in from Git

- **Windows**: Git for Windows includes **Git Credential Manager**. The first fetch/push (or `dev setup`) opens a
  browser window: sign in and approve. It is remembered.
- **macOS / Linux**: install GitHub CLI (`dev setup` > Optional extras > GitHub CLI, or `brew install gh`), then:

```bash
gh auth login        # choose GitHub.com, HTTPS, login with a web browser
gh auth setup-git    # lets Git use that login
```

- Passwords do **not** work for Git on GitHub. If a terminal asks for a password, paste a **personal access
  token** instead: https://github.com/settings/tokens (classic, scope `repo`).

### 8.3 Using the wrong account, or "Permission denied" / 403 / "Repository not found"

1. Make sure you accepted the invite (8.1).
2. Remove the saved login and sign in again:
   - Windows: **Control Panel > Credential Manager > Windows Credentials** > remove `git:https://github.com`,
     or run `git credential-manager github list` and `git credential-manager github logout <user>`.
   - macOS: `gh auth status`, then `gh auth logout` and `gh auth login`.
3. Run `dev doctor --deep` to confirm you can push.

### 8.4 Commits show the wrong person or no profile picture

Your Git email does not match your GitHub account. Fix it for future commits:

```bash
git config --global user.email "the-email-on-your-github-account@example.com"
```

(GitHub > Settings > Emails also offers a private `...@users.noreply.github.com` address you can use.)

### 8.5 Pull requests

- **With dev**: `dev branch` > **Start a new branch**, work, then `dev finish`. It pushes the branch and opens
  the pull request page (or runs `gh pr create` if GitHub CLI is installed).
- **By hand**: push your branch, open https://github.com/arijeetdas/Abhimanyu/compare, pick your branch,
  fill in the template, **Create pull request**.
- **Review**: a teammate reads the changes (Files changed tab), comments or approves. CI must be green.
- **Merge**: click **Squash and merge** (one tidy commit on `main`). Then `dev branch` > **Go back to main** and
  **Delete my merged branches**.

### 8.6 CI (automatic checks on GitHub)

Every push to `main` and every pull request runs `.github/workflows/ci.yml`:
app type-check, lint and website build; backend lint and tests; toolkit smoke test.
See the results in the repo's **Actions** tab, or as a tick/cross next to each commit. A red cross means
something is broken on `main`: fix it first, before new work.

### 8.7 One-time settings for the repo owner (optional)

- **Settings > Branches > Add rule** for `main`: tick **Require status checks to pass** (pick the CI jobs).
  If you also tick **Require a pull request**, everyone must use branches (`dev branch`) for every change.
- **Settings > General > Pull Requests**: allow **Squash merging**, tick **Automatically delete head branches**.

<!-- topic: branches -->
## 9. Branches or main?

Both work for a five-person team:

- **Small changes** (a fix, a doc edit, a small screen): commit straight to `main` with `dev finish`.
  The dev script syncs first, so you never overwrite anyone.
- **Bigger features** (a new agent, a data pipeline, anything taking several days or touching shared files):
  `dev branch` > **Start a new branch**. Your work stays separate; `dev start` keeps the branch updated with
  `main`; `dev finish` pushes it and opens a pull request for review.

Branch names are made for you: `feature/<yourname>-<feature>`.

<!-- topic: conflicts -->
## 10. Merge conflicts

A conflict means you and a teammate changed the **same lines** of the same file. Git cannot know which version
is right, so it asks. It is normal, and nothing is lost.

### 10.1 With dev

`dev start`, `sync` and `finish` detect conflicts, show which files and which teammate, and offer:

1. **Fix it myself in the editor** (recommended): opens the files in VS Code. Above each conflict, click
   **Accept Current Change**, **Accept Incoming Change** or **Accept Both Changes**, or use
   **Resolve in Merge Editor**. Save, then press Enter in the terminal. The script checks that no markers are left.
2. **Decide file by file**: keep mine / keep the team version for each file.
3. **Keep MY version of all of them** or **Keep the TEAM version of all of them**.
4. **Cancel: go back to before this sync**: everything returns to exactly how it was. Try later or ask for help.
5. **Get help: upload my work for a teammate**: creates a rescue branch and prints a link to share.

A backup snapshot is always taken first, so even a wrong choice can be undone (`dev undo` > restore).

### 10.2 Reading the markers

```text
  <<<<<<< (Current)
  the version already in place
  ||||||| (original)
  the text before either of you changed it
  =======
  the version being applied
  >>>>>>> (Incoming)
```

(In a real file the markers start at the beginning of the line.)

- During a **sync** (rebase): **Current = the TEAM version**, **Incoming = YOUR version**.
- During a **merge of main into your branch**: **Current = YOURS**, **Incoming = the TEAM version**.

Keep the right lines (often a mix of both), delete all marker lines, save.

### 10.3 By hand

```bash
git status                  # files under "both modified"
# edit each file and remove all <<<<<<< ||||||| ======= >>>>>>> lines
git add <file>
git rebase --continue       # if you were syncing (pull --rebase)
git commit                  # if you were merging
git rebase --abort          # or give up and go back to before the sync
git merge --abort           # or give up a merge
```

### 10.4 Lock file conflicts

`frontend/package-lock.json`: take the team version, then reinstall your package:

```bash
git checkout --ours frontend/package-lock.json   # during a rebase, "ours" = the team
cd frontend && npm install && cd ..
git add frontend/package-lock.json
git rebase --continue
```

`backend/uv.lock`: take either version, run `uv lock` in `backend/`, then `git add backend/uv.lock` and continue.
`docs/CHANGELOG.md` never conflicts: Git keeps both sides automatically.

<!-- topic: undo -->
## 11. Undo and recovery

### 11.1 With dev

Run `dev undo`:

| Choice | Result |
|---|---|
| Undo my last commit | not uploaded: changes come back unsaved; uploaded: a new commit reverses it |
| Throw away my changes to some files | those files return to the last commit (snapshot first) |
| Throw away ALL my unsaved changes | clean folder (snapshot first; `.env` and `node_modules` kept) |
| Restore a backup snapshot | files back as they were at that moment, or a branch to look at |

### 11.2 By hand

```bash
git restore path/to/file                  # discard unsaved changes to one file
git restore --staged path/to/file         # unstage, keep the change
git reset --soft HEAD~1                   # undo last commit, keep changes (only if NOT pushed)
git revert HEAD                           # undo a pushed commit with a new commit
git reflog                                # find any lost commit
git switch -c recovered <hash>            # bring it back on a branch
git for-each-ref refs/dev/snapshots      # list the dev script's snapshots
git restore --source=<snapshot> --worktree -- .   # put all files back from a snapshot
```

### 11.3 Pushed a secret by mistake

1. **Revoke the key at the provider immediately** (Google AI Studio, Groq, Anthropic, Supabase, GitHub...).
   Deleting the commit is not enough: anyone may already have copied it.
2. Create a new key and put it only in `backend/.env`.
3. Tell the team in the group chat.

<!-- topic: setup -->
## 12. Manual installs and tool details

What `dev setup` installs for each area:

| Area | Installs |
|---|---|
| Frontend | Node.js LTS, app packages (`frontend/node_modules`) |
| Backend / AI / Data / ML | uv, Python 3.12 (managed by uv), backend packages (`backend/.venv`), `backend/.env` |
| Optional | VS Code + extensions, GitHub CLI, Android Studio + JDK 17, Docker Desktop |

Manual install commands:

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

Linux: Git with `sudo apt-get install -y git`; Node.js with nvm
(`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash`, reopen the terminal,
`nvm install --lts`); uv with `curl -LsSf https://astral.sh/uv/install.sh | sh`.

After installing any tool, **close the terminal and open a new one** so it is found.

### Android emulator (optional)

A real phone with Expo Go is easier. For the emulator: install Android Studio, open it once, go to
**More Actions > Virtual Device Manager**, create a Pixel device and press Play. Then `dev run android`.
If `adb` is not found, set `ANDROID_HOME` to the SDK folder (Windows: `%LOCALAPPDATA%\Android\Sdk`,
macOS: `~/Library/Android/sdk`).

### Building an installable Android app (APK)

```bash
cd frontend
npx eas-cli@latest login            # free Expo account
npx eas-cli@latest build -p android --profile preview
```

The first run asks to create an EAS project and a build profile; accept the defaults.

<!-- topic: troubleshoot -->
## 13. Troubleshooting

| Symptom | Fix |
|---|---|
| `dev` is not recognized | PowerShell needs `.\dev`. macOS/Linux need `./dev` (and `chmod +x dev` once). |
| "running scripts is disabled on this system" | You ran a `.ps1` file. Use `.\dev` (a `.cmd` file, not affected). |
| Tool installed but "not found" | Close the terminal, open a new one, run dev again. |
| GitHub sign-in fails / 403 / repository not found | [Section 8.3](#83-using-the-wrong-account-or-permission-denied--403--repository-not-found) |
| `URL.parse is not a function` or Expo reports an unsupported Node.js version | Install Node.js 22.13.0 or newer with `dev setup`, then close and reopen the terminal before running the app again. |
| Phone cannot load the app | Same Wi-Fi for phone and PC; college Wi-Fi often blocks it: use `dev run tunnel` or a hotspot. |
| App on the phone says backend Offline | Run `dev run backend`; allow Python through the Windows firewall when asked. |
| "Port 8081/8000 already in use" | It is already running in another window. Use that one, or stop it with Ctrl+C. |
| Strange bundler / Metro errors | `cd frontend && npx expo start --clear` |
| `npm ci` fails with EPERM / EBUSY | Stop dev servers, close extra terminals, run `dev setup`. Still stuck: delete `frontend/node_modules`. |
| Package version errors | `cd frontend && npx expo install --fix` |
| `Filename too long` (Windows) | `git config --global core.longpaths true` |
| `detected dubious ownership` | `git config --global --add safe.directory <full-path-to-Abhimanyu>` |
| `index.lock: File exists` | Another Git program is running or crashed: `dev rescue` removes a stale lock. |
| SSL certificate problem | Windows: `git config --global http.sslBackend schannel`; or try a mobile hotspot. |
| Offline | Keep working; commits stay on your PC. Run `dev sync` when back online. |
| "Terminate batch job (Y/N)?" after Ctrl+C (Windows) | Answer `Y` or `N`, it does not matter: the dev script has already finished. |
| Anything else | `dev doctor`, then `dev rescue`. Logs are in `.dev/logs/`; share the last lines with a teammate. |

<!-- topic: cheatsheet -->
## 14. Cheat sheet

| I want to... | dev | Git by hand |
|---|---|---|
| set up a new PC | `dev setup` | [section 2.3](#23-manual-setup-if-you-prefer-doing-it-yourself) |
| start working | `dev start` | `git pull --rebase --autostash` |
| run the website | `dev run web` | `cd frontend && npx expo start --web` |
| run on my phone | `dev run phone` | `cd frontend && npx expo start` |
| run the API | `dev run backend` | `cd backend && uv run uvicorn app.main:app --reload` |
| upload my work | `dev finish` | `git add -A && git commit -m "..." && git pull --rebase && git push` |
| only sync | `dev sync` | `git pull --rebase --autostash && git push` |
| see what changed | `dev status` | `git status`, `git log --oneline -10` |
| start a feature branch | `dev branch` | `git switch -c feature/me-x origin/main` |
| undo my last commit | `dev undo` | `git reset --soft HEAD~1` (not pushed) / `git revert HEAD` (pushed) |
| get unstuck | `dev rescue` | `git rebase --abort` / `git merge --abort` |
| check my setup | `dev doctor` | |
| read this guide | `dev help` | |

<!-- topic: firebase -->
## 15. Firebase: sign-in and profiles

### 15.1 How sign-in works

- The app uses **Firebase Authentication** (email and password) and stores each user's onboarding answers in
  **Cloud Firestore** at `users/{uid}`.
- Until the Firebase keys are filled in, it runs in **demo mode**: accounts and profiles are saved only on that
  device or browser (passwords as salted SHA-256 hashes). The log in screen says so. Demo accounts do not move
  to Firebase later; just register again.
- The switch is automatic: when `frontend/.env.local` has the Firebase values, the app uses Firebase.
  `EXPO_PUBLIC_AUTH_MODE=demo` forces demo mode (handy for offline demos).

### 15.2 What to get from the teammate who owns the Firebase project

For the website and the app in Expo Go, **no JSON file is needed**. Ask for:

1. **The web app config.** Firebase console > Project settings (gear) > General > **Your apps**. If there is
   no Web app (`</>` icon) yet, they click **Add app > Web**, name it "Abhimanyu web" (no hosting needed).
   Under **SDK setup and configuration > Config** there are seven values: `apiKey`, `authDomain`,
   `projectId`, `storageBucket`, `messagingSenderId`, `appId` and `measurementId`.
   These identify the project; they are not secret, but keep them in `.env.local` (not in Git).
2. **Email/Password sign-in turned on.** Authentication > Sign-in method > Email/Password > Enable.
3. **Authorized domains.** Authentication > Settings > Authorized domains: `localhost` is there by default;
   add the website's domain when it is deployed.
4. **Cloud Firestore created** (Build > Firestore Database > Create database; region `asia-south1` (Mumbai)
   is closest), with the rules from 15.4 published.
5. Optional: add you as a project member (Project settings > Users and permissions) so you can see users and
   data in the console.

Only later, not for this step:

| File | When it is needed | Where it goes |
|---|---|---|
| `google-services.json` | Android push notifications (FCM) or a native Android build. Register an Android app with package `com.abhimanyu.app` | `frontend/`, referenced from `app.json` (`android.googleServicesFile`) |
| `GoogleService-Info.plist` | iOS push or a native iOS build. Bundle ID `com.abhimanyu.app` | `frontend/`, referenced from `app.json` (`ios.googleServicesFile`) |
| Service account key (`firebase-adminsdk-....json`) | When the FastAPI backend verifies users or sends pushes | **Secret.** Share privately (never in chat or Git), save outside the repo, set `FIREBASE_CREDENTIALS_PATH` in `backend/.env` |

### 15.3 Put the values in

`dev setup` and `dev start` create `frontend/.env.local` from `frontend/.env.example`. Fill it in:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

Then stop the app (Ctrl+C) and run `dev run web` again: Expo reads `.env.local` only at start. The demo
mode note disappears from the log in screen. Every teammate needs the same values in their own `.env.local`
(shared privately by the teammate who owns the Firebase project, never committed to Git).

### 15.4 Firestore security rules

The rules and index config are versioned in the repository at `firestore.rules`, `firestore.indexes.json`,
`firebase.json` and `.firebaserc`:

- Everything is denied by default.
- For `users/{uid}`, only the signed-in owner (`request.auth.uid == uid`) can read, create or update their
  own document, with only the keys `profile`, `email` and `updatedAt` (`updatedAt == request.time`,
  `email` matching the auth token). Client-side deletes are disallowed (`allow delete: if false`).

To deploy rule or index changes without a global Firebase CLI install, run from the repository root:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

For isolated local Auth and Firestore rule checks, start the emulators with a demo project ID:

```bash
npx firebase-tools emulators:start --only auth,firestore --project demo-abhimanyu
```

If Firestore is not set up yet, sign-in still works and profiles stay on the device (a warning appears in the
console). `EXPO_PUBLIC_FIREBASE_USE_FIRESTORE=false` turns the Firestore copy off.

### 15.5 Sign-in and profile persistence

- On web, Firebase Auth uses its default browser persistence (IndexedDB, with browser storage fallbacks) so a
  signed-in session survives reloads. On Android and iOS, it uses Firebase's React Native persistence backed by
  AsyncStorage.
- The app also keeps a per-user profile copy through AsyncStorage (local storage on web). When Firestore is
  enabled, it reads and writes `users/{uid}`. If a cloud read or write fails, the local profile remains available
  and the failure is logged.
- On sign-in, the profile copy with the newer `updatedAt` is used. This allows a newer local copy to remain
  available after an offline or failed cloud write.

### 15.6 What onboarding stores

`users/{uid}` holds `{ profile, email, updatedAt }`. `profile` follows `docs/DATA_SCHEMA.md` and
`PATCH /auth/me` in `docs/API_SPECIFICATION.md`: role, experience and explanation style, risk tolerance,
horizon, goals, exchanges, sectors and market caps, watchlist symbols, how holdings will be added, red-flag
domains, `notification_prefs` (channels, minimum severity, digest, quiet hours with timezone, optional WhatsApp
number), report language and number format, and consents with timestamps and a consent version. The code is in
`frontend/src/lib/profile/types.ts`.

