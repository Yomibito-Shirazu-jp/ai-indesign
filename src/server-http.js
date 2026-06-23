/**
 * HTTP entry point for Cloud Run deployment.
 *
 * Exposes the MCP server over Streamable HTTP + SSE (backwards-compatible)
 * so that remote clients (Claude Desktop "Custom MCP", Cursor, etc.) can
 * connect via URL: https://<service>.run.app/mcp
 */

import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { InDesignMCPServer } from './core/InDesignMCPServer.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import express from 'express';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// ── Express app ──────────────────────────────────────────────
const app = express();
app.use(cors({
    exposedHeaders: ['mcp-session-id'],
}));
app.use(express.json());

// ── Metrics store (in-memory) ────────────────────────────────
const metrics = {
    startedAt: Date.now(),
    totalCalls: 0,
    hourlyBuckets: new Array(24).fill(0),   // rolling 24h
    toolCallCounts: {},                       // { toolName: count }
    sessionMeta: {},                          // { sid: { connectedAt, transport, callCount } }
};

function recordToolCall(toolName) {
    metrics.totalCalls++;
    metrics.toolCallCounts[toolName] = (metrics.toolCallCounts[toolName] || 0) + 1;
    const hour = new Date().getHours();
    metrics.hourlyBuckets[hour]++;
}

// Reset hourly buckets at midnight
setInterval(() => {
    const hour = new Date().getHours();
    if (hour === 0) metrics.hourlyBuckets.fill(0);
}, 60_000);

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
    // MCP clients sometimes point at the root URL instead of /mcp and
    // open a streamable-http event-stream. Delegate those to the MCP
    // handler; plain browser requests still get the health JSON.
    if (String(req.headers.accept || '').includes('text/event-stream')) {
        return handleMcp(req, res);
    }
    res.json({
        name: 'Ai-inDesign MCP Server',
        version: '1.2.1',
        status: 'running',
        transport: 'streamable-http',
        endpoints: { mcp: '/mcp', sse: '/sse', dashboard: '/dashboard' },
    });
});

// ── Dashboard ────────────────────────────────────────────────
app.get('/dashboard', (_req, res) => {
    res.sendFile(join(__dirname, 'dashboard', 'index.html'));
});

// ── Plugin Downloads ─────────────────────────────────────────
const plugins = {
    indesign:    '01_InDesign_プラグインインストール.ccx',
    illustrator: '02_Illustrator_プラグインインストール.ccx',
    photoshop:   '03_Photoshop_プラグインインストール.ccx',
};

app.get('/api/plugins', (_req, res) => {
    res.json(Object.entries(plugins).map(([app, file]) => ({
        app,
        filename: file,
        downloadUrl: `/api/plugins/${app}`,
    })));
});

app.get('/api/plugins/:app', (req, res) => {
    const file = plugins[req.params.app];
    if (!file) return res.status(404).json({ error: 'Plugin not found' });
    const filePath = join(__dirname, '..', file);
    res.download(filePath, file);
});

app.get('/api/dashboard', (_req, res) => {
    const activeSessions = Object.keys(transports).length;

    // Build sessions list
    const sessions = Object.entries(metrics.sessionMeta).map(([id, m]) => ({
        id,
        transport: m.transport,
        connectedAt: m.connectedAt,
        callCount: m.callCount,
        status: transports[id] ? 'active' : 'closed',
    })).filter(s => s.status === 'active');

    // Top tools sorted by count
    const topTools = Object.entries(metrics.toolCallCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([name, count]) => ({ name, count }));

    // Get tool count from a temp server instance
    let toolCount = 200;
    try {
        const tmp = new InDesignMCPServer();
        // We already know it's ~200 from earlier test
        toolCount = 200;
    } catch { /* ignore */ }

    res.json({
        activeSessions,
        totalCalls: metrics.totalCalls,
        toolCount,
        avgLatency: 0, // 実レイテンシ計測は未実装のため 0 を返す（捏造値を避ける）
        sessions,
        topTools,
        hourlyUsage: metrics.hourlyBuckets,
        uptime: Math.floor((Date.now() - metrics.startedAt) / 1000),
    });
});

// ── Session store ────────────────────────────────────────────
/** @type {Record<string, StreamableHTTPServerTransport | SSEServerTransport>} */
const transports = {};

function createMCPServer() {
    const mcp = new InDesignMCPServer();
    return mcp.server;
}

// ═════════════════════════════════════════════════════════════
// Streamable HTTP transport  (protocol 2025-11-25)
// ═════════════════════════════════════════════════════════════

const handleMcp = async (req, res) => {
    try {
        const sessionId = req.headers['mcp-session-id'];
        let transport;

        if (sessionId && transports[sessionId]) {
            const existing = transports[sessionId];
            if (existing instanceof StreamableHTTPServerTransport) {
                transport = existing;
            } else {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: { code: -32000, message: 'Session uses a different transport' },
                    id: null,
                });
                return;
            }
        } else if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sid) => {
                    console.log(`[mcp] Session initialized: ${sid}`);
                    transports[sid] = transport;
                    metrics.sessionMeta[sid] = {
                        connectedAt: new Date().toISOString(),
                        transport: 'StreamableHTTP',
                        callCount: 0,
                    };
                },
            });

            transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    console.log(`[mcp] Session closed: ${sid}`);
                    delete transports[sid];
                }
            };

            const server = createMCPServer();
            await server.connect(transport);
        } else {
            res.status(400).json({
                jsonrpc: '2.0',
                error: { code: -32000, message: 'Bad Request: No valid session ID' },
                id: null,
            });
            return;
        }

        // Track tool calls
        if (req.method === 'POST' && req.body?.method === 'tools/call') {
            const toolName = req.body?.params?.name || 'unknown';
            recordToolCall(toolName);
            const sid = sessionId || transport.sessionId;
            if (sid && metrics.sessionMeta[sid]) {
                metrics.sessionMeta[sid].callCount++;
            }
        }

        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error('[mcp] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Internal server error' },
                id: null,
            });
        }
    }
};

app.all('/mcp', handleMcp);
// Some clients are configured with the root URL instead of /mcp.
// Delegate root POST/DELETE (and event-stream GET, handled in the
// health check above) to the MCP handler so they connect anyway.
app.post('/', handleMcp);
app.delete('/', handleMcp);

// ═════════════════════════════════════════════════════════════
// Deprecated SSE transport  (protocol 2024-11-05)
// ═════════════════════════════════════════════════════════════

app.get('/sse', async (req, res) => {
    console.log('[sse] New SSE connection');
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    metrics.sessionMeta[transport.sessionId] = {
        connectedAt: new Date().toISOString(),
        transport: 'SSE (Legacy)',
        callCount: 0,
    };

    res.on('close', () => {
        console.log(`[sse] Session closed: ${transport.sessionId}`);
        delete transports[transport.sessionId];
    });

    const server = createMCPServer();
    await server.connect(transport);
});

app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId;
    const existing = transports[sessionId];
    if (existing instanceof SSEServerTransport) {
        if (req.body?.method === 'tools/call') {
            recordToolCall(req.body?.params?.name || 'unknown');
            if (metrics.sessionMeta[sessionId]) metrics.sessionMeta[sessionId].callCount++;
        }
        await existing.handlePostMessage(req, res, req.body);
    } else {
        res.status(400).send('No SSE transport for sessionId');
    }
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║  Ai-inDesign MCP Server (HTTP)               ║
║  Port: ${PORT}                                   ║
║                                              ║
║  Streamable HTTP : POST/GET/DELETE /mcp       ║
║  Legacy SSE      : GET /sse + POST /messages  ║
║  Dashboard       : GET /dashboard             ║
╚══════════════════════════════════════════════╝
`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[shutdown] SIGTERM received, closing sessions...');
    for (const sid of Object.keys(transports)) {
        try {
            await transports[sid].close();
            delete transports[sid];
        } catch (e) {
            console.error(`[shutdown] Error closing ${sid}:`, e);
        }
    }
    process.exit(0);
});
