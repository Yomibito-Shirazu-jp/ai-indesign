/**
 * DTP実務語彙辞書
 * 日本語DTP用語→InDesign内部パラメータの対応マップ
 */

// 判型辞書 (mm)
export const PAGE_SIZES = {
    'A3': { width: 297, height: 420 },
    'A4': { width: 210, height: 297 },
    'A5': { width: 148, height: 210 },
    'A6': { width: 105, height: 148 },
    'B4': { width: 257, height: 364 },
    'B5': { width: 182, height: 257 },
    'B6': { width: 128, height: 182 },
    '新書判': { width: 103, height: 182 },
    '四六判': { width: 127, height: 188 },
    '菊判': { width: 150, height: 220 },
    'レター': { width: 216, height: 279 },
    'リーガル': { width: 216, height: 356 },
    'タブロイド': { width: 279, height: 432 },
    'はがき': { width: 100, height: 148 },
    '名刺': { width: 55, height: 91 },
};

// 向き辞書
export const ORIENTATIONS = {
    '縦': 'portrait', 'たて': 'portrait', 'ポートレート': 'portrait', 'portrait': 'portrait',
    '横': 'landscape', 'よこ': 'landscape', 'ランドスケープ': 'landscape', 'landscape': 'landscape',
};

// 書体カテゴリ
export const FONT_CATEGORIES = {
    '明朝': ['Ryumin', 'A-OTF リュウミン', 'ヒラギノ明朝', 'HiraMinProN', 'Yu Mincho', '游明朝', 'MS 明朝', 'Noto Serif JP', 'Noto Serif CJK JP', 'Kozuka Mincho', '小塚明朝'],
    'ゴシック': ['Shin Go', 'A-OTF 新ゴ', 'ヒラギノ角ゴ', 'HiraginoSans', 'Yu Gothic', '游ゴシック', 'MS ゴシック', 'Noto Sans JP', 'Noto Sans CJK JP', 'Kozuka Gothic', '小塚ゴシック'],
    '丸ゴシック': ['じゅん', 'A-OTF じゅん', 'ヒラギノ丸ゴ', 'Rounded Mplus'],
    '教科書体': ['UDデジタル教科書体', 'UD Digi Kyokasho'],
    '太ゴシック': ['A-OTF 太ゴB101', 'ヒラギノ角ゴ W6', 'Noto Sans JP Bold'],
    '行書': ['HG行書体'],
    '楷書': ['HG正楷書体'],
};

// あいまい表現→数値変換
export const AMBIGUOUS_VALUES = {
    // 余白系
    '少し': { margin: 3, tracking: 20, leading: 1 },
    'もう少し': { margin: 5, tracking: 40, leading: 2 },
    'だいぶ': { margin: 10, tracking: 80, leading: 4 },
    'かなり': { margin: 15, tracking: 100, leading: 6 },
    '広め': { margin: 8, tracking: 50, leading: 3 },
    '狭め': { margin: -5, tracking: -30, leading: -2 },
    '詰め': { margin: -3, tracking: -20, leading: -1 },
    '広く': { margin: 8, tracking: 50, leading: 3 },
    '狭く': { margin: -5, tracking: -30, leading: -2 },
    // 強さ系
    '強く': { fontSize: 2, fontWeight: 'bold' },
    '弱く': { fontSize: -2, fontWeight: 'regular' },
    '大きく': { fontSize: 4 },
    '小さく': { fontSize: -4 },
};

// DTP実務用語辞書
export const DTP_TERMS = {
    // レイアウト要素
    '版面': { term: 'type_area', description: '余白を除いた印刷領域', category: 'layout' },
    '柱': { term: 'running_header', description: 'ページ上部のタイトル表示', category: 'layout' },
    'ノンブル': { term: 'page_number', description: 'ページ番号', category: 'layout' },
    '見開き': { term: 'spread', description: '左右2ページの組', category: 'layout' },
    '段組': { term: 'columns', description: '本文を複数段に分割', category: 'layout' },
    '小口': { term: 'fore_edge', description: '本の外側端', category: 'layout' },
    'ノド': { term: 'gutter', description: '本の綴じ側', category: 'layout' },
    '天': { term: 'head', description: 'ページ上端', category: 'layout' },
    '地': { term: 'foot', description: 'ページ下端', category: 'layout' },

    // テキスト処理
    '流し込み': { term: 'text_flow', description: 'テキストをフレームに配置', category: 'text' },
    '追い込み': { term: 'tracking_tighter', description: '字間を詰めて行に収める', category: 'text' },
    '追い出し': { term: 'tracking_looser', description: '字間を広げて次行に送る', category: 'text' },
    '縦中横': { term: 'tatechuyoko', description: '縦組み中の横配置数字等', category: 'text' },
    'ルビ': { term: 'ruby', description: '漢字の読み仮名', category: 'text' },
    '傍点': { term: 'emphasis_marks', description: '強調用の点', category: 'text' },
    '圏点': { term: 'emphasis_marks', description: '強調用の点', category: 'text' },

    // 組版
    '禁則': { term: 'kinsoku', description: '行頭・行末の文字制約', category: 'typesetting' },
    'ぶら下がり': { term: 'hanging_punctuation', description: '句読点の行末はみ出し', category: 'typesetting' },
    '約物': { term: 'punctuation', description: '句読点・括弧等の記号', category: 'typesetting' },
    '和欧間': { term: 'cjk_spacing', description: '日本語と英数字の間隔', category: 'typesetting' },
    '字詰め': { term: 'tracking', description: '文字間隔の調整', category: 'typesetting' },
    '行送り': { term: 'leading', description: '行間の距離', category: 'typesetting' },
    '字送り': { term: 'character_spacing', description: '文字送り幅', category: 'typesetting' },

    // 制作工程
    '赤字': { term: 'redline', description: '修正指示', category: 'workflow' },
    '初校': { term: 'first_proof', description: '最初の校正刷り', category: 'workflow' },
    '再校': { term: 'second_proof', description: '2回目の校正刷り', category: 'workflow' },
    '入稿': { term: 'submission', description: '印刷所への原稿提出', category: 'workflow' },
    '校了': { term: 'approval', description: '校正完了', category: 'workflow' },
    '責了': { term: 'conditional_approval', description: '条件付き校了', category: 'workflow' },
    '塗り足し': { term: 'bleed', description: '断裁余白', category: 'production' },
    'トンボ': { term: 'crop_marks', description: '裁断用マーク', category: 'production' },

    // スタイル
    '見出し': { term: 'heading', description: '大見出し', category: 'style' },
    '小見出し': { term: 'subheading', description: '中見出し', category: 'style' },
    '本文': { term: 'body', description: '主要テキスト', category: 'style' },
    'キャプション': { term: 'caption', description: '図版の説明文', category: 'style' },
    '注記': { term: 'footnote', description: '脚注・注釈', category: 'style' },
    '図版': { term: 'figure', description: '写真・イラスト', category: 'style' },

    // 操作
    'アオる': { term: 'increase_space', description: '余白や間隔を増やす', category: 'operation' },
    '締める': { term: 'decrease_space', description: '余白や間隔を減らす', category: 'operation' },
    '詰める': { term: 'tighten', description: '間隔を狭める', category: 'operation' },
    '開ける': { term: 'loosen', description: '間隔を広げる', category: 'operation' },
};

// 用途辞書
export const DOCUMENT_TYPES = {
    'チラシ': 'flyer',
    'フライヤー': 'flyer',
    '会社案内': 'company_profile',
    '冊子': 'booklet',
    'パンフレット': 'pamphlet',
    '書籍': 'book',
    '広報紙': 'newsletter',
    'ポスター': 'poster',
    'POP': 'pop',
    'ポップ': 'pop',
    '名刺': 'business_card',
    'カタログ': 'catalog',
    '報告書': 'report',
    'プレゼン': 'presentation',
    'リーフレット': 'leaflet',
    'DM': 'direct_mail',
    'ダイレクトメール': 'direct_mail',
    'メニュー': 'menu',
    '告知': 'announcement',
    'イベント': 'event',
};

// 値修飾語の程度マップ
export const DEGREE_MODIFIERS = {
    'ほんの少し': 0.3,
    '少し': 0.5,
    'ちょっと': 0.5,
    'やや': 0.6,
    'もう少し': 0.7,
    '多少': 0.6,
    'まあまあ': 0.8,
    '結構': 1.0,
    'だいぶ': 1.2,
    'かなり': 1.5,
    'とても': 1.8,
    '大幅に': 2.0,
    '極端に': 3.0,
};

/**
 * 用語検索
 * @param {string} text - 検索テキスト
 * @returns {Object|null} マッチした用語情報
 */
export function lookupTerm(text) {
    // 完全一致
    if (DTP_TERMS[text]) return { ...DTP_TERMS[text], source: text };

    // 部分一致
    for (const [key, value] of Object.entries(DTP_TERMS)) {
        if (text.includes(key)) {
            return { ...value, source: key, matchType: 'partial' };
        }
    }
    return null;
}

/**
 * 判型解析
 * @param {string} text - 「A4」「A4縦」等
 * @returns {{ size: Object, orientation: string } | null}
 */
export function parsePageSize(text) {
    const normalized = text.toUpperCase().replace(/\s/g, '');

    for (const [name, dims] of Object.entries(PAGE_SIZES)) {
        if (normalized.includes(name.toUpperCase())) {
            let orientation = 'portrait';
            for (const [key, val] of Object.entries(ORIENTATIONS)) {
                if (text.includes(key)) {
                    orientation = val;
                    break;
                }
            }
            return {
                size: orientation === 'landscape'
                    ? { width: dims.height, height: dims.width }
                    : { ...dims },
                orientation,
                name
            };
        }
    }
    return null;
}

/**
 * 書体カテゴリ解決
 * @param {string} categoryName - 「明朝」「ゴシック」等
 * @returns {string[]} フォント候補リスト
 */
export function resolveFontCategory(categoryName) {
    for (const [key, fonts] of Object.entries(FONT_CATEGORIES)) {
        if (categoryName.includes(key)) {
            return fonts;
        }
    }
    return [];
}

/**
 * あいまい表現を数値に変換
 * @param {string} text - 「少し」「もう少し」等
 * @param {string} context - 'margin' | 'tracking' | 'leading'
 * @returns {number | null}
 */
export function resolveAmbiguousValue(text, context = 'margin') {
    for (const [key, values] of Object.entries(AMBIGUOUS_VALUES)) {
        if (text.includes(key)) {
            return values[context] || values.margin || null;
        }
    }

    // 程度修飾語チェック
    for (const [modifier, multiplier] of Object.entries(DEGREE_MODIFIERS)) {
        if (text.includes(modifier)) {
            const baseValues = { margin: 5, tracking: 30, leading: 2 };
            return Math.round(baseValues[context] * multiplier);
        }
    }

    return null;
}

/**
 * 用途名解決
 */
export function resolveDocumentType(text) {
    for (const [key, value] of Object.entries(DOCUMENT_TYPES)) {
        if (text.includes(key)) {
            return { type: value, source: key };
        }
    }
    return null;
}
