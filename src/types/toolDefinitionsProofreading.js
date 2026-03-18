/**
 * 校閲ツール定義
 * 常用漢字チェック、表記揺れ検知、不適切表現検出
 */
export const proofreadingTools = [
    {
        name: 'check_joyo_kanji',
        description: '常用漢字の使用を確認（旧字体・異体字チェック）',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: '検査テキスト（省略時はドキュメント内テキストを検査）' },
                pageIndex: { type: 'number', description: '検査対象ページ（省略時は全ページ）' },
            },
        },
    },
    {
        name: 'check_hyoki_yure',
        description: '表記揺れを検出・修正候補を提示',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: '検査テキスト（省略時はドキュメント内テキストを検査）' },
                categories: {
                    type: 'array',
                    items: { type: 'string', enum: ['送り仮名', '漢字/かな', '外来語', '記号', '字体'] },
                    description: '検知カテゴリ（省略時は全カテゴリ）',
                },
            },
        },
    },
    {
        name: 'check_sensitive_terms',
        description: '不適切表現・差別表現を確認',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: '検査テキスト（省略時はドキュメント内テキストを検査）' },
                minSeverity: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    default: 'low',
                    description: '最低検出レベル',
                },
                categories: {
                    type: 'array',
                    items: { type: 'string', enum: ['身体', '職業', '性別', '人種', '地域', '年齢', 'その他'] },
                    description: '検出カテゴリ（省略時は全カテゴリ）',
                },
            },
        },
    },
    {
        name: 'proofread_all',
        description: '全校閲チェックを一括実行（表記・用語・禁則）',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: '検査テキスト（省略時はドキュメント内テキストを検査）' },
                minSeverity: { type: 'string', enum: ['low', 'medium', 'high'], default: 'low' },
            },
        },
    },
];
