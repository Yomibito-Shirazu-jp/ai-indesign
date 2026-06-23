# 社員向けセットアップ（ローカル方式）— Ai-inDesign MCP

各自のPCで InDesign を Claude（MCP）から操作できるようにする手順です。
**クラウド不要・署名不要**。実際の導入でハマった点も「トラブルシュート」にまとめています。

## 必要なもの
- Adobe **InDesign 2023以降**（UXP対応）
- **Node.js 18以降**（https://nodejs.org）
- **Adobe UXP Developer Tool**（Creative Cloud → すべてのアプリ → 検索「UXP」→ 無料インストール）
- **Claude Desktop**（または Claude Code）

## 手順

### 1. リポジトリを用意
```bash
git clone https://github.com/Yomibito-Shirazu-jp/ai-indesign.git
cd ai-indesign
npm install
```

### 2. MCPサーバを Claude に登録（ローカル stdio）
リポジトリ直下で：
```bash
node setup.mjs
```
これで Claude の設定に `indesign`（stdio）が追加されます。手動で書く場合は MCP クライアント設定に：
```json
{ "mcpServers": { "indesign": {
  "command": "node",
  "args": ["<リポジトリの絶対パス>/src/index.js"]
} } }
```
> 起動時に `src/index.js` が **ブリッジを 127.0.0.1:49300 に自動起動**します（別途起動は不要）。

### 3. UXP プラグインを読み込む（署名不要）
1. **UXP Developer Tool** を起動
2. **Add Plugin** → `plugin-local/manifest.json` を選択
3. 一覧の **「Ai-inDesign (Local) / AI組版(ローカル)」** の行を **Load**
> `.ccx` のダブルクリック導入は **Adobe 署名済みのみ**可（自前ビルドは **error -4**）。社内配布は必ずこの UDT 読み込みで。

### 4. InDesign でパネルを開く
- InDesign を起動 → メニュー **プラグイン**（または ウィンドウ→エクステンション）→ **「AI組版(ローカル)」** を開く
- 表示が **🔌接続中… → ✅接続OK（Connected to bridge ✓）** になればOK
- 最初 🔴 でも、**Claude を起動**して MCP サーバ（＝ブリッジ）が立てば、数秒で自動的に 🟢（3秒ごとに自動再接続）

### 5. 動作確認
Claude で「InDesignのドキュメント情報を取得して」等。`check_bridge_status` が ✅ になれば成功。

---

## トラブルシュート（実際にあった事例）
| 症状 | 原因・対処 |
|---|---|
| パネルが ❌ のまま | 開いているのが**別の（旧/hub）パネル**。正しいのは「AI組版(ローカル)」。接続先は **`ws://127.0.0.1:49300`** |
| 旧プラグインで繋がらない | 旧版は **port 3001** を見ている。**49300** に直す（`plugin/index.js` の WebSocket URL） |
| `.ccx` が **error -4** | 未署名 .ccx はダブルクリック導入不可。**UDT で読み込む** |
| UDT で「same ID already exists」 | 既存の同ID登録を **Remove** してから Add（`plugin-local` の id は `com.bp.aiindesign.local`） |
| 接続状態を確認したい | ブラウザ/コマンドで `http://127.0.0.1:49300/status` → `{"connected":true}` なら接続済み |
| パネルを Load したのに繋がらない | UDT の **Load だけでは未接続**。InDesign でパネル（ウィンドウ）を**実際に開く**と接続コードが走る |

## アーキテクチャ（ローカル方式）
```
InDesign(UXPプラグイン) --ws--> ブリッジ(127.0.0.1:49300) <-- MCPサーバ(node src/index.js) <-- Claude
```
MCPサーバが起動時にブリッジを自動で立て、プラグインがそこへ繋ぎます。クラウド（mcp.b-p.co.jp / hub）は経由しません。
