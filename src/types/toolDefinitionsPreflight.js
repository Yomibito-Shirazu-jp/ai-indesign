/**
 * 入稿前チェックツール定義
 */
export const preflightTools = [
    { name: 'preflight_check', description: '入稿前総合チェック（フォント/リンク/解像度/塗り足し/オーバーセット/カラーの集約）', inputSchema: { type: 'object', properties: { minDPI: { type: 'number', default: 300 }, requiredBleed: { type: 'number', default: 3, description: '必要塗り足し (mm)' }, colorTarget: { type: 'string', default: 'CMYK' } } } },
    { name: 'check_fonts', description: 'フォント問題検出（欠損フォント等）', inputSchema: { type: 'object', properties: {} } },
    { name: 'check_links', description: 'リンク切れ・修正済みリンク検出', inputSchema: { type: 'object', properties: {} } },
    { name: 'check_image_resolution', description: '低解像度画像検出', inputSchema: { type: 'object', properties: { minDPI: { type: 'number', default: 300, description: '最低DPI' } } } },
    { name: 'check_bleed', description: '塗り足し不足検出', inputSchema: { type: 'object', properties: { requiredBleed: { type: 'number', default: 3, description: '必要塗り足し (mm)' } } } },
    { name: 'check_overset', description: 'オーバーセットテキスト検出', inputSchema: { type: 'object', properties: {} } },
    { name: 'check_color_space', description: 'カラーモード不整合検出（RGB/CMYK）', inputSchema: { type: 'object', properties: { target: { type: 'string', default: 'CMYK', description: '目標カラースペース' } } } },
    { name: 'check_right_binding', description: '縦組みドキュメントの右綴じ（Right-Binding）チェック・補正', inputSchema: { type: 'object', properties: { autoCorrect: { type: 'boolean', default: false, description: '自動で右綴じに補正するか' } } } },
    { name: 'check_black_overprint', description: 'スミベタ（K100%）のオーバープリント適用チェック・補正', inputSchema: { type: 'object', properties: { autoCorrect: { type: 'boolean', default: false, description: '自動でオーバープリントを適用するか' } } } },
    { name: 'auto_outline_vertical_glyphs', description: '縦書きで化けやすい約物や異体字を検出しアウトライン化', inputSchema: { type: 'object', properties: {} } },
    { name: 'export_print_pdf', description: '入稿用PDF書き出し（confirm必要）', inputSchema: { type: 'object', properties: { filePath: { type: 'string', description: '出力先パス' }, preset: { type: 'string', default: 'PDF/X-4' }, safeMode: { type: 'boolean', default: false, description: '旧式RIP向け安全PDF/X-1a出力モード' }, autoCorrectBinding: { type: 'boolean', default: true, description: '縦組み右綴じ自動補正' }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } }, required: ['filePath'] } },
    { name: 'export_review_pdf', description: '校正用PDF書き出し', inputSchema: { type: 'object', properties: { filePath: { type: 'string', description: '出力先パス' }, preview: { type: 'boolean' } }, required: ['filePath'] } },
];
