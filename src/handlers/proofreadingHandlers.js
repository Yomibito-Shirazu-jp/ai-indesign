/**
 * 校閲ハンドラー
 * 常用漢字チェック、表記揺れ検知、不適切表現検出
 * InDesign接続時はドキュメント内テキストを検査、テキスト直接指定も可
 */
import { ScriptExecutor } from '../core/scriptExecutor.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';
import { operationLogger } from '../core/operationLogger.js';
import {
    detectNonJoyoKanji,
    detectHyokiYure,
    detectSensitiveTerms,
} from '../japanese/proofreadingDictionary.js';

export class ProofreadingHandlers {

    /**
     * InDesignドキュメントからテキストを取得
     * @param {number} [pageIndex] - ページ指定（省略で全ページ）
     * @returns {Promise<string|null>}
     */
    static async _getDocumentText(pageIndex) {
        const pageFilter = pageIndex !== undefined
            ? `const pages = [doc.pages.item(${pageIndex})];`
            : `const pages = []; for (let p = 0; p < doc.pages.length; p++) pages.push(doc.pages.item(p));`;

        const code = `
            if (app.documents.length === 0) return { success: false, error: 'ドキュメントが開かれていません' };
            const doc = app.activeDocument;
            ${pageFilter}
            let allText = '';
            for (const page of pages) {
                for (let f = 0; f < page.textFrames.length; f++) {
                    try {
                        allText += page.textFrames.item(f).contents + '\\n';
                    } catch(e) {}
                }
            }
            return { success: true, text: allText, pageCount: pages.length };
        `;

        try {
            const result = await ScriptExecutor.executeViaUXP(code);
            if (result?.success) return result.text;
        } catch (e) {
            // InDesign未接続 — テキスト直接指定が必要
        }
        return null;
    }

    /**
     * テキスト取得（引数 or ドキュメント）
     */
    static async _resolveText(args) {
        if (args?.text) return args.text;
        const docText = await ProofreadingHandlers._getDocumentText(args?.pageIndex);
        if (!docText) {
            return null;
        }
        return docText;
    }

    /**
     * 常用漢字チェック
     */
    static async checkJoyoKanji(args) {
        const text = await ProofreadingHandlers._resolveText(args);
        if (text === null) {
            return formatErrorResponse(
                'テキストが取得できません。text引数を指定するか、InDesignドキュメントを開いてください。',
                '常用漢字チェック'
            );
        }

        const result = detectNonJoyoKanji(text);
        operationLogger.log({ tool: 'check_joyo_kanji', args: { textLength: text.length }, success: true });

        return formatResponse({
            success: true,
            totalCharacters: text.length,
            nonJoyoCount: result.count,
            nonJoyoKanji: result.nonJoyoKanji.slice(0, 100), // 最大100件
            message: result.count === 0
                ? '常用漢字外の文字は検出されませんでした'
                : `${result.count}件の常用漢字外文字を検出しました`,
        }, '常用漢字チェック');
    }

    /**
     * 表記揺れ検知
     */
    static async checkHyokiYure(args) {
        const text = await ProofreadingHandlers._resolveText(args);
        if (text === null) {
            return formatErrorResponse(
                'テキストが取得できません。text引数を指定するか、InDesignドキュメントを開いてください。',
                '表記揺れチェック'
            );
        }

        let result = detectHyokiYure(text);

        // カテゴリフィルタ
        if (args?.categories && Array.isArray(args.categories)) {
            result = {
                issues: result.issues.filter(i => args.categories.includes(i.category)),
                count: 0,
            };
            result.count = result.issues.length;
        }

        operationLogger.log({ tool: 'check_hyoki_yure', args: { textLength: text.length }, success: true });

        return formatResponse({
            success: true,
            totalCharacters: text.length,
            issueCount: result.count,
            issues: result.issues,
            message: result.count === 0
                ? '表記揺れは検出されませんでした'
                : `${result.count}件の表記揺れを検出しました`,
        }, '表記揺れチェック');
    }

    /**
     * 不適切表現検出
     */
    static async checkSensitiveTerms(args) {
        const text = await ProofreadingHandlers._resolveText(args);
        if (text === null) {
            return formatErrorResponse(
                'テキストが取得できません。text引数を指定するか、InDesignドキュメントを開いてください。',
                '不適切表現チェック'
            );
        }

        let result = detectSensitiveTerms(text, { minSeverity: args?.minSeverity || 'low' });

        // カテゴリフィルタ
        if (args?.categories && Array.isArray(args.categories)) {
            result = {
                issues: result.issues.filter(i => args.categories.includes(i.category)),
                count: 0,
            };
            result.count = result.issues.length;
        }

        operationLogger.log({ tool: 'check_sensitive_terms', args: { textLength: text.length, minSeverity: args?.minSeverity }, success: true });

        return formatResponse({
            success: true,
            totalCharacters: text.length,
            issueCount: result.count,
            issues: result.issues,
            message: result.count === 0
                ? '不適切表現は検出されませんでした'
                : `${result.count}件の不適切表現を検出しました`,
        }, '不適切表現チェック');
    }

    /**
     * 校閲総合チェック
     */
    static async proofreadAll(args) {
        const text = await ProofreadingHandlers._resolveText(args);
        if (text === null) {
            return formatErrorResponse(
                'テキストが取得できません。text引数を指定するか、InDesignドキュメントを開いてください。',
                '校閲総合チェック'
            );
        }

        const joyoResult = detectNonJoyoKanji(text);
        const hyokiResult = detectHyokiYure(text);
        const sensitiveResult = detectSensitiveTerms(text, { minSeverity: args?.minSeverity || 'low' });

        const totalIssues = joyoResult.count + hyokiResult.count + sensitiveResult.count;
        const status = totalIssues === 0 ? 'pass'
            : sensitiveResult.issues.some(i => i.severity === 'high') ? 'error'
            : 'warning';

        operationLogger.log({ tool: 'proofread_all', args: { textLength: text.length }, success: true });

        return formatResponse({
            success: true,
            status,
            totalCharacters: text.length,
            summary: {
                totalIssues,
                nonJoyoKanji: joyoResult.count,
                hyokiYure: hyokiResult.count,
                sensitiveTerms: sensitiveResult.count,
            },
            details: {
                joyo: { nonJoyoKanji: joyoResult.nonJoyoKanji.slice(0, 50) },
                hyoki: { issues: hyokiResult.issues },
                sensitive: { issues: sensitiveResult.issues },
            },
            message: totalIssues === 0
                ? '校閲チェックに問題はありませんでした'
                : `合計${totalIssues}件の指摘事項があります`,
        }, '校閲総合チェック');
    }
}
