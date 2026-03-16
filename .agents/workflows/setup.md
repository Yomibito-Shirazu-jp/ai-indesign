---
description: 社員向け Ai-inDesign セットアップ手順（git clone → AIに1プロンプトで完了）
---

# Ai-inDesign セットアップ手順

## 社員がやること（3ステップだけ）

### ステップ1: Git Clone
```
git clone https://github.com/Yomibito-Shirazu-jp/ai-indesign.git
```

### ステップ2: IDEで開く
クローンしたフォルダをIDE（Cursor / VS Code + Roo Code / Windsurf 等）で開く

### ステップ3: AIチャットに以下のプロンプトを貼り付けて実行

---

## コピペ用プロンプト

```
Ai-inDesignのセットアップを行ってください。以下の手順を順番に実行してください：

1. Node.js がインストールされているか確認（`node --version`）。なければインストール方法を案内して止まる。

2. ルートディレクトリで `npm install` を実行

3. bridge ディレクトリで `npm install` を実行

4. `node setup.mjs` を実行して Claude Desktop の設定を自動追加

5. InDesign用プラグイン（CCXファイル）がplugin/フォルダにあるか確認。
   Ai-inDesign.ccx があればユーザーに「このファイルをダブルクリックしてInDesignにインストールしてください」と案内。
   なければ「UXP Developer Toolからplugin/フォルダをロードしてください」と案内。

6. ブリッジサーバーを起動（bridge ディレクトリで `node server.js`）

7. 最後に以下を案内：
   - Claude Desktop を再起動してください（タスクトレイ→右クリック→Quit→再度開く）
   - InDesign を起動して「ウィンドウ」→「プラグイン」→「Bridge Panel」を開く
   - ブラウザで http://localhost:3000 を開いてステータスを確認
   - Claude Desktop で「InDesignでA4の新しいドキュメントを作って」と話しかけてテスト

すべて日本語で案内してください。エラーが出たら原因と解決方法を教えてください。
```

---

## 補足

- このプロンプトは Cursor / VS Code + Roo Code / Windsurf / Cline 等、ターミナル実行ができるAI IDE なら何でも使えます
- Claude Desktop が未インストールの場合は https://claude.ai/download からインストールを案内
- Node.js が未インストールの場合は https://nodejs.org/ja/ からLTS版のインストールを案内
