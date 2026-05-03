/**
 * SystemHandlers — Claudeが直接呼べるブリッジ管理ツール
 * 
 * これにより Claude Desktop が「セットアップして」の一言で
 * 全自動（ブリッジ起動→デモ送信→状態確認）できる
 */

import { spawn, execSync } from 'child_process';
import { createConnection } from 'net';
import { WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// .env からポートを取得
function loadPorts() {
    const envPath = join(ROOT, '.env');
    const ports = { INDESIGN_PORT: 3000, ILLUSTRATOR_PORT: 3001, PHOTOSHOP_PORT: 3002 };
    if (!existsSync(envPath)) return ports;
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.replace(/#.*$/, '').trim().match(/^([A-Z_]+)\s*=\s*(\d+)/);
        if (m && m[1] in ports) ports[m[1]] = parseInt(m[2]);
    }
    return ports;
}

// ポートが使えるかチェック
function checkPort(port) {
    return new Promise(resolve => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`);
        const t = setTimeout(() => { ws.terminate(); resolve(false); }, 1500);
        ws.on('open',  () => { clearTimeout(t); ws.close(); resolve(true); });
        ws.on('error', () => { clearTimeout(t); resolve(false); });
    });
}

let bridgeProcess = null;

export class SystemHandlers {

    /** ブリッジサーバーの状態確認 */
    static async checkBridgeStatus() {
        const ports = loadPorts();
        const results = await Promise.all([
            checkPort(ports.INDESIGN_PORT).then(ok => ({ app: 'InDesign',    port: ports.INDESIGN_PORT,    ok })),
            checkPort(ports.ILLUSTRATOR_PORT).then(ok => ({ app: 'Illustrator', port: ports.ILLUSTRATOR_PORT, ok })),
            checkPort(ports.PHOTOSHOP_PORT).then(ok => ({ app: 'Photoshop',   port: ports.PHOTOSHOP_PORT,   ok })),
        ]);
        const connected = results.filter(r => r.ok).map(r => r.app);
        const offline   = results.filter(r => !r.ok).map(r => r.app);
        return {
            summary: connected.length > 0 ? `✅ ${connected.join(', ')} が接続済み` : '❌ 全アプリ未接続',
            connected,
            offline,
            details: results,
        };
    }

    /** InDesignブリッジを起動 */
    static async startBridge() {
        const ports = loadPorts();
        const already = await checkPort(ports.INDESIGN_PORT);
        if (already) return { success: true, message: `ブリッジは既に起動中 (port ${ports.INDESIGN_PORT})` };

        // 古いプロセスをkill
        try {
            if (process.platform === 'win32') {
                for (const port of [ports.INDESIGN_PORT, ports.ILLUSTRATOR_PORT, ports.PHOTOSHOP_PORT]) {
                    try { execSync(`for /f "tokens=5" %p in ('netstat -ano ^| findstr :${port}') do taskkill /PID %p /F`, { shell: 'cmd', stdio: 'ignore' }); } catch {}
                }
            }
        } catch {}

        return new Promise(resolve => {
            bridgeProcess = spawn('node', ['server.js'], {
                cwd: join(ROOT, 'bridge'),
                detached: true,
                stdio: 'ignore',
                env: { ...process.env },
            });
            bridgeProcess.unref();
            // 3秒待って確認
            setTimeout(async () => {
                const ok = await checkPort(ports.INDESIGN_PORT);
                resolve({
                    success: ok,
                    message: ok
                        ? `✅ ブリッジ起動完了 (port ${ports.INDESIGN_PORT})`
                        : '❌ ブリッジ起動に失敗。port競合またはnode_modulesの問題の可能性',
                    pid: bridgeProcess?.pid,
                });
            }, 3000);
        });
    }

    /** ブリッジを停止 */
    static async stopBridge() {
        const ports = loadPorts();
        try {
            if (process.platform === 'win32') {
                for (const port of Object.values(ports)) {
                    try { execSync(`for /f "tokens=5" %p in ('netstat -ano ^| findstr :${port}') do taskkill /PID %p /F`, { shell: 'cmd', stdio: 'ignore' }); } catch {}
                }
            }
        } catch {}
        return { success: true, message: 'ブリッジサーバーを停止しました' };
    }

    /** トラトラトラ — 全アプリへデモ送信 */
    static async runDemoBroadcast(args = {}) {
        const ports = loadPorts();
        const message = args.message || 'トラトラトラ — Ai-inDesign 接続確認 OK 📡';

        function makeCode(appType) {
            if (appType === 'indesign') {
                return `
                    const doc = app.documents.length > 0 ? app.documents[0] : app.documents.add();
                    const frame = doc.pages[0].textFrames.add();
                    frame.geometricBounds = [20, 20, 40, 120];
                    frame.contents = "${message}";
                    return "InDesign OK";
                `;
            }
            return `alert("${message}"); return "OK";`;
        }

        const apps = [
            { name: 'InDesign',    port: ports.INDESIGN_PORT,    type: 'indesign' },
            { name: 'Illustrator', port: ports.ILLUSTRATOR_PORT, type: 'illustrator' },
            { name: 'Photoshop',   port: ports.PHOTOSHOP_PORT,   type: 'photoshop' },
        ];

        const results = await Promise.all(apps.map(({ name, port, type }) =>
            new Promise(resolve => {
                const ws = new WebSocket(`ws://127.0.0.1:${port}`);
                const timer = setTimeout(() => { ws.terminate(); resolve({ name, ok: false, reason: 'タイムアウト' }); }, 5000);
                ws.on('open', () => {
                    ws.send(JSON.stringify({ type: 'execute', id: `demo-${Date.now()}`, code: makeCode(type) }));
                });
                ws.on('message', data => {
                    clearTimeout(timer); ws.close();
                    try { const m = JSON.parse(data); resolve({ name, ok: m.type === 'result', result: m.result, reason: m.error }); }
                    catch { resolve({ name, ok: false, reason: '不明なレスポンス' }); }
                });
                ws.on('error', e => { clearTimeout(timer); resolve({ name, ok: false, reason: `接続失敗 (${e.code})` }); });
            })
        ));

        const ok = results.filter(r => r.ok).map(r => r.name);
        const ng = results.filter(r => !r.ok).map(r => `${r.name}: ${r.reason}`);

        return {
            message,
            summary: ok.length > 0 ? `✅ ${ok.join(', ')} に送信成功` : '❌ 全アプリ未接続',
            success: ok,
            failed: ng,
            details: results,
        };
    }

    /** セットアップ全自動（ブリッジ起動 → デモ送信） */
    static async autoSetup() {
        const steps = [];

        // Step 1: Claude Desktopをkillして再起動（新MCPツールを認識させる）
        try {
            if (process.platform === 'win32') {
                execSync('taskkill /IM Claude.exe /F', { stdio: 'ignore' });
                await new Promise(r => setTimeout(r, 2000));
                execSync('cmd /c "start shell:AppsFolder\\Claude_pzs8sxrjxfjjc!Claude"', { stdio: 'ignore' });
                steps.push({ step: 'restart_claude', success: true, message: 'Claude Desktopを再起動しました' });
                await new Promise(r => setTimeout(r, 3000));
            }
        } catch (e) {
            steps.push({ step: 'restart_claude', success: false, message: e.message });
        }

        // Step 2: ブリッジ起動
        const bridge = await SystemHandlers.startBridge();
        steps.push({ step: 'start_bridge', ...bridge });

        if (bridge.success) {
            // Step 2: デモ送信
            const demo = await SystemHandlers.runDemoBroadcast();
            steps.push({ step: 'demo_broadcast', ...demo });
        }

        const allOk = steps.every(s => s.success);
        return {
            success: allOk,
            summary: allOk
                ? '✅ セットアップ完了！Claude Desktopから操作できます'
                : '⚠️ 一部の手順が失敗しました。詳細を確認してください',
            steps,
        };
    }
}
