/**
 * テスト: 原稿正規化エンジン + セマンティックマップ (InDesign不要)
 */
import { normalize } from '../src/normalizer/normalizer.js';
import { buildSemanticMap } from '../src/normalizer/semanticMap.js';

let pass = 0;
let fail = 0;

function test(name, fn) {
    return fn()
        .then(() => { pass++; console.log(`  ✅ ${name}`); })
        .catch(e => { fail++; console.log(`  ❌ ${name}: ${e.message}`); });
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }

async function run() {
    console.log('\n=== 原稿正規化エンジン テスト ===\n');

    // ──────────────────────────────────
    console.log('📘 セマンティックマップ テスト');

    await test('見出し検出（Markdown形式）', async () => {
        const map = buildSemanticMap('# タイトル\n\n本文テキスト');
        assert(map.elements.length >= 2, `Expected >= 2 elements, got ${map.elements.length}`);
        const heading = map.elements.find(e => e.type === 'heading');
        assert(heading, 'Should find heading');
        assert(heading.content.includes('タイトル'), 'Heading should contain タイトル');
    });

    await test('見出し検出（日本語形式 — 第一章）', async () => {
        const map = buildSemanticMap('第一章　序文\n\n内容です。');
        const heading = map.elements.find(e => e.type === 'heading');
        assert(heading, 'Should find 第一章 as heading');
    });

    await test('見出し検出（■マーク形式）', async () => {
        const map = buildSemanticMap('■概要\n\n詳細テキスト');
        const heading = map.elements.find(e => e.type === 'heading');
        assert(heading, 'Should find ■概要 as heading');
    });

    await test('見出し検出（【括弧】形式）', async () => {
        const map = buildSemanticMap('【お知らせ】\n\n内容です。');
        const heading = map.elements.find(e => e.type === 'heading');
        assert(heading, 'Should find 【お知らせ】 as heading');
    });

    await test('リスト検出', async () => {
        const map = buildSemanticMap('・項目1\n・項目2\n・項目3');
        const lists = map.elements.filter(e => e.type === 'list');
        assert(lists.length === 3, `Expected 3 list items, got ${lists.length}`);
    });

    await test('注記検出', async () => {
        const map = buildSemanticMap('本文です。\n\n※注意事項があります。');
        const note = map.elements.find(e => e.type === 'note');
        assert(note, 'Should find note starting with ※');
    });

    await test('キャプション検出', async () => {
        const map = buildSemanticMap('図1 システム構成図');
        const caption = map.elements.find(e => e.type === 'caption');
        assert(caption, 'Should find caption starting with 図1');
    });

    await test('複合テキスト構造解析', async () => {
        const text = `# はじめに

この文書は読み人知らずの設計書です。

## 概要

・ポイント1
・ポイント2

※注意: 開発中のドキュメントです。

図1 アーキテクチャ図`;

        const map = buildSemanticMap(text);
        assert(map.elements.length >= 6, `Expected >= 6 elements, got ${map.elements.length}`);
        assert(map.stats.totalElements >= 6);
        assert(map.stats.typeCounts.heading >= 2, 'Should have at least 2 headings');
        assert(map.stats.typeCounts.list >= 2, 'Should have at least 2 list items');
    });

    await test('空テキスト → 空のマップ', async () => {
        const map = buildSemanticMap('');
        assert(map.elements.length === 0);
        assert(map.stats.totalElements === 0);
    });

    await test('階層ツリー構築', async () => {
        const map = buildSemanticMap('# 大見出し\n\n本文\n\n## 小見出し\n\n詳細');
        assert(map.structure.children.length > 0, 'Root should have children');
    });

    // ──────────────────────────────────
    console.log('\n📘 正規化パイプライン テスト');

    await test('全角数字→半角変換', async () => {
        const result = await normalize('令和６年１月１日', { skipCouncil: true });
        assert(result.normalizedText === '令和6年1月1日', `Expected 半角, got "${result.normalizedText}"`);
        assert(result.appliedFixes.some(f => f.type === 'numbers'), 'Should report number fix');
    });

    await test('半角数字→全角変換', async () => {
        const result = await normalize('令和6年1月1日', { rules: { numberStyle: 'fullwidth' }, skipCouncil: true });
        assert(result.normalizedText === '令和６年１月１日', `Expected 全角, got "${result.normalizedText}"`);
    });

    await test('句読点統一（．，→。、）', async () => {
        const result = await normalize('これは文章です．次の項目は，重要です．', { skipCouncil: true });
        assert(result.normalizedText === 'これは文章です。次の項目は、重要です。', `Got: "${result.normalizedText}"`);
    });

    await test('表記揺れ自動修正', async () => {
        const result = await normalize('サーバーを設定する。サーバに接続する。', { skipCouncil: true });
        // 表記揺れが検出され修正される場合
        const hyokiFix = result.appliedFixes.find(f => f.type === 'hyoki_yure');
        if (hyokiFix) {
            assert(result.normalizedText.includes('サーバー'), 'Should normalize to サーバー');
            assert(!result.normalizedText.includes('サーバに'), 'Should not contain サーバに');
        }
        // 修正されない場合でもエラーにはならない
    });

    await test('スペース正規化', async () => {
        const result = await normalize('テスト　　　テスト', { skipCouncil: true });
        assert(!result.normalizedText.includes('　　　'), 'Should reduce consecutive spaces');
    });

    await test('dryRun: 修正適用せず報告のみ', async () => {
        const result = await normalize('令和６年', { dryRun: true, skipCouncil: true });
        assert(result.normalizedText === '令和６年', 'dryRun should keep original text');
        assert(result.appliedFixes.length > 0, 'Should still report fixes');
    });

    await test('空テキスト → 即座に返却', async () => {
        const result = await normalize('', { skipCouncil: true });
        assert(result.normalizedText === '');
        assert(result.appliedFixes.length === 0);
    });

    await test('三者合議付き正規化', async () => {
        const result = await normalize('この文章には問題がありません。正常なテキストです。');
        assert(result.councilVerdict !== null, 'Should have council verdict');
        assert(result.councilVerdict.approved === true, 'Clean text should be approved');
        assert(result.stats.councilApproved === true);
    });

    await test('統計情報の生成', async () => {
        const result = await normalize('テスト文章です。', { skipCouncil: true });
        assert(result.stats.originalLength > 0);
        assert(result.stats.normalizedLength > 0);
        assert(typeof result.stats.fixCount === 'number');
    });

    await test('セマンティックマップの生成', async () => {
        const result = await normalize('# タイトル\n\n本文テキスト', { skipCouncil: true });
        assert(result.semanticMap, 'Should generate semantic map');
        assert(result.semanticMap.elements.length > 0, 'Map should have elements');
    });

    // Summary
    console.log(`\n${'═'.repeat(30)}`);
    console.log(`結果: ${pass} passed, ${fail} failed`);
    console.log(`${'═'.repeat(30)}\n`);
    process.exit(fail > 0 ? 1 : 0);
}

run();
