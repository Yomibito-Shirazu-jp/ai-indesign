/**
 * 校閲ツール定義
 * 常用漢字チェック、表記揺れ検知、不適切表現検出
 */
export const proofreadingTools = [
    {
        name: 'check_joyo_kanji',
        description: '常用漢字外の漢字を検出。InDesignドキュメント内のテキスト、または直接指定テキストを検査。',
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
        description: '表記揺れを検知（送り仮名、漢字/かな、外来語等の混在）。同一文書内で複数の表記が混在する箇所を報告。',
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
        description: '不適切表現・差別用語を検出。身体・職業・性別・人種等のカテゴリ別に検出し、代替表現を提案。',
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
        description: '校閲総合チェック（常用漢字・表記揺れ・不適切表現を一括検査）',
        inputSchema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: '検査テキスト（省略時はドキュメント内テキストを検査）' },
                minSeverity: { type: 'string', enum: ['low', 'medium', 'high'], default: 'low' },
            },
        },
    },
];
