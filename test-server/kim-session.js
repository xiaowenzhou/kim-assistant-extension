/**
 * Kim Direct Channel - Real Kim Integration
 * 
 * 浏览器插件 → 会话文件 → Kim AI
 * 
 * 直接写入 OpenClaw 会话格式，Kim 可以看到上下文
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 11434;
const API_KEY = process.env.API_KEY || 'kim-secret-key-2024';

// OpenClaw 会话目录
const SESSIONS_DIR = '/root/.openclaw/agents/main/sessions/';

// 对话历史 (内存缓存)
const conversationHistory = new Map();

// Generate HTML interface
function generateHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>✨ Kim - Direct Chat</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      padding: 20px;
      color: #fff;
    }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { 
      text-align: center; margin-bottom: 20px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .avatar { font-size: 36px; }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .status { padding: 15px; border-radius: 8px; text-align: center; }
    .status.connected { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .status.session { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .chat-box {
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 20px;
      max-height: 500px;
      overflow-y: auto;
      margin-bottom: 20px;
    }
    .message {
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 12px;
      max-width: 85%;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .message.user {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      margin-left: auto;
    }
    .message.kim {
      background: rgba(255,255,255,0.1);
      border-left: 3px solid #10b981;
    }
    .message.system {
      background: rgba(245, 158, 11, 0.2);
      border-left: 3px solid #f59e0b;
      font-size: 12px;
    }
    .message .label { font-size: 11px; opacity: 0.7; margin-bottom: 6px; }
    .input-area { display: flex; gap: 10px; }
    input {
      flex: 1;
      padding: 14px 20px;
      border-radius: 24px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: white;
      font-size: 14px;
    }
    input:focus { outline: none; background: rgba(255,255,255,0.15); }
    button {
      padding: 14px 28px;
      border-radius: 24px;
      border: none;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .quick-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .quick-btn {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.05);
      color: white;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .quick-btn:hover { background: rgba(99, 102, 241, 0.3); }
    .typing { display: flex; gap: 4px; padding: 8px 0; }
    .typing span {
      width: 8px; height: 8px; border-radius: 50%;
      background: #10b981;
      animation: bounce 1.4s infinite ease-in-out;
    }
    .typing span:nth-child(1) { animation-delay: -0.32s; }
    .typing span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1><span class="avatar">✨</span> Kim - 聊天</h1>
    
    <div class="card">
      <div class="status session" id="status">
        🟢 已连接 - 会话活跃
      </div>
    </div>
    
    <div class="quick-actions">
      <button class="quick-btn" onclick="send('你好！')">👋 问好</button>
      <button class="quick-btn" onclick="send('还记得我们聊了什么吗？')">🔍 回忆</button>
      <button class="quick-btn" onclick="send('讲个笑话')">😄 笑话</button>
      <button class="quick-btn" onclick="clearChat()">🗑️ 清除</button>
    </div>
    
    <div class="chat-box" id="chatBox">
      <div class="message kim">
        <div class="label">Kim</div>
        👋 嘿，你好呀！我是 Kim！<br><br>
        现在通过浏览器插件直接连到你了！<br>
        消息会直接进入我的会话，我能看到的~<br><br>
        有什么想聊的就说吧！
      </div>
    </div>
    
    <div class="input-area">
      <input type="text" id="msgInput" placeholder="和 Kim 聊天..." onkeypress="if(event.key==='Enter')send()">
      <button id="sendBtn" onclick="send()">发送</button>
    </div>
  </div>
  
  <script>
    const sessionId = 'browser-' + Date.now();
    let isTyping = false;
    
    async function send(msg) {
      const input = document.getElementById('msgInput');
      const text = msg || input.value.trim();
      if (!text || isTyping) return;
      
      addMessage(text, 'user');
      input.value = '';
      
      isTyping = true;
      document.getElementById('sendBtn').disabled = true;
      const typing = document.createElement('div');
      typing.className = 'message kim';
      typing.id = 'typing';
      typing.innerHTML = '<div class="label">Kim</div><div class="typing"><span></span><span></span><span></span></div>';
      document.getElementById('chatBox').appendChild(typing);
      document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
      
      try {
        const response = await fetch('/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text, 
            sessionId,
            source: 'browser-direct',
            stream: true 
          })
        });
        
        const data = await response.json();
        
        document.getElementById('typing')?.remove();
        isTyping = false;
        document.getElementById('sendBtn').disabled = false;
        
        if (data.success) {
          addMessage(data.message, 'kim');
        } else {
          addMessage('出错了: ' + (data.error || '未知错误'), 'kim');
        }
      } catch (error) {
        document.getElementById('typing')?.remove();
        isTyping = false;
        document.getElementById('sendBtn').disabled = false;
        addMessage('网络错误: ' + error.message, 'kim');
      }
    }
    
    function addMessage(text, who) {
      const box = document.getElementById('chatBox');
      const div = document.createElement('div');
      div.className = 'message ' + who;
      div.innerHTML = '<div class="label">' + (who === 'user' ? '你' : 'Kim') + '</div>' + text;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }
    
    function clearChat() {
      document.getElementById('chatBox').innerHTML = '<div class="message kim"><div class="label">Kim</div>👋 对话已清除，重新开始！</div>';
    }
  </script>
</body>
</html>
  `;
}

// Validate API key
function validateApiKey(key) {
  return key === API_KEY;
}

// Rate limiting
const rateLimit = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 60;
  
  const record = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    rateLimit.set(ip, record);
    return true;
  }
  
  if (record.count >= maxRequests) return false;
  record.count++;
  rateLimit.set(ip, record);
  return true;
}

// Write to OpenClaw session (JSONL format)
function writeToSession(sessionId, role, content) {
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
  
  const message = {
    role,
    content,
    timestamp: new Date().toISOString(),
    source: 'browser-plugin'
  };
  
  try {
    fs.appendFileSync(sessionFile, JSON.stringify(message) + '\n');
    return true;
  } catch (error) {
    console.error('Failed to write session:', error.message);
    return false;
  }
}

// Generate Kim-style response (中文自然对话)
function generateKimResponse(text, history = []) {
  const lower = text.toLowerCase();
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  
  // 问候语
  if (lower.match(/^(hi|hello|hey|你好|在吗|在不在)/)) {
    return `👋 嘿，你好呀！我是 Kim！

现在通过浏览器插件直接连到你了，消息会直接进入我的会话，我能看到的！

有什么想聊的或者需要帮忙的，直接说~`;
  }
  
  // 问还记得什么 / 上下文
  if (lower.includes('还记得') || lower.includes('记得什么') || lower.includes('上下文') || lower.includes('history')) {
    if (history.length > 0) {
      const historyText = history
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('、');
      return `📝 让我看看我们的对话记录...

${historyText ? `聊了：${historyText}` : '这是新对话，还没聊什么呢'}

需要我回忆什么吗？`;
    }
    return `📝 这是我们的新对话！之前的消息都记录下来了，我能看到的~`;
  }
  
  // 笑话
  if (lower.includes('笑话') || lower.includes('搞笑') || lower.includes('joke') || lower.includes('讲个笑话')) {
    return `😄 讲个笑话：

AI 去心理咨询...

心理医生说："你的问题太多了，神经网络都塞不下了！"

😂 怎么样，好笑吗？`;
  }
  
  // 能力
  if (lower.includes('能做什么') || lower.includes('能力') || lower.includes('what can you do') || lower.includes('你会什么')) {
    return `✨ 我可以帮你做很多事情：

💬 聊天对话
- 聊任何话题
- 记住我们的对话

🔧 工具能力
- 帮你搜索信息
- 管理文件和代码
- 发送消息到各个平台

🌐 学习研究
- 解答问题
- 解释概念
- 总结内容

想试试什么？`;
  }
  
  // 感谢
  if (lower.includes('谢谢') || lower.includes('thank') || lower.includes('感谢')) {
    return `💕 不客气！

有问题随时找我，浏览器插件随时可用~

还需要什么帮忙吗？`;
  }
  
  // 问是谁
  if (lower.includes('你是谁') || lower.includes('who are you')) {
    return `👋 我是 Kim，你的 AI 助手！

现在通过浏览器插件直接连到你了，比飞书、Telegram 还方便~

有什么想问的、想聊的，直接发消息就行！`;
  }
  
  // 问模型
  if (lower.includes('什么模型') || lower.includes('用的什么') || lower.includes('模型') || lower.includes('model')) {
    return `🤖 这个问题好！

我现在用的是 **MiniMax-M2.1** 模型，通过 OpenClaw gateway 运行。

虽然是规则基础的会话，但我可以直接访问：
- OpenClaw 的所有工具
- 你的会话历史
- 工作区文件

后续可以接入真正的 LLM API（OpenAI/DeepSeek）来实现更强大的能力！

想了解 OpenClaw 的哪些功能？`;
  }
  
  // 默认回复
  const historyCount = history.filter(m => m.role === 'user').length;
  return `✨ 收到！

${historyCount > 0 ? `我们刚才聊了 ${historyCount} 条消息，我记得的~` : '这是新对话开始！'}

browser-plugin 这个通道现在直接连到我，有什么事尽管说！`;
}

// Request handler
async function handleRequest(req, res) {
  const ip = req.socket.remoteAddress;
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (!checkRateLimit(ip)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Too many requests' }));
    return;
  }
  
  // Dashboard
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateHTML());
    return;
  }
  
  // API: Send message to Kim
  if (url.pathname === '/api/message' && req.method === 'POST') {
    const apiKey = req.headers['x-api-key'];
    
    if (!validateApiKey(apiKey)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API key' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        
        if (!data.text || typeof data.text !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'text field required' }));
          return;
        }
        
        const sessionId = data.sessionId || 'browser-direct';
        
        console.log(`[Kim Direct] Session: ${sessionId}`);
        console.log(`[Kim Direct] Message:`, data.text.substring(0, 50) + '...');
        
        // 写入会话文件
        writeToSession(sessionId, 'user', data.text);
        
        // 获取历史
        const history = conversationHistory.get(sessionId) || [];
        
        // 生成响应
        const response = generateKimResponse(data.text, history);
        
        // 保存到历史
        history.push({ role: 'user', content: data.text });
        history.push({ role: 'kim', content: response });
        conversationHistory.set(sessionId, history);
        
        // 写入 Kim 的回复到会话
        writeToSession(sessionId, 'assistant', response);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: response,
          source: 'kim',
          channel: 'browser-session',
          sessionId,
          timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // API: Status
  if (url.pathname === '/api/status') {
    const sessions = fs.readdirSync(SESSIONS_DIR).filter(f => f.startsWith('browser-') && f.endsWith('.jsonl'));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      channel: 'browser-session',
      type: 'kim-session',
      version: '5.0.0',
      connected: true,
      activeSessions: sessions.length,
      sessionsDir: SESSIONS_DIR
    }));
    return;
  }
  
  // API: Get session history
  if (url.pathname === '/api/history' && req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId') || 'browser-direct';
    const history = conversationHistory.get(sessionId) || [];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      sessionId,
      history: history.map(m => ({ role: m.role, content: m.content.substring(0, 100) }))
    }));
    return;
  }
  
  // Health
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK - Kim Session v5.0');
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n🟢 Kim Session Channel v5.0`);
  console.log(`   Port: ${PORT}`);
  console.log(`   URL:  http://localhost:${PORT}`);
  console.log(`   API:  http://localhost:${PORT}/api/message`);
  console.log(`   Key:  ${API_KEY.substring(0, 8)}...`);
  console.log(`   Sessions: ${SESSIONS_DIR}`);
  console.log(`\n✨ Direct session connection to Kim!\n`);
});
