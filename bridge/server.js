const { WebSocketServer } = require('ws');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { AiChatSession } = require('./ai-chat');

const WS_PORT = 3001;
const HTTP_PORT = 3000;
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

// WebSocket server — UXP plugin connects here
const wss = new WebSocketServer({ port: WS_PORT, host: '127.0.0.1' });

wss.on('connection', (ws) => {
    console.log('[Bridge] Plugin connected');
    pluginSocket = ws;

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch (e) {
            console.error('[Bridge] Invalid JSON from plugin:', data.toString());
            return;
        }

        // ─── AIチャットメッセージ ───
        if (msg.type === 'chat') {
            handleChatMessage(ws, msg);
            return;
        }

        // ─── APIキー設定 ───
        if (msg.type === 'set_api_key') {
            geminiApiKey = msg.apiKey || '';
            aiSession = null; // セッションリセット
            console.log('[Bridge] API key updated');
            ws.send(JSON.stringify({ type: 'system', message: 'APIキーを設定しました。' }));
            return;
        }

        console.log('[Bridge] From plugin:', JSON.stringify(msg).slice(0, 200));

        const item = pending.get(msg.id);
        if (!item) return;

        clearTimeout(item.timer);
        pending.delete(msg.id);

        if (msg.type === 'result') {
            item.resolve(msg.result);
        } else if (msg.type === 'error') {
            item.reject(new Error(msg.error));
        } else if (msg.type === 'pong') {
            item.resolve('pong');
        }
    });

    ws.on('close', () => {
        console.log('[Bridge] Plugin disconnected');
        pluginSocket = null;
        for (const [id, item] of pending.entries()) {
            clearTimeout(item.timer);
            item.reject(new Error('Plugin disconnected'));
            pending.delete(id);
        }
    });

    ws.on('error', (err) => {
        console.error('[Bridge] WebSocket error:', err);
    });
});

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
    pluginSocket.send(JSON.stringify({ type: 'execute', id, code }));

    promise
        .then((result) => res.json({ result }))
        .catch((err) => res.status(500).json({ error: err.message }));
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

app.listen(HTTP_PORT, '127.0.0.1', () => {
    console.log(`[Bridge] HTTP server on http://127.0.0.1:${HTTP_PORT}`);
    console.log(`[Bridge] WebSocket server on ws://127.0.0.1:${WS_PORT}`);
    console.log('[Bridge] AI Chat engine ready (Gemini)');
    console.log('[Bridge] Waiting for UXP plugin to connect...');

    // 社員向け: ブラウザを自動で開く
    if (process.env.AUTO_OPEN !== 'false') {
        const { exec } = require('child_process');
        const url = `http://127.0.0.1:${HTTP_PORT}`;
        if (process.platform === 'win32') {
            exec(`start ${url}`);
        } else if (process.platform === 'darwin') {
            exec(`open ${url}`);
        }
    }
});
