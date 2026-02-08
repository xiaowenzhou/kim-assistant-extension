/**
 * Kim Assistant - Content Script
 * Floating chat button and quick actions
 */

// Floating button state
let isOpen = false;
let chatPanel = null;

// Create floating button
function createFloatingButton() {
  // Remove existing if any
  removeFloatingButton();

  const button = document.createElement('button');
  button.id = 'kim-assistant-float';
  button.innerHTML = '✨';
  button.title = 'Chat with Kim';
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    cursor: pointer;
    font-size: 28px;
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
    z-index: 999999;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  button.onmouseenter = () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)';
  };
  button.onmouseleave = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
  };

  button.onclick = toggleChatPanel;

  document.body.appendChild(button);

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes kim-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
    }
    #kim-assistant-float {
      animation: kim-pulse 2s infinite;
    }
  `;
  document.head.appendChild(style);
}

function removeFloatingButton() {
  const existing = document.getElementById('kim-assistant-float');
  if (existing) existing.remove();
}

// Create chat panel
function createChatPanel() {
  removeChatPanel();

  chatPanel = document.createElement('div');
  chatPanel.id = 'kim-chat-panel';
  chatPanel.style.cssText = `
    position: fixed;
    bottom: 96px;
    right: 24px;
    width: 380px;
    height: 520px;
    max-height: calc(100vh - 120px);
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 16px;
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.4);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: kim-slide-up 0.3s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;

  chatPanel.innerHTML = `
    <div style="
      padding: 16px 20px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">✨</span>
        <div>
          <div style="font-weight: 600; font-size: 16px;">Kim Assistant</div>
          <div style="font-size: 11px; opacity: 0.9;">Your AI companion</div>
        </div>
      </div>
      <button id="kim-close-btn" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
      ">✕</button>
    </div>

    <div id="kim-messages" style="
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    ">
      <div class="kim-message kim-bot" style="
        background: rgba(255,255,255,0.1);
        padding: 12px 16px;
        border-radius: 12px 12px 12px 4px;
        font-size: 14px;
        line-height: 1.5;
        max-width: 90%;
      ">
        👋 Hi! I'm Kim. How can I help you today?
      </div>
    </div>

    <div style="
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.2);
    ">
      <div style="
        display: flex;
        gap: 8px;
      ">
        <input id="kim-input" type="text" placeholder="Ask me anything..." style="
          flex: 1;
          padding: 12px 16px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          color: white;
          font-size: 14px;
          outline: none;
        ">
        <button id="kim-send-btn" style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">➤</button>
      </div>
      <div style="
        margin-top: 8px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      ">
        <button class="kim-quick-btn" data-prompt="Summarize this page" style="
          padding: 6px 12px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 16px;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          cursor: pointer;
        ">📝 Summarize</button>
        <button class="kim-quick-btn" data-prompt="Explain this page" style="
          padding: 6px 12px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 16px;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          cursor: pointer;
        ">💡 Explain</button>
        <button class="kim-quick-btn" data-prompt="Find key points on this page" style="
          padding: 6px 12px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 16px;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          cursor: pointer;
        ">🔑 Key Points</button>
      </div>
    </div>
  `;

  document.body.appendChild(chatPanel);

  // Event listeners
  document.getElementById('kim-close-btn').onclick = toggleChatPanel;
  document.getElementById('kim-send-btn').onclick = sendMessage;
  document.getElementById('kim-input').onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  // Quick action buttons
  document.querySelectorAll('.kim-quick-btn').forEach(btn => {
    btn.onclick = () => {
      const prompt = btn.dataset.prompt;
      document.getElementById('kim-input').value = prompt;
      sendMessage();
    };
  });
}

function removeChatPanel() {
  const existing = document.getElementById('kim-chat-panel');
  if (existing) existing.remove();
}

function toggleChatPanel() {
  isOpen = !isOpen;
  if (isOpen) {
    createChatPanel();
  } else {
    removeChatPanel();
  }
}

// Add message to chat
function addMessage(text, isUser = false) {
  const messagesContainer = document.getElementById('kim-messages');
  if (!messagesContainer) return;

  const msg = document.createElement('div');
  msg.className = `kim-message ${isUser ? 'kim-user' : 'kim-bot'}`;
  msg.style.cssText = `
    background: ${isUser ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.1)'};
    padding: 12px 16px;
    border-radius: ${isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px'};
    font-size: 14px;
    line-height: 1.5;
    max-width: 90%;
    align-self: ${isUser ? 'flex-end' : 'flex-start'};
    ${isUser ? 'margin-left: auto;' : ''}
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  msg.textContent = text;

  messagesContainer.appendChild(msg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function setTyping(typing) {
  const messagesContainer = document.getElementById('kim-messages');
  if (!messagesContainer) return;

  const existing = document.getElementById('kim-typing');
  if (existing) existing.remove();

  if (typing) {
    const msg = document.createElement('div');
    msg.id = 'kim-typing';
    msg.style.cssText = `
      background: rgba(255,255,255,0.1);
      padding: 12px 16px;
      border-radius: 12px 12px 12px 4px;
      font-size: 14px;
      max-width: 90%;
    `;
    msg.innerHTML = '<span style="animation: kim-dots 1.5s infinite;">● ● ●</span>';
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Add typing animation
const style = document.createElement('style');
style.textContent = `
  @keyframes kim-dots {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @keyframes kim-slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

// Send message to OpenClaw
async function sendMessage() {
  const input = document.getElementById('kim-input');
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, true);
  input.value = '';
  setTyping(true);

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_MESSAGE',
      text: text,
      url: window.location.href,
      title: document.title
    });

    setTyping(false);

    if (response?.success) {
      addMessage(response.message);
    } else {
      addMessage('Sorry, I could not connect to Kim. Please try again.');
    }
  } catch (error) {
    setTyping(false);
    addMessage('Error: ' + error.message);
  }
}

// Initialize
createFloatingButton();

// Handle messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_CHAT') {
    toggleChatPanel();
    sendResponse({ success: true });
  }
  return true;
});
