/**
 * 原稿正規化エンジン — 読み人知らず PHASE 1
 * 
 * 入力テキスト → 構造解析 → ルール適用 → 三者合議検証 → 正規化済み原稿
 * 
 * 設計原則: 入口で全ての地雷を除去する
 * - 表記揺れ → 推奨表記に統一
 * - 数字全半角 → ルール準拠で統一
 * - 句読点 → 統一
 * - 不適切表現 → 置換
 */

import { CouncilEngine } from '../council/councilEngine.js';
import { createInputCouncilAgents } from '../council/agents.js';
import { buildSemanticMap } from './semanticMap.js';
import { detectHyokiYure } from '../japanese/proofreadingDictionary.js';

/**
 * @typedef {Object} NormalizationResult
 * @property {string} normalizedText - 正規化済みテキスト
 * @property {Object} semanticMap - セマンティックマップ
 * @property {Object} councilVerdict - 三者合議の結果
 * @property {Object[]} appliedFixes - 適用された修正のリスト
 * @property {Object} stats - 統計情報
 */

/**
 * 正規化ルール定義
 */
const DEFAULT_RULES = {
    // 数字表記: 'halfwidth' | 'fullwidth' | 'keep'
    numberStyle: 'halfwidth',
    // 句読点: ['。', '、'] | ['．', '，'] 
    punctuation: ['。', '、'],
    // アルファベット: 'halfwidth' | 'fullwidth'
    alphabetStyle: 'halfwidth',
    // 長音記号統一 (コンピューター → コンピュータ or vice versa)
    chouon: 'with', // 'with' = サーバー, 'without' = サーバ
    // スペース正規化
    normalizeSpaces: true,
};

/**
 * 正規化パイプラインを実行
 * @param {string} text - 入力テキスト
 * @param {Object} [options]
 * @param {Object} [options.rules] - 正規化ルール（DEFAULT_RULESとマージ）
 * @param {Object} [options.customerRules] - 顧客別ルール
 * @param {boolean} [options.dryRun=false] - trueの場合、修正を適用せず報告のみ
 * @param {boolean} [options.skipCouncil=false] - 合議をスキップ
 * @returns {Promise<NormalizationResult>}
 */
export async function normalize(text, options = {}) {
    if (!text || !text.trim()) {
        return {
            normalizedText: text || '',
            semanticMap: { elements: [], structure: { children: [] }, stats: { totalElements: 0, lineCount: 0 } },
            councilVerdict: null,
            appliedFixes: [],
            stats: { originalLength: 0, normalizedLength: 0, fixCount: 0 },
        };
    }

    const rules = { ...DEFAULT_RULES, ...options.rules };
    const customerRules = options.customerRules || {};

    // ── 1. セマンティックマップ生成 ──
    const semanticMap = buildSemanticMap(text);

    // ── 2. ルールベース正規化 ──
    let normalized = text;
    const appliedFixes = [];

    // 2a. スペース正規化
    if (rules.normalizeSpaces) {
        const beforeSpaces = normalized;
        // 全角スペース連続 → 1つに
        normalized = normalized.replace(/[\s　]{2,}/g, (match) => {
            if (match.includes('\n')) return '\n'; // 改行は維持
            return '　';
        });
        // 行末の空白除去
        normalized = normalized.replace(/[ \t　]+$/gm, '');
        if (normalized !== beforeSpaces) {
            appliedFixes.push({ type: 'spaces', description: 'スペース正規化', rule: 'normalizeSpaces' });
        }
    }

    // 2b. 数字表記統一
    if (rules.numberStyle === 'halfwidth') {
        const before = normalized;
        normalized = normalized.replace(/[０-９]/g, ch =>
            String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30)
        );
        if (normalized !== before) {
            appliedFixes.push({ type: 'numbers', description: '全角数字→半角', rule: 'numberStyle=halfwidth' });
        }
    } else if (rules.numberStyle === 'fullwidth') {
        const before = normalized;
        normalized = normalized.replace(/[0-9]/g, ch =>
            String.fromCharCode(ch.charCodeAt(0) - 0x30 + 0xFF10)
        );
        if (normalized !== before) {
            appliedFixes.push({ type: 'numbers', description: '半角数字→全角', rule: 'numberStyle=fullwidth' });
        }
    }

    // 2c. アルファベット表記統一
    if (rules.alphabetStyle === 'halfwidth') {
        const before = normalized;
        normalized = normalized.replace(/[ａ-ｚＡ-Ｚ]/g, ch =>
            String.fromCharCode(ch.charCodeAt(0) - (ch >= 'ａ' ? 0xFF41 - 0x61 : 0xFF21 - 0x41))
        );
        if (normalized !== before) {
            appliedFixes.push({ type: 'alphabet', description: '全角英字→半角', rule: 'alphabetStyle=halfwidth' });
        }
    }

    // 2d. 句読点統一
    if (rules.punctuation) {
        const [period, comma] = rules.punctuation;
        const before = normalized;

        if (period === '。') {
            normalized = normalized.replace(/．(?![0-9])/g, '。');
        } else if (period === '．') {
            normalized = normalized.replace(/。/g, '．');
        }

        if (comma === '、') {
            normalized = normalized.replace(/，/g, '、');
        } else if (comma === '，') {
            normalized = normalized.replace(/、/g, '，');
        }

        if (normalized !== before) {
            appliedFixes.push({ type: 'punctuation', description: `句読点統一: ${period}${comma}`, rule: 'punctuation' });
        }
    }

    // 2e. 表記揺れ自動修正
    const hyokiResult = detectHyokiYure(normalized);
    for (const issue of hyokiResult.issues) {
        if (issue.recommended) {
            for (const variant of issue.variants) {
                if (variant !== issue.recommended) {
                    const before = normalized;
                    normalized = normalized.split(variant).join(issue.recommended);
                    if (normalized !== before) {
                        appliedFixes.push({
                            type: 'hyoki_yure',
                            description: `表記統一: ${variant} → ${issue.recommended}`,
                            from: variant,
                            to: issue.recommended,
                            category: issue.category,
                        });
                    }
                }
            }
        }
    }

    // ── 3. 三者合議検証 ──
    let councilVerdict = null;
    if (!options.skipCouncil) {
        const engine = new CouncilEngine({ timeout: 10000 });
        const agents = createInputCouncilAgents(customerRules);
        councilVerdict = await engine.deliberate(agents, normalized);
    }

    // ── 4. dryRunの場合は元テキストを返す ──
    if (options.dryRun) {
        normalized = text;
    }

    return {
        normalizedText: normalized,
        semanticMap,
        councilVerdict,
        appliedFixes,
        stats: {
            originalLength: text.length,
            normalizedLength: normalized.length,
            fixCount: appliedFixes.length,
            councilApproved: councilVerdict?.approved ?? null,
            councilConfidence: councilVerdict?.confidence ?? null,
        },
    };
}

/**
 * バレルエクスポート
 */
export { buildSemanticMap } from './semanticMap.js';
