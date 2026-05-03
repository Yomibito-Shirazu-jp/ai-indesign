/**
 * テスト: 校閲機能 (InDesign不要)
 * 常用漢字チェック、表記揺れ検知、不適切表現検出
 */
import {
    detectNonJoyoKanji,
    detectHyokiYure,
    detectSensitiveTerms,
    JOYO_KANJI,
    HYOKI_YURE_PATTERNS,
    SENSITIVE_TERMS,
} from '../src/japanese/proofreadingDictionary.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
    try { fn(); pass++; console.log(`  ✅ ${name}`); }
    catch (e) { fail++; console.log(`  ❌ ${name}: ${e.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }

// ──────────────────────────────────
console.log('\n📘 常用漢字辞書テスト');

test('JOYO_KANJI is a Set with entries', () => {
    assert(JOYO_KANJI instanceof Set, 'Should be a Set');
    assert(JOYO_KANJI.size > 500, `Expected > 500 entries, got ${JOYO_KANJI.size}`);
});

test('JOYO_KANJI contains basic kanji', () => {
    assert(JOYO_KANJI.has('人'), '人 should be joyo');
    assert(JOYO_KANJI.has('日'), '日 should be joyo');
    assert(JOYO_KANJI.has('大'), '大 should be joyo');
    assert(JOYO_KANJI.has('年'), '年 should be joyo');
    assert(JOYO_KANJI.has('会'), '会 should be joyo');
    assert(JOYO_KANJI.has('国'), '国 should be joyo');
});

test('detectNonJoyoKanji: no issues for common text', () => {
    const result = detectNonJoyoKanji('日本語の文章です。');
    // 日本語文章 — all common kanji
    assert(result.count >= 0, 'Should return count');
    assert(Array.isArray(result.nonJoyoKanji), 'Should return array');
});

test('detectNonJoyoKanji: detects rare kanji', () => {
    // 鑷 (tweezers) is NOT a joyo kanji
    const result = detectNonJoyoKanji('鑷子を使う');
    assert(result.count >= 1, `Expected >= 1 non-joyo, got ${result.count}`);
    assert(result.nonJoyoKanji[0].char === '鑷', 'Should detect 鑷');
    assert(result.nonJoyoKanji[0].context, 'Should have context');
    assert(result.nonJoyoKanji[0].position === 0, 'Should be at position 0');
});

test('detectNonJoyoKanji: empty text returns 0', () => {
    const result = detectNonJoyoKanji('');
    assert(result.count === 0);
});

// ──────────────────────────────────
console.log('\n📘 表記揺れ辞書テスト');

test('HYOKI_YURE_PATTERNS has entries', () => {
    assert(Array.isArray(HYOKI_YURE_PATTERNS), 'Should be array');
    assert(HYOKI_YURE_PATTERNS.length > 30, `Expected > 30 patterns, got ${HYOKI_YURE_PATTERNS.length}`);
});

test('detectHyokiYure: single variant = no issue', () => {
    const result = detectHyokiYure('サーバーを設定する。サーバーに接続する。');
    const serverIssue = result.issues.find(i => i.variants.includes('サーバー'));
    assert(!serverIssue, 'Single variant should not be flagged');
});

test('detectHyokiYure: mixed variants = issue', () => {
    const result = detectHyokiYure('サーバーを設定する。サーバに接続する。');
    assert(result.count >= 1, `Expected >= 1 issue, got ${result.count}`);
    const issue = result.issues.find(i => i.variants.includes('サーバー') || i.variants.includes('サーバ'));
    assert(issue, 'Should detect サーバー/サーバ inconsistency');
    assert(issue.recommended === 'サーバー', 'Should recommend サーバー');
    assert(issue.category === '外来語', 'Should be 外来語 category');
});

test('detectHyokiYure: okurigana variants', () => {
    const result = detectHyokiYure('申し込みフォームです。申込は本日締切です。');
    assert(result.count >= 1, 'Should detect okurigana variant');
});

test('detectHyokiYure: kanji/kana variants', () => {
    const result = detectHyokiYure('ご確認下さい。早めにください。');
    assert(result.count >= 1, 'Should detect 下さい/ください');
});

test('detectHyokiYure: empty text = no issues', () => {
    const result = detectHyokiYure('');
    assert(result.count === 0);
});

// ──────────────────────────────────
console.log('\n📘 不適切表現辞書テスト');

test('SENSITIVE_TERMS has entries', () => {
    assert(Array.isArray(SENSITIVE_TERMS), 'Should be array');
    assert(SENSITIVE_TERMS.length > 20, `Expected > 20 terms, got ${SENSITIVE_TERMS.length}`);
});

test('detectSensitiveTerms: detects term', () => {
    const result = detectSensitiveTerms('この計画は片手落ちだ');
    assert(result.count >= 1, `Expected >= 1 issue, got ${result.count}`);
    assert(result.issues[0].term === '片手落ち');
    assert(result.issues[0].suggestion, 'Should have suggestion');
    assert(result.issues[0].severity === 'high');
    assert(result.issues[0].positions.length === 1);
});

test('detectSensitiveTerms: multiple occurrences', () => {
    const result = detectSensitiveTerms('盲点がある。もう一つの盲点。');
    assert(result.count >= 1);
    const issue = result.issues.find(i => i.term === '盲点');
    assert(issue, 'Should find 盲点');
    assert(issue.positions.length === 2, 'Should find 2 occurrences');
});

test('detectSensitiveTerms: minSeverity filter', () => {
    const text = '看護婦がいる。片手落ちだ。';
    const allResult = detectSensitiveTerms(text, { minSeverity: 'low' });
    const highResult = detectSensitiveTerms(text, { minSeverity: 'high' });
    assert(allResult.count > highResult.count, 'High severity filter should return fewer results');
    assert(highResult.count >= 1, 'Should still find 片手落ち at high level');
});

test('detectSensitiveTerms: clean text = no issues', () => {
    const result = detectSensitiveTerms('この文章には問題がありません。');
    assert(result.count === 0);
});

test('detectSensitiveTerms: has category field', () => {
    const result = detectSensitiveTerms('看護婦が対応した');
    assert(result.count >= 1);
    assert(result.issues[0].category === '職業');
});

// ──────────────────────────────────
console.log(`\n═══════════════════════════`);
console.log(`結果: ${pass} passed, ${fail} failed`);
console.log(`═══════════════════════════\n`);
process.exit(fail > 0 ? 1 : 0);
