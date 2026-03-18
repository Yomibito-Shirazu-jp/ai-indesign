/**
 * 修正運用ツール定義
 */
export const revisionTools = [
    { name: 'apply_redline_changes', description: '赤字・修正指示を一括適用', inputSchema: { type: 'object', properties: { changes: { type: 'array', items: { type: 'object', properties: { find: { type: 'string' }, replace: { type: 'string' } }, required: ['find', 'replace'] }, description: '置換リスト [{find, replace}]' }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } }, required: ['changes'] } },
    { name: 'replace_text_by_instruction', description: '指示文に基づいてテキストを置換', inputSchema: { type: 'object', properties: { find: { type: 'string' }, replace: { type: 'string' }, pageIndex: { type: 'number' }, preview: { type: 'boolean' } }, required: ['find', 'replace'] } },
    { name: 'export_change_log', description: '変更履歴・修正ログをエクスポート', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 50 } } } },
    { name: 'compare_versions', description: 'ドキュメントのバージョン差分を比較', inputSchema: { type: 'object', properties: {} } },
];

/**
 * 日本語自然文解釈ツール定義
 */
export const interpretationTools = [
    { name: 'parse_instruction', description: '日本語の指示を解析してInDesignコマンドに変換', inputSchema: { type: 'object', properties: { text: { type: 'string', description: '日本語指示文' } }, required: ['text'] } },
    { name: 'confirm_instruction', description: '実行予定の操作を確認・承認', inputSchema: { type: 'object', properties: { approve: { type: 'boolean', description: 'trueで承認、falseで却下' } }, required: ['approve'] } },
    { name: 'get_operation_log', description: '操作ログを取得', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 20 }, tool: { type: 'string' }, failedOnly: { type: 'boolean' } } } },
    { name: 'export_operation_log', description: '操作ログをファイルにエクスポート', inputSchema: { type: 'object', properties: {} } },
];
