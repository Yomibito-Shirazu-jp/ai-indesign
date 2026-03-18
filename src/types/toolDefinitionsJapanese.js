/**
 * 和文組版ツール定義
 */
export const japaneseTypesettingTools = [
    {
        name: 'apply_japanese_typesetting_preset',
        description: '日本語組版プリセットを適用（禁則・約物・字詰め）',
        inputSchema: {
            type: 'object',
            properties: {
                preset: { type: 'string', description: 'プリセット名: book, booklet, flyer, newsletter, pop', enum: ['book', 'booklet', 'flyer', 'newsletter', 'pop'] },
                pageIndex: { type: 'number', description: '対象ページ (0始まり)' },
                frameIndex: { type: 'number', description: '対象フレーム (省略時: 全フレーム)' },
                preview: { type: 'boolean', description: 'trueで変更プレビューのみ' },
            }
        }
    },
    {
        name: 'normalize_japanese_text',
        description: '日本語テキストを正規化（全角・半角統一）',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', description: '対象ページ (0始まり)', default: 0 },
                frameIndex: { type: 'number', description: '対象フレーム' },
                normalizations: { type: 'array', items: { type: 'string' }, description: '正規化種別: halfToFull, numbers, spaces' },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'fix_kinsoku',
        description: '禁則処理を一括修正',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                kinsokuType: { type: 'string', enum: ['Hard', 'Soft'], default: 'Hard' },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'adjust_kumihan',
        description: '字詰め・組方向を調整',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                cjkSpacing: { type: 'string', description: '和欧間スペース: quarter, half, none' },
                punctuationWidth: { type: 'string', description: '約物幅: full, half' },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'adjust_tracking_for_japanese',
        description: '和文トラッキングを調整',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                frameIndex: { type: 'number' },
                tracking: { type: 'number', description: 'トラッキング値 (例: -20, 0, 50)' },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'adjust_leading_for_japanese',
        description: '和文行送りを調整',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                frameIndex: { type: 'number' },
                leadingRatio: { type: 'number', description: '文字サイズに対する行送り比率 (1.5〜2.0)' },
                leading: { type: 'number', description: '直接指定する行送り値 (pt)' },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'validate_japanese_layout',
        description: '日本語レイアウトの妥当性を検証',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                checks: { type: 'array', items: { type: 'string' }, description: 'チェック種別: kinsoku, overset, spacing, consistency' },
            }
        }
    },
    {
        name: 'detect_style_inconsistencies',
        description: 'スタイルの不統一・乱れを検出',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number' },
                allPages: { type: 'boolean', description: '全ページチェック' },
            }
        }
    },
];
