const { WebSocketServer } = require('ws');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const WS_PORT = 3001;
const HTTP_PORT = 3000;
const TIMEOUT_MS = 30000;

const app = express();
app.use(express.json());

// 接続サポート用UIを配信
app.use(express.static(path.join(__dirname, 'public')));

let pluginSocket = null;
const pending = new Map(); // id -> { resolve, reject, timer }

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

app.listen(HTTP_PORT, '127.0.0.1', () => {
  console.log(`[Bridge] HTTP server on http://127.0.0.1:${HTTP_PORT}`);
  console.log(`[Bridge] WebSocket server on ws://127.0.0.1:${WS_PORT}`);
  console.log('[Bridge] Waiting for UXP plugin to connect...');
});
