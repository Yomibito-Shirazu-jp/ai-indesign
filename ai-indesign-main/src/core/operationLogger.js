/**
 * Operation Logger - 操作ログシステム (CCPM修正版)
 * 全ツール実行をJSONL + メモリで記録
 * 
 * 必須ログ項目:
 * timestamp, instruction, tool, args, preview, confirm,
 * scope, result, success, error, durationMs
 */
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'operations.jsonl');

export class OperationLogger {
    constructor(config = {}) {
        this.maxMemoryLogs = config.maxMemoryLogs || 200;
        this.logs = [];
        this.sessionId = `session_${Date.now()}`;
        this._ensureLogDir();
    }

    _ensureLogDir() {
        try {
            if (!fs.existsSync(LOG_DIR)) {
                fs.mkdirSync(LOG_DIR, { recursive: true });
            }
        } catch { /* non-critical */ }
    }

    /**
     * ログエントリを記録（JSONL + メモリ）
     * @param {Object} entry — 必須ログ項目
     */
    log(entry) {
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            // 必須ログ項目
            instruction: entry.instruction || null,
            tool: entry.tool || 'unknown',
            args: this._sanitizeArgs(entry.args),
            preview: entry.preview || false,
            confirm: entry.confirm || false,
            scope: entry.scope || null,
            result: entry.result || null,
            success: entry.success ?? null,
            error: entry.error || null,
            durationMs: entry.durationMs || null,
        };

        // メモリ保持
        this.logs.push(logEntry);
        if (this.logs.length > this.maxMemoryLogs) {
            this.logs = this.logs.slice(-this.maxMemoryLogs);
        }

        // JSONL ファイル出力
        try {
            fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
        } catch { /* non-critical */ }

        return logEntry;
    }

    /**
     * ツール実行をラップしてログ記録
     */
    async trackExecution(tool, args, executeFn, meta = {}) {
        const start = Date.now();
        const logBase = {
            tool,
            args,
            instruction: meta.instruction || null,
            preview: args?.preview || false,
            confirm: args?.confirm || false,
            scope: meta.scope || null,
        };

        try {
            const result = await executeFn();
            logBase.success = true;
            logBase.durationMs = Date.now() - start;
            this.log(logBase);
            return result;
        } catch (error) {
            logBase.success = false;
            logBase.error = error.message || String(error);
            logBase.durationMs = Date.now() - start;
            this.log(logBase);
            throw error;
        }
    }

    getRecentLogs(count = 20) {
        return this.logs.slice(-count).map(l => ({ ...l }));
    }

    getLogsByTool(toolName, count = 20) {
        return this.logs.filter(l => l.tool === toolName).slice(-count);
    }

    getFailedLogs(count = 20) {
        return this.logs.filter(l => l.success === false).slice(-count);
    }

    exportLogs() {
        // ファイルからフル読み出し
        try {
            if (fs.existsSync(LOG_FILE)) {
                const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean);
                return lines.map(line => JSON.parse(line));
            }
        } catch { /* fall through */ }
        return [...this.logs];
    }

    getSummary() {
        const total = this.logs.length;
        const succeeded = this.logs.filter(l => l.success === true).length;
        const failed = this.logs.filter(l => l.success === false).length;
        const previews = this.logs.filter(l => l.preview === true).length;

        const toolCounts = {};
        for (const log of this.logs) {
            toolCounts[log.tool] = (toolCounts[log.tool] || 0) + 1;
        }

        return {
            sessionId: this.sessionId,
            totalOperations: total,
            succeeded,
            failed,
            previews,
            successRate: total > 0 ? ((succeeded / total) * 100).toFixed(1) + '%' : 'N/A',
            toolUsage: toolCounts,
        };
    }

    clearLogs() {
        const count = this.logs.length;
        this.logs = [];
        return { cleared: count };
    }

    _sanitizeArgs(args) {
        if (!args) return null;
        const sanitized = {};
        for (const [key, value] of Object.entries(args)) {
            if (typeof value === 'string' && value.length > 500) {
                sanitized[key] = value.substring(0, 500) + '... [truncated]';
            } else if (key === 'code') {
                sanitized[key] = '[InDesign script code]';
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

export const operationLogger = new OperationLogger();
