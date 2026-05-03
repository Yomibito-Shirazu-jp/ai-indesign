/**
 * AI Chat Engine — Gemini + InDesign + Memory + Filesystem
 * ブリッジサーバーに組み込むAIチャットモジュール
 */
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// ─── メモリストア（長期記憶）───
const memoryStore = new Map();

function memoryRead(key) {
    return memoryStore.get(key) || null;
}
function memoryWrite(key, value) {
    memoryStore.set(key, value);
    return { success: true, key };
}
function memoryList() {
    return Array.from(memoryStore.keys());
}
function memorySearch(query) {
    const results = [];
    for (const [key, value] of memoryStore.entries()) {
        const str = JSON.stringify(value).toLowerCase();
        if (str.includes(query.toLowerCase()) || key.toLowerCase().includes(query.toLowerCase())) {
            results.push({ key, value });
        }
    }
    return results;
}

// ─── ファイルシステム（ローカル読み込み）───
const ALLOWED_DIRS = [
    path.join(require('os').homedir(), 'Desktop'),
    path.join(require('os').homedir(), 'Documents'),
    path.join(require('os').homedir(), 'Downloads'),
];

function isPathAllowed(filePath) {
    const resolved = path.resolve(filePath);
    return ALLOWED_DIRS.some(dir => resolved.startsWith(dir));
}

function fsReadFile(filePath) {
    if (!isPathAllowed(filePath)) {
        return { error: `アクセスが許可されていないパスです: ${filePath}` };
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { path: filePath, content: content.slice(0, 50000) };
    } catch (e) {
        return { error: `ファイル読み込みエラー: ${e.message}` };
    }
}

function fsListDir(dirPath) {
    if (!isPathAllowed(dirPath)) {
        return { error: `アクセスが許可されていないパスです: ${dirPath}` };
    }
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        return entries.map(e => ({
            name: e.name,
            type: e.isDirectory() ? 'directory' : 'file',
        }));
    } catch (e) {
        return { error: `ディレクトリ読み込みエラー: ${e.message}` };
    }
}

function fsWriteFile(filePath, content) {
    if (!isPathAllowed(filePath)) {
        return { error: `アクセスが許可されていないパスです: ${filePath}` };
    }
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true, path: filePath };
    } catch (e) {
        return { error: `ファイル書き込みエラー: ${e.message}` };
    }
}

// ─── Geminiツール定義 ───
const tools = [
    {
        functionDeclarations: [
            // InDesign操作
            {
                name: 'execute_indesign',
                description: 'InDesign上でJavaScriptコードを実行します。InDesign UXPのAPIを使用して、ドキュメント操作、テキスト編集、スタイル適用、画像配置などを行います。appオブジェクトが利用可能です。',
                parameters: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'string',
                            description: 'InDesign UXP JavaScript code to execute. The `app` object is available. Return a value to get it back. Example: `return app.activeDocument.name;`'
                        },
                        description: {
                            type: 'string',
                            description: '実行する操作の日本語説明（ユーザーに表示用）'
                        }
                    },
                    required: ['code', 'description']
                }
            },
            // メモリ
            {
                name: 'memory_read',
                description: 'メモリから情報を読み出す。顧客ルール、過去の指示、設定などの記憶を取得。',
                parameters: {
                    type: 'object',
                    properties: {
                        key: { type: 'string', description: '読み出すキー名' }
                    },
                    required: ['key']
                }
            },
            {
                name: 'memory_write',
                description: 'メモリに情報を保存。顧客ごとのルール、よく使う設定、過去の作業記録など。',
                parameters: {
                    type: 'object',
                    properties: {
                        key: { type: 'string', description: '保存するキー名' },
                        value: { type: 'string', description: '保存する内容' }
                    },
                    required: ['key', 'value']
                }
            },
            {
                name: 'memory_search',
                description: 'メモリ内をキーワード検索。関連する過去の記憶を探す。',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: '検索キーワード' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'memory_list',
                description: 'メモリに保存されている全てのキーを一覧表示。',
                parameters: { type: 'object', properties: {} }
            },
            // ファイルシステム
            {
                name: 'fs_read_file',
                description: 'ローカルファイルを読み込む。原稿テキスト、CSVデータ、設定ファイルなどの読み込みに使用。Desktop、Documents、Downloadsフォルダにアクセス可能。',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'ファイルの絶対パス' }
                    },
                    required: ['path']
                }
            },
            {
                name: 'fs_list_dir',
                description: 'ディレクトリの内容を一覧表示。',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'ディレクトリの絶対パス' }
                    },
                    required: ['path']
                }
            },
            {
                name: 'fs_write_file',
                description: 'ローカルファイルに書き込む。ログ出力や変更記録の保存に使用。',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'ファイルの絶対パス' },
                        content: { type: 'string', description: '書き込む内容' }
                    },
                    required: ['path', 'content']
                }
            }
        ]
    }
];

// ─── システムプロンプト ───
const SYSTEM_PROMPT = `あなたは「Ai-inDesign」— Adobe InDesignを自動操作するAI組版アシスタントです。

## あなたの役割
- ユーザーの日本語指示を理解し、InDesignの操作に変換して実行する
- 組版・DTPの専門知識を活かした高品質な自動組版を行う
- 日本語組版のルール（禁則処理、行取り、字間調整など）を遵守する

## 利用可能なツール
1. **execute_indesign** — InDesign UXP APIでコードを実行
   - appオブジェクトが利用可能
   - 新規ドキュメント作成: const doc = app.documents.add();
   - 現在のドキュメント: app.activeDocument
   - ページ取得: const page = doc.pages.item(0);
   - テキストフレーム作成: page.textFrames.add({geometricBounds: [y1, x1, y2, x2]})
   - ※注意※ 新しいドキュメントを作成した直後は、app.activeDocument ではなく作成した doc 変数からページを取得し操作してください。（例: doc.pages.item(0).textFrames.add(...)）

2. **memory_*** — 記憶の保存・検索・一覧
   - 顧客ごとのルール、過去の指示パターンを記憶
3. **fs_*** — ローカルファイルの読み書き
   - 原稿テキスト、CSVデータ、設定ファイルの読み込み

## エラー時のルール（重要・厳守）
- ツール実行時にエラーが発生した場合、絶対に「できません」と返さず、原因を推測して**再度ツールを呼び出してください**。
- 例: "undefinedのプロパティを読み取れない" エラーの場合、アクセスする前のオブジェクトが存在しない、または取得方法が誤っている（例: pages[0] を pages.item(0) に変えるなど）可能性が高いです。
- 複雑な操作は1度のスクリプトで全てやらず、数回に分けてツールを呼び出しても構いません。

## 応答ルール
- 日本語で応答する
- 操作実行前に何をするか簡潔に説明する
- エラー起きた場合でも、諦めずにツールを再実行して状況を打破する
- 1ステップずつ着実に進める
`;

// ─── チャットセッション ───
class AiChatSession {
    constructor(apiKey, executeInDesignFn) {
        this.genAI = new GoogleGenAI({ apiKey });
        this.executeInDesign = executeInDesignFn;
        this.history = [];
    }

    async chat(userMessage, onStream) {
        this.history.push({ role: 'user', parts: [{ text: userMessage }] });

        try {
            const response = await this.genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: this.history,
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                    tools: tools,
                },
            });

            // Function calling loop
            let result = response;
            let maxIterations = 10;

            while (maxIterations-- > 0) {
                const candidate = result.candidates?.[0];
                if (!candidate) break;

                const parts = candidate.content?.parts || [];
                const functionCalls = parts.filter(p => p.functionCall);

                if (functionCalls.length === 0) {
                    // Text response — done
                    const textParts = parts.filter(p => p.text);
                    const text = textParts.map(p => p.text).join('');
                    
                    this.history.push({ role: 'model', parts: [{ text }] });
                    return text;
                }

                // Execute function calls
                const functionResponses = [];
                for (const part of functionCalls) {
                    const fc = part.functionCall;
                    console.log(`[AI] Calling: ${fc.name}`, JSON.stringify(fc.args).slice(0, 200));
                    
                    if (onStream) {
                        onStream({ type: 'tool_use', name: fc.name, description: fc.args?.description || fc.name });
                    }

                    const output = await this._executeTool(fc.name, fc.args);
                    functionResponses.push({
                        functionResponse: {
                            name: fc.name,
                            response: { result: JSON.stringify(output) }
                        }
                    });
                }

                // Add model's function call + our response to history
                this.history.push({ role: 'model', parts: functionCalls.map(p => ({ functionCall: p.functionCall })) });
                this.history.push({ role: 'user', parts: functionResponses });

                // Continue the conversation
                result = await this.genAI.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: this.history,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        tools: tools,
                    },
                });
            }

            return '⚠️ 操作ステップ数の上限に達しました。指示を分割して再度お試しください。';

        } catch (error) {
            console.error('[AI] Error:', error);
            
            if (error.message?.includes('API key')) {
                return '❌ Gemini APIキーが設定されていないか、無効です。設定画面からAPIキーを入力してください。';
            }
            return `❌ AIエラー: ${error.message}`;
        }
    }

    async _executeTool(name, args) {
        try {
            switch (name) {
                case 'execute_indesign':
                    return await this.executeInDesign(args.code);
                case 'memory_read':
                    return memoryRead(args.key);
                case 'memory_write':
                    return memoryWrite(args.key, args.value);
                case 'memory_search':
                    return memorySearch(args.query);
                case 'memory_list':
                    return memoryList();
                case 'fs_read_file':
                    return fsReadFile(args.path);
                case 'fs_list_dir':
                    return fsListDir(args.path);
                case 'fs_write_file':
                    return fsWriteFile(args.path, args.content);
                default:
                    return { error: `Unknown tool: ${name}` };
            }
        } catch (e) {
            return { error: e.message };
        }
    }
}

module.exports = { AiChatSession };
