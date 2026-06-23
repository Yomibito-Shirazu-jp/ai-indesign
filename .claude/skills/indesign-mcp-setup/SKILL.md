---
name: indesign-mcp-setup
description: Ai-inDesign の MCP 接続セットアップとトラブルシュート。InDesign を Claude(MCP)から操作したい／パネルが繋がらない／"indesign_disconnected"／"ブリッジ"／"Bridge Panel"／port 49300／.ccx が error -4／UXP プラグインが Load できない等のときに使う。社員のローカル導入(git clone方式)を支援する。
---

# Ai-inDesign MCP 接続セットアップ＆トラブルシュート

InDesign を Claude(MCP) から操作するための接続を作る／直すスキル。**ローカル方式**（クラウド非経由）が確実。

## アーキテクチャ（ローカル方式）
```
InDesign(UXPプラグイン) --WebSocket--> ブリッジ(127.0.0.1:49300) <-- MCPサーバ(node src/index.js) <-- Claude
```
- MCPサーバ(`src/index.js`)が起動時に**ブリッジを 127.0.0.1:49300 に自動 fork**する（`bridge/server.js`）。
- UXPプラグインは **`ws://127.0.0.1:49300`** に接続。`/status` が `{"connected":true}` で接続済み。
- クラウド(`mcp.b-p.co.jp` / `mcp-hub-dashboard…run.app`)は別系統。混在させると割れる（下記）。

## セットアップ手順（社員/各PC）
1. `git clone` → `npm install`
2. Claude設定に MCPサーバを stdio 登録：`node setup.mjs`（または手動で `{"command":"node","args":["<repo>/src/index.js"]}`）
3. **UXP Developer Tool** → Add Plugin → `plugin-local/manifest.json` → **Load**
4. InDesign で **「AI組版(ローカル)」パネルを開く**（開いた瞬間に自動接続）
5. Claudeを起動 → 数秒で 🟢。`check_bridge_status` が ✅ なら成功

## トラブルシュート（決定木）
1. **`check_bridge_status` がオフラインなのにツールは呼べる**
   → ホスト型(`mcp.b-p.co.jp`)に繋いでいる。`curl https://mcp.b-p.co.jp/` の `status` を見る。ローカル方式に切替推奨。
2. **`/status` が `connected:false`（＝プラグイン未接続）**
   - プラグインの接続先ポートを確認。**旧版は 3001、現行は 49300**。`plugin/index.js` の `new WebSocket("ws://127.0.0.1:____")` を 49300 に直す。
   - 開いているパネルが正しいか。`Adobe UXP Developer Tool/plugins_workspace.json` でロード中の manifest パスを確認。"Bridge Panel"(旧 `com.ads.indesign-bridge`) や "MCP Hub"(hub版) は別物。
   - UDT の **Load だけでは未接続**。InDesign でパネル(ウィンドウ)を実際に開くと接続コードが走る。
3. **`.ccx` ダブルクリックが error -4**
   → 未署名 .ccx は不可（Adobe 署名済みのみ）。**UDT で読み込む**。社内配布もUDT。
4. **UDT「same ID already exists」**
   → 同 ID の既存登録を Remove、または manifest の `id` をユニークに（例 `com.bp.aiindesign.local`）。
5. **クラウドで `indesign_disconnected`（参考）**
   → プラグインは hub(`mcp-hub-dashboard…run.app`)に、Claudeは `mcp.b-p.co.jp` に繋がって**割れている**。hub に MCP `/mcp` は無い。クラウド一本化は Cloud Run の `BRIDGE_URL` をプラグイン接続先へ向ける必要（サーバ側作業）。
6. **応急策：旧プラグインを無改修で繋ぐ**
   → 旧版が 3001 を見ているなら、`127.0.0.1:3001 -> 49300` の WebSocket プロキシを立てれば再接続(3秒間隔)で即つながる。

## 確認コマンド
- 接続: `curl http://127.0.0.1:49300/status` → `{"connected":true}`
- ポート: `netstat -ano | findstr 49300`
- MCP越し: `get_document_info` / `check_bridge_status`

## メモ
- `.indd` はバイナリで外部解析不可。スタイル確認は IDML 書き出し or 接続後 `get_document_styles`。
- 接続後の組版作業は別スキル（流用組版）参照。
