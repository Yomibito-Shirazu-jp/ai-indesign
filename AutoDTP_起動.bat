@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Ai-inDesign Setup

echo.
echo  ===================================
echo   Ai-inDesign - Adobe DTP Automation
echo  ===================================
echo.

REM Node.js check
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found.
    start https://nodejs.org/ja/
    pause
    exit /b 1
)

REM Kill existing processes on port 49300
echo  [1/4] Port cleanup ...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":49300 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo         OK

REM npm install
echo  [2/4] Package check ...
if not exist "bridge\node_modules" (
    echo         Installing ...
    pushd bridge
    call npm install --no-fund --no-audit >nul 2>&1
    popd
)
if not exist "node_modules" (
    call npm install --no-fund --no-audit >nul 2>&1
)
echo         OK

REM Claude Desktop
echo  [3/4] Claude Desktop ...
tasklist /FI "IMAGENAME eq Claude.exe" 2>nul | findstr /I "Claude.exe" >nul
if %ERRORLEVEL% EQU 0 (
    taskkill /IM Claude.exe /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)
node setup.mjs >nul 2>&1
start shell:AppsFolder\Claude_pzs8sxrjxfjjc!Claude
echo         OK
timeout /t 3 /nobreak >nul

REM Bridge server
echo  [4/4] Starting Bridge on port 49300 ...
echo.
echo  ===================================
echo   Bridge running. Press Ctrl+C to stop.
echo  ===================================
echo.

node bridge/server.js
