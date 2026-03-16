import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

// If started with the --mcp flag, run silently as the MCP server
const isMCP = process.argv.includes('--mcp');

if (isMCP) {
    // Hide Electron in macOS dock
    if (app.dock) app.dock.hide();
    
    // We import the MCP server module directly.
    import('../src/index.js').catch(err => {
        console.error('Failed to start MCP Server:', err);
        process.exit(1);
    });
} else {
    // Normal GUI App Mode
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    let mainWindow;

    async function createWindow() {
        mainWindow = new BrowserWindow({
            width: 800,
            height: 650,
            titleBarStyle: 'hidden',
            titleBarOverlay: {
                color: '#1a1a1a',
                symbolColor: '#fff'
            },
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            backgroundColor: '#1a1a1a'
        });

        await mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    app.whenReady().then(() => {
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    // Install/Setup Claude Desktop Config
    ipcMain.handle('setup-claude', async () => {
        try {
            let configPath = '';
            if (process.platform === 'win32') {
                configPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
            } else if (process.platform === 'darwin') {
                configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
            } else {
                return { success: false, message: 'サポート対象外のOSです。' };
            }

            let config = {};
            if (fs.existsSync(configPath)) {
                try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } catch (e) {
                    return { success: false, message: '既存の設定ファイルの読み込みに失敗しました。' };
                }
            }
            if (!config.mcpServers) config.mcpServers = {};

            // Determine executable path
            const exePath = app.getPath('exe');

            config.mcpServers['Ai-inDesign'] = {
                command: exePath,
                args: ['--mcp']
            };

            // Optional standard MCPs
            if (!config.mcpServers['memory']) {
                config.mcpServers['memory'] = {
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-memory"]
                };
            }

            if (!config.mcpServers['filesystem']) {
                const desktopPath = path.join(os.homedir(), 'Desktop').split(path.sep).join('/');
                config.mcpServers['filesystem'] = {
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-filesystem", desktopPath]
                };
            }

            const configDir = path.dirname(configPath);
            if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

            return { success: true, path: configPath };
        } catch (e) {
            return { success: false, message: e.message };
        }
    });

    // Handle Open Ext URLs
    ipcMain.on('open-external', (event, url) => {
        shell.openExternal(url);
    });
}
