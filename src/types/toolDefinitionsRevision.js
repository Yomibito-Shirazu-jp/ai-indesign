/**
 * 修正運用ツール定義
 */
export const revisionTools = [
    { name: 'apply_redline_changes', description: '赤字指示を一括反映（confirm必要）', inputSchema: { type: 'object', properties: { changes: { type: 'array', items: { type: 'object', properties: { find: { type: 'string' }, replace: { type: 'string' } }, required: ['find', 'replace'] }, description: '置換リスト [{find, replace}]' }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } }, required: ['changes'] } },
    { name: 'replace_text_by_instruction', description: '自然文指示でのテキスト置換', inputSchema: { type: 'object', properties: { find: { type: 'string' }, replace: { type: 'string' }, pageIndex: { type: 'number' }, preview: { type: 'boolean' } }, required: ['find', 'replace'] } },
    { name: 'export_change_log', description: '変更履歴出力', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 50 } } } },
    { name: 'compare_versions', description: 'バージョン差分比較（ページ/フレーム構成）', inputSchema: { type: 'object', properties: {} } },
];

/**
 * 日本語自然文解釈ツール定義
 */
export const interpretationTools = [
    { name: 'parse_instruction', description: '日本語自然文をDTP操作の中間表現(IR)に変換。実行は行わず解析のみ。', inputSchema: { type: 'object', properties: { text: { type: 'string', description: '日本語指示文' } }, required: ['text'] } },
    { name: 'confirm_instruction', description: '保留中の低確信度操作を承認または却下', inputSchema: { type: 'object', properties: { approve: { type: 'boolean', description: 'trueで承認、falseで却下' } }, required: ['approve'] } },
    { name: 'get_operation_log', description: '操作ログ取得', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 20 }, tool: { type: 'string' }, failedOnly: { type: 'boolean' } } } },
    { name: 'export_operation_log', description: '操作ログをJSONL形式でエクスポート', inputSchema: { type: 'object', properties: {} } },
];
