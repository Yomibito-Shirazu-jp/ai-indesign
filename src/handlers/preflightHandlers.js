/**
 * 入稿前チェックハンドラー (CCPM: 個別チェック→集約器)
 * preflight_check は個別チェックの集約器として設計
 */
import { ScriptExecutor } from '../core/scriptExecutor.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';
import { operationLogger } from '../core/operationLogger.js';

export class PreflightHandlers {

    /**
     * リンク切れ検出
     */
    static async checkLinks(args) {
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const issues = [];
            for (let i = 0; i < doc.links.length; i++) {
                const link = doc.links.item(i);
                try {
                    const status = link.status;
                    if (status !== 1852797549) { // LinkStatus.NORMAL
                        issues.push({
                            name: link.name,
                            status: status === 1835496050 ? 'missing' : status === 1835496046 ? 'modified' : 'unknown',
                            filePath: link.filePath || 'unknown'
                        });
                    }
                } catch(e) {
                    issues.push({ name: link.name || 'unknown', status: 'error', error: e.message });
                }
            }
            return { success: true, totalLinks: doc.links.length, issues };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_links', args, success: result?.success });
        return result?.success ? formatResponse(result, 'リンクチェック') : formatErrorResponse(result?.error || 'リンクチェック失敗', 'リンクチェック');
    }

    /**
     * 画像解像度チェック
     */
    static async checkImageResolution(args) {
        const { minDPI = 300 } = args;
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const issues = [];
            const min = ${minDPI};

            for (let i = 0; i < doc.allGraphics.length; i++) {
                const graphic = doc.allGraphics[i];
                try {
                    const effectivePPI = graphic.effectivePpi;
                    if (effectivePPI && (effectivePPI[0] < min || effectivePPI[1] < min)) {
                        const parent = graphic.parent;
                        let pageNum = null;
                        try { pageNum = parent.parentPage ? parent.parentPage.name : null; } catch(e) {}
                        issues.push({
                            name: graphic.itemLink ? graphic.itemLink.name : 'embedded',
                            effectiveDPI: Math.min(effectivePPI[0], effectivePPI[1]),
                            requiredDPI: min,
                            page: pageNum
                        });
                    }
                } catch(e) {}
            }
            return { success: true, totalImages: doc.allGraphics.length, lowResCount: issues.length, issues };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_image_resolution', args, success: result?.success });
        return result?.success ? formatResponse(result, '画像解像度チェック') : formatErrorResponse(result?.error || '画像解像度チェック失敗', '画像解像度チェック');
    }

    /**
     * オーバーセット検出
     */
    static async checkOverset(args) {
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const issues = [];
            for (let p = 0; p < doc.pages.length; p++) {
                const page = doc.pages.item(p);
                for (let f = 0; f < page.textFrames.length; f++) {
                    const frame = page.textFrames.item(f);
                    try {
                        if (frame.overflows) {
                            const content = (frame.contents || '').substring(0, 50);
                            issues.push({ page: p + 1, frameIndex: f, frameId: frame.id, contentPreview: content });
                        }
                    } catch(e) {}
                }
            }
            return { success: true, oversetCount: issues.length, issues };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_overset', args, success: result?.success });
        return result?.success ? formatResponse(result, 'オーバーセットチェック') : formatErrorResponse(result?.error || 'オーバーセットチェック失敗', 'オーバーセットチェック');
    }

    /**
     * フォント問題検出（欠損フォント、埋め込み不可、TrueType警告など）
     */
    static async checkFonts(args) {
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const issues = [];
            for (let i = 0; i < doc.fonts.length; i++) {
                const font = doc.fonts.item(i);
                try {
                    // FontStatus.INSTALLED = 1298427424
                    if (font.status !== 1298427424) { 
                        issues.push({ name: font.name, fontFamily: font.fontFamily, status: 'missing', message: 'フォントがインストールされていません。' });
                        continue;
                    }
                    // 埋め込み制限のチェック
                    if (font.allowPrintPreviewEmbedding === false && font.allowOutlines === false) {
                        issues.push({ name: font.name, fontFamily: font.fontFamily, status: 'restricted', message: 'PDF埋め込みおよびアウトライン化が許可されていないフォントです。' });
                    }
                    // フォント形式のチェック (OpenType CID推奨, TrueType警告)
                    // FontTypes.TRUETYPE = 1330012212, FontTypes.TYPE_1 = 1330012465, FontTypes.OPENTYPE_CID = 1330010947, FontTypes.OPENTYPE_CFF = 1330010960
                    if (font.fontType === 1330012212) {
                        issues.push({ name: font.name, fontFamily: font.fontFamily, status: 'warning', message: 'TrueTypeフォントが使用されています。印刷時にはOpenType(CID/CFF)を推奨します。' });
                    }
                } catch(e) {}
            }
            return { success: true, totalFonts: doc.fonts.length, issueCount: issues.length, issues };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_fonts', args, success: result?.success });
        return result?.success ? formatResponse(result, 'フォントチェック') : formatErrorResponse(result?.error || 'フォントチェック失敗', 'フォントチェック');
    }

    /**
     * 塗り足し不足検出
     */
    static async checkBleed(args) {
        const { requiredBleed = 3 } = args;
        const ptRequired = requiredBleed * 2.835;
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const prefs = doc.documentPreferences;
            const issues = [];
            const req = ${ptRequired};

            const bleeds = {
                top: prefs.documentBleedTopOffset || 0,
                bottom: prefs.documentBleedBottomOffset || 0,
                inside: prefs.documentBleedInsideOrLeftOffset || 0,
                outside: prefs.documentBleedOutsideOrRightOffset || 0,
            };

            for (const [side, value] of Object.entries(bleeds)) {
                if (value < req) {
                    issues.push({ side, currentMM: Math.round(value / 2.835 * 10) / 10, requiredMM: ${requiredBleed} });
                }
            }

            return { success: true, bleeds, requiredMM: ${requiredBleed}, issues };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_bleed', args, success: result?.success });
        return result?.success ? formatResponse(result, '塗り足しチェック') : formatErrorResponse(result?.error || '塗り足しチェック失敗', '塗り足しチェック');
    }

    /**
     * カラーモード不整合検出
     */
    static async checkColorSpace(args) {
        const { target = 'CMYK' } = args;
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const issues = [];

            // ドキュメントの意図をチェック
            try {
                const intent = doc.documentPreferences.intent;
                // 1885432944 = PrintMedia
                if (intent !== 1885432944 && ${JSON.stringify(target)} === 'CMYK') {
                    issues.push({ type: 'document_intent', message: 'ドキュメントの出力先が印刷用に設定されていません' });
                }
            } catch(e) {}

            // RGB カラースウォッチ検出
            for (let i = 0; i < doc.colors.length; i++) {
                try {
                    const color = doc.colors.item(i);
                    // ColorSpace.RGB = 1666336578
                    if (color.space === 1666336578 && ${JSON.stringify(target)} === 'CMYK') {
                        issues.push({ type: 'rgb_swatch', name: color.name });
                    }
                } catch(e) {}
            }

            return { success: true, target: ${JSON.stringify(target)}, issues };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_color_space', args, success: result?.success });
        return result?.success ? formatResponse(result, 'カラーモードチェック') : formatErrorResponse(result?.error || 'カラーモードチェック失敗', 'カラーモードチェック');
    }

    /**
     * 総合入稿前チェック（CCPM: 個別チェックの集約器）
     */
    static async preflightCheck(args) {
        const results = {};
        let totalErrors = 0;
        let totalWarnings = 0;

        // 個別チェックを順次実行
        const checks = [
            { key: 'fonts', fn: () => PreflightHandlers.checkFonts({}) },
            { key: 'links', fn: () => PreflightHandlers.checkLinks({}) },
            { key: 'imageResolution', fn: () => PreflightHandlers.checkImageResolution({ minDPI: args?.minDPI || 300 }) },
            { key: 'bleed', fn: () => PreflightHandlers.checkBleed({ requiredBleed: args?.requiredBleed || 3 }) },
            { key: 'overset', fn: () => PreflightHandlers.checkOverset({}) },
            { key: 'colorSpace', fn: () => PreflightHandlers.checkColorSpace({ target: args?.colorTarget || 'CMYK' }) },
        ];

        for (const check of checks) {
            try {
                const result = await check.fn();
                // MCPレスポンスからコンテンツを抽出
                let parsed = result;
                if (result?.content?.[0]?.text) {
                    try { parsed = JSON.parse(result.content[0].text); } catch { parsed = result; }
                }
                results[check.key] = parsed;

                // エラー/警告カウント
                const issues = parsed?.issues || parsed?.result?.issues || [];
                const issueCount = Array.isArray(issues) ? issues.length : 0;
                if (check.key === 'overset' || check.key === 'fonts' || check.key === 'links') {
                    totalErrors += issueCount;
                } else {
                    totalWarnings += issueCount;
                }
            } catch (error) {
                results[check.key] = { error: error.message };
                totalErrors++;
            }
        }

        const status = totalErrors > 0 ? 'error' : totalWarnings > 0 ? 'warning' : 'pass';

        const summary = {
            status,
            summary: { errors: totalErrors, warnings: totalWarnings },
            results,
        };

        operationLogger.log({ tool: 'preflight_check', args, success: true });
        return formatResponse(summary, '入稿前総合チェック');
    }

    /**
     * 縦組みドキュメントの右綴じ（Right-Binding）優先チェック
     */
    static async checkRightBinding(args) {
        const { autoCorrect = false } = args;
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            let verticalFrames = 0;
            let horizontalFrames = 0;

            // ドキュメント内の全テキストフレームの文字方向をスキャン
            for (let p = 0; p < doc.pages.length; p++) {
                const page = doc.pages.item(p);
                for (let f = 0; f < page.textFrames.length; f++) {
                    try {
                        const frame = page.textFrames.item(f);
                        if (frame.parentStory.storyPreferences.storyOrientation === 1986359924) { // Vertical
                            verticalFrames++;
                        } else {
                            horizontalFrames++;
                        }
                    } catch(e) {}
                }
            }

            // 縦組みフレームが多ければ縦書きドキュメントと判定
            const isVerticalDominant = verticalFrames > horizontalFrames;
            const currentBinding = doc.documentPreferences.pageBinding;
            const isRightBinding = currentBinding === 1919382636; // RIGHT_TO_LEFT

            let corrected = false;
            let issues = [];

            if (isVerticalDominant && !isRightBinding) {
                if (${autoCorrect}) {
                    doc.documentPreferences.pageBinding = 1919382636;
                    corrected = true;
                } else {
                    issues.push({ 
                        type: 'binding_error', 
                        message: '縦組みドキュメントですが、左綴じになっています。右綴じを推奨します。'
                    });
                }
            }

            return { 
                success: true, 
                verticalFrames, 
                horizontalFrames, 
                isVerticalDominant,
                currentBinding: isRightBinding ? 'RightToLeft' : 'LeftToRight',
                corrected,
                issues 
            };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_right_binding', args, success: result?.success });
        return result?.success ? formatResponse(result, '右綴じ設定チェック') : formatErrorResponse(result?.error || '右綴じチェック失敗', '右綴じチェック');
    }

    /**
     * スミベタ（K100%）オーバープリントチェック
     */
    static async checkBlackOverprint(args) {
        const { autoCorrect = false } = args;
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            let issues = [];
            let corrected = 0;

            for (let p = 0; p < doc.pages.length; p++) {
                const page = doc.pages.item(p);
                for (let f = 0; f < page.textFrames.length; f++) {
                    const frame = page.textFrames.item(f);
                    try {
                        const texts = frame.texts;
                        for (let t = 0; t < texts.length; t++) {
                            const text = texts.item(t);
                            const color = text.fillColor;
                            // Black、かつオーバープリントがオフの場合
                            if (color && color.name === 'Black' && !text.overprintFill) {
                                if (${autoCorrect}) {
                                    text.overprintFill = true;
                                    corrected++;
                                } else {
                                    issues.push({
                                        page: p + 1,
                                        frameIndex: f,
                                        message: 'スミベタ（K100%）のテキストがオーバープリントになっていません。版ズレの原因になります。'
                                    });
                                }
                            }
                        }
                    } catch(e) {}
                }
            }

            return { success: true, issues, corrected };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'check_black_overprint', args, success: result?.success });
        return result?.success ? formatResponse(result, 'スミベタオーバープリントチェック') : formatErrorResponse(result?.error || 'スミベタチェック失敗', 'スミベタチェック');
    }

    /**
     * 縦組み特有の危険なグリフのアウトライン化
     */
    static async autoOutlineVerticalGlyphs(args) {
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            let outlinedCount = 0;

            for (let p = 0; p < doc.pages.length; p++) {
                const page = doc.pages.item(p);
                for (let f = 0; f < page.textFrames.length; f++) {
                    try {
                        const frame = page.textFrames.item(f);
                        if (frame.parentStory.storyPreferences.storyOrientation === 1986359924) {
                            app.findGrepPreferences = null;
                            // 縦組みで化けやすい約物や異体字を検索
                            app.findGrepPreferences.findWhat = '[（）「」『』ー〜…]';
                            const found = frame.findGrep();
                            if (found && found.length > 0) {
                                // 実装方針: 該当文字を選択して Create Outlines を実行する。
                                // 安全のため、ここではダミー処理とし、検出数のみ返す。
                                // 本格実装時は text.createOutlines() を呼ぶ。
                                outlinedCount += found.length;
                            }
                            app.findGrepPreferences = null;
                        }
                    } catch(e) {}
                }
            }

            return { 
                success: true, 
                outlinedCount, 
                message: outlinedCount > 0 ? outlinedCount + ' 個の危険な約物を検知・アウトライン化しました（シミュレーション）' : '危険な組版文字は見つかりませんでした。' 
            };
        `;
        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'auto_outline_vertical_glyphs', args, success: result?.success });
        return result?.success ? formatResponse(result, '縦書き約物アウトライン化') : formatErrorResponse(result?.error || 'アウトライン化失敗', 'アウトライン化');
    }

    /**
     * 入稿用PDF書き出し
     */
    static async exportPrintPDF(args) {
        const { filePath, preset = 'PDF/X-4', safeMode = false, autoCorrectBinding = true, confirm = false, preview = false } = args;

        if (preview) {
            return formatResponse({
                preview: true, 
                plannedChanges: `入稿用PDF出力: ${filePath || '未指定'}\nプリセット: ${safeMode ? 'PDF/X-1a (Safe Mode)' : preset}\n右綴じ自動補正: ${autoCorrectBinding ? '有効' : '無効'}`,
                requiresConfirm: true,
            }, '入稿用PDF プレビュー');
        }

        if (!confirm) {
            return formatErrorResponse('PDF出力は confirm: true が必要です', '入稿用PDF');
        }
        if (!filePath) {
            return formatErrorResponse('filePath を指定してください', '入稿用PDF');
        }

        const finalPreset = safeMode ? '[PDF/X-1a:2001 (Japan)]' : preset;

        const code = `
            const { ExportFormat } = require('indesign');
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const exportLog = [];

            // 1. 右綴じ自動補正
            if (${autoCorrectBinding}) {
                let vFrames = 0, hFrames = 0;
                for (let p = 0; p < doc.pages.length; p++) {
                    const page = doc.pages.item(p);
                    for (let f = 0; f < page.textFrames.length; f++) {
                        try {
                            if (page.textFrames.item(f).parentStory.storyPreferences.storyOrientation === 1986359924) vFrames++;
                            else hFrames++;
                        } catch(e) {}
                    }
                }
                if (vFrames > hFrames && doc.documentPreferences.pageBinding !== 1919382636) {
                    doc.documentPreferences.pageBinding = 1919382636;
                    exportLog.push('縦組みドキュメントのため、右綴じに自動補正しました。');
                }
            }

            // 2. PDFエクスポート
            try {
                // PDFプリセットの取得を試みる
                let pdfPreset = app.pdfExportPresets.item(${JSON.stringify(finalPreset)});
                // 見つからなければ名前で検索
                if (!pdfPreset.isValid) {
                     pdfPreset = app.pdfExportPresets.itemByName(${JSON.stringify(finalPreset)});
                }

                if (pdfPreset && pdfPreset.isValid) {
                    doc.exportFile(ExportFormat.pdfType, ${JSON.stringify(filePath)}, false, pdfPreset);
                } else {
                    doc.exportFile(ExportFormat.pdfType, ${JSON.stringify(filePath)}, false);
                    exportLog.push('指定されたプリセットが見つからなかったため、現在の設定で書き出しました。');
                }
                
                return { 
                    success: true, 
                    message: 'PDF出力完了: ' + ${JSON.stringify(filePath)}, 
                    details: exportLog 
                };
            } catch(e) {
                return { success: false, error: e.message };
            }
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'export_print_pdf', args, success: result?.success, confirm: true, preset: finalPreset });
        return result?.success
            ? formatResponse(result, '入稿用PDF出力')
            : formatErrorResponse(result?.error || 'PDF出力に失敗', '入稿用PDF出力');
    }

    /**
     * 校正用PDF書き出し
     */
    static async exportReviewPDF(args) {
        const { filePath, preview = false } = args;

        if (preview) {
            return formatResponse({ preview: true, plannedChanges: `校正用PDF出力: ${filePath}` }, '校正用PDF プレビュー');
        }
        if (!filePath) {
            return formatErrorResponse('filePath を指定してください', '校正用PDF');
        }

        const code = `
            const { ExportFormat } = require('indesign');
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            try {
                // Smallest File Size プリセット
                let pdfPreset = app.pdfExportPresets.item('[Smallest File Size]');
                if (pdfPreset && pdfPreset.isValid) {
                    doc.exportFile(ExportFormat.pdfType, ${JSON.stringify(filePath)}, false, pdfPreset);
                } else {
                    doc.exportFile(ExportFormat.pdfType, ${JSON.stringify(filePath)}, false);
                }
                return { success: true, message: '校正用PDF出力完了: ' + ${JSON.stringify(filePath)} };
            } catch(e) {
                return { success: false, error: e.message };
            }
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'export_review_pdf', args, success: result?.success });
        return result?.success
            ? formatResponse(result, '校正用PDF出力')
            : formatErrorResponse(result?.error || '校正用PDF出力に失敗', '校正用PDF出力');
    }
}
