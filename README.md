# 🚀 ROAR AI - Roblox Optimized Assistant & Resource

**ROAR AI** is a production-ready, local-first AI assistant built specifically for Roblox Luau game development. No external API keys. No cloud dependencies. Just pure local Ollama power.

<img alt="ROAR AI Interface" src="./docs/preview.png" width="100%" />

## ✨ Features

- 🤖 **Local-First**: Runs entirely on your machine using Ollama - no external API calls
- 💻 **Web UI**: Modern, responsive web interface deployed via GitHub Pages
- 🔌 **Local Bridge**: Node.js server bridges your web UI with local Ollama
- 🎮 **Studio Integration**: Roblox Studio plugin to send code selections directly to AI
- 🎯 **Specialized**: ROAR PRO model optimized for Roblox Luau development
- ⚡ **Production Ready**: Comprehensive error handling, logging, timeouts
- 🔒 **Secure**: All processing happens locally - your code never leaves your machine

## 📋 Requirements

- **Node.js** 18+ 
- **Ollama** (free) - [Download here](https://ollama.ai)
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Install Ollama

Download and install [Ollama](https://ollama.ai), then pull a model:

```bash
ollama pull llama3
ollama pull mistral
```

### 2. Start ROAR AI Bridge

```bash
cd server
npm install
npm start
```

Server runs at `http://localhost:3000`

### 3. Open Web UI

Visit **http://localhost:3000** in your browser

### 4. Install Roblox Plugin (Optional)

1. Download `plugin/RobloxAIPlugin.lua`
2. In Roblox Studio: **Plugins → Open Plugin Folder**
3. Place the file there and restart Studio
4. Click the ROAR button in the Plugins tab

## 🛠️ Configuration

Create a `.env` file in the `server/` directory:

```env
PORT=3000
NODE_ENV=production
OLLAMA_HOST=http://127.0.0.1:11434
REQUEST_TIMEOUT_MS=30000
MAX_TOKENS=2048
```

See `.env.example` for all options.

## 📖 Usage

### Chat Tab

1. Select a model (ROAR PRO recommended for Roblox)
2. Type your question about Roblox development
3. Hit Enter or click Send
4. Response streams to chat

### Settings

- **Temperature**: 0-1 controls creativity (0 = precise, 1 = creative)
- **Max Tokens**: Response length limit (100-2048)
- **Bridge URL**: Configure Ollama bridge location

### Roblox Studio Plugin

1. Select code in the Explorer
2. Click "Send to ROAR" button
3. AI analyzes in web console
4. Get suggestions for improvements

## 🔧 API Endpoints

All endpoints require local bridge to be running.

### GET /api/health
Check server health:
```bash
curl http://localhost:3000/api/health
```

### GET /api/status
Check Ollama bridge connection:
```bash
curl http://localhost:3000/api/status
```

### GET /api/models
List available Ollama models:
```bash
curl http://localhost:3000/api/models
```

### POST /api/chat
Send chat request:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "roar-pro",
    "prompt": "Write a DataStore script",
    "temperature": 0.7,
    "max_tokens": 800
  }'
```

### POST /api/roblox
Send Roblox-specific request:
```bash
curl -X POST http://localhost:3000/api/roblox \
  -H "Content-Type: application/json" \
  -d '{
    "model": "roar-pro",
    "prompt": "Analyze this for performance",
    "source": "roblox"
  }'
```

## 🎯 ROAR PRO System Prompt

ROAR AI comes with a specialized system prompt that teaches the AI about:

- Luau syntax and best practices
- Roblox game architecture
- Performance optimization techniques
- Security best practices
- Common design patterns

You can customize this in `server/server.js`.

## 🧠 Recommended Models

| Model | Use Case | Speed | Memory |
|-------|----------|-------|--------|
| **llama3** | General purpose, good balance | Fast | 4GB |
| **mistral** | Code generation, fast | Very Fast | 3GB |
| **codellama** | Code-specific tasks | Moderate | 8GB |
| **neural-chat** | Conversational, helpful | Fast | 4GB |

## 📁 Project Structure

```
RoarAI/
├── docs/                    # Static web UI (GitHub Pages)
│   ├── index.html
│   ├── app.js             # Frontend logic
│   ├── styles.css         # UI styles
│   └── app.js.map         # (optional) source maps
├── server/                  # Node.js bridge
│   ├── server.js          # Express server
│   └── package.json
├── plugin/                  # Roblox plugin
│   ├── RobloxAIPlugin.lua
│   └── README.md
├── .env.example            # Configuration template
├── .gitignore
└── README.md              # This file
```

## 🚀 Deployment

### Deploy Web UI to GitHub Pages

1. Fork this repository
2. Enable GitHub Pages in Settings → Pages
3. Select `docs` folder as source
4. Visit `https://yourusername.github.io/RoarAI`

**Note**: The web UI still needs a local bridge running to function.

## 🐛 Troubleshooting

### "Bridge unavailable"
- Check Ollama is running: `ollama serve`
- Verify `OLLAMA_HOST` is set correctly
- Try `http://127.0.0.1:11434` explicitly

### "No models found"
- Pull a model: `ollama pull llama3`
- Check Ollama is listening: `curl http://localhost:11434/api/models`

### Slow responses
- Increase RAM allocation to Ollama
- Try a smaller model (mistral vs codellama)
- Reduce `max_tokens` setting

### Memory issues
- Reduce model size or use GPU acceleration
- Close other applications
- Check available disk space

## 📝 Development

### Install dependencies

```bash
cd server
npm install
```

### Start in development mode

```bash
NODE_ENV=development npm start
```

Logs will include debug information.

### Testing

```bash
npm test
```

## 🤝 Contributing

Issues, PRs, and suggestions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Roblox Developer Hub](https://create.roblox.com/)
- [Luau Language Guide](https://luau-lang.org/)
- [Express.js Documentation](https://expressjs.com/)

## ⚡ Tips & Tricks

- **Pro Tip**: Use temperature 0.3-0.5 for code generation (more precise)
- **Pro Tip**: Use temperature 0.7-0.9 for brainstorming (more creative)
- **Pro Tip**: Increase max_tokens for complex scripts (1000-2000)
- **Pro Tip**: Pin your chat history by copying to a file

## 🎓 Learning Resources

- [Roblox Studio Basics](https://create.roblox.com/docs/studio/intro-studio)
- [Luau Type Annotations](https://luau-lang.org/tutorial#type-annotations)
- [DataStoreService Guide](https://create.roblox.com/docs/engine/data-stores)
- [RemoteEvents & Functions](https://create.roblox.com/docs/engine/remote-functions-events)

## 📞 Support

- Check the FAQ in the app
- Read troubleshooting section above
- Visit Roblox DevForum for game dev help
- Open an issue on GitHub

---

**Built with ❤️ for Roblox developers**

Last updated: December 2024 | Version 1.0.0

### 4. Open the web app

Visit `http://127.0.0.1:3000` in your browser.

### 5. Load the Roblox plugin

Open `plugin/RobloxAIPlugin.lua` in Roblox Studio as a plugin script. Enable HTTP requests in Studio settings.

## GitHub Pages Deployment

The web app lives inside the `docs/` folder to make GitHub Pages deployment easy.

1. Commit this repository to GitHub.
2. Enable Pages from the `docs/` folder.
3. Use the included workflow in `.github/workflows/gh-pages.yml` for automatic deployments.

## Plugin Usage

- Use the toolbar button to open the local AI console.
- Use the plugin command to send selected objects or instance names to the AI.
- Select an Ollama model from the web UI.

## Notes

- The web UI is static and works on GitHub Pages.
- The plugin is the Roblox Studio bridge into the same local AI workflow.
- Ollama model selection works with your local Ollama installation.
