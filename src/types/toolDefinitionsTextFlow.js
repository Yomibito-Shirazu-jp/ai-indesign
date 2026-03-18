/**
 * テキスト流し込みツール定義
 */
export const textFlowTools = [
    { name: 'import_text', description: 'テキストファイルを流し込む', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'テキスト内容' }, filePath: { type: 'string', description: 'ファイルパス' } } } },
    { name: 'parse_manuscript_structure', description: '原稿の見出し・本文構造を自動解析', inputSchema: { type: 'object', properties: { text: { type: 'string', description: '原稿テキスト' } }, required: ['text'] } },
    { name: 'flow_text_to_pages', description: '原稿テキストをページに自動流し込み', inputSchema: { type: 'object', properties: { text: { type: 'string', description: '流し込みテキスト' }, pageIndex: { type: 'number', default: 0 }, autoAddPages: { type: 'boolean', default: true }, applyStyles: { type: 'boolean', default: true }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } }, required: ['text'] } },
    { name: 'apply_document_template', description: 'テンプレートを適用して自動組版', inputSchema: { type: 'object', properties: { templateType: { type: 'string', description: 'テンプレートID' }, templateName: { type: 'string', description: 'テンプレート名（日本語）' }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } } } },
    { name: 'resolve_overset_text', description: 'オーバーセットテキストを自動解消', inputSchema: { type: 'object', properties: {} } },
    { name: 'list_available_templates', description: '利用可能なテンプレート一覧を表示', inputSchema: { type: 'object', properties: {} } },
];
