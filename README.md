# Ai-inDesign — Adobe DTP自動化プラグイン for Claude Desktop

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Claude Desktopから自然な日本語でInDesign・Illustrator・Photoshopを操作できる、無料のMCPプラグインです。**

---

## ✨ できること

| カテゴリ | 主なツール |
|---------|-----------|
| 📄 ドキュメント管理 | 作成・開く・保存・書き出し |
| 📐 ページ・レイアウト | ページ追加・削除・マスター適用 |
| ✍️ テキスト・組版 | 流し込み・スタイル適用・検索置換 |
| 🇯🇵 日本語DTP | 禁則処理・縦書き・約物・字詰め・縦中横 |
| 🔍 校閲・校正 | 表記揺れ・常用漢字・センシティブワード |
| ✅ 入稿前チェック | フォント・リンク・解像度・塗り足し・PDF/X |
| 📚 ブック管理 | 複数ドキュメントのブック生成・同期 |
| 🎨 グラフィック | 図形・画像配置・スタイル管理 |
| 📡 ブリッジ管理 | Illustrator・Photoshopへのコマンド送信 |

**合計170以上のツール**

---

## 🚀 インストール（ワンクリック）

### 方法1: Claude Desktop → GitHubから同期

1. Claude Desktop を開く
2. 設定 → **プラグインを追加**
3. **「GitHubから同期」** を選択
4. このURLを入力：
   ```
   https://github.com/Yomibito-Shirazu-jp/ai-indesign
   ```
5. 完了！

### 方法2: .zip をダウンロードして追加

1. [Releases](../../releases) から最新版をダウンロード
2. Claude Desktop → 設定 → プラグインを追加 → **ファイルをアップロード**
3. ダウンロードした `.zip` を選択

---

## 💬 使い方（例）

Claude Desktopのチャットで日本語で指示するだけ：

```
A4縦のドキュメントを作って、「こんにちは」というテキストフレームを配置して
```
```
全ページの禁則処理を確認して修正して
```
```
入稿前チェックをして問題点をまとめて
```
```
このドキュメントをPDF/X-1aで書き出して
```

---

## 🔧 UXPプラグイン（InDesign内の接続インジケーター）

`01_事前にダブルクリックしてインストール.ccx` を InDesign にインストールすると、  
パネル内に接続状態（🟢 接続中 / 🔴 未接続）が表示されます。

---

## 📋 必要環境

- **Claude Desktop** (Windows / macOS)
- **Adobe InDesign** 2023以降（UXP対応）
- **Node.js** 18以降
- Illustrator / Photoshop は任意（ブリッジ機能に必要）

---

## 📜 ライセンス

MIT License — 商用・社内利用・改変・再配布すべて無料

---

*Ai-inDesign は Adobe Systems とは無関係の独立したオープンソースプロジェクトです。*