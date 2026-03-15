/**
 * テキスト流し込みツール定義
 */
export const textFlowTools = [
    { name: 'import_text', description: 'テキスト取り込み', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'テキスト内容' }, filePath: { type: 'string', description: 'ファイルパス' } } } },
    { name: 'parse_manuscript_structure', description: '原稿構造解析（見出し/本文/箇条書き/注記/キャプション推定）', inputSchema: { type: 'object', properties: { text: { type: 'string', description: '原稿テキスト' } }, required: ['text'] } },
    { name: 'flow_text_to_pages', description: '自動流し込み＋ページ自動追加（confirm必要）', inputSchema: { type: 'object', properties: { text: { type: 'string', description: '流し込みテキスト' }, pageIndex: { type: 'number', default: 0 }, autoAddPages: { type: 'boolean', default: true }, applyStyles: { type: 'boolean', default: true }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } }, required: ['text'] } },
    { name: 'apply_document_template', description: 'テンプレート適用（confirm必要）', inputSchema: { type: 'object', properties: { templateType: { type: 'string', description: 'テンプレートID' }, templateName: { type: 'string', description: 'テンプレート名（日本語）' }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } } } },
    { name: 'resolve_overset_text', description: 'オーバーセット解決提案', inputSchema: { type: 'object', properties: {} } },
    { name: 'list_available_templates', description: '利用可能テンプレート一覧', inputSchema: { type: 'object', properties: {} } },
];
