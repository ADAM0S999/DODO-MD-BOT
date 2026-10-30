# ⚡ ADAM WhatsApp Bot

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-purple)]()
[![Baileys](https://img.shields.io/badge/Powered%20by-Baileys-25D366?logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)

> A powerful, clean, multi-session WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys).  
> Plugin-based architecture · Group moderation · AI chat · Media tools · REST API

---

## ✨ Features

| Category | Features |
|----------|---------|
| 🔌 **Plugin System** | Hot-loaded plugin files, easy to extend |
| 👥 **Group Moderation** | Kick, add, promote, demote, mute, unmute, warnings, anti-link, anti-spam, anti-word |
| 🤖 **AI Chat** | Gemini 1.5 Flash, Groq (Llama3), OpenRouter — configurable fallback chain |
| 🎵 **Media Tools** | YouTube audio/video download, image search, text-to-speech, sticker creation |
| 🌐 **REST API** | Full Express API to send messages programmatically + webhook relay |
| 🗄️ **Database** | SQLite (default) or PostgreSQL via Sequelize |
| 🌍 **Localization** | English (more languages: add `lang/<code>.json`) |
| ⚡ **Rate Limiting** | Built-in per-user cooldowns to prevent spam abuse |
| 🐳 **Docker** | Multi-stage build for production-ready, minimal images |
| ☁️ **Cloud Ready** | One-click deploy to Koyeb, Render, Heroku |

---

## 🚀 Quick Start

```bash
git clone https://github.com/your-username/adam-bot.git
cd adam-bot

# Copy example config
cp config.env.example config.env
# Edit config.env and fill in at minimum SESSION_ID and SUDO

npm install   # or: yarn install
npm start     # Scan QR code on first run
```

---

## 🌍 Supported Languages

| Code | Language   |
|------|-----------|
| `en` | English    |
| `fr` | French *(add `lang/fr.json`)* |
| `es` | Spanish *(add `lang/es.json`)* |
| `pt` | Portuguese *(add `lang/pt.json`)* |
| `ar` | Arabic *(add `lang/ar.json`)* |

Set `BOT_LANG=fr` in `config.env` to switch language.

---

## 🌐 API Mode

ADAM supports three operating modes, set via `API_MODE` in `config.env`:

| Mode   | Description |
|--------|-------------|
| `bot`  | Run only the WhatsApp bot |
| `api`  | Run only the REST API server (no WhatsApp) |
| `both` | Run both simultaneously *(default)* |

### REST API Endpoints

| Method | Endpoint        | Description |
|--------|-----------------|-------------|
| GET    | `/`             | Health check & bot status |
| GET    | `/info`         | Bot configuration info |
| POST   | `/send`         | Send a text message |
| POST   | `/send/media`   | Send an image/video/audio/document |
| POST   | `/webhook`      | Receive & forward webhooks |

**Authentication**: Set `API_KEY` in `config.env`. Pass it as `x-api-key` header or `?apiKey=` query param.

```bash
# Example: send a message
curl -X POST http://localhost:3000/send \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"jid":"263XXXXXXXXX@s.whatsapp.net","message":"Hello from ADAM API!"}'
```

---

## ☁️ Deployment

### Koyeb
1. Fork this repo
2. Go to [koyeb.com](https://koyeb.com) → New Service → GitHub
3. Set environment variables from `config.env.example`
4. Set `KOYEB=true`, `KOYEB_NAME=<your-service-name>`, `KOYEB_API=<your-api-key>`
5. Deploy!

### Render
1. Fork this repo → [render.com](https://render.com) → New Web Service
2. Build command: `npm install`  
   Start command: `npm start`
3. Add environment variables from `config.env.example`
4. Set `RENDER_NAME` and `RENDER_API_KEY` for keep-alive

### VPS / Local PC
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run pm2

# View logs
npm run pm2:logs

# Restart
npm run pm2:restart
```

### Docker
```bash
docker build -t adam-bot .
docker run -d \
  --name adam-bot \
  -p 3000:3000 \
  -v $(pwd)/auth_info_baileys:/app/auth_info_baileys \
  -v $(pwd)/database.db:/app/database.db \
  --env-file config.env \
  adam-bot
```

---

## ⚙️ Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_ID` | *(required)* | WhatsApp session ID |
| `PREFIX` | `.` | Command prefix |
| `SUDO` | — | Owner phone number(s), comma-separated |
| `BOT_LANG` | `en` | Bot language code |
| `STICKER_PACKNAME` | `⚡,ADAM` | Sticker pack name (format: `pack,author`) |
| `VPS` | `false` | Set `true` on a server |
| `ALWAYS_ONLINE` | `false` | Keep bot as "Online" always |
| `SEND_READ` | `false` | Send read receipts |
| `AUTO_STATUS_VIEW` | `false` | Auto-view status updates |
| `REJECT_CALL` | `false` | Auto-reject voice/video calls |
| `WARN_LIMIT` | `3` | Warnings before auto-kick |
| `ANTIWORDS` | — | Comma-separated banned words |
| `ANTI_BOT` | `false` | Auto-remove bots from groups |
| `ANTI_DELETE` | `false` | Notify/repost deleted messages |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model |
| `GROQ_API_KEY` | — | Groq API key |
| `GROQ_MODEL` | `llama3-70b-8192` | Groq model |
| `OPENROUTER_API_KEY` | — | OpenRouter API key |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini:free` | OpenRouter model |
| `API_MODE` | `both` | `bot` / `api` / `both` |
| `API_KEY` | — | REST API secret key |
| `API_WEBHOOK_URL` | — | URL to forward incoming messages |
| `API_PUBLIC_URL` | — | Your public server URL |
| `PORT` | `3000` | API server port |
| `DATABASE_URL` | — | PostgreSQL URL (SQLite if blank) |
| `TIMEZONE` | `Africa/Harare` | Timezone for date display |
| `MAX_UPLOAD` | `200` | Max media upload size (MB) |
| `BAILEYS_LOG_LVL` | `silent` | Baileys log level |
| `LOG_MSG` | `true` | Log incoming messages |
| `CMD_REACTION` | `true` | React with emoji on commands |
| `AUTO_UPDATE` | `true` | Auto-update check |

See [`config.env.example`](config.env.example) for the full list.

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `.menu` / `.help` | Show command menu |
| `.alive` | Check bot status |
| `.ping` | Latency check |
| `.uptime` | Bot uptime |
| `.owner` | Show owner info |
| `.speed` | System information |
| `.kick @user` | Remove member from group |
| `.add 263XXXXXXXXX` | Add member to group |
| `.promote @user` | Promote to admin |
| `.demote @user` | Demote from admin |
| `.mute` / `.unmute` | Lock/unlock group |
| `.invite` | Get group invite link |
| `.ginfo` | Group information |
| `.warn @user` | Warn a member |
| `.resetwarn @user` | Reset warnings |
| `.warnlist` | List all warnings |
| `.antilink on/off` | Toggle anti-link filter |
| `.antispam on/off` | Toggle anti-spam filter |
| `.antiword on/off` | Toggle anti-word filter |
| `.filters` | Show filter status |
| `.sticker` | Create sticker from image/video |
| `.toimg` | Convert sticker to image |
| `.ai <question>` | Ask AI (auto-selects provider) |
| `.gemini <question>` | Ask Google Gemini |
| `.groq <question>` | Ask Groq (Llama3) |
| `.openrouter <question>` | Ask via OpenRouter |
| `.play <song>` | YouTube audio download |
| `.video <title>` | YouTube video download |
| `.img <query>` | Image search |
| `.tts <text>` | Text to speech |

---

## 🐛 GitHub Issues

We welcome contributions and feedback! Please use the appropriate template:

- **[Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)** — Something is broken
- **[Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)** — Suggest a new feature
- **[Bad Feedback](.github/ISSUE_TEMPLATE/bad_feedback.md)** — A command gave a poor experience

---

## 🏗️ Project Structure

```
adam-bot/
├── index.js              # Entry point
├── config.js             # Configuration loader
├── config.env.example    # Example environment variables
├── config.json.example   # Multi-session config example
├── package.json
├── Dockerfile            # Multi-stage Docker build
├── heroku.yml
├── app.json              # Heroku env docs
├── .gitignore
├── plugins/              # Command plugins (auto-loaded)
│   ├── menu.js
│   ├── ping.js
│   ├── misc.js
│   ├── group.js
│   ├── sticker.js
│   ├── ai.js
│   ├── media.js
│   ├── warn.js
│   └── filters.js
├── lib/                  # Core libraries
│   ├── index.js          # Utility helpers
│   ├── events.js         # Command registry
│   ├── client.js         # Baileys client & message handler
│   ├── api.js            # Express REST API
│   └── config.js         # Config re-export
└── lang/
    └── en.json           # English language strings
```

---

## 📜 Credits

- [Baileys](https://github.com/WhiskeySockets/Baileys) — WhatsApp Web API
- [Google Generative AI](https://ai.google.dev/) — Gemini AI
- [Groq](https://groq.com/) — Fast Llama inference
- [OpenRouter](https://openrouter.ai/) — Multi-model AI routing
- [Sequelize](https://sequelize.org/) — ORM for SQLite/PostgreSQL

---

## 📄 License

MIT © ADAM Bot Team
