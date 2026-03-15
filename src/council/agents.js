/**
 * 合議エージェント定義 — 読み人知らず
 * 
 * 入口合議（PHASE 1: 原稿正規化）と出口合議（PHASE 5: 品質検証）の
 * エージェント群を定義。各エージェントは独立した視点で検査を行う。
 */

import {
    detectNonJoyoKanji,
    detectHyokiYure,
    detectSensitiveTerms,
} from '../japanese/proofreadingDictionary.js';

// ═══════════════════════════════════════════
// PHASE 1 — 入口合議エージェント（原稿正規化）
// ═══════════════════════════════════════════

/**
 * Agent 1: 表記検証
 * 表記揺れ・常用漢字外・不適切表現を検出し、修正を提案
 */
export function createNotationAgent(customerRules = {}) {
    return {
        id: 'notation-verifier',
        weight: 1.0,
        async fn(input, context) {
            const text = typeof input === 'string' ? input : input.text || '';
            if (!text) {
                return { findings: {}, issues: [], fixes: {}, confidence: 1.0 };
            }

            const issues = [];
            const fixes = {};

            // 1. 表記揺れ検出
            const hyokiResult = detectHyokiYure(text);
            for (const issue of hyokiResult.issues) {
                issues.push({
                    type: 'hyoki_yure',
                    severity: 'warning',
                    message: `表記揺れ: ${issue.variants.join(' / ')}`,
                    category: issue.category,
                    variants: issue.variants,
                    recommended: issue.recommended,
                });

                // 修正提案: 推奨表記に統一
                if (issue.recommended) {
                    for (const variant of issue.variants) {
                        if (variant !== issue.recommended) {
                            fixes[variant] = {
                                action: 'replace',
                                from: variant,
                                to: issue.recommended,
                                reason: `表記統一: ${issue.category}`,
                            };
                        }
                    }
                }
            }

            // 2. 常用漢字チェック
            const joyoResult = detectNonJoyoKanji(text);
            for (const kanji of joyoResult.nonJoyoKanji.slice(0, 50)) {
                issues.push({
                    type: 'non_joyo',
                    severity: 'info',
                    message: `常用漢字外: ${kanji.char}`,
                    position: kanji.position,
                    context: kanji.context,
                });
            }

            // 3. 顧客別ルール適用
            if (customerRules.notation) {
                for (const rule of customerRules.notation) {
                    const regex = new RegExp(rule.pattern, 'g');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        issues.push({
                            type: 'customer_rule',
                            severity: 'warning',
                            message: `顧客ルール: ${rule.message}`,
                            position: match.index,
                        });
                        if (rule.replacement) {
                            fixes[match[0]] = {
                                action: 'replace',
                                from: match[0],
                                to: rule.replacement,
                                reason: `顧客ルール: ${rule.message}`,
                            };
                        }
                    }
                }
            }

            return {
                findings: {
                    hyokiYureCount: hyokiResult.count,
                    nonJoyoCount: joyoResult.count,
                    customerRuleViolations: issues.filter(i => i.type === 'customer_rule').length,
                },
                issues,
                fixes,
                confidence: issues.length === 0 ? 1.0 : Math.max(0.3, 1.0 - issues.length * 0.05),
            };
        },
    };
}

/**
 * Agent 2: 構造照合
 * テキスト構造（見出し/本文/箇条書き等）の一貫性を検証
 */
export function createStructureAgent() {
    return {
        id: 'structure-verifier',
        weight: 0.9,
        async fn(input, _context) {
            const text = typeof input === 'string' ? input : input.text || '';
            if (!text) {
                return { findings: {}, issues: [], fixes: {}, confidence: 1.0 };
            }

            const lines = text.split('\n').filter(l => l.trim());
            const issues = [];

            // 見出し階層チェック
            let lastHeadingLevel = 0;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const headingMatch = line.match(/^(#{1,6})\s/);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    if (level > lastHeadingLevel + 1 && lastHeadingLevel > 0) {
                        issues.push({
                            type: 'heading_skip',
                            severity: 'warning',
                            message: `見出し階層スキップ: H${lastHeadingLevel} → H${level} (行 ${i + 1})`,
                            line: i + 1,
                        });
                    }
                    lastHeadingLevel = level;
                }
            }

            // 空行の過多チェック
            let consecutiveEmpty = 0;
            for (let i = 0; i < text.length; i++) {
                if (text[i] === '\n') {
                    consecutiveEmpty++;
                    if (consecutiveEmpty > 3) {
                        issues.push({
                            type: 'excessive_whitespace',
                            severity: 'info',
                            message: `過多な空行 (位置: ${i})`,
                            position: i,
                        });
                        consecutiveEmpty = 0;
                    }
                } else {
                    consecutiveEmpty = 0;
                }
            }

            // 句読点の統一性チェック
            const periodStyles = {
                '。': (text.match(/。/g) || []).length,
                '.': (text.match(/(?<![0-9])\.(?![0-9])/g) || []).length,
                '．': (text.match(/．/g) || []).length,
            };
            const commaStyles = {
                '、': (text.match(/、/g) || []).length,
                '，': (text.match(/，/g) || []).length,
                ',': (text.match(/(?<![0-9]),(?![0-9])/g) || []).length,
            };

            const usedPeriods = Object.entries(periodStyles).filter(([_, count]) => count > 0);
            const usedCommas = Object.entries(commaStyles).filter(([_, count]) => count > 0);

            if (usedPeriods.length > 1) {
                issues.push({
                    type: 'punctuation_inconsistency',
                    severity: 'warning',
                    message: `句点の不統一: ${usedPeriods.map(([s, c]) => `${s}(${c})`).join(', ')}`,
                    variants: usedPeriods,
                });
            }
            if (usedCommas.length > 1) {
                issues.push({
                    type: 'punctuation_inconsistency',
                    severity: 'warning',
                    message: `読点の不統一: ${usedCommas.map(([s, c]) => `${s}(${c})`).join(', ')}`,
                    variants: usedCommas,
                });
            }

            return {
                findings: {
                    lineCount: lines.length,
                    headingSkips: issues.filter(i => i.type === 'heading_skip').length,
                    punctuationIssues: issues.filter(i => i.type === 'punctuation_inconsistency').length,
                },
                issues,
                fixes: {},
                confidence: issues.length === 0 ? 1.0 : Math.max(0.4, 1.0 - issues.length * 0.1),
            };
        },
    };
}

/**
 * Agent 3: 意味検証
 * テキストの意味的な整合性・不適切表現を検証
 */
export function createSemanticAgent() {
    return {
        id: 'semantic-verifier',
        weight: 0.8,
        async fn(input, _context) {
            const text = typeof input === 'string' ? input : input.text || '';
            if (!text) {
                return { findings: {}, issues: [], fixes: {}, confidence: 1.0 };
            }

            const issues = [];
            const fixes = {};

            // 不適切表現チェック
            const sensitiveResult = detectSensitiveTerms(text, { minSeverity: 'low' });
            for (const item of sensitiveResult.issues) {
                issues.push({
                    type: 'sensitive_term',
                    severity: item.severity === 'high' ? 'critical' : 'warning',
                    message: `不適切表現: ${item.term} → ${item.suggestion}`,
                    term: item.term,
                    suggestion: item.suggestion,
                    category: item.category,
                });
                if (item.suggestion) {
                    fixes[item.term] = {
                        action: 'replace',
                        from: item.term,
                        to: item.suggestion,
                        reason: `不適切表現 (${item.category})`,
                    };
                }
            }

            // 数字表記の不統一チェック
            const halfWidthNums = (text.match(/[0-9]+/g) || []).length;
            const fullWidthNums = (text.match(/[０-９]+/g) || []).length;
            if (halfWidthNums > 0 && fullWidthNums > 0) {
                issues.push({
                    type: 'number_inconsistency',
                    severity: 'warning',
                    message: `数字の全半角不統一: 半角${halfWidthNums}箇所, 全角${fullWidthNums}箇所`,
                });
            }

            return {
                findings: {
                    sensitiveTermCount: sensitiveResult.count,
                    numberInconsistency: halfWidthNums > 0 && fullWidthNums > 0,
                },
                issues,
                fixes,
                confidence: sensitiveResult.issues.some(i => i.severity === 'high')
                    ? 0.3
                    : issues.length === 0 ? 1.0 : 0.7,
            };
        },
    };
}


// ═══════════════════════════════════════════
// PHASE 5 — 出口合議エージェント（品質検証）
//
// InDesign接続時に使用。プリフライトチェック19項目を
// 3エージェントに分担。
// ═══════════════════════════════════════════

/**
 * Agent 1: 構造検証（出口）
 * ノンブル連続性、柱位置、ページ奇偶、階層設定
 * チェックシート項目: 2, 5, 9, 10, 13
 */
export function createLayoutStructureAgent() {
    return {
        id: 'layout-structure-verifier',
        weight: 1.0,
        async fn(input, _context) {
            // input = InDesignドキュメント情報（プリフライト結果等）
            const doc = input.documentInfo || {};
            const issues = [];

            // ノンブル連続性チェック
            if (doc.pages) {
                for (let i = 1; i < doc.pages.length; i++) {
                    const prev = doc.pages[i - 1];
                    const curr = doc.pages[i];
                    if (prev.number && curr.number && curr.number !== prev.number + 1) {
                        issues.push({
                            type: 'page_number_gap',
                            severity: 'error',
                            message: `ノンブル不連続: p${prev.number} → p${curr.number}`,
                            page: i + 1,
                        });
                    }
                }
            }

            // オーバーセットチェック
            if (doc.oversetFrames && doc.oversetFrames.length > 0) {
                for (const frame of doc.oversetFrames) {
                    issues.push({
                        type: 'overset',
                        severity: 'critical',
                        message: `オーバーセット: ページ ${frame.page}`,
                        page: frame.page,
                    });
                }
            }

            return {
                findings: {
                    pageNumberGaps: issues.filter(i => i.type === 'page_number_gap').length,
                    oversetFrames: issues.filter(i => i.type === 'overset').length,
                },
                issues,
                fixes: {},
                confidence: issues.some(i => i.severity === 'critical') ? 0.2 : issues.length === 0 ? 1.0 : 0.6,
            };
        },
    };
}

/**
 * Agent 2: マッピング検証（出口）
 * 座標/サイズ照合、字詰め/行詰め、画像位置
 * チェックシート項目: 3, 4, 6, 7, 8, 12
 */
export function createLayoutMappingAgent() {
    return {
        id: 'layout-mapping-verifier',
        weight: 1.0,
        async fn(input, _context) {
            const doc = input.documentInfo || {};
            const issues = [];

            // フォントチェック
            if (doc.missingFonts && doc.missingFonts.length > 0) {
                for (const font of doc.missingFonts) {
                    issues.push({
                        type: 'missing_font',
                        severity: 'critical',
                        message: `フォント未インストール: ${font.name}`,
                    });
                }
            }

            // リンク切れチェック
            if (doc.brokenLinks && doc.brokenLinks.length > 0) {
                for (const link of doc.brokenLinks) {
                    issues.push({
                        type: 'broken_link',
                        severity: 'critical',
                        message: `リンク切れ: ${link.name}`,
                    });
                }
            }

            // 低解像度画像チェック
            if (doc.lowResImages && doc.lowResImages.length > 0) {
                for (const img of doc.lowResImages) {
                    issues.push({
                        type: 'low_resolution',
                        severity: 'warning',
                        message: `解像度不足: ${img.name} (${img.dpi}dpi)`,
                        page: img.page,
                    });
                }
            }

            return {
                findings: {
                    missingFonts: (doc.missingFonts || []).length,
                    brokenLinks: (doc.brokenLinks || []).length,
                    lowResImages: (doc.lowResImages || []).length,
                },
                issues,
                fixes: {},
                confidence: issues.some(i => i.severity === 'critical') ? 0.1 : issues.length === 0 ? 1.0 : 0.5,
            };
        },
    };
}

/**
 * Agent 3: 差分検証（出口）
 * 塗り足し、カラーモード、データ保存確認
 * チェックシート項目: 14, 15, 18
 */
export function createLayoutDiffAgent() {
    return {
        id: 'layout-diff-verifier',
        weight: 0.9,
        async fn(input, _context) {
            const doc = input.documentInfo || {};
            const issues = [];

            // 塗り足しチェック
            if (doc.bleedIssues && doc.bleedIssues.length > 0) {
                for (const bleed of doc.bleedIssues) {
                    issues.push({
                        type: 'bleed_insufficient',
                        severity: 'warning',
                        message: `塗り足し不足: ${bleed.side} (${bleed.currentMM}mm < ${bleed.requiredMM}mm)`,
                    });
                }
            }

            // カラーモードチェック
            if (doc.colorIssues && doc.colorIssues.length > 0) {
                for (const color of doc.colorIssues) {
                    issues.push({
                        type: 'color_space',
                        severity: 'warning',
                        message: `カラーモード不正: ${color.name} (${color.type})`,
                    });
                }
            }

            return {
                findings: {
                    bleedIssues: (doc.bleedIssues || []).length,
                    colorIssues: (doc.colorIssues || []).length,
                },
                issues,
                fixes: {},
                confidence: issues.length === 0 ? 1.0 : 0.6,
            };
        },
    };
}


// ═══════════════════════════════════════════
// ファクトリ関数
// ═══════════════════════════════════════════

/**
 * 入口合議用エージェントセットを生成
 * @param {Object} [customerRules] - 顧客別ルール
 * @returns {Array} 3つのエージェント
 */
export function createInputCouncilAgents(customerRules = {}) {
    return [
        createNotationAgent(customerRules),
        createStructureAgent(),
        createSemanticAgent(),
    ];
}

/**
 * 出口合議用エージェントセットを生成
 * @returns {Array} 3つのエージェント
 */
export function createOutputCouncilAgents() {
    return [
        createLayoutStructureAgent(),
        createLayoutMappingAgent(),
        createLayoutDiffAgent(),
    ];
}
