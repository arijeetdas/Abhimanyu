@echo off
rem ======================================================================
rem  Abhimanyu team toolkit - Windows launcher
rem
rem    dev            interactive menu (double-clicking this file works too)
rem    dev start      sync with the team, update dependencies, run the app
rem    dev finish     commit your work and push it to GitHub
rem    dev help       every command + manual steps
rem
rem  First time on a new PC: put this file in an empty "Abhimanyu" folder
rem  and run it. It installs Git + Node.js if needed (winget), downloads the
rem  project, then hands over to scripts\dev\index.mjs which does the rest.
rem ======================================================================
setlocal
chcp 65001 >nul 2>&1
set "DEV_ROOT=%~dp0"
set "DEV_REPO_URL=https://github.com/arijeetdas/Abhimanyu.git"
cd /d "%DEV_ROOT%"

where git >nul 2>&1 || call :install_tool Git.Git "Git" "C:\Program Files\Git\cmd"
where git >nul 2>&1 || goto :no_git
where node >nul 2>&1 || call :install_tool OpenJS.NodeJS.LTS "Node.js LTS" "C:\Program Files\nodejs"
where node >nul 2>&1 || goto :no_node

if not exist "%DEV_ROOT%scripts\dev\index.mjs" (
  call :bootstrap
  if errorlevel 1 goto :boot_failed
)

rem Keep this on ONE line: Windows re-reads .cmd files while running, and a
rem sync may update this very file.
node "%DEV_ROOT%scripts\dev\index.mjs" %* & exit /b

:install_tool
echo.
echo   [dev] %~2 is not installed. Installing it with winget...
where winget >nul 2>&1 || (echo   [dev] winget is not available on this PC. & exit /b 1)
winget install --id %~1 -e --source winget --accept-source-agreements --accept-package-agreements
if exist "%~3" set "PATH=%~3;%PATH%"
exit /b 0

:bootstrap
echo.
echo   [dev] First run: downloading the project from GitHub into
echo          %DEV_ROOT%
set "DEV_OTHER="
for /f "delims=" %%F in ('dir /b /a 2^>nul ^| findstr /v /i /x "dev.cmd dev .git"') do set "DEV_OTHER=1"
if defined DEV_OTHER (
  echo.
  echo   [dev] This folder is not empty. Files with the same names as project
  echo          files will be replaced by the GitHub version.
  set /p "DEV_OK=         Continue? (y/N) "
)
if defined DEV_OTHER if /i not "%DEV_OK%"=="y" exit /b 1
if not exist ".git" git init -q || exit /b 1
git symbolic-ref HEAD refs/heads/main
git remote get-url origin >nul 2>&1 || git remote add origin %DEV_REPO_URL%
git fetch origin main || exit /b 1
git reset -q origin/main || exit /b 1
git checkout -- . ":(exclude)dev.cmd" || exit /b 1
git branch -q --set-upstream-to=origin/main main
echo   [dev] Project downloaded.
exit /b 0

:no_git
echo.
echo   [dev] Git is required. Install it, then run dev again:
echo            winget install --id Git.Git -e
echo          or download it from https://git-scm.com/download/win
echo          (then CLOSE this window and open a new terminal)
goto :fail

:no_node
echo.
echo   [dev] Node.js is required. Install the LTS version, then run dev again:
echo            winget install --id OpenJS.NodeJS.LTS -e
echo          or download it from https://nodejs.org
echo          (then CLOSE this window and open a new terminal)
goto :fail

:boot_failed
echo.
echo   [dev] Could not download the project. Common fixes:
echo          - Check your internet connection.
echo          - Accept the collaborator invite: https://github.com/arijeetdas/Abhimanyu/invitations
echo          - Or clone by hand:  git clone %DEV_REPO_URL%
goto :fail

:fail
echo.
pause
exit /b 1
