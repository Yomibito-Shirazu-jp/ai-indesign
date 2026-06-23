# Ai-inDesign ローカル接続プラグイン (UXP)

社員配布用。**自分のPC内のブリッジ (`ws://127.0.0.1:49300`) に接続**する版です。
クラウド(hub/mcp.b-p.co.jp)を経由しないので、MCPサーバをローカル(stdio)で動かす構成と一緒に使います。

## 導入（UXP Developer Tool ＝署名不要）
1. **UXP Developer Tool** を起動（Creative Cloud からインストール可）
2. **Add Plugin** → この `plugin-local/manifest.json` を選択
3. 一覧の「Ai-inDesign (Local)」を **Load**
4. InDesign にパネルが出る（最初は🔴。ローカルMCPサーバ起動でブリッジ49300が立つと🟢）

> `.ccx` のダブルクリック導入は **Adobe署名済みのみ**可（自前ビルドは error -4）。社内配布は上記UDT読み込みで。

## MCPクライアント設定（例: Claude）
```json
{ "mcpServers": { "indesign": { "type": "stdio", "command": "node",
  "args": ["<repo>/src/index.js"] } } }
```
起動時に `src/index.js` がブリッジを 127.0.0.1:49300 に自動起動します。
