/**
 * 修正運用ハンドラー
 * apply_redline_changes, replace_text_by_instruction,
 * export_change_log, compare_versions
 */
import { ScriptExecutor } from '../core/scriptExecutor.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';
import { operationLogger } from '../core/operationLogger.js';

export class RevisionHandlers {

    /**
     * 赤字指示反映（テキスト置換の一括実行）
     */
    static async applyRedlineChanges(args) {
        const { changes = [], preview = false, confirm = false } = args;

        if (!changes || changes.length === 0) {
            return formatErrorResponse(
                'changes 配列を指定してください。例: [{ "find": "旧テキスト", "replace": "新テキスト" }]',
                '赤字反映'
            );
        }

        if (preview) {
            return formatResponse({
                preview: true,
                plannedChanges: changes.map((c, i) => `${i + 1}. 「${c.find}」→「${c.replace}」`),
                totalChanges: changes.length,
                requiresConfirm: true,
            }, '赤字反映 プレビュー');
        }

        if (!confirm) {
            return formatErrorResponse('赤字反映は confirm: true が必要です', '赤字反映');
        }

        const results = [];
        for (const change of changes) {
            const code = `
                if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
                const doc = app.activeDocument;
                try {
                    app.findGrepPreferences = null;
                    app.changeGrepPreferences = null;
                    app.findGrepPreferences.findWhat = ${JSON.stringify(change.find)};
                    app.changeGrepPreferences.changeTo = ${JSON.stringify(change.replace)};
                    const changed = doc.changeGrep();
                    app.findGrepPreferences = null;
                    app.changeGrepPreferences = null;
                    return { success: true, find: ${JSON.stringify(change.find)}, replaced: changed ? changed.length : 0 };
                } catch(e) {
                    app.findGrepPreferences = null;
                    app.changeGrepPreferences = null;
                    return { success: false, error: e.message };
                }
            `;
            const result = await ScriptExecutor.executeViaUXP(code);
            results.push(result);
        }

        const totalReplaced = results.reduce((sum, r) => sum + (r?.replaced || 0), 0);
        operationLogger.log({ tool: 'apply_redline_changes', args: { changeCount: changes.length }, success: true, confirm: true });

        return formatResponse({
            success: true,
            totalChanges: changes.length,
            totalReplaced,
            results,
        }, '赤字反映');
    }

    /**
     * 自然文指示でのテキスト置換
     */
    static async replaceTextByInstruction(args) {
        const { find, replace, caseSensitive = false, wholeWord = false, pageIndex, preview = false } = args;

        if (!find || !replace) {
            return formatErrorResponse('find と replace を指定してください', 'テキスト置換');
        }

        if (preview) {
            return formatResponse({
                preview: true,
                find, replace, caseSensitive, wholeWord,
                message: `「${find}」を「${replace}」に置換します`,
            }, 'テキスト置換 プレビュー');
        }

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            try {
                app.findGrepPreferences = null;
                app.changeGrepPreferences = null;
                app.findGrepPreferences.findWhat = ${JSON.stringify(find)};
                app.changeGrepPreferences.changeTo = ${JSON.stringify(replace)};
                const scope = ${pageIndex !== undefined ? `doc.pages.item(${pageIndex})` : 'doc'};
                const changed = scope.changeGrep();
                app.findGrepPreferences = null;
                app.changeGrepPreferences = null;
                return { success: true, replaced: changed ? changed.length : 0 };
            } catch(e) {
                app.findGrepPreferences = null;
                app.changeGrepPreferences = null;
                return { success: false, error: e.message };
            }
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'replace_text_by_instruction', args: { find, replace }, success: result?.success });
        return result?.success
            ? formatResponse(result, 'テキスト置換')
            : formatErrorResponse(result?.error || 'テキスト置換に失敗', 'テキスト置換');
    }

    /**
     * 変更履歴出力（operationLoggerから）
     */
    static async exportChangeLog(args) {
        const { limit = 50 } = args;
        const logs = operationLogger.getRecentLogs(limit);
        const changeLogs = logs.filter(l => l.tool !== 'get_operation_log' && l.tool !== 'export_change_log');

        return formatResponse({
            success: true,
            logCount: changeLogs.length,
            summary: operationLogger.getSummary(),
            logs: changeLogs,
        }, '変更履歴出力');
    }

    /**
     * バージョン差分比較（簡易: ページ/フレーム構成差分）
     */
    static async compareVersions(args) {
        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            const snapshot = {
                name: doc.name,
                pages: doc.pages.length,
                pageDetails: [],
            };

            for (let p = 0; p < doc.pages.length; p++) {
                const page = doc.pages.item(p);
                const detail = {
                    page: p + 1,
                    textFrames: page.textFrames.length,
                    rectangles: page.rectangles.length,
                    totalItems: page.allPageItems.length,
                    oversetFrames: 0,
                };
                for (let f = 0; f < page.textFrames.length; f++) {
                    try { if (page.textFrames.item(f).overflows) detail.oversetFrames++; } catch(e) {}
                }
                snapshot.pageDetails.push(detail);
            }

            return { success: true, snapshot };
        `;

        const result = await ScriptExecutor.executeViaUXP(code);
        operationLogger.log({ tool: 'compare_versions', args, success: result?.success });
        return result?.success
            ? formatResponse(result, 'バージョン差分比較')
            : formatErrorResponse(result?.error || '差分比較に失敗', 'バージョン差分比較');
    }
}
