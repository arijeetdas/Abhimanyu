@echo off
rem ======================================================================
rem  Abhimanyu team toolkit - Windows launcher
rem
rem    abhi            interactive menu (double-clicking this file works too)
rem    abhi start      sync with the team, update dependencies, run the app
rem    abhi finish     commit your work and push it to GitHub
rem    abhi help       every command + manual steps
rem
rem  First time on a new PC: put this file in an empty "Abhimanyu" folder
rem  and run it. It installs Git + Node.js if needed (winget), downloads the
rem  project, then hands over to scripts\abhi\index.mjs which does the rest.
rem ======================================================================
setlocal
chcp 65001 >nul 2>&1
set "ABHI_ROOT=%~dp0"
set "ABHI_REPO_URL=https://github.com/arijeetdas/Abhimanyu.git"
cd /d "%ABHI_ROOT%"

where git >nul 2>&1 || call :install_tool Git.Git "Git" "C:\Program Files\Git\cmd"
where git >nul 2>&1 || goto :no_git
where node >nul 2>&1 || call :install_tool OpenJS.NodeJS.LTS "Node.js LTS" "C:\Program Files\nodejs"
where node >nul 2>&1 || goto :no_node

if not exist "%ABHI_ROOT%scripts\abhi\index.mjs" (
  call :bootstrap
  if errorlevel 1 goto :boot_failed
)

rem Keep this on ONE line: Windows re-reads .cmd files while running, and a
rem sync may update this very file.
node "%ABHI_ROOT%scripts\abhi\index.mjs" %* & exit /b

:install_tool
echo.
echo   [abhi] %~2 is not installed. Installing it with winget...
where winget >nul 2>&1 || (echo   [abhi] winget is not available on this PC. & exit /b 1)
winget install --id %~1 -e --source winget --accept-source-agreements --accept-package-agreements
if exist "%~3" set "PATH=%~3;%PATH%"
exit /b 0

:bootstrap
echo.
echo   [abhi] First run: downloading the project from GitHub into
echo          %ABHI_ROOT%
set "ABHI_OTHER="
for /f "delims=" %%F in ('dir /b /a 2^>nul ^| findstr /v /i /x "abhi.cmd abhi .git"') do set "ABHI_OTHER=1"
if defined ABHI_OTHER (
  echo.
  echo   [abhi] This folder is not empty. Files with the same names as project
  echo          files will be replaced by the GitHub version.
  set /p "ABHI_OK=         Continue? (y/N) "
)
if defined ABHI_OTHER if /i not "%ABHI_OK%"=="y" exit /b 1
if not exist ".git" git init -q || exit /b 1
git symbolic-ref HEAD refs/heads/main
git remote get-url origin >nul 2>&1 || git remote add origin %ABHI_REPO_URL%
git fetch origin main || exit /b 1
git reset -q origin/main || exit /b 1
git checkout -- . ":(exclude)abhi.cmd" || exit /b 1
git branch -q --set-upstream-to=origin/main main
echo   [abhi] Project downloaded.
exit /b 0

:no_git
echo.
echo   [abhi] Git is required. Install it, then run abhi again:
echo            winget install --id Git.Git -e
echo          or download it from https://git-scm.com/download/win
echo          (then CLOSE this window and open a new terminal)
goto :fail

:no_node
echo.
echo   [abhi] Node.js is required. Install the LTS version, then run abhi again:
echo            winget install --id OpenJS.NodeJS.LTS -e
echo          or download it from https://nodejs.org
echo          (then CLOSE this window and open a new terminal)
goto :fail

:boot_failed
echo.
echo   [abhi] Could not download the project. Common fixes:
echo          - Check your internet connection.
echo          - Accept the collaborator invite: https://github.com/arijeetdas/Abhimanyu/invitations
echo          - Or clone by hand:  git clone %ABHI_REPO_URL%
goto :fail

:fail
echo.
pause
exit /b 1
