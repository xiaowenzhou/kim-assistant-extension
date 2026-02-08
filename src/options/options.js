/**
 * Kim Assistant - Options Page Script
 */

// Load settings
async function loadSettings() {
  const defaults = {
    openclawUrl: 'http://localhost:11434',
    apiPath: '/api/message',
    apiKey: '',
    autoConnect: true,
    saveHistory: true,
    showQuickActions: true
  };

  const settings = await chrome.storage.sync.get(defaults);

  document.getElementById('openclawUrl').value = settings.openclawUrl;
  document.getElementById('apiPath').value = settings.apiPath;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('autoConnect').checked = settings.autoConnect;
  document.getElementById('saveHistory').checked = settings.saveHistory;
  document.getElementById('showQuickActions').checked = settings.showQuickActions;
}

// Save settings
async function saveSettings() {
  const settings = {
    openclawUrl: document.getElementById('openclawUrl').value.trim(),
    apiPath: document.getElementById('apiPath').value.trim() || '/api/message',
    apiKey: document.getElementById('apiKey').value.trim(),
    autoConnect: document.getElementById('autoConnect').checked,
    saveHistory: document.getElementById('saveHistory').checked,
    showQuickActions: document.getElementById('showQuickActions').checked
  };

  await chrome.storage.sync.set(settings);
  showStatus('Settings saved!', 'success');
}

// Test connection
async function testConnection() {
  const url = document.getElementById('openclawUrl').value.trim();
  const apiPath = document.getElementById('apiPath').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();

  showStatus('Testing connection...', 'success');

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(`${url}${apiPath}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ type: 'ping' }),
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok || response.status === 400) { // 400 might mean wrong message type
      showStatus('✅ Connection successful!', 'success');
    } else {
      throw new Error('Connection failed');
    }
  } catch (error) {
    showStatus(`⚠️ ${url} unreachable. Make sure OpenClaw is running.`, 'error');
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('testBtn').addEventListener('click', testConnection);

// Initialize
loadSettings();
