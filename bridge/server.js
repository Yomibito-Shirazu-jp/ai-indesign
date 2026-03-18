const { WebSocketServer } = require('ws');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { AiChatSession } = require('./ai-chat');

// ─── .env 読み込み ───
(function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.replace(/#.*$/, '').trim().match(/^([A-Z_]+)\s*=\s*(.+)/);
        if (m) process.env[m[1]] = m[2].trim();
    }
})();

// ─── In-memory operation log (for Dimension Hub) ───
const opLog = [];
const MAX_LOG = 500;

function pushLog(level, message) {
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8);
    opLog.push({ time: ts, level, message });
    if (opLog.length > MAX_LOG) opLog.shift();
}

const HTTP_PORT = parseInt(process.env.INDESIGN_PORT || '49300');
const TIMEOUT_MS = 30000;

const app = express();
app.use(express.json());

// セットアップ＆チュートリアルUI（メインページ）
app.use(express.static(path.join(__dirname, 'public')));

// AutoDTP ダッシュボードUI配信（app/ui ビルド済み）
const uiPath = path.join(__dirname, '..', 'app', 'ui');
if (require('fs').existsSync(uiPath)) {
    app.use('/app', express.static(uiPath));
    console.log('[Bridge] Serving AutoDTP UI from', uiPath, '(at /app)');
}

let pluginSocket = null;
const pending = new Map(); // id -> { resolve, reject, timer }

// ─── AI Chat Sessions (per-connection) ───
let aiSession = null;
let geminiApiKey = process.env.GEMINI_API_KEY || '';

// InDesignコード実行ヘルパー（AI用）
function executeInDesignCode(code) {
    return new Promise((resolve, reject) => {
        if (!pluginSocket) {
            return reject(new Error('InDesignプラグインが接続されていません'));
        }

        const id = uuidv4();
        const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error('InDesign実行タイムアウト（30秒）'));
        }, TIMEOUT_MS);

        pending.set(id, { resolve, reject, timer });
        pluginSocket.send(JSON.stringify({ type: 'execute', id, code }));
    });
}




// ─── AIチャット処理 ───
async function handleChatMessage(ws, msg) {
    const userText = msg.message;
    console.log(`[AI Chat] User: ${userText.slice(0, 100)}`);

    if (!geminiApiKey) {
        ws.send(JSON.stringify({
            type: 'ai_reply',
            message: '⚠️ Gemini APIキーが設定されていません。\n\n設定方法：\n1. パネル上部の⚙️をタップ\n2. AIプロバイダーで「Gemini」を選択\n3. APIキーを入力\n\n※ APIキーは https://aistudio.google.com/ から無料で取得できます。'
        }));
        return;
    }

    // セッションがなければ作成
    if (!aiSession) {
        aiSession = new AiChatSession(geminiApiKey, executeInDesignCode);
    }

    // ストリーム的にツール使用状況を通知
    const onStream = (event) => {
        if (event.type === 'tool_use') {
            ws.send(JSON.stringify({
                type: 'ai_status',
                message: `🔧 ${event.description || event.name} ...`
            }));
        }
    };

    try {
        const reply = await aiSession.chat(userText, onStream);
        ws.send(JSON.stringify({ type: 'ai_reply', message: reply }));
    } catch (e) {
        console.error('[AI Chat] Error:', e);
        ws.send(JSON.stringify({
            type: 'ai_reply',
            message: `❌ エラーが発生しました: ${e.message}`
        }));
    }
}

// HTTP API — MCP server calls these endpoints

app.get('/status', (req, res) => {
    res.json({ connected: pluginSocket !== null });
});

app.post('/execute', (req, res) => {
    if (!pluginSocket) {
        return res.status(503).json({
            error: 'Plugin not connected. Open InDesign, then load the Bridge Panel via UXP Developer Tool.'
        });
    }

    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Missing "code" in request body' });
    }

    const id = uuidv4();

    const promise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error('Execution timed out after 30s'));
        }, TIMEOUT_MS);

        pending.set(id, { resolve, reject, timer });
    });

    console.log('[Bridge] Sending execute:', id, code.slice(0, 100));
    pushLog('info', 'Execute: ' + code.slice(0, 80) + (code.length > 80 ? '…' : ''));
    pluginSocket.send(JSON.stringify({ type: 'execute', id, code }));

    promise
        .then((result) => {
            pushLog('success', 'Execute result: ' + JSON.stringify(result).slice(0, 80));
            res.json({ result });
        })
        .catch((err) => {
            pushLog('error', 'Execute error: ' + err.message);
            res.status(500).json({ error: err.message });
        });
});

// ─── Dimension Hub API ───

// ツール一覧 (ESMモジュールを動的インポート)
let cachedTools = null;
app.get('/api/tools', async (req, res) => {
    if (cachedTools) return res.json({ tools: cachedTools });
    try {
        const { allToolDefinitions } = await import('../src/types/index.js');
        cachedTools = allToolDefinitions.map(t => ({
            name: t.name,
            description: t.description || '',
        }));
        pushLog('info', `Tool list loaded: ${cachedTools.length} tools`);
        res.json({ tools: cachedTools });
    } catch (e) {
        res.json({ tools: [], error: e.message });
    }
});

// 操作ログ
app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 200;
    res.json({ logs: opLog.slice(-limit) });
});

// 詳細ステータス
app.get('/api/status/detailed', (req, res) => {
    res.json({
        bridge: true,
        pluginConnected: pluginSocket !== null,
        pendingRequests: pending.size,
        logCount: opLog.length,
        serverVersion: '1.2.1',
        uptime: Math.floor(process.uptime()),
    });
});

// ─── CCXプラグイン ダウンロードエンドポイント ───
app.get('/download-plugin', (req, res) => {
    const ccxPath = path.join(__dirname, '..', 'plugin', 'Ai-inDesign.ccx');
    if (require('fs').existsSync(ccxPath)) {
        res.download(ccxPath, 'Ai-inDesign.ccx');
    } else {
        res.status(404).json({ error: 'CCXファイルが見つかりません' });
    }
});

// ─── APIキー設定エンドポイント ───
app.post('/set-api-key', (req, res) => {
    const { apiKey } = req.body;
    geminiApiKey = apiKey || '';
    aiSession = null;
    res.json({ success: true });
});

const http = require('http');
const server = http.createServer(app);

// WebSocket: HTTPサーバーにupgradeで統合（UXPプラグイン接続用）
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('[Bridge] UXP plugin connected');
    pluginSocket = ws;
    pushLog('info', 'UXP plugin connected');

    ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data.toString()); } catch { return; }

        // AIチャット
        if (msg.type === 'chat') {
            handleChatMessage(ws, msg);
            return;
        }

        // APIキー設定
        if (msg.type === 'set_api_key') {
            geminiApiKey = msg.apiKey || '';
            aiSession = null;
            ws.send(JSON.stringify({ type: 'system', message: 'APIキーを設定しました。' }));
            return;
        }

        // コマンド結果
        if (msg.type === 'pong' || msg.type === 'result' || msg.type === 'error') {
            const p = pending.get(msg.id);
            if (p) {
                clearTimeout(p.timer);
                pending.delete(msg.id);
                if (msg.type === 'error') p.reject(new Error(msg.error));
                else p.resolve(msg.result || 'pong');
            }
        }
    });

    ws.on('close', () => {
        console.log('[Bridge] UXP plugin disconnected');
        pluginSocket = null;
        pushLog('warn', 'UXP plugin disconnected');
        for (const [id, item] of pending.entries()) {
            clearTimeout(item.timer);
            item.reject(new Error('Plugin disconnected'));
            pending.delete(id);
        }
    });

    ws.on('error', (err) => {
        console.error('[Bridge] WebSocket error:', err.message);
    });
});

server.listen(HTTP_PORT, '127.0.0.1', () => {
    console.log(`[Bridge] Server on http://127.0.0.1:${HTTP_PORT} (HTTP + WebSocket)`);
    console.log('[Bridge] Waiting for UXP plugin to connect...');
    pushLog('info', `Bridge server started on port ${HTTP_PORT}`);
});

