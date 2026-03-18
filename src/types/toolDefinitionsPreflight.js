/**
 * 入稿前チェックツール定義
 */
export const preflightTools = [
    { name: 'preflight_check', description: '入稿前チェックを一括実行', inputSchema: { type: 'object', properties: { minDPI: { type: 'number', default: 300 }, requiredBleed: { type: 'number', default: 3, description: '必要塗り足し (mm)' }, colorTarget: { type: 'string', default: 'CMYK' } } } },
    { name: 'check_fonts', description: 'フォントの使用状況・埋め込みを確認', inputSchema: { type: 'object', properties: {} } },
    { name: 'check_links', description: 'リンク画像の状態を確認', inputSchema: { type: 'object', properties: {} } },
    { name: 'check_image_resolution', description: '画像解像度を確認（印刷適性チェック）', inputSchema: { type: 'object', properties: { minDPI: { type: 'number', default: 300, description: '最低DPI' } } } },
    { name: 'check_bleed', description: '塗り足しの設定を確認', inputSchema: { type: 'object', properties: { requiredBleed: { type: 'number', default: 3, description: '必要塗り足し (mm)' } } } },
    { name: 'check_overset', description: 'オーバーセットテキストを確認', inputSchema: { type: 'object', properties: {} } },
    { name: 'check_color_space', description: 'カラーモード（CMYK/RGB）を確認', inputSchema: { type: 'object', properties: { target: { type: 'string', default: 'CMYK', description: '目標カラースペース' } } } },
    { name: 'check_right_binding', description: '縦組みドキュメントの右綴じ（Right-Binding）チェック・補正', inputSchema: { type: 'object', properties: { autoCorrect: { type: 'boolean', default: false, description: '自動で右綴じに補正するか' } } } },
    { name: 'check_black_overprint', description: 'スミベタ（K100%）のオーバープリント適用チェック・補正', inputSchema: { type: 'object', properties: { autoCorrect: { type: 'boolean', default: false, description: '自動でオーバープリントを適用するか' } } } },
    { name: 'auto_outline_vertical_glyphs', description: '縦書きで化けやすい約物や異体字を検出しアウトライン化', inputSchema: { type: 'object', properties: {} } },
    { name: 'export_print_pdf', description: '印刷用PDF/X-1a・PDF/X-4をエクスポート', inputSchema: { type: 'object', properties: { filePath: { type: 'string', description: '出力先パス' }, preset: { type: 'string', default: 'PDF/X-4' }, safeMode: { type: 'boolean', default: false, description: '旧式RIP向け安全PDF/X-1a出力モード' }, autoCorrectBinding: { type: 'boolean', default: true, description: '縦組み右綴じ自動補正' }, confirm: { type: 'boolean' }, preview: { type: 'boolean' } }, required: ['filePath'] } },
    { name: 'export_review_pdf', description: '校正・レビュー用PDFをエクスポート', inputSchema: { type: 'object', properties: { filePath: { type: 'string', description: '出力先パス' }, preview: { type: 'boolean' } }, required: ['filePath'] } },
];
