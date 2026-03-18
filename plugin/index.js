const { app } = require("indesign");
const { entrypoints } = require("uxp");

// UI refs
let statusRing, statusLabel, hint;
let ws = null;

// Suppress UXP false-rejection noise
window.addEventListener("unhandledrejection", (e) => {
    if (e.reason === false) e.preventDefault();
});

function setStatus(state) {
    if (!statusRing) return;
    statusRing.className = "status-ring " + state;
    if (state === "connected") {
        statusRing.textContent = "✅";
        statusLabel.textContent = "Claude Desktopから操作できます";
        if (hint) hint.className = "hint show";
    } else if (state === "disconnected") {
        statusRing.textContent = "❌";
        statusLabel.textContent = "サーバーが見つかりません";
        if (hint) hint.className = "hint";
    } else {
        statusRing.textContent = "🔌";
        statusLabel.textContent = "Bridgeサーバーに接続中...";
        if (hint) hint.className = "hint";
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

function connect() {
    setStatus("connecting");
    ws = new WebSocket("ws://localhost:3000");

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
                connect();
            }
        }
    }
});
