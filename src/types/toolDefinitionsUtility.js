/**
 * Utility tool definitions for InDesign MCP Server
 * Utility functions and custom execution capabilities
 */

export const utilityToolDefinitions = [
    // =================== UTILITY TOOLS ===================
    {
        name: 'execute_indesign_code',
        description: 'ExtendScriptコードをInDesignで実行',
        inputSchema: {
            type: 'object',
            properties: {
                code: { type: 'string', description: 'ExtendScript code to execute' },
            },
            required: ['code'],
        },
    },
    {
        name: 'view_document',
        description: 'ドキュメントのスクリーンショットを取得',
        inputSchema: { type: 'object', properties: {} },
    },
    {
        name: 'get_session_info',
        description: '現在のセッション情報を取得',
        inputSchema: { type: 'object', properties: {} },
    },
    {
        name: 'clear_session',
        description: 'セッションをリセット',
        inputSchema: { type: 'object', properties: {} },
    },
]; 