const { app } = require("indesign");
const { entrypoints } = require("uxp");

// UI Elements
let statusIndicator, overlay, overlayText, chatContainer, chatInput, sendBtn;
let toggleSettingsBtn, closeSettingsBtn, settingsView, aiProviderSelect, apiKeyGroup;

let ws = null;
let isConnected = false;

// Suppress known UXP WebSocket rejection false errors
window.addEventListener("unhandledrejection", (e) => {
    if (e.reason === false) {
        e.preventDefault(); // Ignore "false" rejection
    }
});

// Initialize elements safely
function initUI() {
    statusIndicator = document.getElementById("status-indicator");
    overlay = document.getElementById("overlay");
    overlayText = document.getElementById("overlay-text");
    chatContainer = document.getElementById("chat-container");
    chatInput = document.getElementById("chat-input");
    sendBtn = document.getElementById("send-btn");

    toggleSettingsBtn = document.getElementById("toggle-settings");
    closeSettingsBtn = document.getElementById("close-settings");
    settingsView = document.getElementById("settings-view");
    aiProviderSelect = document.getElementById("ai-provider");
    apiKeyGroup = document.getElementById("api-key-group");

    if (toggleSettingsBtn) {
        toggleSettingsBtn.addEventListener("click", () => {
            if (settingsView) settingsView.style.display = settingsView.style.display === "flex" ? "none" : "flex";
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener("click", () => {
            if (settingsView) settingsView.style.display = "none";
        });
    }

    if (aiProviderSelect) {
        aiProviderSelect.addEventListener("change", (e) => {
            if (e.target.value === "external") {
                if (apiKeyGroup) apiKeyGroup.style.display = "none";
                addMessage("外部MCP設定（Claude Desktop等）からの接続を待機します。", "system");
            } else {
                if (apiKeyGroup) apiKeyGroup.style.display = "flex";
                addMessage(`${e.target.value} のAPI設定に切り替えました。`, "system");
            }
        });
    }

    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// Helpers
function addMessage(text, type = 'user') {
  if (!chatContainer) return;
  const msgDiv = document.createElement("div");
  msgDiv.className = `message msg-${type}`;
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function updateStatus(state) {
  if (!statusIndicator) return;
  statusIndicator.className = "status-dot";
  if (state === 'connected') {
    statusIndicator.classList.add("connected");
    if (overlay) overlay.style.display = "none";
    if (sendBtn) sendBtn.disabled = false;
    isConnected = true;
  } else if (state === 'disconnected') {
    statusIndicator.classList.add("disconnected");
    if (overlay) overlay.style.display = "flex";
    if (overlayText) overlayText.textContent = "Bridgeサーバーから切断されました...";
    if (sendBtn) sendBtn.disabled = true;
    isConnected = false;
  }
}

// Chat Send
function sendMessage() {
    if (!isConnected || !chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = "";
    
    if (aiProviderSelect && aiProviderSelect.value === "external") {
        addMessage("※外部MCPモードのため、チャット入力は無視されます。Claude Desktop等から直接指示をお願いします！", "system");
    } else {
        addMessage("考え中...", "system");
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'chat', message: text, provider: aiProviderSelect ? aiProviderSelect.value : 'external' }));
        }
    }
}

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
  ws = new WebSocket("ws://localhost:3001");

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
        console.log("[Plugin] Panel show() called");
        try {
            initUI();
            console.log("[Plugin] initUI() successful");
            connectToBridge();
        } catch (e) {
            console.error("[Plugin] Error in show():", e);
        }
      }
    }
  }
});
