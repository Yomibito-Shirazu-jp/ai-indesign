/**
 * テスト: ルールストア + ルール学習 (InDesign不要)
 */
import { RuleStore } from '../src/rules/ruleStore.js';
import { learnRules, extractDiffs } from '../src/rules/ruleLearner.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
    return fn()
        .then(() => { pass++; console.log(`  ✅ ${name}`); })
        .catch(e => { fail++; console.log(`  ❌ ${name}: ${e.message}`); });
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }

async function run() {
    console.log('\n=== ルールストア テスト ===\n');

    // ──────────────────────────────────
    console.log('📘 RuleStore 基本テスト');

    await test('デフォルトルール取得', async () => {
        const rules = RuleStore.getDefaults();
        assert(rules.customerId === '_default');
        assert(rules.style.numberStyle === 'halfwidth');
        assert(rules.notation.length === 0);
    });

    await test('存在しない顧客 → デフォルトにフォールバック', async () => {
        RuleStore.clearCache();
        const rules = await RuleStore.getRules('nonexistent-customer-xyz');
        assert(rules.customerId === 'nonexistent-customer-xyz');
        assert(rules.style.numberStyle === 'halfwidth', 'Should use default style');
    });

    await test('ルール保存と読み込み', async () => {
        RuleStore.clearCache();
        const customerId = '_test_' + Date.now();
        const saved = await RuleStore.saveRules(customerId, {
            customerName: 'テスト顧客',
            notation: [
                { pattern: '6月', replacement: '六月', message: '月は漢数字表記' }
            ],
            style: { numberStyle: 'fullwidth' },
        });
        assert(saved.customerId === customerId);
        assert(saved.customerName === 'テスト顧客');
        assert(saved.notation.length === 1);
        assert(saved.style.numberStyle === 'fullwidth');

        // 再読み込み
        RuleStore.clearCache();
        const loaded = await RuleStore.getRules(customerId);
        assert(loaded.customerId === customerId);
        assert(loaded.notation.length === 1);
        assert(loaded.notation[0].pattern === '6月');

        // クリーンアップ
        const { unlink } = await import('fs/promises');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            await unlink(join(__dirname, '../src/rules/customers', `${customerId}.json`));
        } catch(e) {}
    });

    await test('表記ルール追加', async () => {
        RuleStore.clearCache();
        const customerId = '_test_add_' + Date.now();
        await RuleStore.addNotationRule(customerId, {
            pattern: '御社',
            replacement: '貴社',
            message: 'ビジネス文書では貴社を使用',
        });

        const rules = await RuleStore.getRules(customerId);
        assert(rules.notation.length === 1);
        assert(rules.notation[0].pattern === '御社');

        // 重複追加は無視
        await RuleStore.addNotationRule(customerId, {
            pattern: '御社',
            replacement: '貴社',
            message: 'duplicate',
        });
        const rules2 = await RuleStore.getRules(customerId);
        assert(rules2.notation.length === 1, 'Should not add duplicate');

        // クリーンアップ
        const { unlink } = await import('fs/promises');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            await unlink(join(__dirname, '../src/rules/customers', `${customerId}.json`));
        } catch(e) {}
    });

    await test('キャッシュクリア', async () => {
        RuleStore.clearCache();
        // キャッシュクリア後は問題なく動作する
        const rules = await RuleStore.getRules('_cache_test');
        assert(rules.customerId === '_cache_test');
    });

    // ──────────────────────────────────
    console.log('\n📘 ルール学習 テスト');

    await test('差分からルール学習（最低出現回数）', async () => {
        const diffs = [
            { before: 'サーバ', after: 'サーバー' },
            { before: 'サーバ', after: 'サーバー' },
            { before: 'サーバ', after: 'サーバー' },
            { before: 'ユーザ', after: 'ユーザー' },
            { before: 'ユーザ', after: 'ユーザー' },
            { before: '一回限り', after: '一回のみ' }, // 1回だけ → ルール化されない
        ];
        const rules = learnRules(diffs, { minOccurrences: 2 });
        assert(rules.length >= 2, `Expected >= 2 rules, got ${rules.length}`);
        const serverRule = rules.find(r => r.replacement === 'サーバー');
        assert(serverRule, 'Should learn サーバ→サーバー rule');
        assert(serverRule.occurrences === 3, `Expected 3 occurrences, got ${serverRule.occurrences}`);
        assert(serverRule.confidence > 0.5);
    });

    await test('変更種別の自動推定', async () => {
        const diffs = [
            { before: 'サーバ', after: 'サーバー' },
            { before: 'サーバ', after: 'サーバー' },
        ];
        const rules = learnRules(diffs, { minOccurrences: 2 });
        assert(rules.length >= 1);
        assert(rules[0].category === '長音表記' || rules[0].category === '外来語表記',
            `Expected 長音/外来語, got ${rules[0].category}`);
    });

    await test('空入力 → 空ルール', async () => {
        const rules = learnRules([]);
        assert(rules.length === 0);
    });

    await test('同一テキスト → スキップ', async () => {
        const diffs = [
            { before: '同じ', after: '同じ' },
            { before: '同じ', after: '同じ' },
        ];
        const rules = learnRules(diffs);
        assert(rules.length === 0, 'Same text should not generate rules');
    });

    await test('extractDiffs: テキスト差分抽出', async () => {
        const original = 'サーバを設定する。ユーザは管理者です。';
        const revised = 'サーバーを設定する。ユーザーは管理者です。';
        const diffs = extractDiffs(original, revised);
        assert(diffs.length > 0, 'Should find diffs');
    });

    await test('確信度フィルタ', async () => {
        const diffs = [
            { before: 'X', after: 'Y' },
            { before: 'X', after: 'Y' },
        ];
        const highConfRules = learnRules(diffs, { minConfidence: 0.9 });
        const lowConfRules = learnRules(diffs, { minConfidence: 0.3 });
        assert(lowConfRules.length >= highConfRules.length,
            'Lower confidence threshold should return more rules');
    });

    // Summary
    console.log(`\n${'═'.repeat(30)}`);
    console.log(`結果: ${pass} passed, ${fail} failed`);
    console.log(`${'═'.repeat(30)}\n`);
    process.exit(fail > 0 ? 1 : 0);
}

run();
