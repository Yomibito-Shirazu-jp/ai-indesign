/**
 * セマンティックマップ生成器 — 読み人知らず
 * 
 * 原稿テキストから構造を抽出し、意味地図を生成する。
 * 既存の manuscriptParser.js を拡張した設計。
 * 
 * セマンティックマップ:
 *   テキスト全体 → セクション → ブロック → 要素
 *   各要素に type, depth, content, confidence を付与
 */

/**
 * @typedef {Object} SemanticElement
 * @property {string} type - 'heading' | 'body' | 'list' | 'note' | 'caption' | 'quote' | 'table'
 * @property {number} depth - 階層深度 (0=トップ)
 * @property {string} content - テキスト内容
 * @property {number} lineStart - 開始行番号
 * @property {number} lineEnd - 終了行番号
 * @property {number} confidence - 構造推定の確信度 (0.0-1.0)
 * @property {Object} [meta] - 追加メタ情報
 */

/**
 * @typedef {Object} SemanticMap
 * @property {SemanticElement[]} elements - 全要素
 * @property {Object} structure - 階層構造ツリー
 * @property {Object} stats - 統計情報
 */

// 日本語見出しパターン
const HEADING_PATTERNS = [
    { pattern: /^#{1,6}\s+(.+)$/, type: 'markdown', levelFn: (m) => m[0].indexOf(' ') },
    { pattern: /^[第一二三四五六七八九十百千]+[章節項条][\s　]+(.+)$/, type: 'numbered_ja' },
    { pattern: /^(\d+)[.．]\s*(.+)$/, type: 'numbered' },
    { pattern: /^[（(]\d+[)）]\s*(.+)$/, type: 'sub_numbered' },
    { pattern: /^[■□●○◆◇▶▷★☆]\s*(.+)$/, type: 'bullet_heading' },
    { pattern: /^【(.+)】$/, type: 'bracket_heading' },
    { pattern: /^〈(.+)〉$/, type: 'angle_heading' },
];

// リストパターン
const LIST_PATTERNS = [
    /^[\s　]*[・][\s　]*/,            // 中黒（スペース有無を問わず）
    /^[\s　]*[●○◆◇▸▹→][\s　]+/,      // その他ビュレット（スペース必須）
    /^[\s　]*[-–—]\s+/,
    /^[\s　]*\d+[.．)）]\s+/,
    /^[\s　]*[（(][0-9０-９]+[)）]\s*/,
    /^[\s　]*[ア-ン][.．)）]\s*/,
    /^[\s　]*[a-zA-Zａ-ｚＡ-Ｚ][.．)）]\s*/,
];

// 注記パターン
const NOTE_PATTERNS = [
    /^[\s　]*[※＊\*][\s　]*/,
    /^[\s　]*注[：:]\s*/,
    /^[\s　]*NOTE[\s:：]/i,
    /^[\s　]*備考[\s:：]/,
];

// キャプションパターン
const CAPTION_PATTERNS = [
    /^[\s　]*図[\s　]*\d+/,
    /^[\s　]*表[\s　]*\d+/,
    /^[\s　]*写真[\s　]*\d+/,
    /^[\s　]*Fig\.\s*\d+/i,
    /^[\s　]*Table\s*\d+/i,
    /^[\s　]*Photo\s*\d+/i,
];

// 引用パターン
const QUOTE_PATTERNS = [
    /^[\s　]*[「『"]/,
    /^>\s+/,
    /^[\s　]*―[\s　]/,
];

/**
 * テキストからセマンティックマップを生成
 * @param {string} text - 原稿テキスト
 * @param {Object} [options] - オプション
 * @returns {SemanticMap}
 */
export function buildSemanticMap(text, options = {}) {
    if (!text || !text.trim()) {
        return { elements: [], structure: { children: [] }, stats: { totalElements: 0, lineCount: 0 } };
    }

    const lines = text.split('\n');
    const elements = [];
    let currentBodyStart = -1;
    let currentBodyLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 空行：本文ブロックを閉じる
        if (!trimmed) {
            if (currentBodyLines.length > 0) {
                elements.push({
                    type: 'body',
                    depth: 0,
                    content: currentBodyLines.join('\n'),
                    lineStart: currentBodyStart + 1,
                    lineEnd: i,
                    confidence: 0.8,
                });
                currentBodyLines = [];
                currentBodyStart = -1;
            }
            continue;
        }

        // ── 具体パターンを先に判定（リスト・注記・キャプション・引用） ──
        // ※ 暗黙見出し（短い行）より先にこれらを判定しないと誤分類が発生する

        // リスト判定
        if (LIST_PATTERNS.some(p => p.test(trimmed))) {
            if (currentBodyLines.length > 0) {
                elements.push({
                    type: 'body',
                    depth: 0,
                    content: currentBodyLines.join('\n'),
                    lineStart: currentBodyStart + 1,
                    lineEnd: i,
                    confidence: 0.8,
                });
                currentBodyLines = [];
                currentBodyStart = -1;
            }
            elements.push({
                type: 'list',
                depth: 1,
                content: trimmed,
                lineStart: i + 1,
                lineEnd: i + 1,
                confidence: 0.9,
            });
            continue;
        }

        // 注記判定
        if (NOTE_PATTERNS.some(p => p.test(trimmed))) {
            if (currentBodyLines.length > 0) {
                elements.push({
                    type: 'body',
                    depth: 0,
                    content: currentBodyLines.join('\n'),
                    lineStart: currentBodyStart + 1,
                    lineEnd: i,
                    confidence: 0.8,
                });
                currentBodyLines = [];
                currentBodyStart = -1;
            }
            elements.push({
                type: 'note',
                depth: 1,
                content: trimmed,
                lineStart: i + 1,
                lineEnd: i + 1,
                confidence: 0.85,
            });
            continue;
        }

        // キャプション判定
        if (CAPTION_PATTERNS.some(p => p.test(trimmed))) {
            if (currentBodyLines.length > 0) {
                elements.push({
                    type: 'body',
                    depth: 0,
                    content: currentBodyLines.join('\n'),
                    lineStart: currentBodyStart + 1,
                    lineEnd: i,
                    confidence: 0.8,
                });
                currentBodyLines = [];
                currentBodyStart = -1;
            }
            elements.push({
                type: 'caption',
                depth: 1,
                content: trimmed,
                lineStart: i + 1,
                lineEnd: i + 1,
                confidence: 0.85,
            });
            continue;
        }

        // 引用判定
        if (QUOTE_PATTERNS.some(p => p.test(trimmed)) && trimmed.length < 200) {
            if (currentBodyLines.length > 0) {
                elements.push({
                    type: 'body',
                    depth: 0,
                    content: currentBodyLines.join('\n'),
                    lineStart: currentBodyStart + 1,
                    lineEnd: i,
                    confidence: 0.8,
                });
                currentBodyLines = [];
                currentBodyStart = -1;
            }
            elements.push({
                type: 'quote',
                depth: 1,
                content: trimmed,
                lineStart: i + 1,
                lineEnd: i + 1,
                confidence: 0.7,
            });
            continue;
        }

        // ── 見出し判定（具体パターン判定後） ──
        const heading = classifyHeading(trimmed);
        if (heading) {
            // 先に本文を閉じる
            if (currentBodyLines.length > 0) {
                elements.push({
                    type: 'body',
                    depth: 0,
                    content: currentBodyLines.join('\n'),
                    lineStart: currentBodyStart + 1,
                    lineEnd: i,
                    confidence: 0.8,
                });
                currentBodyLines = [];
                currentBodyStart = -1;
            }

            elements.push({
                type: 'heading',
                depth: heading.level,
                content: trimmed,
                lineStart: i + 1,
                lineEnd: i + 1,
                confidence: heading.confidence,
                meta: { headingType: heading.type },
            });
            continue;
        }

        // 本文として蓄積
        if (currentBodyStart === -1) currentBodyStart = i;
        currentBodyLines.push(trimmed);
    }

    // 残りの本文を閉じる
    if (currentBodyLines.length > 0) {
        elements.push({
            type: 'body',
            depth: 0,
            content: currentBodyLines.join('\n'),
            lineStart: currentBodyStart + 1,
            lineEnd: lines.length,
            confidence: 0.8,
        });
    }

    // 階層構造ツリーを構築
    const structure = buildTree(elements);

    // 統計
    const stats = calcStats(elements, lines.length);

    return { elements, structure, stats };
}

/**
 * 見出しを分類
 */
function classifyHeading(line) {
    for (const { pattern, type, levelFn } of HEADING_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
            let level = 1;
            if (levelFn) level = levelFn(match);
            else if (type === 'numbered_ja') level = 1;
            else if (type === 'numbered') level = 2;
            else if (type === 'sub_numbered') level = 3;
            else if (type === 'bullet_heading') level = 2;
            else if (type === 'bracket_heading') level = 1;
            else if (type === 'angle_heading') level = 2;

            // 短い行（5文字以下）は見出しの可能性が高い — ただし確信度で表現
            const confidence = line.length <= 30 ? 0.9 : 0.7;

            return { level: Math.min(level, 6), type, confidence };
        }
    }

    // 短い行（一定以下）で次行が本文なら見出しの可能性
    if (line.length <= 15 && !line.endsWith('。') && !line.endsWith('、')) {
        return { level: 2, type: 'implicit', confidence: 0.4 };
    }

    return null;
}

/**
 * 階層ツリー構築
 */
function buildTree(elements) {
    const root = { type: 'root', children: [] };
    const stack = [root];

    for (const el of elements) {
        if (el.type === 'heading') {
            // 現在のスタックを巻き戻す
            while (stack.length > 1 && stack[stack.length - 1].depth >= el.depth) {
                stack.pop();
            }
            const node = { ...el, children: [] };
            stack[stack.length - 1].children = stack[stack.length - 1].children || [];
            stack[stack.length - 1].children.push(node);
            stack.push(node);
        } else {
            stack[stack.length - 1].children = stack[stack.length - 1].children || [];
            stack[stack.length - 1].children.push({ ...el });
        }
    }

    return root;
}

/**
 * 統計計算
 */
function calcStats(elements, lineCount) {
    const typeCounts = {};
    let totalConfidence = 0;

    for (const el of elements) {
        typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
        totalConfidence += el.confidence;
    }

    return {
        totalElements: elements.length,
        lineCount,
        typeCounts,
        avgConfidence: elements.length > 0 ? totalConfidence / elements.length : 0,
    };
}
