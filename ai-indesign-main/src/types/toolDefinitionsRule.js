export const ruleTools = [
    {
        name: 'get_customer_rules',
        description: '顧客別の表記ルールを取得',
        inputSchema: {
            type: 'object',
            properties: {
                customerId: {
                    type: 'string',
                    description: 'The unique ID for the customer or project'
                }
            },
            required: ['customerId']
        }
    },
    {
        name: 'save_customer_rules',
        description: '顧客別の表記ルールを保存',
        inputSchema: {
            type: 'object',
            properties: {
                customerId: {
                    type: 'string',
                    description: 'The unique ID for the customer or project'
                },
                rules: {
                    type: 'object',
                    description: 'The rules configuration (notation, style, meta)',
                    properties: {
                        customerName: { type: 'string' },
                        notation: { type: 'array' },
                        style: { type: 'object' },
                        meta: { type: 'object' }
                    }
                }
            },
            required: ['customerId', 'rules']
        }
    },
    {
        name: 'add_notation_rule',
        description: '表記ルールを追加',
        inputSchema: {
            type: 'object',
            properties: {
                customerId: {
                    type: 'string',
                    description: 'The unique ID for the customer or project'
                },
                rule: {
                    type: 'object',
                    description: 'The notation rule to add',
                    properties: {
                        pattern: { type: 'string', description: 'Regex pattern or precise string to match' },
                        replacement: { type: 'string', description: 'Replacement text' },
                        message: { type: 'string', description: 'Rule description' }
                    },
                    required: ['pattern', 'message']
                }
            },
            required: ['customerId', 'rule']
        }
    },
    {
        name: 'list_customers',
        description: '顧客一覧を表示',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'learn_rules_from_diff',
        description: '修正差分から表記ルールを自動学習',
        inputSchema: {
            type: 'object',
            properties: {
                beforeText: {
                    type: 'string',
                    description: 'Original text before corrections'
                },
                afterText: {
                    type: 'string',
                    description: 'Revised text after corrections'
                },
                minOccurrences: {
                    type: 'number',
                    description: 'Minimum times a change must appear to become a rule (default 2)'
                },
                minConfidence: {
                    type: 'number',
                    description: 'Minimum confidence score (0.0 to 1.0) (default 0.5)'
                }
            },
            required: ['beforeText', 'afterText']
        }
    }
];
