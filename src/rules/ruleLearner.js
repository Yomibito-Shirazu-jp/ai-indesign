/**
 * ルール学習エンジン — 読み人知らず
 * 
 * 初校→最終稿の差分からルールを自動学習する。
 * テキストの変更パターンを分析し、
 * 繰り返し出現する修正を NotationRule として抽出する。
 */

/**
 * @typedef {Object} DiffPair
 * @property {string} before - 修正前テキスト
 * @property {string} after - 修正後テキスト
 * @property {string} [context] - 前後のコンテキスト
 */

/**
 * @typedef {Object} LearnedRule
 * @property {string} pattern - 検出パターン
 * @property {string} replacement - 置換テキスト
 * @property {string} message - ルール説明
 * @property {number} confidence - 確信度 (出現回数ベース)
 * @property {number} occurrences - 出現回数
 * @property {string} category - カテゴリ推定
 */

/**
 * 差分ペアからルールを学習
 * @param {DiffPair[]} diffs - 変更ペアのリスト
 * @param {Object} [options]
 * @param {number} [options.minOccurrences=2] - ルール化の最低出現回数
 * @param {number} [options.minConfidence=0.5] - 最低確信度
 * @returns {LearnedRule[]}
 */
export function learnRules(diffs, options = {}) {
    const { minOccurrences = 2, minConfidence = 0.5 } = options;

    if (!diffs || diffs.length === 0) return [];

    // ── 1. 変更パターンを集計 ──
    const patternMap = new Map();

    for (const diff of diffs) {
        if (!diff.before || !diff.after || diff.before === diff.after) continue;

        const key = `${diff.before}→${diff.after}`;
        if (!patternMap.has(key)) {
            patternMap.set(key, {
                before: diff.before,
                after: diff.after,
                count: 0,
                contexts: [],
            });
        }
        const entry = patternMap.get(key);
        entry.count++;
        if (diff.context) entry.contexts.push(diff.context);
    }

    // ── 2. 出現回数でフィルタ & ルール生成 ──
    const rules = [];

    for (const [_, entry] of patternMap) {
        if (entry.count < minOccurrences) continue;

        const category = classifyChange(entry.before, entry.after);
        const confidence = Math.min(1.0, 0.3 + entry.count * 0.1);

        if (confidence < minConfidence) continue;

        // 正規表現パターンとしてエスケープ
        const escapedPattern = escapeRegex(entry.before);

        rules.push({
            pattern: escapedPattern,
            replacement: entry.after,
            message: `${entry.before} → ${entry.after} (${entry.count}回検出)`,
            confidence,
            occurrences: entry.count,
            category,
        });
    }

    // 確信度順でソート
    rules.sort((a, b) => b.confidence - a.confidence);

    return rules;
}

/**
 * 変更種別を推定
 */
function classifyChange(before, after) {
    // 全角半角変換
    if (isFullWidthToHalfWidth(before, after) || isHalfWidthToFullWidth(before, after)) {
        return '全半角変換';
    }

    // 送り仮名の違い
    if (isOkuriganaVariant(before, after)) {
        return '送り仮名';
    }

    // 長音記号の有無
    if (isChouonVariant(before, after)) {
        return '長音表記';
    }

    // カタカナ表記の違い
    if (isKatakanaVariant(before, after)) {
        return '外来語表記';
    }

    // 句読点変更
    if (isPunctuationChange(before, after)) {
        return '句読点';
    }

    return '一般表記';
}

function isFullWidthToHalfWidth(before, after) {
    return /[０-９ａ-ｚＡ-Ｚ]/.test(before) && /[0-9a-zA-Z]/.test(after);
}
function isHalfWidthToFullWidth(before, after) {
    return /[0-9a-zA-Z]/.test(before) && /[０-９ａ-ｚＡ-Ｚ]/.test(after);
}

function isOkuriganaVariant(before, after) {
    // 例: 申し込み ↔ 申込
    // 漢字を含まないケース（カタカナ語の長音差等）はここで捕捉しない。
    // 漢字が無いと、長音差のカタカナ語まで「送り仮名」と誤判定されるため。
    if (!/[一-鿿]/.test(before) || !/[一-鿿]/.test(after)) {
        return false;
    }
    const kanjiBefore = before.replace(/[\u3040-\u309F]/g, ''); // ひらがな除去
    const kanjiAfter = after.replace(/[\u3040-\u309F]/g, '');
    return kanjiBefore === kanjiAfter && before !== after;
}

function isChouonVariant(before, after) {
    // 例: サーバー ↔ サーバ、コンピューター ↔ コンピュータ
    // 末尾だけでなく語中の長音差も検出するため、両者から
    // 全ての長音記号を除いて比較する。
    if (before === after) return false;
    const stripChouon = (s) => s.replace(/ー/g, '');
    return stripChouon(before) === stripChouon(after);
}

function isKatakanaVariant(before, after) {
    return /[\u30A0-\u30FF]{2,}/.test(before) && /[\u30A0-\u30FF]{2,}/.test(after);
}

function isPunctuationChange(before, after) {
    const punctuation = /^[。、．，.,:：;；!！?？]+$/;
    return punctuation.test(before) || punctuation.test(after);
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 2つのテキスト間のシンプルな差分を抽出
 * @param {string} original - 修正前テキスト全体
 * @param {string} revised - 修正後テキスト全体
 * @returns {DiffPair[]}
 */
export function extractDiffs(original, revised) {
    // 文字単位 LCS（日本語はスペース区切りがないため文字レベルで差分を取る）
    const a = Array.from(original);
    const b = Array.from(revised);
    const n = a.length;
    const m = b.length;

    // LCS 長テーブル
    const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j]
                ? lcs[i + 1][j + 1] + 1
                : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }

    // バックトラックして edit script を生成（'=' 共通 / '-' 削除 / '+' 挿入）
    const ops = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            ops.push({ type: '=' });
            i++;
            j++;
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            ops.push({ type: '-', ch: a[i] });
            i++;
        } else {
            ops.push({ type: '+', ch: b[j] });
            j++;
        }
    }
    while (i < n) ops.push({ type: '-', ch: a[i++] });
    while (j < m) ops.push({ type: '+', ch: b[j++] });

    // 連続する削除＋挿入ランを1つの差分ペアにまとめる
    const diffs = [];
    let pos = 0;
    let k = 0;
    while (k < ops.length) {
        if (ops[k].type === '=') {
            pos++;
            k++;
            continue;
        }
        const startPos = pos;
        let before = '';
        let after = '';
        while (k < ops.length && ops[k].type !== '=') {
            if (ops[k].type === '-') {
                before += ops[k].ch;
                pos++;
            } else {
                after += ops[k].ch;
            }
            k++;
        }
        before = before.trim();
        after = after.trim();
        if (before || after) {
            diffs.push({ before, after, context: `position ${startPos}` });
        }
    }

    return diffs;
}
