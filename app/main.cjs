console.log("ELECTRON_RUN_AS_NODE:", process.env.ELECTRON_RUN_AS_NODE);
const electron = require('electron');
const { app, BrowserWindow, ipcMain, shell } = electron;
const path = require('path');
const fs = require('fs');
const os = require('os');

// If started with the --mcp flag, run silently as the MCP server
const isMCP = process.argv.includes('--mcp');

if (isMCP) {
    // Hide Electron in macOS dock
    if (app.dock) app.dock.hide();
    
    // Dynamically import the ESM server module
    import('../src/index.js').catch(err => {
        console.error('Failed to start MCP Server:', err);
        process.exit(1);
    });
} else {
    // Normal GUI App Mode
    let mainWindow;

    async function createWindow() {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            minWidth: 960,
            minHeight: 600,
            titleBarStyle: 'hidden',
            titleBarOverlay: {
                color: '#1e293b',
                symbolColor: '#fff'
            },
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            backgroundColor: '#f8fafc'
        });

        // AutoDTP UIをロード（ビルド済み or 開発サーバー）
        const uiPath = path.join(__dirname, 'ui', 'index.html');
        if (fs.existsSync(uiPath)) {
            await mainWindow.loadFile(uiPath);
        } else {
            // 開発時: Vite devサーバーに接続
            await mainWindow.loadURL('http://localhost:5173');
        }
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
                    const rawData = fs.readFileSync(configPath, 'utf8');
                    config = JSON.parse(rawData.replace(/^\uFEFF/, ''));
                } catch (e) {
                    return { success: false, message: '既存の設定ファイルの読み込みに失敗しました。' };
                }
            }
            if (!config.mcpServers) config.mcpServers = {};

            // Determine executable path
            const isPackaged = app.isPackaged;
            let command, args;

            if (isPackaged) {
                // Production (Built .exe)
                command = app.getPath('exe');
                args = ['--mcp'];
            } else {
                // Development
                command = 'node';
                // Resolve path to src/index.js correctly escaping backslashes for JSON automatically
                args = [path.join(__dirname, 'src', 'index.js')];
            }

            config.mcpServers['ai-indesign'] = {
                command: command,
                args: args
            };

            // Optional standard MCPs
            if (!config.mcpServers['memory']) {
                config.mcpServers['memory'] = {
                    command: "npx",
                    args: [
                        "-y",
                        "@modelcontextprotocol/server-memory"
                    ]
                };
            }

            if (!config.mcpServers['filesystem']) {
                const desktopPath = path.join(os.homedir(), 'Desktop');
                config.mcpServers['filesystem'] = {
                    command: "npx",
                    args: [
                        "-y",
                        "@modelcontextprotocol/server-filesystem",
                        desktopPath
                    ]
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
