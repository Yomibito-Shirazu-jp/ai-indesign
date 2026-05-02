/**
 * Core script execution functionality
 */
const BRIDGE_PORT = parseInt(process.env.INDESIGN_PORT || '49300', 10);
const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;

export class ScriptExecutor {
    /**
     * Execute JS code inside InDesign via the UXP bridge
     * @param {string} code - JS code with `app` in scope (UXP InDesign API)
     * @returns {any} The serialized result
     */
    static async executeViaUXP(code) {
        const response = await fetch(`${BRIDGE_URL}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Bridge error: ${response.status}`);
        }

        return data.result;
    }

    /**
     * Check if the UXP bridge is running and plugin is connected
     * @returns {boolean}
     */

    static async executeAction(action, params = {}) {
        const response = await fetch(`${BRIDGE_URL}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, params }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Bridge error: ${response.status}`);
        }
        return data.result;
    }

    static async isUXPAvailable() {
        try {
            const response = await fetch(`${BRIDGE_URL}/status`, { signal: AbortSignal.timeout(1000) });
            const data = await response.json();
            return data.connected === true;
        } catch {
            return false;
        }
    }

} 