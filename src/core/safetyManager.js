/**
 * Safety Manager - 安全確認システム (CCPM修正版)
 * 統一 preview/confirm 仕様 + 固定危険操作リスト
 * 
 * 統一ルール:
 * - preview: true → 実変更なし、変更計画だけ返す
 * - preview: false && 危険操作 → confirm: true 必須
 * - preview: false && 安全操作 → 通常実行
 */

// 固定危険操作リスト（CCPM指示: 汎用化しすぎない）
const DANGEROUS_OPERATIONS = new Set([
    'delete_page',            // 全ページ削除
    'close_document',         // ドキュメントク ローズ
    'find_replace_text',      // 全テキスト再流し込み相当
    'flow_text_to_pages',     // 全テキスト再流し込み
    'reflow_all_text',        // 全テキスト再流し込み
    'cleanup_document',       // ドキュメントクリーンアップ
    'apply_paragraph_style',  // 全スタイル置換可能性
    'replace_all_styles',     // 全スタイル置換
    'remove_all_links',       // 全リンク解除
    'replace_all_images',     // 全画像再配置
    'apply_document_template',// 既存テンプレート上書き
    'export_print_pdf',       // PDF書き出し先上書き
]);

export class SafetyManager {

    /**
     * 操作が危険かどうかを判定
     */
    isDangerous(toolName) {
        return DANGEROUS_OPERATIONS.has(toolName);
    }

    /**
     * 統一安全チェック
     * @param {{ tool: string, args: Object }} params
     * @returns {{ allowed: boolean, reason?: string }}
     */
    checkSafety({ tool, args }) {
        const preview = args?.preview === true;
        const confirm = args?.confirm === true;
        const dangerous = this.isDangerous(tool);

        // preview モードは常に許可（実行しない）
        if (preview) {
            return { allowed: true, preview: true };
        }

        // 危険操作で confirm なし → 拒否
        if (dangerous && !confirm) {
            return {
                allowed: false,
                reason: 'dangerous_operation_requires_confirm',
                tool,
                message: `「${tool}」は危険操作です。実行するには confirm: true を指定してください。`
            };
        }

        return { allowed: true };
    }

    /**
     * 統一 preview 結果生成
     */
    buildPreviewResult(tool, args) {
        return {
            preview: true,
            tool,
            plannedChanges: this._describePlannedChanges(tool, args),
            riskLevel: this.isDangerous(tool) ? 'HIGH' : 'LOW',
            warnings: this._generateWarnings(tool, args),
            requiresConfirm: this.isDangerous(tool),
            message: 'プレビューモードです。実行するには preview: false で再度呼び出してください。'
        };
    }

    _describePlannedChanges(tool, args) {
        const descriptions = {
            create_document: () => `新規ドキュメント作成: ${args?.width || 210}×${args?.height || 297}mm, ${args?.pages || 1}ページ`,
            create_vertical_text_frame: () => `縦組みテキストフレーム作成`,
            convert_frame_to_vertical: () => `テキストフレームを縦組みに変換`,
            find_replace_text: () => `テキスト置換: 「${args?.findText}」→「${args?.replaceText}」`,
            delete_page: () => `ページ削除: ${args?.pageIndex !== undefined ? 'ページ ' + (args.pageIndex + 1) : '指定なし'}`,
            close_document: () => 'ドキュメントを閉じます',
            apply_japanese_typesetting_preset: () => `和文組版プリセット「${args?.preset || 'book'}」適用`,
            flow_text_to_pages: () => 'テキスト自動流し込み＋ページ追加',
            apply_document_template: () => `テンプレート「${args?.templateType}」適用`,
            export_print_pdf: () => `入稿用PDF出力: ${args?.filePath || '未指定'}`,
            preflight_check: () => '入稿前総合チェック実行',
        };

        const fn = descriptions[tool];
        if (fn) { try { return fn(); } catch { /* fall through */ } }
        return `ツール「${tool}」を実行`;
    }

    _generateWarnings(tool, args) {
        const warnings = [];
        if (args?.pageRange === 'all' || args?.applyToAll) {
            warnings.push('全ページに影響する操作です。');
        }
        if (this.isDangerous(tool)) {
            warnings.push('この操作は元に戻せない可能性があります。');
        }
        return warnings;
    }
}

export const safetyManager = new SafetyManager();
