/**
 * テスト: 日本語自然文解釈 (InDesign不要)
 * CCPM指示: 最初に作るテスト
 */
import { parseInstruction, parseMultipleInstructions } from '../src/japanese/instructionParser.js';
import { lookupTerm, parsePageSize, resolveAmbiguousValue, resolveDocumentType } from '../src/japanese/dtpDictionary.js';
import { categorizeOperations, formatIRSummary } from '../src/japanese/intermediateRepresentation.js';
import { ConfirmationMode } from '../src/japanese/confirmationMode.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
    try {
        fn();
        pass++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        fail++;
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}

// ──────────────────────────────────
console.log('\n📘 DTP辞書テスト');

test('parsePageSize: A4', () => {
    const r = parsePageSize('A4');
    assert(r?.size?.width === 210 && r?.size?.height === 297, `Got ${JSON.stringify(r)}`);
});

test('parsePageSize: B5', () => {
    const r = parsePageSize('B5');
    assert(r?.size?.width === 182 && r?.size?.height === 257, `Got ${JSON.stringify(r)}`);
});

test('lookupTerm: 版面', () => {
    const r = lookupTerm('版面');
    assert(r !== undefined, 'Should find 版面');
});

test('lookupTerm: 流し込み', () => {
    const r = lookupTerm('流し込み');
    assert(r !== undefined, 'Should find 流し込み');
});

test('resolveAmbiguousValue: 少し', () => {
    const v = resolveAmbiguousValue('少し');
    assert(typeof v === 'number' && v > 0, 'Should resolve to a number');
});

test('resolveDocumentType: チラシ', () => {
    const r = resolveDocumentType('チラシ');
    assert(r?.type === 'flyer', `Got ${JSON.stringify(r)}`);
});

// ──────────────────────────────────
console.log('\n📘 自然文パーサーテスト');

test('parseInstruction: A4チラシを作って', () => {
    const ir = parseInstruction('A4チラシを作って');
    assert(ir.operations.length >= 1, `Expected operations, got ${ir.operations.length}`);
    assert(ir.operations[0].tool === 'create_document', `Expected create_document, got ${ir.operations[0].tool}`);
});

test('parseInstruction: A4縦、8ページの会社案内を作成', () => {
    const ir = parseInstruction('A4縦、8ページの会社案内を作成');
    assert(ir.operations.length >= 1);
    const createOp = ir.operations.find(op => op.tool === 'create_document');
    assert(createOp, 'Should have create_document');
    assert(createOp.args.pages === 8, `Expected 8 pages, got ${createOp.args.pages}`);
});

test('parseInstruction: 本文は明朝、見出しはゴシックで', () => {
    const ir = parseInstruction('本文は明朝、見出しはゴシックで');
    assert(ir.operations.length >= 2, `Expected 2+ ops, got ${ir.operations.length}`);
    const bodyOp = ir.operations.find(op => op.args?.name === '本文');
    const headOp = ir.operations.find(op => op.args?.name === '見出し');
    assert(bodyOp, 'Should have body style op');
    assert(headOp, 'Should have heading style op');
});

test('parseInstruction: 2ページ目だけ縦書きで', () => {
    const ir = parseInstruction('2ページ目だけ縦書きで');
    assert(ir.operations.length >= 1);
    assert(ir.operations[0].tool === 'convert_frame_to_vertical');
    assert(ir.operations[0].args.pageIndex === 1, `Expected page 1, got ${ir.operations[0].args.pageIndex}`);
});

test('parseInstruction: 余白を少し広げて', () => {
    const ir = parseInstruction('余白を少し広げて');
    assert(ir.operations.length >= 1);
    assert(ir.operations[0].scope, 'Should have scope');
});

test('parseInstruction: 入稿チェックして', () => {
    const ir = parseInstruction('入稿チェックして');
    assert(ir.operations.length >= 1);
    assert(ir.operations[0].tool === 'preflight_check');
});

test('parseInstruction: 入稿用PDFを書き出して', () => {
    const ir = parseInstruction('入稿用PDFを書き出して');
    assert(ir.operations[0].tool === 'export_print_pdf');
    assert(ir.operations[0].requiresConfirmation === true);
});

test('parseInstruction: 画像が荒いところを確認して', () => {
    const ir = parseInstruction('画像が荒いところを確認して');
    assert(ir.operations[0].tool === 'check_image_resolution');
});

test('parseInstruction: unknown input returns unresolved', () => {
    const ir = parseInstruction('何かよくわからないこと');
    assert(ir.unresolved.length > 0, 'Should have unresolved');
});

// ──────────────────────────────────
console.log('\n📘 複数指示テスト');

test('parseMultipleInstructions: combined', () => {
    const text = 'A4チラシを作って。入稿チェックして';
    const ir = parseMultipleInstructions(text);
    assert(ir.operations.length >= 2, `Expected 2+ ops, got ${ir.operations.length}`);
});

// ──────────────────────────────────
console.log('\n📘 IR分類テスト');

test('categorizeOperations: separates by confidence', () => {
    const ir = parseInstruction('入稿用PDFを書き出して');
    const { executable, needsConfirmation } = categorizeOperations(ir);
    assert(needsConfirmation.length >= 1, 'PDF export should need confirmation');
});

test('formatIRSummary: produces readable output', () => {
    const ir = parseInstruction('A4チラシを作って');
    const summary = formatIRSummary(ir);
    assert(summary.includes('実行予定操作'), 'Should contain summary text');
});

// ──────────────────────────────────
console.log('\n📘 IR必須フィールドテスト (CCPM)');

test('IR operation has requiresConfirmation', () => {
    const ir = parseInstruction('A4チラシを作って');
    assert(ir.operations[0].requiresConfirmation !== undefined, 'Must have requiresConfirmation');
});

test('IR operation has previewAvailable', () => {
    const ir = parseInstruction('A4チラシを作って');
    assert(ir.operations[0].previewAvailable !== undefined, 'Must have previewAvailable');
});

test('IR operation has scope', () => {
    const ir = parseInstruction('A4チラシを作って');
    assert(ir.operations[0].scope !== undefined, 'Must have scope');
    assert(typeof ir.operations[0].scope.document === 'boolean', 'scope.document must be boolean');
});

test('IR metadata has language and domain', () => {
    const ir = parseInstruction('A4チラシを作って');
    assert(ir.metadata.language === 'ja');
    assert(ir.metadata.domain === 'dtp');
});

// ──────────────────────────────────
console.log('\n📘 確認モードテスト');

test('ConfirmationMode: evaluate + approve', () => {
    const cm = new ConfirmationMode();
    const ir = parseInstruction('入稿用PDFを書き出して');
    const result = cm.evaluate(ir);
    assert(result.needsConfirmation === true || result.autoExecute !== undefined);
});

// ──────────────────────────────────
console.log(`\n═══════════════════════════`);
console.log(`結果: ${pass} passed, ${fail} failed`);
console.log(`═══════════════════════════\n`);
process.exit(fail > 0 ? 1 : 0);
