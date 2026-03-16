@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   AutoDTP AI Agent - 起動中...
echo ========================================
echo.

REM 初回のみ: パッケージインストール
if not exist "bridge\node_modules" (
    echo [1/2] 初回セットアップ中（数分かかります）...
    cd bridge
    call npm install
    cd ..
    echo.
)

echo [OK] ブリッジサーバーを起動します...
echo [OK] ブラウザが自動で開きます
echo.
echo  ※ このウィンドウは閉じないでください
echo  ※ 終了するにはこのウィンドウを閉じてください
echo ========================================
echo.

cd bridge
node server.js
pause
