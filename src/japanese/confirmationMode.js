/**
 * 確認モード制御
 * 低confidence操作を保留し、ユーザーに確認を求める
 */
import { categorizeOperations, formatIRSummary } from './intermediateRepresentation.js';

export class ConfirmationMode {
    constructor() {
        this.pendingOperations = null;
        this.pendingIR = null;
    }

    /**
     * IRを評価し、自動実行可能な操作と確認必要な操作を分離
     * @param {Object} ir - IntermediateRepresentation
     * @returns {{ autoExecute: Object[], needsConfirmation: Object[], summary: string }}
     */
    evaluate(ir) {
        const { executable, needsConfirmation, unresolved } = categorizeOperations(ir);

        const result = {
            autoExecute: executable,
            needsConfirmation,
            unresolved,
            summary: formatIRSummary(ir),
            canAutoExecute: needsConfirmation.length === 0 && unresolved.length === 0,
        };

        if (!result.canAutoExecute) {
            this.pendingOperations = needsConfirmation;
            this.pendingIR = ir;
        }

        return result;
    }

    /**
     * 保留中の操作を承認して返す
     */
    approve() {
        const ops = this.pendingOperations || [];
        this.pendingOperations = null;
        this.pendingIR = null;
        return ops;
    }

    /**
     * 保留中の操作を破棄
     */
    reject() {
        this.pendingOperations = null;
        this.pendingIR = null;
        return { rejected: true };
    }

    /**
     * 保留中の操作があるか
     */
    hasPending() {
        return this.pendingOperations !== null && this.pendingOperations.length > 0;
    }

    /**
     * 保留中の操作サマリー
     */
    getPendingSummary() {
        if (!this.pendingIR) return null;
        return formatIRSummary(this.pendingIR);
    }
}

export const confirmationMode = new ConfirmationMode();
