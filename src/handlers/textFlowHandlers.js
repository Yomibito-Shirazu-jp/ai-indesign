/**
 * テキスト流し込みハンドラー
 * import_text, parse_manuscript_structure, flow_text_to_pages,
 * apply_document_template, resolve_overset_text
 */
import { ScriptExecutor } from '../core/scriptExecutor.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';
import { operationLogger } from '../core/operationLogger.js';
import { parseManuscript } from '../japanese/manuscriptParser.js';
import { loadTemplate, listTemplates, resolveTemplateByName } from '../japanese/templatePresets.js';

export class TextFlowHandlers {

    /**
     * テキスト取り込み（メモリ上で原稿テキストを保持）
     */
    static async importText(args) {
        const { text, filePath } = args;

        if (!text && !filePath) {
            return formatErrorResponse('text または filePath を指定してください', 'テキスト取り込み');
        }

        let content = text || '';
        if (filePath) {
            // InDesign側でファイル読み込み
            const code = `
                try {
                    const fs = require('fs');
                    const content = fs.readFileSync(${JSON.stringify(filePath)}, 'utf-8');
                    return { success: true, content, length: content.length };
                } catch(e) {
                    return { success: false, error: e.message };
                }
            `;
            const result = await ScriptExecutor.executeViaUXP(code);
            if (!result?.success) return formatErrorResponse(result?.error || 'ファイル読み込み失敗', 'テキスト取り込み');
            content = result.content;
        }

        const charCount = content.replace(/\s/g, '').length;
        operationLogger.log({ tool: 'import_text', args: { charCount }, success: true });
        return formatResponse({
            success: true,
            charCount,
            lineCount: content.split(/\r?\n/).length,
            preview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        }, 'テキスト取り込み');
    }

    /**
     * 原稿構造解析
     */
    static async parseManuscriptStructure(args) {
        const { text } = args;
        if (!text) return formatErrorResponse('text を指定してください', '原稿構造解析');

        const result = parseManuscript(text);
        operationLogger.log({ tool: 'parse_manuscript_structure', args: { charCount: text.length }, success: true });

        return formatResponse({
            success: true,
            stats: result.stats,
            sections: result.sections.map(s => ({
                type: s.type,
                suggestedStyle: s.suggestedStyle,
                confidence: s.confidence,
                contentPreview: s.content.substring(0, 60) + (s.content.length > 60 ? '...' : ''),
                lineStart: s.lineStart,
                lineEnd: s.lineEnd,
            })),
        }, '原稿構造解析');
    }

    /**
     * 自動流し込み＋ページ追加
     */
    static async flowTextToPages(args) {
        const { text, pageIndex = 0, autoAddPages = true, applyStyles = true, preview = false, confirm = false } = args;

        if (preview) {
            const structure = text ? parseManuscript(text) : null;
            return formatResponse({
                preview: true,
                plannedChanges: 'テキスト流し込み' + (autoAddPages ? '（ページ自動追加）' : ''),
                structure: structure?.stats || null,
                requiresConfirm: true,
            }, '流し込み プレビュー');
        }

        if (!confirm) {
            return formatErrorResponse('テキスト流し込みは confirm: true が必要です', '流し込み');
        }
        if (!text) {
            return formatErrorResponse('text を指定してください', '流し込み');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const startPage = doc.pages.item(${pageIndex});
            const content = ${JSON.stringify(text)};

            try {
                // メインテキストフレーム作成
                const frame = startPage.textFrames.add();
                const bounds = startPage.bounds;
                const margin = doc.marginPreferences;
                frame.geometricBounds = [
                    bounds[0] + (margin.top || 36),
                    bounds[1] + (margin.left || 36),
                    bounds[2] - (margin.bottom || 36),
                    bounds[3] - (margin.right || 36)
                ];
                frame.contents = content;

                let pagesAdded = 0;

                // オーバーセット時にページ自動追加
                if (${autoAddPages}) {
                    let currentFrame = frame;
                    while (currentFrame.overflows && pagesAdded < 50) {
                        const newPage = doc.pages.add();
                        const newFrame = newPage.textFrames.add();
                        const newBounds = newPage.bounds;
                        newFrame.geometricBounds = [
                            newBounds[0] + (margin.top || 36),
                            newBounds[1] + (margin.left || 36),
                            newBounds[2] - (margin.bottom || 36),
                            newBounds[3] - (margin.right || 36)
                        ];
                        currentFrame.nextTextFrame = newFrame;
                        currentFrame = newFrame;
                        pagesAdded++;
                    }
                }

                return {
                    success: true,
                    pagesAdded,
                    totalPages: doc.pages.length,
                    overflows: frame.overflows
                };
            } catch(e) {
                return { success: false, error: e.message };
            }
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'flow_text_to_pages', args: { charCount: text.length, autoAddPages }, success: result?.success, confirm: true });
        return result?.success
            ? formatResponse(result, 'テキスト流し込み')
            : formatErrorResponse(result?.error || '流し込みに失敗', 'テキスト流し込み');
    }

    /**
     * テンプレート適用
     */
    static async applyDocumentTemplate(args) {
        const { templateType, templateName, preview = false, confirm = false } = args;

        // テンプレートID解決
        let templateId = templateType;
        if (!templateId && templateName) {
            templateId = resolveTemplateByName(templateName);
        }
        if (!templateId) {
            const available = listTemplates();
            return formatErrorResponse(
                `テンプレートが見つかりません。利用可能: ${available.map(t => `${t.id} (${t.name})`).join(', ')}`,
                'テンプレート適用'
            );
        }

        const template = loadTemplate(templateId);
        if (!template) {
            return formatErrorResponse(`テンプレート「${templateId}」の読み込みに失敗`, 'テンプレート適用');
        }

        if (preview) {
            return formatResponse({
                preview: true,
                template: { id: templateId, name: template.name, size: template.size, margins: template.margins, columns: template.columns, writingMode: template.writingMode || 'horizontal' },
                requiresConfirm: true,
            }, 'テンプレート プレビュー');
        }

        if (!confirm) {
            return formatErrorResponse('テンプレート適用は confirm: true が必要です', 'テンプレート適用');
        }

        const ptMargins = {
            top: (template.margins?.top || 20) * 2.835,
            bottom: (template.margins?.bottom || 20) * 2.835,
            left: (template.margins?.left || 20) * 2.835,
            right: (template.margins?.right || 20) * 2.835,
        };

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            try {
                const prefs = doc.documentPreferences;
                prefs.pageWidth = ${(template.size?.width || 210) * 2.835};
                prefs.pageHeight = ${(template.size?.height || 297) * 2.835};
                if (${template.bleed ? 'true' : 'false'}) {
                    const bleed = ${(template.bleed || 3) * 2.835};
                    prefs.documentBleedTopOffset = bleed;
                    prefs.documentBleedBottomOffset = bleed;
                    prefs.documentBleedInsideOrLeftOffset = bleed;
                    prefs.documentBleedOutsideOrRightOffset = bleed;
                }
                if (${template.facingPages ? 'true' : 'false'}) {
                    prefs.facingPages = true;
                }

                const margin = doc.marginPreferences;
                margin.top = ${ptMargins.top};
                margin.bottom = ${ptMargins.bottom};
                margin.left = ${ptMargins.left};
                margin.right = ${ptMargins.right};
                if (${template.columns || 1} > 1) {
                    margin.columnCount = ${template.columns || 1};
                    margin.columnGutter = ${(template.columnGutter || 5) * 2.835};
                }

                return { success: true, template: ${JSON.stringify(template.name)} };
            } catch(e) {
                return { success: false, error: e.message };
            }
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'apply_document_template', args: { templateId }, success: result?.success, confirm: true });
        return result?.success
            ? formatResponse(result, 'テンプレート適用')
            : formatErrorResponse(result?.error || 'テンプレート適用に失敗', 'テンプレート適用');
    }

    /**
     * オーバーセット解決提案
     */
    static async resolveOversetText(args) {
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const proposals = [];

            for (let p = 0; p < doc.pages.length; p++) {
                const page = doc.pages.item(p);
                for (let f = 0; f < page.textFrames.length; f++) {
                    const frame = page.textFrames.item(f);
                    if (!frame.overflows) continue;

                    const oversetChars = frame.parentStory.characters.length - frame.characters.length;
                    const fontSize = frame.texts.item(0).pointSize || 10;

                    proposals.push({
                        page: p + 1,
                        frameIndex: f,
                        oversetChars,
                        suggestions: [
                            { method: 'reduce_font_size', description: 'フォントサイズを1pt下げる', newSize: fontSize - 1 },
                            { method: 'reduce_leading', description: '行送りを縮める' },
                            { method: 'add_page', description: '次ページにテキスト連結' },
                            { method: 'expand_frame', description: 'フレームサイズ拡大' },
                            { method: 'tighten_tracking', description: '字詰めで収める' },
                        ]
                    });
                }
            }

            return { success: true, oversetFrames: proposals.length, proposals };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'resolve_overset_text', args, success: result?.success });
        return result?.success
            ? formatResponse(result, 'オーバーセット解決提案')
            : formatErrorResponse(result?.error || 'オーバーセット解決提案に失敗', 'オーバーセット解決提案');
    }

    /**
     * テンプレート一覧
     */
    static listAvailableTemplates() {
        return formatResponse({ templates: listTemplates() }, 'テンプレート一覧');
    }
}
