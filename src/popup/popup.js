/**
 * Kim Assistant - Popup Script
 */

// DOM Elements
const openclawUrlInput = document.getElementById('openclawUrl');
const statusEl = document.getElementById('status');
const statusTextEl = document.getElementById('statusText');
const statusDotEl = statusEl.querySelector('.status-dot');

// Load settings
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    openclawUrl: 'http://localhost:11434',
    useOpenClaw: true
  });

  openclawUrlInput.value = settings.openclawUrl;

  // Test connection
  await testConnection();
}

// Test OpenClaw connection
async function testConnection() {
  const url = openclawUrlInput.value.trim();

  try {
    const response = await fetch(`${url}/api/status`, {
      signal: AbortSignal.timeout(3000)
    });

    if (response.ok) {
      statusDotEl.className = 'status-dot connected';
      statusTextEl.textContent = 'Connected to OpenClaw';
    } else {
      throw new Error('Status check failed');
    }
  } catch (error) {
    statusDotEl.className = 'status-dot disconnected';
    statusTextEl.textContent = 'OpenClaw not connected';
  }
}

// Save settings
async function saveSettings() {
  const url = openclawUrlInput.value.trim();

  await chrome.storage.sync.set({
    openclawUrl: url,
    useOpenClaw: true
  });

  await testConnection();
}

// Event listeners
document.getElementById('openChatBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'TOGGLE_CHAT' });
  window.close();
});

document.getElementById('summarizeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.sendMessage(tab.id, {
    type: 'CONTEXT_ACTION',
    action: 'summarize-page'
  });
  window.close();
});

document.getElementById('helpBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.sendMessage(tab.id, {
    type: 'CONTEXT_ACTION',
    action: 'help-selection'
  });
  window.close();
});

document.getElementById('testBtn').addEventListener('click', async () => {
  await saveSettings();
  alert('Settings saved! Connection status updated.');
});

openclawUrlInput.addEventListener('change', saveSettings);

document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
loadSettings();
