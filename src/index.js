/**
 * Main entry point for InDesign MCP Server
 */
import { InDesignMCPServer } from './core/InDesignMCPServer.js';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import net from 'net';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .envのポート設定を読み込む
(function loadEnv() {
    const envPath = join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const trimmed = line.replace(/#.*$/, '').trim();
        const m = trimmed.match(/^([A-Z_]+)\s*=\s*(\d+)/);
        if (m) process.env[m[1]] = m[2];
    }
})();

const BRIDGE_PORT = parseInt(process.env.INDESIGN_PORT || '3000', 10);

function isBridgeRunning() {
    return new Promise((resolve) => {
        const socket = net.connect(BRIDGE_PORT, '127.0.0.1');
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('error', () => resolve(false));
    });
}

function startBridge() {
    const bridgePath = join(__dirname, '../bridge/server.js');
    process.env.AUTO_OPEN = 'false';
    const child = fork(bridgePath, [], {
        detached: true,
        stdio: 'ignore'
    });
    child.unref();
    console.error('[MCP] Bridge server started (pid ' + child.pid + ')');
}

async function ensureBridge() {
    const running = await isBridgeRunning();
    if (!running) {
        console.error('[MCP] Bridge not running — starting it now...');
        startBridge();
        await new Promise(r => setTimeout(r, 500));
    } else {
        console.error('[MCP] Bridge already running on port ' + BRIDGE_PORT);
    }
}

async function main() {
    try {
        await ensureBridge();
        const server = new InDesignMCPServer();
        await server.run();
    } catch (error) {
        // Log to stderr instead of stdout to avoid interfering with MCP protocol
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

main(); 