/**
 * テスト: 三者合議エンジン (InDesign不要)
 * CouncilEngine + 入口合議エージェント
 */
import { CouncilEngine } from '../src/council/councilEngine.js';
import {
    createNotationAgent,
    createStructureAgent,
    createSemanticAgent,
    createInputCouncilAgents,
    createOutputCouncilAgents,
} from '../src/council/agents.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
    return fn()
        .then(() => { pass++; console.log(`  ✅ ${name}`); })
        .catch(e => { fail++; console.log(`  ❌ ${name}: ${e.message}`); });
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }

async function run() {
    console.log('\n=== 三者合議エンジン テスト ===\n');

    // ──────────────────────────────────
    console.log('📘 CouncilEngine 基本テスト');

    await test('3エージェント全一致 → unanimous', async () => {
        const engine = new CouncilEngine();
        const agents = [
            { id: 'a1', fn: async () => ({ findings: { ok: true }, issues: [], fixes: {}, confidence: 0.9 }) },
            { id: 'a2', fn: async () => ({ findings: { ok: true }, issues: [], fixes: {}, confidence: 0.85 }) },
            { id: 'a3', fn: async () => ({ findings: { ok: true }, issues: [], fixes: {}, confidence: 0.95 }) },
        ];
        const result = await engine.deliberate(agents, 'テスト');
        assert(result.consensus === 'unanimous', `Expected unanimous, got ${result.consensus}`);
        assert(result.approved === true, 'Should be approved');
        assert(result.confidence > 0.7, `Confidence should be > 0.7, got ${result.confidence}`);
        assert(result.meta.totalAgents === 3);
        assert(result.meta.successfulAgents === 3);
    });

    await test('2:1 分裂（warning） → majority承認', async () => {
        const engine = new CouncilEngine();
        const agents = [
            { id: 'a1', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.9 }) },
            { id: 'a2', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.8 }) },
            { id: 'a3', fn: async () => ({
                findings: {},
                issues: [{ type: 'test', severity: 'warning', message: '軽微な問題' }],
                fixes: {},
                confidence: 0.2,
            }) },
        ];
        const result = await engine.deliberate(agents, 'テスト');
        assert(result.consensus === 'majority', `Expected majority, got ${result.consensus}`);
        assert(result.approved === true, 'Majority should approve for warnings');
    });

    await test('critical issue → veto（多数決オーバーライド）', async () => {
        const engine = new CouncilEngine();
        const agents = [
            { id: 'a1', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.9 }) },
            { id: 'a2', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.8 }) },
            { id: 'a3', fn: async () => ({
                findings: {},
                issues: [{ type: 'test', severity: 'critical', message: '致命的問題' }],
                fixes: {},
                confidence: 0.2,
            }) },
        ];
        const result = await engine.deliberate(agents, 'テスト');
        assert(result.approved === false, 'Critical issue should veto regardless of majority');
    });

    await test('1エージェント失敗 → 残り2で判定', async () => {
        const engine = new CouncilEngine();
        const agents = [
            { id: 'a1', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.9 }) },
            { id: 'a2', fn: async () => { throw new Error('Agent crashed'); } },
            { id: 'a3', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.85 }) },
        ];
        const result = await engine.deliberate(agents, 'テスト');
        assert(result.meta.successfulAgents === 2, `Expected 2 successful, got ${result.meta.successfulAgents}`);
        assert(result.approved === true, 'Should still approve with 2 agents');
        assert(result.agentResults[1].success === false, 'Agent 2 should have failed');
    });

    await test('全エージェント失敗 → fallback', async () => {
        const engine = new CouncilEngine({ minAgentsRequired: 2 });
        const agents = [
            { id: 'a1', fn: async () => { throw new Error('crash 1'); } },
            { id: 'a2', fn: async () => { throw new Error('crash 2'); } },
            { id: 'a3', fn: async () => { throw new Error('crash 3'); } },
        ];
        const result = await engine.deliberate(agents, 'テスト');
        assert(result.consensus === 'fallback', `Expected fallback, got ${result.consensus}`);
        assert(result.approved === false, 'Should not be approved');
        assert(result.confidence === 0, 'Confidence should be 0');
    });

    await test('タイムアウト → エージェント失敗扱い', async () => {
        const engine = new CouncilEngine({ timeout: 100 });
        const agents = [
            { id: 'fast', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.9 }) },
            { id: 'slow', fn: () => new Promise(r => setTimeout(() => r({ findings: {}, issues: [], fixes: {}, confidence: 0.5 }), 5000)) },
            { id: 'fast2', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.85 }) },
        ];
        const result = await engine.deliberate(agents, 'テスト');
        assert(result.meta.successfulAgents === 2, 'Slow agent should timeout');
        const slowResult = result.agentResults.find(r => r.agentId === 'slow');
        assert(slowResult.success === false, 'Slow agent should be marked as failed');
    });

    await test('修正提案マージ（複数エージェント同意）', async () => {
        const engine = new CouncilEngine();
        const agents = [
            { id: 'a1', fn: async () => ({ findings: {}, issues: [], fixes: { 'サーバ': { action: 'replace', to: 'サーバー' } }, confidence: 0.9 }) },
            { id: 'a2', fn: async () => ({ findings: {}, issues: [], fixes: { 'サーバ': { action: 'replace', to: 'サーバー' } }, confidence: 0.8 }) },
            { id: 'a3', fn: async () => ({ findings: {}, issues: [], fixes: {}, confidence: 0.7 }) },
        ];
        const result = await engine.deliberate(agents, 'テスト');
        assert(result.mergedFixes['サーバ'], 'Should have merged fix for サーバ');
        assert(result.mergedFixes['サーバ'].to === 'サーバー', 'Fix should be サーバー');
    });

    await test('エージェント2つ以上必須', async () => {
        const engine = new CouncilEngine();
        try {
            await engine.deliberate([{ id: 'a1', fn: async () => ({}) }], 'テスト');
            assert(false, 'Should have thrown');
        } catch (e) {
            assert(e.message.includes('最低2つ'), `Expected error about minimum agents, got: ${e.message}`);
        }
    });

    // ──────────────────────────────────
    console.log('\n📘 入口合議エージェント テスト');

    await test('createInputCouncilAgents: クリーンテキスト → 全承認', async () => {
        const engine = new CouncilEngine();
        const agents = createInputCouncilAgents();
        const result = await engine.deliberate(agents, 'この文章には問題がありません。正常なテキストです。');
        assert(result.approved === true, 'Clean text should be approved');
        assert(result.confidence > 0.5, `Confidence should be > 0.5, got ${result.confidence}`);
    });

    await test('createInputCouncilAgents: 表記揺れ検出', async () => {
        const engine = new CouncilEngine();
        const agents = createInputCouncilAgents();
        const result = await engine.deliberate(agents, 'サーバーを設定する。サーバに接続する。');
        const notationResult = result.agentResults.find(r => r.agentId === 'notation-verifier');
        assert(notationResult.success === true, 'Notation agent should succeed');
        assert(notationResult.issues.length > 0, 'Should find notation issues');
        const hyokiIssue = notationResult.issues.find(i => i.type === 'hyoki_yure');
        assert(hyokiIssue, 'Should find hyoki yure issue');
    });

    await test('createInputCouncilAgents: 不適切表現検出', async () => {
        const engine = new CouncilEngine();
        const agents = createInputCouncilAgents();
        const result = await engine.deliberate(agents, '片手落ちなやり方だ。');
        const semanticResult = result.agentResults.find(r => r.agentId === 'semantic-verifier');
        assert(semanticResult.success === true, 'Semantic agent should succeed');
        assert(semanticResult.issues.length > 0, 'Should find sensitive issues');
        assert(semanticResult.issues[0].type === 'sensitive_term', 'Should be sensitive_term type');
    });

    await test('createInputCouncilAgents: 空テキスト → 即座にパス', async () => {
        const engine = new CouncilEngine();
        const agents = createInputCouncilAgents();
        const result = await engine.deliberate(agents, '');
        assert(result.approved === true, 'Empty text should pass');
        assert(result.confidence > 0.8, 'High confidence for empty text');
    });

    // ──────────────────────────────────
    console.log('\n📘 出口合議エージェント テスト');

    await test('createOutputCouncilAgents: クリーンドキュメント → 承認', async () => {
        const engine = new CouncilEngine();
        const agents = createOutputCouncilAgents();
        const cleanDoc = { documentInfo: {} };
        const result = await engine.deliberate(agents, cleanDoc);
        assert(result.approved === true, 'Clean doc should be approved');
    });

    await test('createOutputCouncilAgents: フォント欠損 → critical', async () => {
        const engine = new CouncilEngine();
        const agents = createOutputCouncilAgents();
        const docWithIssues = {
            documentInfo: {
                missingFonts: [{ name: 'A-OTF リュウミン Pr6N' }],
                brokenLinks: [{ name: 'image001.tif' }],
            },
        };
        const result = await engine.deliberate(agents, docWithIssues);
        assert(result.approved === false, 'Doc with critical issues should be rejected');
        const mappingResult = result.agentResults.find(r => r.agentId === 'layout-mapping-verifier');
        assert(mappingResult.issues.length >= 2, 'Should find font + link issues');
    });

    await test('createOutputCouncilAgents: 塗り足し不足 → warning', async () => {
        const engine = new CouncilEngine();
        const agents = createOutputCouncilAgents();
        const docWithWarning = {
            documentInfo: {
                bleedIssues: [{ side: 'top', currentMM: 2, requiredMM: 3 }],
            },
        };
        const result = await engine.deliberate(agents, docWithWarning);
        // Warning only — should still approve since no critical issues
        assert(result.approved === true, 'Doc with only warnings should be approved');
        const diffResult = result.agentResults.find(r => r.agentId === 'layout-diff-verifier');
        assert(diffResult.issues.length === 1, 'Should find 1 bleed issue');
    });

    // Summary
    console.log(`\n${'═'.repeat(30)}`);
    console.log(`結果: ${pass} passed, ${fail} failed`);
    console.log(`${'═'.repeat(30)}\n`);
    process.exit(fail > 0 ? 1 : 0);
}

run();
