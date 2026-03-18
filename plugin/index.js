const { app } = require("indesign");
const { entrypoints } = require("uxp");

let statusRing, statusLabel, hint, testBtn, testResult;
let ws = null;

window.addEventListener("unhandledrejection", (e) => {
    if (e.reason === false) e.preventDefault();
});

function setStatus(state) {
    if (!statusRing) return;
    statusRing.className = "status-ring " + state;
    if (state === "connected") {
        statusRing.textContent = "✅";
        statusLabel.textContent = "接続OK";
        if (hint) hint.className = "hint show";
        if (testBtn) testBtn.className = "test-btn show";
    } else if (state === "disconnected") {
        statusRing.textContent = "❌";
        statusLabel.textContent = "サーバーが見つかりません";
        if (hint) hint.className = "hint";
        if (testBtn) testBtn.className = "test-btn";
    } else {
        statusRing.textContent = "🔌";
        statusLabel.textContent = "Bridgeサーバーに接続中...";
        if (hint) hint.className = "hint";
        if (testBtn) testBtn.className = "test-btn";
    }
}

function serializeResult(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.map(serializeResult);
    if (typeof value === "object") {
        try { return JSON.parse(JSON.stringify(value)); } catch { return String(value); }
    }
    return String(value);
}

async function handleExecute(socket, msg) {
    try {
        // app はモジュールスコープで定義済みなので直接参照可能
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction("app", msg.code);
        const result = await fn(app);
        socket.send(JSON.stringify({ type: "result", id: msg.id, result: serializeResult(result) }));
    } catch (e) {
        const errMsg = e.message || String(e);
        console.error("[Plugin] Execute error:", errMsg);
        socket.send(JSON.stringify({ type: "error", id: msg.id, error: errMsg }));
    }
}

// テスト送信ボタン
window.sendTest = function() {
    if (!testResult || !ws || ws.readyState !== 1) return;
    testResult.textContent = "送信中...";
    testResult.style.color = "#f39c12";
    const testId = "test-" + Date.now();
    ws.send(JSON.stringify({ type: "ping", id: testId }));
    testResult.textContent = "✅ Bridge応答OK";
    testResult.style.color = "#2ecc71";
    setTimeout(function() {
        if (testResult) {
            testResult.textContent = "";
            testResult.style.color = "#aaa";
        }
    }, 5000);
};

function connect() {
    setStatus("connecting");
    ws = new WebSocket("ws://localhost:49300");

    ws.onopen = () => setStatus("connected");

    ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", id: msg.id }));
        } else if (msg.type === "execute") {
            handleExecute(ws, msg);
        }
    };

    ws.onerror = () => {};
    ws.onclose = () => {
        setStatus("disconnected");
        setTimeout(connect, 3000);
    };
}

entrypoints.setup({
    panels: {
        mainPanel: {
            show() {
                statusRing  = document.getElementById("status-ring");
                statusLabel = document.getElementById("status-label");
                hint        = document.getElementById("hint");
                testBtn     = document.getElementById("test-btn");
                testResult  = document.getElementById("test-result");
                connect();
            }
        }
    }
});
