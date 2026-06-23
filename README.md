# Ai-inDesign — Adobe DTP自動化プラグイン for Claude Desktop

**Claude Desktopから自然な日本語でInDesign・Illustrator・Photoshopを操作できるMCPプラグインです。**

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

### 方法2: ローカルにクローンして追加

1. このリポジトリを `git clone`
2. Claude Desktop → 設定 → プラグインを追加 → **ローカルフォルダ／ファイルを選択**
3. クローンしたフォルダ（または各自で `.dxt` にパッケージしたもの）を指定

> 注: 配布用の `.zip` / `.ccx` / `.dxt` はリポジトリには含まれません（`.gitignore` 対象）。
> 現時点で GitHub Releases の配布物は用意していないため、上記の「GitHubから同期」または
> ローカルクローンでの導入を推奨します。

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

UXPプラグインのソースは `plugin/` フォルダに含まれています。  
これを `.ccx` にパッケージして InDesign にインストールすると、  
パネル内に接続状態（🟢 接続中 / 🔴 未接続）が表示されます。

> 注: `.ccx` はリポジトリには同梱されません（`.gitignore` 対象）。
> UXP Developer Tool 等で `plugin/` から各自パッケージしてください。

---

## 📋 必要環境

- **Claude Desktop** (Windows / macOS)
- **Adobe InDesign** 2023以降（UXP対応）
- **Node.js** 18以降
- Illustrator / Photoshop は任意（ブリッジ機能に必要）

---

## 🏷️ 命名・識別子について

本プロジェクトの正式名称（プロダクト名）は **「Ai-inDesign」** です。
配布物・ビルド・各種設定の都合上、以下のように複数の内部識別子が併存していますが、いずれも同一プロジェクトを指すものであり、不具合ではありません。

| 種別 | 値 | 定義場所 |
|------|-----|---------|
| プロダクト名（正式名称） | `Ai-inDesign` | README / manifest |
| npm パッケージ名 | `indesign-mcp-server` | `package.json` の `name` |
| DXT マニフェスト名 | `ai-indesign` | `manifest.json` の `name` |
| Electron アプリ ID | `com.yomibitoshirazujp.ai-indesign` | `package.json` の `build.appId` |
| UXP プラグイン ID | `com.bunshodo.ai-indesign` | `plugin/manifest.json` の `id` |

著者表記は `Yomibito-Shirazu-jp`（GitHub Organization）／文唱堂印刷株式会社（発行元）です。

## ⚠️ 注意事項

本ソフトウェアは文唱堂印刷株式会社の社内ツールです。無断複製・再配布・販売を禁止します。

---

*Ai-inDesign は Adobe Systems とは無関係のプロジェクトです。*