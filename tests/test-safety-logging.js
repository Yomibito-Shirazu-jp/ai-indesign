/**
 * テスト: 安全機構・ログ (InDesign不要)
 * CCPM指示: 2番目に作るテスト
 */
import { OperationLogger } from '../src/core/operationLogger.js';
import { SafetyManager } from '../src/core/safetyManager.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
    try { fn(); pass++; console.log(`  ✅ ${name}`); }
    catch (e) { fail++; console.log(`  ❌ ${name}: ${e.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }

// ──────────────────────────────────
console.log('\n📘 OperationLogger テスト');

test('log + getRecentLogs', () => {
    const logger = new OperationLogger({ maxMemoryLogs: 10 });
    logger.log({ tool: 'test_tool', args: { x: 1 }, preview: false, success: true });
    const logs = logger.getRecentLogs(5);
    assert(logs.length === 1, `Expected 1 log, got ${logs.length}`);
    assert(logs[0].tool === 'test_tool');
    assert(logs[0].timestamp);
});

test('log required fields present', () => {
    const logger = new OperationLogger();
    const entry = logger.log({ tool: 'create_document', args: { width: 210 }, preview: true, confirm: false, scope: { document: true }, success: true, durationMs: 42 });
    // CCPM必須項目チェック
    assert(entry.timestamp, 'timestamp');
    assert(entry.tool === 'create_document', 'tool');
    assert(entry.preview === true, 'preview');
    assert(entry.confirm === false, 'confirm');
    assert(entry.scope?.document === true, 'scope');
    assert(entry.success === true, 'success');
    assert(entry.durationMs === 42, 'durationMs');
});

test('getLogsByTool', () => {
    const logger = new OperationLogger();
    logger.log({ tool: 'a', success: true });
    logger.log({ tool: 'b', success: true });
    logger.log({ tool: 'a', success: false });
    assert(logger.getLogsByTool('a').length === 2);
    assert(logger.getLogsByTool('b').length === 1);
});

test('getFailedLogs', () => {
    const logger = new OperationLogger();
    logger.log({ tool: 'x', success: true });
    logger.log({ tool: 'y', success: false, error: 'fail' });
    assert(logger.getFailedLogs().length === 1);
    assert(logger.getFailedLogs()[0].tool === 'y');
});

test('getSummary', () => {
    const logger = new OperationLogger();
    logger.log({ tool: 'a', success: true });
    logger.log({ tool: 'a', success: true, preview: true });
    logger.log({ tool: 'b', success: false });
    const s = logger.getSummary();
    assert(s.totalOperations === 3);
    assert(s.succeeded === 2);
    assert(s.failed === 1);
    assert(s.previews === 1);
    assert(s.toolUsage.a === 2);
});

test('memory limit', () => {
    const logger = new OperationLogger({ maxMemoryLogs: 5 });
    for (let i = 0; i < 10; i++) logger.log({ tool: `t${i}`, success: true });
    assert(logger.logs.length === 5, `Expected 5, got ${logger.logs.length}`);
    assert(logger.logs[0].tool === 't5', 'Should keep latest');
});

test('clearLogs', () => {
    const logger = new OperationLogger();
    logger.log({ tool: 'x', success: true });
    const { cleared } = logger.clearLogs();
    assert(cleared === 1);
    assert(logger.logs.length === 0);
});

test('sanitizeArgs truncates long strings', () => {
    const logger = new OperationLogger();
    const entry = logger.log({ tool: 'x', args: { text: 'a'.repeat(600) }, success: true });
    assert(entry.args.text.length < 600, 'Should truncate');
});

test('sanitizeArgs hides code', () => {
    const logger = new OperationLogger();
    const entry = logger.log({ tool: 'x', args: { code: 'alert(1)' }, success: true });
    assert(entry.args.code === '[InDesign script code]');
});

test('trackExecution success', async () => {
    const logger = new OperationLogger();
    const result = await logger.trackExecution('test', { a: 1 }, async () => 'ok');
    assert(result === 'ok');
    assert(logger.logs.length === 1);
    assert(logger.logs[0].success === true);
    assert(logger.logs[0].durationMs >= 0);
});

test('trackExecution failure', async () => {
    const logger = new OperationLogger();
    let caught = false;
    try {
        await logger.trackExecution('test', {}, async () => { throw new Error('boom'); });
    } catch { caught = true; }
    assert(caught, 'Should throw');
    assert(logger.logs[0].success === false);
    assert(logger.logs[0].error === 'boom');
});

// ──────────────────────────────────
console.log('\n📘 SafetyManager テスト');

test('isDangerous: delete_page', () => {
    const sm = new SafetyManager();
    assert(sm.isDangerous('delete_page') === true);
});

test('isDangerous: create_document (safe)', () => {
    const sm = new SafetyManager();
    assert(sm.isDangerous('create_document') === false);
});

test('checkSafety: dangerous without confirm → blocked', () => {
    const sm = new SafetyManager();
    const r = sm.checkSafety({ tool: 'delete_page', args: {} });
    assert(r.allowed === false);
    assert(r.reason === 'dangerous_operation_requires_confirm');
});

test('checkSafety: dangerous with confirm → allowed', () => {
    const sm = new SafetyManager();
    const r = sm.checkSafety({ tool: 'delete_page', args: { confirm: true } });
    assert(r.allowed === true);
});

test('checkSafety: preview mode → always allowed', () => {
    const sm = new SafetyManager();
    const r = sm.checkSafety({ tool: 'delete_page', args: { preview: true } });
    assert(r.allowed === true);
    assert(r.preview === true);
});

test('checkSafety: safe operation → allowed', () => {
    const sm = new SafetyManager();
    const r = sm.checkSafety({ tool: 'create_text_frame', args: {} });
    assert(r.allowed === true);
});

test('buildPreviewResult', () => {
    const sm = new SafetyManager();
    const r = sm.buildPreviewResult('create_document', { width: 210, height: 297 });
    assert(r.preview === true);
    assert(r.riskLevel === 'LOW');
    assert(r.plannedChanges);
});

test('buildPreviewResult: dangerous has HIGH risk', () => {
    const sm = new SafetyManager();
    const r = sm.buildPreviewResult('delete_page', {});
    assert(r.riskLevel === 'HIGH');
    assert(r.requiresConfirm === true);
});

// ──────────────────────────────────
console.log(`\n═══════════════════════════`);
console.log(`結果: ${pass} passed, ${fail} failed`);
console.log(`═══════════════════════════\n`);
process.exit(fail > 0 ? 1 : 0);
