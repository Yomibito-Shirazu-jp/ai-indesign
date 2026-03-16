@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Ai-inDesign セットアップ & 起動

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║          Ai-inDesign  オールインワン起動ツール               ║
echo ║          文唱堂印刷株式会社                                  ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM  STEP 1: Node.js の確認
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [1/5] Node.js を確認しています...

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════╗
    echo ║  ❌ エラー: Node.js がインストールされていません          ║
    echo ╠══════════════════════════════════════════════════════════╣
    echo ║                                                          ║
    echo ║  以下のURLからNode.jsをダウンロードしてインストール       ║
    echo ║  してください（LTS版を推奨）：                           ║
    echo ║                                                          ║
    echo ║  👉 https://nodejs.org/ja/                               ║
    echo ║                                                          ║
    echo ║  インストール後、このバッチファイルを再実行してください。 ║
    echo ║                                                          ║
    echo ╚══════════════════════════════════════════════════════════╝
    echo.
    echo ブラウザでダウンロードページを開きます...
    start https://nodejs.org/ja/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
echo       ✅ Node.js %NODE_VERSION% が見つかりました
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM  STEP 2: ポート確認
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [2/5] ポート 3000, 3001 を確認しています...

set PORT_ERROR=0

netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       ⚠️  ポート 3000 が既に使用されています。
    echo          既に起動中のサーバーがある場合は閉じてください。
    set PORT_ERROR=1
)

netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       ⚠️  ポート 3001 が既に使用されています。
    echo          既に起動中のサーバーがある場合は閉じてください。
    set PORT_ERROR=1
)

if %PORT_ERROR% EQU 1 (
    echo.
    echo       ポートが使用中です。続行しますか？
    echo       （既にサーバーが起動中なら、このウィンドウは閉じてOKです）
    echo.
    choice /C YN /M "続行しますか？ (Y=はい / N=いいえ)"
    if errorlevel 2 (
        echo 終了します。
        pause
        exit /b 1
    )
) else (
    echo       ✅ ポート 3000, 3001 は利用可能です
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM  STEP 3: パッケージインストール
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [3/5] パッケージを確認しています...

if not exist "node_modules" (
    echo       初回セットアップ: ルートパッケージをインストール中...
    call npm install --no-fund --no-audit 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo       ❌ npm install に失敗しました。
        echo       ネットワーク接続を確認してください。
        echo       プロキシ環境の場合は管理者にお問い合わせください。
        echo.
        pause
        exit /b 1
    )
    echo       ✅ ルートパッケージのインストール完了
) else (
    echo       ✅ ルートパッケージは既にインストール済み
)

if not exist "bridge\node_modules" (
    echo       初回セットアップ: ブリッジパッケージをインストール中...
    pushd bridge
    call npm install --no-fund --no-audit 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo       ❌ bridge の npm install に失敗しました。
        echo       ネットワーク接続を確認してください。
        echo.
        popd
        pause
        exit /b 1
    )
    popd
    echo       ✅ ブリッジパッケージのインストール完了
) else (
    echo       ✅ ブリッジパッケージは既にインストール済み
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM  STEP 4: Claude Desktop 自動設定
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [4/5] Claude Desktop の設定を確認しています...

set CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json

if exist "%APPDATA%\Claude" (
    REM Claude Desktop がインストールされている
    REM setup.mjs で設定を自動追加
    node setup.mjs >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo       ✅ Claude Desktop にMCPサーバーを自動登録しました
        echo          設定ファイル: %CLAUDE_CONFIG%
    ) else (
        echo       ⚠️  Claude Desktop の設定更新に失敗しました（手動設定が必要かもしれません）
    )
) else (
    echo       ℹ️  Claude Desktop が見つかりませんでした（未インストール？）
    echo          Claude Desktop を使わない場合は問題ありません。
    echo          VS Code + Roo Code / Cursor 等からもMCP接続できます。
)

REM Claude Desktopが起動中か確認
tasklist /FI "IMAGENAME eq Claude.exe" 2>nul | findstr /I "Claude.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo       ⚠️  Claude Desktop が起動中です。
    echo          MCP設定を反映するには、Claude Desktop を
    echo          一度完全に終了（タスクトレイからQuit）してから
    echo          再起動してください。
)
echo.

REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REM  STEP 5: ブリッジサーバー起動
REM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [5/5] ブリッジサーバーを起動します...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  ✅ セットアップ完了！ サーバーを起動します                  ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  📋 次にやること:                                           ║
echo ║                                                              ║
echo ║  1. InDesign を起動                                         ║
echo ║  2. InDesign内の「ウィンドウ → プラグイン → Bridge Panel」  ║
echo ║     を開く（表示されない場合はCCXファイルをインストール）    ║
echo ║  3. Claude Desktop を再起動                                 ║
echo ║  4. Claude Desktop のチャットでInDesignに指示！              ║
echo ║                                                              ║
echo ║  ※ このウィンドウは閉じないでください                       ║
echo ║  ※ 終了するにはこのウィンドウを閉じてください               ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd bridge
node server.js

REM サーバーが異常終了した場合
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  ❌ サーバーが停止しました                                   ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  よくある原因:                                               ║
echo ║  • ポート 3000 または 3001 が既に使用中                     ║
echo ║  • ファイアウォールがブロックしている                       ║
echo ║  • パッケージが壊れている → bridge\node_modules を          ║
echo ║    削除して再実行してください                                ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
