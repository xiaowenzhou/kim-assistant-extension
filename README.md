# Kim Assistant Browser Extension

🤖 Kim AI 浏览器插件 - 直接在浏览器中与 Kim AI 对话

## ✨ 功能特点

- 🚀 **直接对话** - 无需通过 Telegram/飞书等中间渠道
- 🔒 **安全认证** - API Key 验证保护通信安全
- 📝 **会话历史** - 自动记录对话历史
- 🌐 **跨平台** - 支持所有支持 Chrome 扩展的浏览器
- 🔧 **易于配置** - 提供完整的配置文档

## 📁 项目结构

```
kim-assistant-extension/
├── assets/                 # 图标资源
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── src/                   # 插件源代码
│   ├── background/        # 后台脚本
│   ├── content/           # 内容脚本
│   ├── popup/            # 弹窗界面
│   └── options/           # 选项页面
├── test-server/           # 测试服务器
│   ├── kim-session.js    # Kim 会话服务器（最终版本）
│   ├── .env.example      # 环境变量模板
│   └── nginx-kim.conf.template  # Nginx 配置模板
├── manifest.json          # 插件配置
├── nginx-kim.conf         # Nginx 反向代理配置
├── README.md             # 项目说明
└── TUTORIAL.md          # 详细教程
```

## 🚀 快速开始

### 1. 安装浏览器插件

1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `kim-assistant-extension` 文件夹

### 2. 配置服务器

```bash
# 进入测试服务器目录
cd kim-assistant-extension/test-server

# 复制环境变量模板
cp .env.example .env

# 编辑配置文件（填入真实值）
nano .env
```

### 3. 配置 Nginx（可选，用于 HTTPS）

```bash
# 复制 Nginx 配置模板
cd kim-assistant-extension
cp nginx-kim.conf.template nginx-kim.conf

# 编辑配置（填入真实域名和证书路径）
sudo cp nginx-kim.conf /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 启动服务器

```bash
cd kim-assistant-extension/test-server
node kim-session.js
```

### 5. 配置插件

在插件选项中配置：

| 配置项 | 说明 | 示例值 |
|-------|------|-------|
| API URL | Kim 服务器地址 | `https://kim.yourdomain.com` |
| API Key | 认证密钥 | `your-secret-key` |

## 📖 使用说明

### 基本对话

1. 点击浏览器工具栏中的 Kim 图标
2. 输入消息并发送
3. Kim 会直接回复你

### 快捷操作

- 点击「问好」- 向 Kim 问好
- 点击「回忆」- 询问对话历史
- 点击「笑话」- 听 Kim 讲笑话
- 点击「清除」- 清空对话历史

## 🔧 配置选项

### 环境变量 (.env)

```bash
# 必需配置
API_KEY=your-secret-key-here
PORT=11434
OPENCLAW_URL=http://localhost:18789
SESSIONS_DIR=/path/to/openclaw/agents/main/sessions

# 可选配置（AI API）
# OPENAI_API_KEY=sk-your-key
# DEEPSEEK_API_KEY=sk-your-key
```

### 插件配置

| 选项 | 说明 | 默认值 |
|-----|------|-------|
| API URL | Kim 服务器地址 | `http://localhost:11434` |
| API Key | 认证密钥 | - |
| 自动连接 | 启动时自动连接 | 开启 |
| 显示通知 | 收到消息时通知 | 开启 |

## 🏗️ 架构设计

```
浏览器插件 
    ↓ HTTPS/WSS
Nginx 反向代理
    ↓
Kim 会话服务器 (Node.js)
    ↓
OpenClaw Gateway / AI API
```

## 📝 API 文档

### 发送消息

```bash
curl -X POST https://kim.yourdomain.com/api/message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{"text":"你好 Kim！","sessionId":"browser-123"}'
```

### 响应格式

```json
{
  "success": true,
  "message": "👋 嘿，你好呀！...",
  "source": "kim",
  "sessionId": "browser-123",
  "timestamp": "2026-02-08T07:00:00.000Z"
}
```

## 🔒 安全注意事项

1. **API Key 安全**
   - 不要将真实 API Key 上传到代码仓库
   - 使用 `.env` 文件管理敏感信息
   - 定期更换 API Key

2. **HTTPS 强制**
   - 生产环境必须使用 HTTPS
   - 使用 Cloudflare 或 Let's Encrypt 获取 SSL 证书

3. **访问控制**
   - 限制 IP 访问频率
   - 监控异常请求
   - 及时更新安全补丁

## 🛠️ 开发指南

### 添加新功能

1. 修改 `src/` 目录下的源代码
2. 在 `test-server/kim-session.js` 中添加 API 端点
3. 测试新功能
4. 更新文档

### 调试技巧

```bash
# 查看服务器日志
tail -f /tmp/kim-session.log

# 测试 API
curl -v http://localhost:11434/api/status

# 检查端口占用
netstat -tlnp | grep 11434
```

## 📦 部署到生产环境 PM2 管理进程

```bash
# 安装 PM

### 使用2
npm install -g pm2

# 启动服务
pm2 start kim-session.js --name kim-assistant

# 设置开机自启
pm2 startup
pm2 save
```

### 使用 Systemd

```ini
# /etc/systemd/system/kim-assistant.service
[Unit]
Description=Kim Assistant Browser Plugin Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/kim-assistant-extension/test-server
ExecStart=/usr/bin/node kim-session.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - AI 助手框架
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) - 浏览器扩展开发文档

---

**注意**: 本项目包含脱敏的配置模板。在部署前，请务必：

1. 复制 `.env.example` 为 `.env` 并填入真实值
2. 复制 `nginx-kim.conf.template` 为 `nginx-kim.conf` 并配置域名和证书路径
3. 不要将包含真实信息的配置文件提交到代码仓库

## 📞 联系方式

如有问题，请提交 [Issue](https://github.com/yourusername/kim-assistant-extension/issues)
