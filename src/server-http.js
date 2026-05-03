/**
 * HTTP entry point for Cloud Run deployment.
 *
 * Exposes the MCP server over Streamable HTTP + SSE (backwards-compatible)
 * so that remote clients (Claude Desktop "Custom MCP", Cursor, etc.) can
 * connect via URL: https://<service>.run.app/mcp
 */

import { randomUUID } from 'node:crypto';
import { InDesignMCPServer } from './core/InDesignMCPServer.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

// Express (already in deps)
import express from 'express';
import cors from 'cors';

const PORT = parseInt(process.env.PORT || '8080', 10);

// ── Express app ──────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check for Cloud Run
app.get('/', (_req, res) => {
    res.json({
        name: 'Ai-inDesign MCP Server',
        version: '1.2.1',
        status: 'running',
        transport: 'streamable-http',
        endpoints: {
            mcp: '/mcp',
            sse: '/sse (deprecated, for older clients)',
        },
    });
});

// ── Session store ────────────────────────────────────────────
/** @type {Record<string, StreamableHTTPServerTransport | SSEServerTransport>} */
const transports = {};

/**
 * Create a fresh InDesignMCPServer and return its inner `Server` instance.
 * Each session gets its own server to avoid handler conflicts.
 */
function createMCPServer() {
    const mcp = new InDesignMCPServer();
    return mcp.server;
}

// ═════════════════════════════════════════════════════════════
// Streamable HTTP transport  (protocol 2025-11-25)
// ═════════════════════════════════════════════════════════════

app.all('/mcp', async (req, res) => {
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
            // New session
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sid) => {
                    console.log(`[mcp] Session initialized: ${sid}`);
                    transports[sid] = transport;
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
});

// ═════════════════════════════════════════════════════════════
// Deprecated SSE transport  (protocol 2024-11-05)
// For older Claude Desktop versions
// ═════════════════════════════════════════════════════════════

app.get('/sse', async (req, res) => {
    console.log('[sse] New SSE connection');
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;

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
