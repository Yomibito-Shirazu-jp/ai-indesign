import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 1. 必要なパッケージをインストールしています...');
try {
    execSync('npm install', { stdio: 'inherit' });
} catch (e) {
    console.error('❌ npm installに失敗しました。Node.jsがインストールされているか確認してください。');
    process.exit(1);
}

console.log('\n⚙️  2. Claude Desktopの設定を安全に更新しています...');

// OSごとのClaude設定ファイルのパスを取得
let configPath = '';
if (process.platform === 'win32') {
    const storePath = path.join(process.env.LOCALAPPDATA, 'Packages', 'Claude_pzs8sxrjxfjjc', 'LocalCache', 'Roaming', 'Claude', 'claude_desktop_config.json');
    const defaultPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
    
    if (fs.existsSync(path.dirname(storePath))) {
        configPath = storePath;
    } else {
        configPath = defaultPath;
    }
} else if (process.platform === 'darwin') {
    configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
} else {
    console.warn('⚠️ サポート対象外のOSです。');
    process.exit(0);
}

// 既存の設定を読み込む（ファイルがない場合は空のひな形を作成）
let config = {};
if (fs.existsSync(configPath)) {
    try {
        const rawData = fs.readFileSync(configPath, 'utf8');
        // Strip out the BOM (Byte Order Mark) from Windows if it exists
        config = JSON.parse(rawData.replace(/^\uFEFF/, ''));
    } catch (e) {
        console.error('❌ 既存の claude_desktop_config.json の読み込み（JSONパース）に失敗しました。フォーマットが正しいか確認してください。');
        process.exit(1);
    }
}

// mcpServersオブジェクトがなければ作成
if (!config.mcpServers) {
    config.mcpServers = {};
}

// Windowsのバックスラッシュ問題を回避するため、スラッシュに統一
// Node.js は Windows でもスラッシュ区切りパスを正しく扱える
const toSlash = (p) => p.replace(/\\/g, '/');
const indexPath = toSlash(path.join(__dirname, 'src', 'index.js'));

// ai-indesign の設定を追加または上書き
config.mcpServers['ai-indesign'] = {
    command: "node",
    args: [
        indexPath
    ]
};

// オプション設定（既存の設定が存在しない場合のみ追加して、バッティングを防ぐ）
// Windows環境での実行互換性のためnpxをnpx.cmdとする
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

if (!config.mcpServers['memory']) {
    config.mcpServers['memory'] = {
        command: npxCmd,
        args: [
            "-y",
            "@modelcontextprotocol/server-memory"
        ]
    };
}

if (!config.mcpServers['filesystem']) {
    const desktopPath = (() => {
        let p = path.join(os.homedir(), 'Desktop');
        if (!fs.existsSync(p)) {
            p = path.join(os.homedir(), 'OneDrive', 'Desktop');
        }
        return toSlash(p);
    })();
    config.mcpServers['filesystem'] = {
        command: npxCmd,
        args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            desktopPath
        ]
    };
}

// フォルダが存在しない場合は作成
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

// 保存
try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`\n✅ 完了！ Claude Desktopの設定ファイルを安全に更新しました。`);
    console.log(`📁 保存先: ${configPath}`);
    console.log(`\n⚠️ Claude Desktop と InDesign が起動している場合は、一度完全に終了（Quit）してから再起動してください。`);
} catch (e) {
    console.error('❌ 設定ファイルの保存に失敗しました。権限などを確認してください。', e);
}

// ============================================================
// Claude for Work (Cowork) 用カスタムコネクタ (.plugin) を生成
// .plugin = ZIP形式で、中に .claude-plugin/plugin.json と .mcp.json を含む
// ============================================================
import zlib from 'zlib';

const desktopPath = (() => {
    let p = path.join(os.homedir(), 'Desktop');
    if (!fs.existsSync(p)) {
        p = path.join(os.homedir(), 'OneDrive', 'Desktop');
    }
    return toSlash(p);
})();

// --- ZIP生成（外部パッケージ不要、Node.js標準のzlibのみ使用） ---
function crc32(buf) {
    let table = crc32._table;
    if (!table) {
        table = crc32._table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZip(files) {
    const parts = [];
    const centralDir = [];
    let offset = 0;

    for (const file of files) {
        const nameBuffer = Buffer.from(file.name, 'utf8');
        const content = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf8');
        const compressed = zlib.deflateRawSync(content);
        const crc = crc32(content);

        const local = Buffer.alloc(30 + nameBuffer.length);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0, 6);
        local.writeUInt16LE(8, 8);
        local.writeUInt16LE(0, 10);
        local.writeUInt16LE(0, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(compressed.length, 18);
        local.writeUInt32LE(content.length, 22);
        local.writeUInt16LE(nameBuffer.length, 26);
        local.writeUInt16LE(0, 28);
        nameBuffer.copy(local, 30);
        parts.push(local, compressed);

        const central = Buffer.alloc(46 + nameBuffer.length);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0, 8);
        central.writeUInt16LE(8, 10);
        central.writeUInt16LE(0, 12);
        central.writeUInt16LE(0, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(compressed.length, 20);
        central.writeUInt32LE(content.length, 24);
        central.writeUInt16LE(nameBuffer.length, 28);
        central.writeUInt16LE(0, 30);
        central.writeUInt16LE(0, 32);
        central.writeUInt16LE(0, 34);
        central.writeUInt16LE(0, 36);
        central.writeUInt32LE(0, 38);
        central.writeUInt32LE(offset, 42);
        nameBuffer.copy(central, 46);
        centralDir.push(central);

        offset += local.length + compressed.length;
    }

    const centralDirBuf = Buffer.concat(centralDir);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralDirBuf.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...parts, centralDirBuf, eocd]);
}

// --- .plugin の中身 ---
const pluginJson = JSON.stringify({
    name: "Ai-inDesign-Tools",
    version: "0.1.0",
    description: "AI InDesign, Memory, Filesystem の3つのMCPサーバーをCoworkで利用するためのプラグイン",
    author: { name: "Bunshodo Printing Co., Ltd." }
}, null, 2);

const mcpJson = JSON.stringify({
    mcpServers: {
        "ai-indesign": {
            command: "node",
            args: [indexPath]
        },
        "memory": {
            command: npxCmd,
            args: ["-y", "@modelcontextprotocol/server-memory"]
        },
        "filesystem": {
            command: npxCmd,
            args: ["-y", "@modelcontextprotocol/server-filesystem", desktopPath]
        }
    }
}, null, 2);

const readmeMd = `# Ai-inDesign-Tools\nAI InDesign, Memory, Filesystem MCP servers for Cowork.\nAuto-generated by setup.mjs\n`;

try {
    const zipBuffer = createZip([
        { name: '.claude-plugin/plugin.json', content: pluginJson },
        { name: '.mcp.json', content: mcpJson },
        { name: 'README.md', content: readmeMd }
    ]);

    const pluginPath = path.join(desktopPath, 'Ai-inDesign-Tools.plugin');
    fs.writeFileSync(pluginPath, zipBuffer);
    console.log(`\n🎁 Claude for Work (Cowork) 向けカスタムコネクタを生成しました！`);
    console.log(`📁 ファイル: ${pluginPath}`);
    console.log(`   💡 Cowork版のClaudeアプリに、この .plugin ファイルをドラッグ＆ドロップしてください。`);
} catch (e) {
    console.error('❌ カスタムコネクタ (.plugin) の生成に失敗しました。', e);
}
