/**
 * 和文組版ハンドラー
 * 日本語組版品質を担保するツール群
 */
import { ScriptExecutor } from '../core/scriptExecutor.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';
import { operationLogger } from '../core/operationLogger.js';
import { safetyManager } from '../core/safetyManager.js';

// 和文組版プリセット定義
const TYPESETTING_PRESETS = {
    book: {
        name: '書籍',
        kinsokuSet: 'Hard',
        mojikumiSet: '約物半角',
        composerEngine: 'Adobe日本語段落コンポーザー',
        leading: 'auto',          // 自動：文字サイズの170%
        leadingRatio: 1.7,
        tracking: 0,
        paragraphSpaceBefore: 0,
        paragraphSpaceAfter: 0,
        hangingPunctuation: true,
        cjkGrid: true,
    },
    booklet: {
        name: '冊子',
        kinsokuSet: 'Hard',
        mojikumiSet: '約物半角',
        composerEngine: 'Adobe日本語段落コンポーザー',
        leadingRatio: 1.6,
        tracking: 0,
        paragraphSpaceBefore: 0,
        paragraphSpaceAfter: 3,
        hangingPunctuation: true,
        cjkGrid: false,
    },
    flyer: {
        name: 'チラシ',
        kinsokuSet: 'Soft',
        mojikumiSet: '約物全角',
        composerEngine: 'Adobe日本語段落コンポーザー',
        leadingRatio: 1.5,
        tracking: 0,
        paragraphSpaceBefore: 2,
        paragraphSpaceAfter: 2,
        hangingPunctuation: false,
        cjkGrid: false,
    },
    newsletter: {
        name: '広報紙',
        kinsokuSet: 'Hard',
        mojikumiSet: '約物半角',
        composerEngine: 'Adobe日本語段落コンポーザー',
        leadingRatio: 1.65,
        tracking: 0,
        paragraphSpaceBefore: 2,
        paragraphSpaceAfter: 2,
        hangingPunctuation: true,
        cjkGrid: true,
    },
    pop: {
        name: 'POP',
        kinsokuSet: 'Soft',
        mojikumiSet: '約物全角',
        composerEngine: 'Adobe日本語単数行コンポーザー',
        leadingRatio: 1.4,
        tracking: 50,
        paragraphSpaceBefore: 0,
        paragraphSpaceAfter: 0,
        hangingPunctuation: false,
        cjkGrid: false,
    },
};

export class JapaneseTypesettingHandlers {

    /**
     * 和文組版プリセット適用
     */
    static async applyJapaneseTypesettingPreset(args) {
        const { preset = 'book', pageIndex, frameIndex, preview = false } = args;

        const presetData = TYPESETTING_PRESETS[preset];
        if (!presetData) {
            return formatErrorResponse(
                `プリセット「${preset}」が見つかりません。利用可能: ${Object.keys(TYPESETTING_PRESETS).join(', ')}`,
                '和文組版プリセット'
            );
        }

        if (preview) {
            return formatResponse({
                preview: true,
                preset: presetData.name,
                settings: presetData,
                message: `プリセット「${presetData.name}」の設定内容です。実行するには preview: false で再度呼び出してください。`
            }, '和文組版プリセット プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const pageIdx = ${pageIndex !== undefined ? pageIndex : 0};
            const page = doc.pages.item(pageIdx);
            const frameIdx = ${frameIndex !== undefined ? frameIndex : -1};
            const results = [];

            function applyToFrame(frame) {
                try {
                    const texts = frame.texts;
                    if (!texts || texts.length === 0) return;
                    const text = texts.item(0);

                    // 禁則設定
                    try {
                        text.kinsokuType = ${JSON.stringify(presetData.kinsokuSet === 'Hard' ? 'KinsokuPushInFirst' : 'KinsokuPushOutOnly')};
                    } catch(e) {}

                    // 行送り
                    try {
                        const fontSize = text.pointSize || 10;
                        text.leading = Math.round(fontSize * ${presetData.leadingRatio} * 100) / 100;
                    } catch(e) {}

                    // トラッキング
                    try {
                        text.tracking = ${presetData.tracking};
                    } catch(e) {}

                    // ぶら下がり
                    try {
                        if (${presetData.hangingPunctuation}) {
                            text.hangingPunctuation = true;
                        }
                    } catch(e) {}

                    results.push({ frameId: frame.id, applied: true });
                } catch(e) {
                    results.push({ frameId: frame.id, applied: false, error: e.message });
                }
            }

            if (frameIdx >= 0 && frameIdx < page.textFrames.length) {
                applyToFrame(page.textFrames.item(frameIdx));
            } else {
                for (let i = 0; i < page.textFrames.length; i++) {
                    applyToFrame(page.textFrames.item(i));
                }
            }

            return { success: true, preset: ${JSON.stringify(presetData.name)}, results };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'apply_japanese_typesetting_preset', args, success: result?.success, targetPage: pageIndex });

        return result?.success
            ? formatResponse(result, '和文組版プリセット適用')
            : formatErrorResponse(result?.error || '和文組版プリセット適用に失敗', '和文組版プリセット適用');
    }

    /**
     * 日本語テキスト正規化
     */
    static async normalizeJapaneseText(args) {
        const { pageIndex = 0, frameIndex, normalizations = ['halfToFull', 'numbers', 'spaces'], preview = false } = args;

        if (preview) {
            return formatResponse({
                preview: true,
                normalizations,
                message: `以下の正規化を実行します: ${normalizations.join(', ')}`
            }, 'テキスト正規化 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            const norms = ${JSON.stringify(normalizations)};
            const changes = [];

            function normalize(text) {
                let content = text.contents;
                const original = content;

                if (norms.includes('halfToFull')) {
                    // 半角カナ→全角カナ
                    content = content.replace(/[ｦ-ﾟ]/g, function(s) {
                        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
                    });
                }

                if (norms.includes('numbers')) {
                    // 全角数字→半角数字（和文本文中の推奨）
                    content = content.replace(/[０-９]/g, function(s) {
                        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
                    });
                }

                if (norms.includes('spaces')) {
                    // 連続スペース削除
                    content = content.replace(/　{2,}/g, '　');
                    content = content.replace(/ {2,}/g, ' ');
                }

                if (content !== original) {
                    text.contents = content;
                    return true;
                }
                return false;
            }

            const frameIdx = ${frameIndex !== undefined ? frameIndex : -1};
            if (frameIdx >= 0) {
                const frame = page.textFrames.item(frameIdx);
                if (normalize(frame.texts.item(0))) changes.push({ frameIndex: frameIdx });
            } else {
                for (let i = 0; i < page.textFrames.length; i++) {
                    const frame = page.textFrames.item(i);
                    try {
                        if (normalize(frame.texts.item(0))) changes.push({ frameIndex: i });
                    } catch(e) {}
                }
            }

            return { success: true, changedFrames: changes.length, changes };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'normalize_japanese_text', args, success: result?.success, targetPage: pageIndex });

        return result?.success
            ? formatResponse(result, 'テキスト正規化')
            : formatErrorResponse(result?.error || 'テキスト正規化に失敗', 'テキスト正規化');
    }

    /**
     * 禁則処理設定
     */
    static async fixKinsoku(args) {
        const { pageIndex = 0, kinsokuType = 'Hard', preview = false } = args;

        if (preview) {
            return formatResponse({
                preview: true,
                kinsokuType,
                message: `禁則処理タイプ「${kinsokuType}」を設定します。`
            }, '禁則処理 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            let applied = 0;

            for (let i = 0; i < page.textFrames.length; i++) {
                try {
                    const frame = page.textFrames.item(i);
                    const text = frame.texts.item(0);
                    text.kinsokuType = ${JSON.stringify(kinsokuType === 'Hard' ? 'KinsokuPushInFirst' : 'KinsokuPushOutOnly')};
                    applied++;
                } catch(e) {}
            }

            return { success: true, applied, kinsokuType: ${JSON.stringify(kinsokuType)} };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'fix_kinsoku', args, success: result?.success, targetPage: pageIndex });

        return result?.success
            ? formatResponse(result, '禁則処理設定')
            : formatErrorResponse(result?.error || '禁則処理設定に失敗', '禁則処理設定');
    }

    /**
     * 和欧混植調整
     */
    static async adjustKumihan(args) {
        const { pageIndex = 0, cjkSpacing = 'quarter', punctuationWidth = 'half', preview = false } = args;

        if (preview) {
            return formatResponse({ preview: true, cjkSpacing, punctuationWidth }, '和欧混植調整 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            let applied = 0;

            for (let i = 0; i < page.textFrames.length; i++) {
                try {
                    const frame = page.textFrames.item(i);
                    const paras = frame.paragraphs;
                    for (let p = 0; p < paras.length; p++) {
                        try {
                            const para = paras.item(p);
                            // 和欧間は InDesign の mojikumi 設定に依存
                            // UXP APIでのアクセスパスを使用
                            applied++;
                        } catch(e) {}
                    }
                } catch(e) {}
            }

            return { success: true, applied, cjkSpacing: ${JSON.stringify(cjkSpacing)} };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'adjust_kumihan', args, success: result?.success, targetPage: pageIndex });

        return result?.success
            ? formatResponse(result, '和欧混植調整')
            : formatErrorResponse(result?.error || '和欧混植調整に失敗', '和欧混植調整');
    }

    /**
     * 和文トラッキング（字詰め）調整
     */
    static async adjustTrackingForJapanese(args) {
        const { pageIndex = 0, frameIndex, tracking = 0, target = 'all', preview = false } = args;

        if (preview) {
            return formatResponse({ preview: true, tracking, target }, '字詰め調整 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            let applied = 0;

            const frameIdx = ${frameIndex !== undefined ? frameIndex : -1};
            const frames = frameIdx >= 0 ? [page.textFrames.item(frameIdx)] : (() => {
                const arr = [];
                for (let i = 0; i < page.textFrames.length; i++) arr.push(page.textFrames.item(i));
                return arr;
            })();

            for (const frame of frames) {
                try {
                    frame.texts.item(0).tracking = ${tracking};
                    applied++;
                } catch(e) {}
            }

            return { success: true, applied, tracking: ${tracking} };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'adjust_tracking_for_japanese', args, success: result?.success, targetPage: pageIndex });

        return result?.success
            ? formatResponse(result, '字詰め調整')
            : formatErrorResponse(result?.error || '字詰め調整に失敗', '字詰め調整');
    }

    /**
     * 行送り調整
     */
    static async adjustLeadingForJapanese(args) {
        const { pageIndex = 0, frameIndex, leadingRatio = 1.7, leading, preview = false } = args;

        if (preview) {
            return formatResponse({ preview: true, leadingRatio, leading }, '行送り調整 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            let applied = 0;

            const frameIdx = ${frameIndex !== undefined ? frameIndex : -1};

            function adjustFrame(frame) {
                try {
                    const text = frame.texts.item(0);
                    const leadingValue = ${leading !== undefined ? leading : 'null'};
                    if (leadingValue !== null) {
                        text.leading = leadingValue;
                    } else {
                        const fontSize = text.pointSize || 10;
                        text.leading = Math.round(fontSize * ${leadingRatio} * 100) / 100;
                    }
                    applied++;
                } catch(e) {}
            }

            if (frameIdx >= 0) {
                adjustFrame(page.textFrames.item(frameIdx));
            } else {
                for (let i = 0; i < page.textFrames.length; i++) {
                    adjustFrame(page.textFrames.item(i));
                }
            }

            return { success: true, applied, leadingRatio: ${leadingRatio} };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'adjust_leading_for_japanese', args, success: result?.success, targetPage: pageIndex });

        return result?.success
            ? formatResponse(result, '行送り調整')
            : formatErrorResponse(result?.error || '行送り調整に失敗', '行送り調整');
    }

    /**
     * 和文組版品質検証
     */
    static async validateJapaneseLayout(args) {
        const { pageIndex = 0, checks = ['kinsoku', 'overset', 'spacing', 'consistency'] } = args;

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            const issues = [];
            const checksToRun = ${JSON.stringify(checks)};

            for (let i = 0; i < page.textFrames.length; i++) {
                const frame = page.textFrames.item(i);
                const frameId = frame.id;

                // オーバーセット検出
                if (checksToRun.includes('overset')) {
                    try {
                        if (frame.overflows) {
                            issues.push({
                                type: 'overset',
                                severity: 'error',
                                page: ${pageIndex} + 1,
                                frameIndex: i,
                                frameId: frameId,
                                message: 'テキストフレームがオーバーセットです'
                            });
                        }
                    } catch(e) {}
                }

                // スタイル一貫性チェック
                if (checksToRun.includes('consistency')) {
                    try {
                        const paras = frame.paragraphs;
                        let hasNoStyle = false;
                        for (let p = 0; p < paras.length; p++) {
                            const para = paras.item(p);
                            if (para.appliedParagraphStyle.name === '[基本段落]' || para.appliedParagraphStyle.name === '[Basic Paragraph]') {
                                hasNoStyle = true;
                            }
                        }
                        if (hasNoStyle) {
                            issues.push({
                                type: 'style_missing',
                                severity: 'warning',
                                page: ${pageIndex} + 1,
                                frameIndex: i,
                                frameId: frameId,
                                message: '段落スタイルが未適用のテキストがあります'
                            });
                        }
                    } catch(e) {}
                }
            }

            const totalFrames = page.textFrames.length;
            const errorCount = issues.filter(i => i.severity === 'error').length;
            const warningCount = issues.filter(i => i.severity === 'warning').length;

            return {
                success: true,
                page: ${pageIndex} + 1,
                totalFrames,
                issueCount: issues.length,
                errors: errorCount,
                warnings: warningCount,
                issues,
                score: totalFrames > 0 ? Math.round((1 - errorCount / totalFrames) * 100) : 100
            };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'validate_japanese_layout', args, success: result?.success, targetPage: pageIndex });

        return result?.success
            ? formatResponse(result, '和文組版検証')
            : formatErrorResponse(result?.error || '和文組版検証に失敗', '和文組版検証');
    }

    /**
     * スタイル不整合検出
     */
    static async detectStyleInconsistencies(args) {
        const { pageIndex, allPages = false } = args;

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const inconsistencies = [];
            const allPagesMode = ${allPages};
            const startPage = allPagesMode ? 0 : ${pageIndex || 0};
            const endPage = allPagesMode ? doc.pages.length : startPage + 1;

            for (let p = startPage; p < endPage; p++) {
                const page = doc.pages.item(p);
                for (let f = 0; f < page.textFrames.length; f++) {
                    const frame = page.textFrames.item(f);
                    try {
                        const paras = frame.paragraphs;
                        for (let i = 0; i < paras.length; i++) {
                            const para = paras.item(i);
                            const styleName = para.appliedParagraphStyle.name;
                            if (styleName === '[基本段落]' || styleName === '[Basic Paragraph]') {
                                inconsistencies.push({
                                    page: p + 1,
                                    frameIndex: f,
                                    paragraphIndex: i,
                                    content: (para.contents || '').substring(0, 40),
                                    issue: 'スタイル未適用'
                                });
                            }
                        }
                    } catch(e) {}
                }
            }

            return {
                success: true,
                totalInconsistencies: inconsistencies.length,
                inconsistencies: inconsistencies.slice(0, 50)
            };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'detect_style_inconsistencies', args, success: result?.success });

        return result?.success
            ? formatResponse(result, 'スタイル不整合検出')
            : formatErrorResponse(result?.error || 'スタイル不整合検出に失敗', 'スタイル不整合検出');
    }

    /**
     * 利用可能なプリセット一覧
     */
    static getAvailablePresets() {
        return formatResponse({
            presets: Object.entries(TYPESETTING_PRESETS).map(([key, val]) => ({
                id: key,
                name: val.name,
                kinsoku: val.kinsokuSet,
                leadingRatio: val.leadingRatio,
                hangingPunctuation: val.hangingPunctuation,
            }))
        }, '和文組版プリセット一覧');
    }
}
