@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Ai-inDesign

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║        Ai-inDesign  ワンクリックセットアップ         ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM ── Node.js チェック ──
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js が見つかりません。https://nodejs.org/ からインストールしてください。
    start https://nodejs.org/ja/
    pause & exit /b 1
)

REM ── 既存プロセスをポートごとクリーンアップ ──
echo [1/4] クリーンアップ中...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":3000 \|:3001 \|:3002 " ^| findstr "LISTENING"') do (
    if not "%%p"=="" taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

REM ── npm install (初回のみ) ──
echo [2/4] パッケージ確認中...
if not exist "bridge\node_modules" (
    echo       初回インストール中...
    pushd bridge & call npm install --no-fund --no-audit >nul 2>&1 & popd
)
if not exist "node_modules" (
    call npm install --no-fund --no-audit >nul 2>&1
)

REM ── Claude Desktop 設定 & 再起動 ──
echo [3/4] Claude Desktop を設定中...
REM 必ず先にKill（起動中に書くと設定が上書きされる）
tasklist /FI "IMAGENAME eq Claude.exe" 2>nul | findstr /I "Claude.exe" >nul
if %ERRORLEVEL% EQU 0 (
    taskkill /IM Claude.exe /F >nul 2>&1
    timeout /t 2 /nobreak >nul
)
REM Claude完全停止後に設定書き込み
node setup.mjs >nul 2>&1
REM 設定確認してからClaude起動
start shell:AppsFolder\Claude_pzs8sxrjxfjjc!Claude
echo       Claude Desktop を起動しました
timeout /t 3 /nobreak >nul

REM ── Bridge をバックグラウンドで起動 ──
echo [4/4] Bridgeサーバーを起動中...
start "Ai-inDesign Bridge" /min cmd /c "cd /d "%~dp0bridge" && :loop && node server.js && timeout /t 3 /nobreak >nul && goto loop"
timeout /t 3 /nobreak >nul

REM ── デモ送信（トラトラトラ）──
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  📡 デモ送信: トラトラトラ
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
node test-broadcast.js

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  ✅ セットアップ完了！
echo.
echo  InDesign: ウィンドウ→プラグイン→Ai-inDesign
echo            緑ランプ = 接続OK
echo.
echo  あとは Claude Desktop から指示するだけ
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
pause
