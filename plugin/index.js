const { app } = require("indesign");
const { entrypoints } = require("uxp");

// UI Elements
const statusIndicator = document.getElementById("status-indicator");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const chatContainer = document.getElementById("chat-container");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Settings Elements
const toggleSettingsBtn = document.getElementById("toggle-settings");
const closeSettingsBtn = document.getElementById("close-settings");
const settingsView = document.getElementById("settings-view");
const aiProviderSelect = document.getElementById("ai-provider");
const apiKeyGroup = document.getElementById("api-key-group");

let ws = null;
let isConnected = false;

// Helpers
function addMessage(text, type = 'user') {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message msg-${type}`;
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function updateStatus(state) {
  statusIndicator.className = "status-dot";
  if (state === 'connected') {
    statusIndicator.classList.add("connected");
    overlay.style.display = "none";
    sendBtn.disabled = false;
    isConnected = true;
  } else if (state === 'disconnected') {
    statusIndicator.classList.add("disconnected");
    overlay.style.display = "flex";
    overlayText.textContent = "Bridgeサーバーから切断されました...";
    sendBtn.disabled = true;
    isConnected = false;
  }
}

// Settings Toggle
toggleSettingsBtn.addEventListener("click", () => {
    settingsView.style.display = settingsView.style.display === "flex" ? "none" : "flex";
});
closeSettingsBtn.addEventListener("click", () => {
    settingsView.style.display = "none";
});
aiProviderSelect.addEventListener("change", (e) => {
    if (e.target.value === "external") {
        apiKeyGroup.style.display = "none";
        addMessage("外部MCP設定（Claude Desktop等）からの接続を待機します。", "system");
    } else {
        apiKeyGroup.style.display = "flex";
        addMessage(`${e.target.value} のAPI設定に切り替えました。`, "system");
    }
});

// Chat Send
function sendMessage() {
    if (!isConnected) return;
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = "";
    
    // Simulate AI thinking or send to bridge
    if (aiProviderSelect.value === "external") {
        addMessage("※外部MCPモードのため、チャット入力は無視されます。Claude Desktop等から直接指示をお願いします！", "system");
    } else {
        addMessage("考え中...", "system");
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'chat', message: text, provider: aiProviderSelect.value }));
        }
    }
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Serialize for execute result
function serializeResult(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(serializeResult);
  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
}

// Core execution (from Bridge)
async function handleExecute(ws, msg) {
  try {
    addMessage(`⚙️ DTP自動化を実行中...`, "system");
    const fn = new Function('app', `return (async () => { ${msg.code} })()`);
    const result = await fn(app);
    ws.send(JSON.stringify({ type: 'result', id: msg.id, result: serializeResult(result) }));
    addMessage(`✅ 実行完了`, "system");
  } catch (e) {
    ws.send(JSON.stringify({ type: 'error', id: msg.id, error: e.message || String(e) }));
    addMessage(`❌ エラー発生: ${e.message}`, "system");
  }
}

function connectToBridge() {
  ws = new WebSocket("ws://127.0.0.1:3001");

  ws.onopen = () => {
    updateStatus("connected");
    addMessage("Ai-inDesign ブリッジに接続しました。アシスタント機能が利用可能です。", "system");
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', id: msg.id }));
    } else if (msg.type === 'execute') {
      handleExecute(ws, msg);
    } else if (msg.type === 'ai_reply') {
      // Used if Bridge handles the AI chat
      addMessage(msg.message, "ai");
    }
  };

  ws.onerror = (err) => {
    console.error("[Plugin] WebSocket error:", err);
  };

  ws.onclose = () => {
    updateStatus("disconnected");
    setTimeout(connectToBridge, 3000);
  };
}

entrypoints.setup({
  panels: {
    mainPanel: {
      show() {
        connectToBridge();
      }
    }
  }
});
