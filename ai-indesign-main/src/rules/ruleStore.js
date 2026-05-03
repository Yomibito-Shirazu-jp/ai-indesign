/**
 * 顧客別ルールストア — 読み人知らず DATA LAYER
 * 
 * 顧客ごとの表記ルール・スタイルルールを管理。
 * 初期実装はインメモリ + JSON ファイルベース。
 * 将来的に BigQuery 移行を想定した抽象レイヤー。
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = join(__dirname, 'customers');

/**
 * @typedef {Object} NotationRule
 * @property {string} pattern - 正規表現パターン
 * @property {string} [replacement] - 置換テキスト
 * @property {string} message - ルール説明
 * @property {string} [category] - カテゴリ
 * @property {number} [confidence] - 学習元の確信度
 */

/**
 * @typedef {Object} CustomerRuleSet
 * @property {string} customerId - 顧客ID
 * @property {string} [customerName] - 顧客名
 * @property {NotationRule[]} notation - 表記ルール
 * @property {Object} style - スタイルルール（句読点、数字等）
 * @property {Object} meta - メタ情報
 */

// デフォルトルール
const DEFAULT_RULES = {
    customerId: '_default',
    customerName: 'デフォルト',
    notation: [],
    style: {
        numberStyle: 'halfwidth',
        punctuation: ['。', '、'],
        alphabetStyle: 'halfwidth',
        chouon: 'with',
    },
    meta: {
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        source: 'default',
    },
};

// インメモリキャッシュ
const cache = new Map();

export class RuleStore {

    /**
     * 顧客ルールを取得（キャッシュ → ファイル → デフォルト）
     * @param {string} customerId
     * @returns {Promise<CustomerRuleSet>}
     */
    static async getRules(customerId) {
        if (!customerId) return { ...DEFAULT_RULES };

        // キャッシュチェック
        if (cache.has(customerId)) {
            return cache.get(customerId);
        }

        // ファイルから読み込み
        try {
            const filePath = join(RULES_DIR, `${customerId}.json`);
            const content = await readFile(filePath, 'utf-8');
            const rules = JSON.parse(content);
            const merged = RuleStore.mergeWithDefaults(rules);
            cache.set(customerId, merged);
            return merged;
        } catch (e) {
            // ファイルなし → デフォルト
            return { ...DEFAULT_RULES, customerId };
        }
    }

    /**
     * 顧客ルールを保存
     * @param {string} customerId
     * @param {Partial<CustomerRuleSet>} rules
     * @returns {Promise<CustomerRuleSet>}
     */
    static async saveRules(customerId, rules) {
        const existing = await RuleStore.getRules(customerId);
        const updated = {
            ...existing,
            ...rules,
            customerId,
            meta: {
                ...existing.meta,
                ...rules.meta,
                updatedAt: new Date().toISOString(),
            },
        };

        // ディレクトリ作成
        try {
            await mkdir(RULES_DIR, { recursive: true });
        } catch (e) { /* already exists */ }

        // ファイル書き込み
        const filePath = join(RULES_DIR, `${customerId}.json`);
        await writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');

        // キャッシュ更新
        cache.set(customerId, updated);

        return updated;
    }

    /**
     * 表記ルールを追加
     * @param {string} customerId
     * @param {NotationRule} rule
     */
    static async addNotationRule(customerId, rule) {
        const rules = await RuleStore.getRules(customerId);

        // 重複チェック
        const exists = rules.notation.some(r => r.pattern === rule.pattern);
        if (!exists) {
            rules.notation.push({
                ...rule,
                addedAt: new Date().toISOString(),
            });
        }

        return RuleStore.saveRules(customerId, rules);
    }

    /**
     * デフォルトルールとマージ
     */
    static mergeWithDefaults(rules) {
        return {
            ...DEFAULT_RULES,
            ...rules,
            notation: [...(rules.notation || [])],
            style: { ...DEFAULT_RULES.style, ...rules.style },
            meta: { ...DEFAULT_RULES.meta, ...rules.meta },
        };
    }

    /**
     * 全顧客IDを取得
     * @returns {Promise<string[]>}
     */
    static async listCustomers() {
        try {
            const { readdir } = await import('fs/promises');
            const files = await readdir(RULES_DIR);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''));
        } catch (e) {
            return [];
        }
    }

    /**
     * キャッシュクリア
     */
    static clearCache() {
        cache.clear();
    }

    /**
     * デフォルトルールを取得
     */
    static getDefaults() {
        return { ...DEFAULT_RULES };
    }
}
