import { RuleStore } from '../rules/ruleStore.js';
import { learnRules, extractDiffs } from '../rules/ruleLearner.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';

export class RuleHandlers {
    /**
     * Get rules for a specific customer/project
     */
    static async getCustomerRules(args) {
        const { customerId } = args;
        if (!customerId) {
            return formatErrorResponse('customerId は必須です。', 'Get Customer Rules');
        }
        const rules = await RuleStore.getRules(customerId);
        return formatResponse(rules, `Rules for Customer: ${customerId}`);
    }

    /**
     * Save rules for a specific customer/project
     */
    static async saveCustomerRules(args) {
        const { customerId, rules } = args;
        if (!customerId) {
            return formatErrorResponse('customerId は必須です。', 'Save Customer Rules');
        }
        if (rules === undefined || rules === null) {
            return formatErrorResponse('rules は必須です。', 'Save Customer Rules');
        }
        const updated = await RuleStore.saveRules(customerId, rules);
        return formatResponse(updated, `Saved Rules for Customer: ${customerId}`);
    }

    /**
     * Add a specific notation rule
     */
    static async addNotationRule(args) {
        const { customerId, rule } = args;
        if (!customerId) {
            return formatErrorResponse('customerId は必須です。', 'Add Notation Rule');
        }
        if (rule === undefined || rule === null) {
            return formatErrorResponse('rule は必須です。', 'Add Notation Rule');
        }
        const updated = await RuleStore.addNotationRule(customerId, rule);
        return formatResponse(updated, `Added Notation Rule for Customer: ${customerId}`);
    }
    
    /**
     * List all customers with custom rules
     */
    static async listCustomers() {
        const customers = await RuleStore.listCustomers();
        return formatResponse({ customers }, 'List of Customers with Rules');
    }

    /**
     * Learn rules from before/after text diffs
     */
    static async learnRulesFromDiff(args) {
        const { beforeText, afterText, minOccurrences, minConfidence } = args;
        
        const diffs = extractDiffs(beforeText, afterText);
        const learned = learnRules(diffs, { 
            minOccurrences: minOccurrences || 2, 
            minConfidence: minConfidence || 0.5 
        });
        
        return formatResponse({
            diffsFound: diffs.length,
            learnedRules: learned
        }, 'Learned Rules from Diffs');
    }
}
