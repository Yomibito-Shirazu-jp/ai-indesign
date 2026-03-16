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
    configPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
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

// 現在のプロジェクトの src/index.js の絶対パスを取得（バックスラッシュのまま扱うことでJSON.stringify時に\\になる）
const indexPath = path.join(__dirname, 'src', 'index.js');

// ai-indesign の設定を追加または上書き（小文字推奨）
config.mcpServers['ai-indesign'] = {
    command: "node",
    args: [
        indexPath
    ]
};

// オプション設定（既存の設定が存在しない場合のみ追加して、バッティングを防ぐ）
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
