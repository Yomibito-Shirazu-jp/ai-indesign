/**
 * 三者合議エンジン — 読み人知らず コア
 * 
 * オーディオマスタリングプロジェクトと同一構造。
 * 3つのエージェント関数を並行実行し、結果をマージして
 * confidence付きの最終判定を返す。
 * 
 * 設計原則: Minimize to Maximize
 * - 入口（原稿正規化）と出口（品質検証）にのみ配置
 * - 真ん中の組版エンジンには合議を入れない
 */

/**
 * @typedef {Object} AgentResult
 * @property {boolean} success - 実行成功/失敗
 * @property {string} agentId - エージェント識別子
 * @property {Object} findings - 検出結果
 * @property {number} confidence - 確信度 (0.0 - 1.0)
 * @property {string[]} [issues] - 検出された問題
 * @property {Object} [fixes] - 提案修正
 */

/**
 * @typedef {Object} CouncilVerdict
 * @property {boolean} approved - 合議結果（承認/否認）
 * @property {number} confidence - 合議全体の確信度
 * @property {string} consensus - 'unanimous' | 'majority' | 'split' | 'fallback'
 * @property {AgentResult[]} agentResults - 各エージェントの結果
 * @property {Object} mergedFindings - マージ済み検出結果
 * @property {Object} mergedFixes - マージ済み修正提案
 * @property {Object} meta - メタ情報（実行時間等）
 */

export class CouncilEngine {
    /**
     * @param {Object} options
     * @param {number} [options.timeout=30000] - エージェントタイムアウト(ms)
     * @param {number} [options.minAgentsRequired=2] - 最低必要エージェント数
     * @param {string} [options.mergeStrategy='majority'] - 'majority' | 'weighted' | 'unanimous'
     */
    constructor(options = {}) {
        this.timeout = options.timeout ?? 30000;
        this.minAgentsRequired = options.minAgentsRequired ?? 2;
        this.mergeStrategy = options.mergeStrategy ?? 'majority';
    }

    /**
     * 三者合議を実行
     * @param {Array<{id: string, fn: Function, weight?: number}>} agents - 3つのエージェント定義
     * @param {*} input - エージェントに渡す入力データ
     * @param {Object} [context] - 追加コンテキスト（顧客ルール等）
     * @returns {Promise<CouncilVerdict>}
     */
    async deliberate(agents, input, context = {}) {
        if (!agents || agents.length < 2) {
            throw new Error('合議には最低2つのエージェントが必要です');
        }

        const startTime = Date.now();

        // ── 1. 全エージェントを並行実行 ──
        const agentResults = await this._executeAgents(agents, input, context);

        // ── 2. 成功した結果のみ抽出 ──
        const successResults = agentResults.filter(r => r.success);

        if (successResults.length < this.minAgentsRequired) {
            return this._buildFallbackVerdict(agentResults, startTime);
        }

        // ── 3. コンセンサス判定 ──
        const consensus = this._determineConsensus(successResults);

        // ── 4. 結果マージ ──
        const mergedFindings = this._mergeFindings(successResults);
        const mergedFixes = this._mergeFixes(successResults);

        // ── 5. 最終確信度計算 ──
        const confidence = this._calcConfidence(successResults, consensus);

        // ── 6. 承認判定 ──
        const approved = this._judgeApproval(successResults, consensus, mergedFindings);

        return {
            approved,
            confidence,
            consensus,
            agentResults,
            mergedFindings,
            mergedFixes,
            meta: {
                totalAgents: agents.length,
                successfulAgents: successResults.length,
                executionTimeMs: Date.now() - startTime,
                mergeStrategy: this.mergeStrategy,
            },
        };
    }

    /**
     * 全エージェントを並行実行（タイムアウト付き）
     */
    async _executeAgents(agents, input, context) {
        const promises = agents.map(agent =>
            this._executeWithTimeout(agent, input, context)
        );
        return Promise.all(promises);
    }

    /**
     * 単一エージェントをタイムアウト付きで実行
     */
    async _executeWithTimeout(agent, input, context) {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Agent ${agent.id} timed out`)), this.timeout)
        );

        try {
            const result = await Promise.race([
                agent.fn(input, context),
                timeoutPromise,
            ]);

            return {
                success: true,
                agentId: agent.id,
                weight: agent.weight ?? 1.0,
                ...result,
            };
        } catch (error) {
            return {
                success: false,
                agentId: agent.id,
                weight: agent.weight ?? 1.0,
                error: error.message,
                findings: {},
                issues: [],
                fixes: {},
                confidence: 0,
            };
        }
    }

    /**
     * コンセンサス判定
     */
    _determineConsensus(results) {
        if (results.length < 2) return 'fallback';

        // 全員が同じ判定か
        const approvals = results.map(r => this._isAgentApproving(r));
        const allSame = approvals.every(a => a === approvals[0]);

        if (allSame) return 'unanimous';

        // 多数決
        const yesCount = approvals.filter(a => a).length;
        if (yesCount > results.length / 2) return 'majority';
        if (yesCount < results.length / 2) return 'majority';

        return 'split';
    }

    /**
     * エージェントの承認判定
     */
    _isAgentApproving(result) {
        // issues が0件、かつ confidence が閾値以上なら承認
        const issues = result.issues || [];
        const criticalIssues = issues.filter(i =>
            typeof i === 'object' ? i.severity === 'critical' || i.severity === 'error' : false
        );
        return criticalIssues.length === 0 && (result.confidence ?? 0.5) > 0.3;
    }

    /**
     * 検出結果のマージ（和集合 — 誰か一人でも見つけたものは全て含める）
     */
    _mergeFindings(results) {
        const merged = {};

        for (const result of results) {
            if (!result.findings) continue;

            for (const [key, value] of Object.entries(result.findings)) {
                if (!merged[key]) {
                    merged[key] = { value, sources: [result.agentId] };
                } else {
                    merged[key].sources.push(result.agentId);
                    // 複数エージェントが同じ所見 → confidence が上がる
                }
            }
        }

        return merged;
    }

    /**
     * 修正提案のマージ（多数決 or 重み付き）
     */
    _mergeFixes(results) {
        const fixMap = new Map();

        for (const result of results) {
            if (!result.fixes) continue;

            for (const [target, fix] of Object.entries(result.fixes)) {
                if (!fixMap.has(target)) {
                    fixMap.set(target, []);
                }
                fixMap.set(target, [
                    ...fixMap.get(target),
                    { fix, agentId: result.agentId, weight: result.weight, confidence: result.confidence ?? 0.5 },
                ]);
            }
        }

        // 各修正対象について最良の修正を選択
        const merged = {};
        for (const [target, proposals] of fixMap.entries()) {
            if (proposals.length === 1) {
                merged[target] = proposals[0].fix;
            } else {
                // 重み付き投票
                merged[target] = this._selectBestFix(proposals);
            }
        }

        return merged;
    }

    /**
     * 複数の修正提案から最良を選択
     */
    _selectBestFix(proposals) {
        if (this.mergeStrategy === 'unanimous') {
            // 全員一致のみ採用
            const fixValues = proposals.map(p => JSON.stringify(p.fix));
            if (new Set(fixValues).size === 1) return proposals[0].fix;
            return null;
        }

        // 重み付き投票: confidence × weight のスコアが最高の提案を選択
        let best = proposals[0];
        for (const p of proposals) {
            const score = (p.confidence ?? 0.5) * (p.weight ?? 1.0);
            const bestScore = (best.confidence ?? 0.5) * (best.weight ?? 1.0);
            if (score > bestScore) best = p;
        }
        return best.fix;
    }

    /**
     * 全体の確信度計算
     */
    _calcConfidence(results, consensus) {
        const weights = results.map(r => r.weight ?? 1.0);
        const confidences = results.map(r => r.confidence ?? 0.5);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        // 重み付き平均
        let weightedConf = 0;
        for (let i = 0; i < results.length; i++) {
            weightedConf += confidences[i] * weights[i];
        }
        weightedConf /= totalWeight;

        // コンセンサスボーナス
        const consensusMultiplier = {
            'unanimous': 1.0,
            'majority': 0.85,
            'split': 0.6,
            'fallback': 0.4,
        };

        return Math.min(1.0, weightedConf * (consensusMultiplier[consensus] || 0.5));
    }

    /**
     * 承認判定
     * 設計原則: critical/error レベルのイシューは一人でも見つけたら拒否（安全側に倒す）
     */
    _judgeApproval(results, consensus, mergedFindings) {
        if (consensus === 'split') {
            // 割れた場合は否認（安全側に倒す）
            return false;
        }

        // ── Critical Veto: 誰か一人でも critical/error を検出したら強制否認 ──
        for (const result of results) {
            const issues = result.issues || [];
            const hasCritical = issues.some(i =>
                typeof i === 'object' && (i.severity === 'critical' || i.severity === 'error')
            );
            if (hasCritical) return false;
        }

        const approvals = results.map(r => this._isAgentApproving(r));
        const yesCount = approvals.filter(a => a).length;

        return yesCount >= Math.ceil(results.length / 2);
    }

    /**
     * フォールバック判定（エージェント不足時）
     */
    _buildFallbackVerdict(agentResults, startTime) {
        const successResults = agentResults.filter(r => r.success);

        return {
            approved: false,
            confidence: successResults.length > 0 ? 0.3 : 0,
            consensus: 'fallback',
            agentResults,
            mergedFindings: this._mergeFindings(successResults),
            mergedFixes: {},
            meta: {
                totalAgents: agentResults.length,
                successfulAgents: successResults.length,
                executionTimeMs: Date.now() - startTime,
                mergeStrategy: this.mergeStrategy,
                fallbackReason: `${successResults.length}/${agentResults.length} agents succeeded (minimum ${this.minAgentsRequired} required)`,
            },
        };
    }
}
