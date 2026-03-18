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
        const fn = new Function("app", `return (async () => { ${msg.code} })()`);
        const result = await fn(app);
        socket.send(JSON.stringify({ type: "result", id: msg.id, result: serializeResult(result) }));
    } catch (e) {
        socket.send(JSON.stringify({ type: "error", id: msg.id, error: e.message || String(e) }));
    }
}

// テスト送信ボタン
window.sendTest = function() {
    if (!testResult) return;
    testResult.textContent = "テスト中...";
    try {
        const doc = app.documents.length > 0 ? app.documents[0] : app.documents.add();
        const frame = doc.pages[0].textFrames.add();
        frame.geometricBounds = [20, 20, 40, 120];
        frame.contents = "Ai-inDesign OK - " + new Date().toLocaleTimeString();
        testResult.textContent = "✅ テキストフレーム作成OK";
        testResult.style.color = "#2ecc71";
    } catch (e) {
        testResult.textContent = "❌ " + e.message;
        testResult.style.color = "#e74c3c";
    }
    setTimeout(() => {
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
