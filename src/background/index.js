/**
 * Kim Assistant - Background Service Worker
 * Handles API communication with OpenClaw gateway
 */

// Configuration
const CONFIG = {
  openclawUrl: 'http://localhost:11434', // Default OpenClaw API port
  apiPath: '/api/message',
  apiKey: '' // Optional API key for secure mode
};

// Load settings on install
chrome.runtime.onInstalled.addListener(async () => {
  // Create context menu
  await chrome.contextMenus.create({
    id: 'kim-assistant-menu',
    title: '✨ Ask Kim',
    contexts: ['page', 'selection']
  });

  await chrome.contextMenus.create({
    id: 'kim-ask-page',
    parentId: 'kim-assistant-menu',
    title: 'About this page',
    contexts: ['page']
  });

  await chrome.contextMenus.create({
    id: 'kim-summarize',
    parentId: 'kim-assistant-menu',
    title: 'Summarize selection',
    contexts: ['selection']
  });

  await chrome.contextMenus.create({
    id: 'kim-explain',
    parentId: 'kim-assistant-menu',
    title: 'Explain selection',
    contexts: ['selection']
  });

  // Load saved config
  const settings = await chrome.storage.sync.get({
    openclawUrl: 'http://localhost:11434',
    apiKey: '',
    useOpenClaw: true
  });
  CONFIG.openclawUrl = settings.openclawUrl;
  CONFIG.apiKey = settings.apiKey;

  console.log('[Kim Assistant] Background service worker loaded');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const action = info.menuItemId;

  let prompt = '';
  switch (action) {
    case 'kim-ask-page':
      prompt = `Tell me about this webpage: ${tab.title}. What is the main content?`;
      break;
    case 'kim-summarize':
      prompt = `Please summarize the following text:\n\n${info.selectionText}`;
      break;
    case 'kim-explain':
      prompt = `Please explain the following text in simple terms:\n\n${info.selectionText}`;
      break;
  }

  if (prompt) {
    await sendMessageToOpenClaw(prompt, tab.id);
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEND_MESSAGE') {
    sendMessageToOpenClaw(message.text, sender.tab?.id)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
});

// Send message to OpenClaw gateway
async function sendMessageToOpenClaw(text, tabId) {
  try {
    // Get current settings
    const settings = await chrome.storage.sync.get({
      openclawUrl: 'http://localhost:11434',
      apiKey: '',
      useOpenClaw: true
    });

    if (!settings.useOpenClaw) {
      // Use built-in response for testing
      return {
        success: true,
        message: getBuiltInResponse(text)
      };
    }

    const url = `${settings.openclawUrl}${CONFIG.apiPath}`;
    
    // Build headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if configured (for secure mode)
    if (settings.apiKey) {
      headers['X-API-Key'] = settings.apiKey;
    }

    // Try to send to OpenClaw
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          text: text,
          source: 'kim-assistant-extension'
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: data.response || data.message || getBuiltInResponse(text)
        };
      }
    } catch (fetchError) {
      console.log('[Kim Assistant] OpenClaw not available, using fallback');
    }

    // Fallback to built-in response
    return {
      success: true,
      message: getBuiltInResponse(text)
    };

  } catch (error) {
    console.error('[Kim Assistant] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Built-in fallback responses (for when OpenClaw is not connected)
function getBuiltInResponse(text) {
  const lower = text.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi')) {
    return "Hello! I'm Kim's assistant. I'm here to help you while you browse! 🤖\n\nCurrently I'm running in offline mode. To enable full AI features, please configure the OpenClaw connection in the extension settings.";
  }

  if (lower.includes('summarize') || lower.includes('summary')) {
    return "I can help you summarize content! To enable this feature:\n\n1. Make sure OpenClaw is running\n2. Configure the connection URL in extension settings\n3. You'll need to set up a message endpoint at `/api/message`\n\nAlternatively, you can open Kim directly in Telegram for the full experience!";
  }

  return "I received your message! 🤖\n\nTo enable full AI capabilities:\n\n1. Make sure your OpenClaw gateway is running\n2. Open extension settings and configure the URL\n3. Set up an API endpoint at `/api/message` to receive messages\n\nFor now, you can use me as a quick bookmark to open Kim's chat! 👉 Click the extension icon to get started.";
}

// Badge (optional, may not work in MV3 service workers)
try {
  if (chrome.runtime.setBadgeBackgroundColor) {
    chrome.runtime.setBadgeBackgroundColor({ color: '#6366f1' });
  }
  if (chrome.runtime.setBadgeText) {
    chrome.runtime.setBadgeText({ text: 'K' });
  }
} catch (e) {
  // Badge API not available in this context
}
