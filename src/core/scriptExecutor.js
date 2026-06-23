/**
 * Core script execution functionality
 */
const BRIDGE_URL = `http://127.0.0.1:${process.env.INDESIGN_PORT || 3000}`;

export class ScriptExecutor {
    /**
     * Execute JS code inside InDesign via the UXP bridge
     * @param {string} code - JS code with `app` in scope (UXP InDesign API)
     * @returns {any} The serialized result
     */
    static async executeViaUXP(code) {
        let response;
        try {
            response = await fetch(`${BRIDGE_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
                signal: AbortSignal.timeout(60000),
            });
        } catch (err) {
            if (err.name === 'TimeoutError' || err.name === 'AbortError') {
                throw new Error('Bridge request timed out after 60s');
            }
            throw err;
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            if (!response.ok) {
                throw new Error(`Bridge error: ${response.status} ${response.statusText}`);
            }
            throw new Error('Bridge returned a non-JSON response');
        }

        if (!response.ok) {
            throw new Error(data.error || `Bridge error: ${response.status}`);
        }

        return data.result;
    }

    /**
     * Check if the UXP bridge is running and plugin is connected
     * @returns {boolean}
     */
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