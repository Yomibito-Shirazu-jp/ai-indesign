/**
 * 縦書きハンドラー (CCPM: 検証優先)
 * 順序: 生成 → 変換 → 検証 → 修正 → 混在
 */
import { ScriptExecutor } from '../core/scriptExecutor.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';
import { operationLogger } from '../core/operationLogger.js';

export class VerticalTextHandlers {

    /**
     * 縦組みテキストフレーム生成
     */
    static async createVerticalTextFrame(args) {
        const { x = 20, y = 20, width = 200, height = 260, content = '', pageIndex = 0, preview = false } = args;

        if (preview) {
            return formatResponse({
                preview: true, plannedChanges: `縦組みテキストフレーム作成: ${width}×${height}mm, ページ${pageIndex + 1}`,
            }, '縦組みフレーム作成 プレビュー');
        }

        const ptX = x * 2.835; const ptY = y * 2.835;
        const ptW = width * 2.835; const ptH = height * 2.835;

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            try {
                const frame = page.textFrames.add();
                frame.geometricBounds = [${ptY}, ${ptX}, ${ptY + ptH}, ${ptX + ptW}];
                frame.contents = ${JSON.stringify(content)};
                // 縦組み設定 (TOP_ALIGN = 1953460256 = 'top ')
                try { frame.textFramePreferences.verticalJustification = 1953460256; } catch(e) {}
                try {
                    const story = frame.parentStory;
                    story.storyPreferences.storyOrientation = 1986359924;
                } catch(e) {
                    // fallback: フレーム単位
                    try { frame.texts.item(0).storyOrientation = 1986359924; } catch(e2) {}
                }
                return { success: true, id: frame.id, vertical: true, bounds: frame.geometricBounds };
            } catch(e) {
                return { success: false, error: e.message };
            }
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'create_vertical_text_frame', args, success: result?.success, scope: { pages: [pageIndex] } });
        return result?.success
            ? formatResponse(result, '縦組みテキストフレーム作成')
            : formatErrorResponse(result?.error || '縦組みフレーム作成に失敗', '縦組みフレーム作成');
    }

    /**
     * 横→縦変換
     */
    static async convertFrameToVertical(args) {
        const { pageIndex = 0, frameIndex, allFrames = false, preview = false } = args;

        if (preview) {
            return formatResponse({
                preview: true, plannedChanges: `ページ${pageIndex + 1}のフレームを縦組みに変換${allFrames ? '（全フレーム）' : ''}`,
            }, '縦組み変換 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            const results = [];
            const allMode = ${allFrames};
            const fIdx = ${frameIndex !== undefined ? frameIndex : -1};

            function convertFrame(frame, idx) {
                try {
                    const story = frame.parentStory;
                    story.storyPreferences.storyOrientation = 1986359924;
                    // 縦組みでは上から開始 (TOP_ALIGN = 1953460256)
                    try { frame.textFramePreferences.verticalJustification = 1953460256; } catch(e2) {}
                    results.push({ frameIndex: idx, id: frame.id, converted: true });
                } catch(e) {
                    results.push({ frameIndex: idx, id: frame.id, converted: false, error: e.message });
                }
            }

            if (allMode) {
                for (let i = 0; i < page.textFrames.length; i++) {
                    convertFrame(page.textFrames.item(i), i);
                }
            } else if (fIdx >= 0) {
                convertFrame(page.textFrames.item(fIdx), fIdx);
            }

            return { success: true, converted: results.filter(r => r.converted).length, results };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'convert_frame_to_vertical', args, success: result?.success, scope: { pages: [pageIndex] } });
        return result?.success
            ? formatResponse(result, '縦組み変換')
            : formatErrorResponse(result?.error || '縦組み変換に失敗', '縦組み変換');
    }

    /**
     * 縦書き品質検証（CCPM: 検証を先に強化）
     */
    static async validateVerticalLayout(args) {
        const { pageIndex = 0 } = args;

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            const issues = [];
            let verticalFrameCount = 0;

            for (let i = 0; i < page.textFrames.length; i++) {
                const frame = page.textFrames.item(i);
                try {
                    const story = frame.parentStory;
                    let isVertical = false;
                    try {
                        isVertical = (story.storyPreferences.storyOrientation === 1986359924);
                    } catch(e) {}

                    if (!isVertical) continue;
                    verticalFrameCount++;

                    // オーバーセットチェック
                    if (frame.overflows) {
                        issues.push({ type: 'overset', severity: 'error', frameIndex: i, message: '縦組みフレームがオーバーセットです' });
                    }

                    // テキスト内容を検査
                    const content = frame.contents || '';

                    // 半角数字チェック（2桁以上は崩れやすい）
                    const numMatches = content.match(/[0-9]{2,}/g);
                    if (numMatches) {
                        issues.push({
                            type: 'number_display', severity: 'warning', frameIndex: i,
                            message: '縦組み中に2桁以上の半角数字があります。縦中横の設定を確認してください。',
                            details: numMatches.slice(0, 5)
                        });
                    }

                    // 半角英字チェック（横倒しになる）
                    const alphaMatches = content.match(/[a-zA-Z]{2,}/g);
                    if (alphaMatches) {
                        issues.push({
                            type: 'alpha_display', severity: 'warning', frameIndex: i,
                            message: '縦組み中に連続した半角英字があります。表示が不自然な可能性があります。',
                            details: alphaMatches.slice(0, 5)
                        });
                    }

                    // 括弧・約物チェック
                    const punctuation = content.match(/[（）「」『』【】〈〉《》()\\[\\]{}]/g);
                    if (punctuation && punctuation.length > 0) {
                        // 括弧の存在を報告（回転崩れの候補）
                        issues.push({
                            type: 'punctuation_rotation', severity: 'info', frameIndex: i,
                            message: '括弧・約物が含まれています。回転状態を確認してください。',
                            count: punctuation.length
                        });
                    }
                } catch(e) {}
            }

            const errors = issues.filter(i => i.severity === 'error').length;
            const warnings = issues.filter(i => i.severity === 'warning').length;

            return {
                success: true,
                page: ${pageIndex} + 1,
                verticalFrameCount,
                issueCount: issues.length,
                errors,
                warnings,
                issues,
                score: verticalFrameCount > 0 ? Math.round((1 - errors / Math.max(verticalFrameCount, 1)) * 100) : 100
            };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'validate_vertical_layout', args, success: result?.success, scope: { pages: [pageIndex] } });
        return result?.success
            ? formatResponse(result, '縦書き品質検証')
            : formatErrorResponse(result?.error || '縦書き検証に失敗', '縦書き品質検証');
    }

    /**
     * 縦中横設定
     */
    static async fixTatechuyoko(args) {
        const { pageIndex = 0, maxDigits = 2, applyToAlpha = false, preview = false } = args;

        if (preview) {
            return formatResponse({
                preview: true, plannedChanges: `縦中横設定: ${maxDigits}桁まで, 英字${applyToAlpha ? '対象' : '非対象'}`,
            }, '縦中横設定 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            let applied = 0;

            for (let i = 0; i < page.textFrames.length; i++) {
                const frame = page.textFrames.item(i);
                try {
                    const story = frame.parentStory;
                    let isVertical = false;
                    try { isVertical = (story.storyPreferences.storyOrientation === 1986359924); } catch(e) {}
                    if (!isVertical) continue;

                    // GREP検索で数字を縦中横に
                    app.findGrepPreferences = null;
                    app.changeGrepPreferences = null;
                    app.findGrepPreferences.findWhat = '[0-9]{1,${maxDigits}}';
                    app.changeGrepPreferences.tatechuyoko = true;
                    const changed = frame.changeGrep();
                    applied += changed ? changed.length : 0;

                    app.findGrepPreferences = null;
                    app.changeGrepPreferences = null;
                } catch(e) {}
            }

            return { success: true, applied, maxDigits: ${maxDigits} };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'fix_tatechuyoko', args, success: result?.success, scope: { pages: [pageIndex] } });
        return result?.success
            ? formatResponse(result, '縦中横設定')
            : formatErrorResponse(result?.error || '縦中横設定に失敗', '縦中横設定');
    }

    /**
     * 約物回転・句読点位置補正
     */
    static async fixVerticalPunctuation(args) {
        const { pageIndex = 0, preview = false } = args;

        if (preview) {
            return formatResponse({
                preview: true, plannedChanges: `ページ${pageIndex + 1}の縦組みフレームの約物補正`,
            }, '約物補正 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            let fixed = 0;

            for (let i = 0; i < page.textFrames.length; i++) {
                const frame = page.textFrames.item(i);
                try {
                    const story = frame.parentStory;
                    let isVertical = false;
                    try { isVertical = (story.storyPreferences.storyOrientation === 1986359924); } catch(e) {}
                    if (!isVertical) continue;

                    // 禁則処理を確実に適用
                    try {
                        const text = frame.texts.item(0);
                        text.kinsokuType = 'KinsokuPushInFirst';
                        text.hangingPunctuation = true;
                        fixed++;
                    } catch(e) {}
                } catch(e) {}
            }

            return { success: true, fixed };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'fix_vertical_punctuation', args, success: result?.success, scope: { pages: [pageIndex] } });
        return result?.success
            ? formatResponse(result, '約物補正')
            : formatErrorResponse(result?.error || '約物補正に失敗', '約物補正');
    }

    /**
     * 縦横混在レイアウト管理
     */
    static async mixVerticalAndHorizontalLayout(args) {
        const { pageIndex = 0 } = args;

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const page = doc.pages.item(${pageIndex});
            const frames = [];

            for (let i = 0; i < page.textFrames.length; i++) {
                const frame = page.textFrames.item(i);
                try {
                    let isVertical = false;
                    try {
                        isVertical = (frame.parentStory.storyPreferences.storyOrientation === 1986359924);
                    } catch(e) {}
                    frames.push({
                        index: i,
                        id: frame.id,
                        orientation: isVertical ? 'vertical' : 'horizontal',
                        bounds: frame.geometricBounds,
                        overflows: frame.overflows
                    });
                } catch(e) {}
            }

            const vertical = frames.filter(f => f.orientation === 'vertical');
            const horizontal = frames.filter(f => f.orientation === 'horizontal');

            return {
                success: true,
                page: ${pageIndex} + 1,
                totalFrames: frames.length,
                verticalCount: vertical.length,
                horizontalCount: horizontal.length,
                frames
            };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'mix_vertical_and_horizontal_layout', args, success: result?.success, scope: { pages: [pageIndex] } });
        return result?.success
            ? formatResponse(result, '縦横混在レイアウト情報')
            : formatErrorResponse(result?.error || '縦横混在情報取得に失敗', '縦横混在レイアウト');
    }
}
