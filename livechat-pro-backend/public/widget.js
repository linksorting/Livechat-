(function () {
  const config = window.LiveChatPro || {};
  const brand = config.brandColor || "#6366f1";
  const apiUrl = config.apiUrl || window.location.origin;

  // ===== Inject Styles =====
  const style = document.createElement("style");
  style.innerHTML = `
    .lc-box {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 340px;
      background: white;
      border-radius: 24px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      font-family: Inter, sans-serif;
      overflow: hidden;
      z-index: 9999;
    }

    .lc-header {
      padding: 16px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .lc-msgs {
      padding: 14px;
      background: #f8fafc;
      max-height: 300px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .lc-bubble {
      padding: 10px 14px;
      border-radius: 18px;
      max-width: 80%;
      font-size: 14px;
      line-height: 1.4;
    }

    .lc-left {
      background: #e2e8f0;
      border-top-left-radius: 6px;
    }

    .lc-right {
      background: ${brand};
      color: white;
      align-self: flex-end;
      border-top-right-radius: 6px;
    }

    .lc-input {
      display: flex;
      border-top: 1px solid #eee;
      padding: 10px;
      gap: 8px;
    }

    .lc-input input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
    }

    .lc-send {
      background: ${brand};
      color: white;
      border: none;
      border-radius: 12px;
      padding: 6px 10px;
      cursor: pointer;
    }

    .lc-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${brand};
      color: white;
      padding: 14px 18px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 9999;
      border: none;
      font-size: 14px;
      font-family: Inter, sans-serif;
    }

    .lc-btn:hover { opacity: 0.9; }

    .lc-error {
      padding: 16px;
      text-align: center;
      color: #ef4444;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  // ===== Button =====
  const btn = document.createElement("button");
  btn.className = "lc-btn";
  btn.innerText = "💬 Chat with us";
  document.body.appendChild(btn);

  let isOpen = false;
  let sessionData = null;

  btn.onclick = async () => {
    if (isOpen) {
      document.getElementById("lc-box")?.remove();
      isOpen = false;
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/widget/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug: config.workspace })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const json = await res.json();
      sessionData = json; // The stable endpoint returns data directly
      renderChat(sessionData);
      isOpen = true;
    } catch (err) {
      console.error("[LiveChatPro] Failed to open chat:", err);
      renderError(err.message);
      isOpen = true;
    }
  };

  function renderError(message) {
    const box = document.createElement("div");
    box.id = "lc-box";
    box.className = "lc-box";
    box.innerHTML = `
      <div class="lc-header" style="background:${brand}">
        <div style="font-weight:600">LiveChat Pro</div>
        <div id="lc-close" style="cursor:pointer;font-size:18px">×</div>
      </div>
      <div class="lc-error">
        <div style="font-size:24px;margin-bottom:8px">⚠️</div>
        <div>Could not connect to chat server.</div>
        <div style="margin-top:4px;color:#94a3b8;font-size:12px">${message}</div>
      </div>
    `;
    document.body.appendChild(box);
    document.getElementById("lc-close").onclick = () => {
      box.remove();
      isOpen = false;
    };
  }

  function renderChat(data) {
    const workspace = data.workspace || { name: "Support" };
    const messages = data.messages || [];
    const conversationId = data.conversation?._id || data.conversationId;
    const workspaceId = workspace._id || data.workspaceId;

    const box = document.createElement("div");
    box.id = "lc-box";
    box.className = "lc-box";

    // HEADER
    const header = document.createElement("div");
    header.className = "lc-header";
    header.style.background = brand;
    header.innerHTML = `
      <div>
        <div style="font-weight:600">${workspace.name || "Support"}</div>
        <div style="font-size:12px;opacity:0.8">Usually replies in under 2 min</div>
      </div>
      <div id="lc-close" style="cursor:pointer;font-size:18px">×</div>
    `;

    // MESSAGES
    const msgs = document.createElement("div");
    msgs.className = "lc-msgs";
    msgs.innerHTML = `<div class="lc-bubble lc-left">Hi 👋 How can we help you?</div>`;

    messages.forEach(function (m) {
      const side = m.senderType === "visitor" || m.senderType === "customer" ? "lc-right" : "lc-left";
      const style = side === "lc-right" ? `style="background:${brandColor}"` : "";
      msgs.innerHTML += `<div class="lc-bubble ${side}" ${style}>${m.content}</div>`;
    });

    // INPUT
    const inputWrap = document.createElement("div");
    inputWrap.className = "lc-input";
    inputWrap.innerHTML = `
      <input placeholder="Type your message..." />
      <button class="lc-send">➤</button>
    `;

    box.appendChild(header);
    box.appendChild(msgs);
    box.appendChild(inputWrap);
    document.body.appendChild(box);

    // CLOSE
    document.getElementById("lc-close").onclick = () => {
      box.remove();
      isOpen = false;
    };

    // VARIABLES
    const input = inputWrap.querySelector("input");
    const sendBtn = inputWrap.querySelector("button");
    const brandColor = workspace.branding?.primaryColor || workspace.widget?.primaryColor || brand;
    
    // Apply dynamic brand color
    header.style.background = brandColor;
    sendBtn.style.background = brandColor;

    // POLLING FOR NEW MESSAGES
    const processedIds = new Set(messages.map(m => m._id));
    let lastMessageCount = messages.length;
    const pollInterval = setInterval(async () => {
      if (!isOpen) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/v1/chat/messages/${conversationId}`);
        if (!res.ok) return;

        const json = await res.json();
        const newMessages = json.messages || [];

        newMessages.forEach(m => {
          if (!processedIds.has(m._id)) {
            processedIds.add(m._id);
            const side = m.senderType === "visitor" || m.senderType === "customer" ? "lc-right" : "lc-left";
            const msgEl = document.createElement("div");
            msgEl.className = `lc-bubble ${side}`;
            if (side === "lc-right") msgEl.style.background = brandColor;
            msgEl.innerText = m.content;
            msgs.appendChild(msgEl);
            
            lastMessageCount++;
            msgs.scrollTop = msgs.scrollHeight;
          }
        });
      } catch (err) {
        console.error("[LiveChatPro] Poll failed:", err);
      }
    }, 3000);

    // SEND MESSAGE
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      const msg = document.createElement("div");
      msg.className = "lc-bubble lc-right";
      msg.style.background = brandColor;
      msg.innerText = text;
      msgs.appendChild(msg);
      input.value = "";
      msgs.scrollTop = msgs.scrollHeight;
      
      const res = await fetch(`${apiUrl}/api/v1/chat/website-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text,
          conversationId: conversationId,
          workspaceId: workspaceId,
          action: "send_message"
        })
      });
      
      if (res.ok) {
        lastMessageCount++;
      }
    }

    sendBtn.onclick = sendMessage;
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") sendMessage();
    });
  }

})();