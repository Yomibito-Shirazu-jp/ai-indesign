/**
 * 中間表現 (Intermediate Representation) — CCPM修正版
 * 
 * 必須項目:
 * - requiresConfirmation: 確認必要フラグ
 * - previewAvailable: プレビュー可否
 * - scope: { document, pages[], objects[] }
 * - warnings: 警告配列
 * - metadata: { language, domain }
 */

/**
 * @typedef {Object} Operation
 * @property {string} tool
 * @property {Object} args
 * @property {number} confidence
 * @property {boolean} requiresConfirmation
 * @property {boolean} previewAvailable
 * @property {{ document?: boolean, pages?: number[], objects?: string[] }} scope
 * @property {string} reason
 * @property {string[]} warnings
 */

export class IntermediateRepresentationBuilder {
    constructor() {
        this.operations = [];
        this.unresolved = [];
        this.warnings = [];
        this.contextReferences = [];
        this.source = '';
        this.metadata = { language: 'ja', domain: 'dtp' };
    }

    setSource(text) {
        this.source = text;
        return this;
    }

    /**
     * 操作を追加（CCPM必須フィールド付き）
     */
    addOperation(tool, args, confidence, options = {}) {
        const op = {
            tool,
            args,
            confidence: Math.max(0, Math.min(1, confidence)),
            requiresConfirmation: options.requiresConfirmation ?? (confidence < 0.7),
            previewAvailable: options.previewAvailable ?? true,
            scope: options.scope || { document: true, pages: [], objects: [] },
            reason: options.reason || '',
            warnings: options.warnings || [],
            order: this.operations.length,
        };
        this.operations.push(op);
        return this;
    }

    addUnresolved(term) {
        this.unresolved.push(term);
        return this;
    }

    addWarning(warning) {
        this.warnings.push(warning);
        return this;
    }

    addContextReference(ref) {
        this.contextReferences.push(ref);
        return this;
    }

    setMetadata(key, value) {
        this.metadata[key] = value;
        return this;
    }

    /**
     * IR をビルド
     */
    build() {
        return {
            source: this.source,
            operations: [...this.operations],
            unresolved: [...this.unresolved],
            warnings: [...this.warnings],
            contextReferences: [...this.contextReferences],
            metadata: {
                ...this.metadata,
                createdAt: new Date().toISOString(),
                operationCount: this.operations.length,
                overallConfidence: this._calcOverallConfidence(),
                needsConfirmation: this._needsConfirmation(),
            }
        };
    }

    _calcOverallConfidence() {
        if (this.operations.length === 0) return 0;
        const sum = this.operations.reduce((acc, op) => acc + op.confidence, 0);
        return Math.round((sum / this.operations.length) * 100) / 100;
    }

    _needsConfirmation() {
        if (this.unresolved.length > 0) return true;
        if (this.operations.some(op => op.requiresConfirmation)) return true;
        if (this.operations.length === 0) return true;
        return false;
    }

    reset() {
        this.operations = [];
        this.unresolved = [];
        this.warnings = [];
        this.contextReferences = [];
        this.source = '';
        this.metadata = { language: 'ja', domain: 'dtp' };
        return this;
    }
}

/**
 * IR → 実行可能 / 確認必要 に分類
 */
export function categorizeOperations(ir) {
    const executable = [];
    const needsConfirmation = [];

    for (const op of ir.operations) {
        if (!op.requiresConfirmation && op.confidence >= 0.7) {
            executable.push(op);
        } else {
            needsConfirmation.push(op);
        }
    }

    return { executable, needsConfirmation, unresolved: ir.unresolved };
}

/**
 * IR → ユーザー表示用サマリー
 */
export function formatIRSummary(ir) {
    const lines = [`📋 指示解釈結果:`, `元の指示: 「${ir.source}」`, ''];

    if (ir.operations.length > 0) {
        lines.push(`🔧 実行予定操作 (${ir.operations.length}件):`);
        for (const op of ir.operations) {
            const conf = Math.round(op.confidence * 100);
            const icon = op.requiresConfirmation ? '⚠️' : '✅';
            const scope = op.scope.pages?.length > 0
                ? ` [ページ: ${op.scope.pages.join(',')}]` : '';
            lines.push(`  ${icon} ${op.tool} (確信度: ${conf}%)${scope} — ${op.reason}`);
            for (const w of op.warnings) lines.push(`     ⚠ ${w}`);
        }
    }

    if (ir.unresolved.length > 0) {
        lines.push('', `❓ 未解決語句: ${ir.unresolved.map(u => `「${u}」`).join(', ')}`);
    }

    if (ir.warnings.length > 0) {
        lines.push('', `⚠️ 警告: ${ir.warnings.join('; ')}`);
    }

    lines.push('', `📊 全体確信度: ${Math.round((ir.metadata.overallConfidence || 0) * 100)}%`);
    if (ir.metadata.needsConfirmation) {
        lines.push('⚠️ 確認が必要な操作があります。');
    }

    return lines.join('\n');
}
