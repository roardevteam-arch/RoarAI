# 🎮 ROAR AI Roblox Studio Plugin

The ROAR AI plugin integrates with Roblox Studio, allowing you to analyze code directly within the editor.

## Installation

### Option 1: Automatic (Recommended)

1. Open Roblox Studio
2. Go to **Plugins → Open Plugin Folder**
3. Copy `RobloxAIPlugin.lua` into this folder
4. Restart Roblox Studio
5. Click the **ROAR AI** button in the **Plugins** toolbar

### Option 2: Manual

1. Navigate to: `%APPDATA%\Roblox\Plugins\`
2. Paste `RobloxAIPlugin.lua`
3. Restart Roblox Studio

## Features

- **Analyze Code**: Send selected scripts to ROAR AI for analysis
- **Performance Review**: Get optimization suggestions
- **Security Check**: Identify potential vulnerabilities
- **Best Practices**: Learn Roblox development patterns
- **Local Analysis**: No external API calls - fully private

## Usage

### Basic Analysis

1. **Select a script** in the Explorer (Script, LocalScript, or ModuleScript)
2. **Click the ROAR AI plugin button** in the toolbar
3. **Click "Analyze Code"** in the dock widget
4. Results appear in the plugin output and browser console

### Open Web Console

Click **"Open Console"** to view the full ROAR AI interface at `http://localhost:3000`

### Settings

- **HTTP Requests**: Must be enabled
  - File → Settings → Studio Settings
  - Security tab → "Enable HTTP Requests" ✓

## Requirements

- ✅ Roblox Studio 
- ✅ Node.js bridge running (`npm start`)
- ✅ Ollama running locally
- ✅ HTTP Requests enabled in Studio settings

## Troubleshooting

### Plugin doesn't appear

- Verify file is in: `%APPDATA%\Roblox\Plugins\`
- Restart Roblox Studio
- Check studio.log in `%APPDATA%\Roblox\` for errors

### "HTTP requests disabled" error

1. Open Roblox Studio
2. File → Settings → Studio Settings
3. Click "Security" tab
4. Check "✓ Enable HTTP Requests"
5. Restart Studio

### "Connection Failed" error

- Ensure bridge is running: `cd server && npm start`
- Verify Ollama is running
- Try: `curl http://localhost:3000/api/status`

### No response from AI

1. Check bridge is running at `http://localhost:3000`
2. Ensure Ollama model is installed: `ollama pull llama3`
3. Verify OLLAMA_HOST is set correctly

## Tips

- **Pro Tip**: Select a script and analyze multiple times with different focus areas
- **Pro Tip**: Use security analysis to find potential exploits
- **Pro Tip**: Copy-paste responses into your code comments
- **Pro Tip**: Use performance analysis on frequently-called functions

## API Reference

The plugin sends requests to:
- `http://localhost:3000/api/roblox` - Roblox-specific analysis
- `http://localhost:3000/api/chat` - General chat requests

Both require the bridge server to be running.

## Limitations

- Plugin code size is limited to ~5000 chars (first 5000 sent to AI)
- Requires local bridge - cannot work with cloud services
- Must enable HTTP requests in Studio settings
- Script must be selected in Explorer

## Privacy

✅ **Your code is private!**
- No data sent to external servers
- All processing happens locally
- Bridge only communicates with your Ollama
- Delete .env and bridge logs at any time

## License

MIT License - See LICENSE in main repo

## Support

- Check the main [README.md](../README.md) for general help
- Review server logs with `NODE_ENV=development npm start`
- Open an issue on GitHub

---

Built for Roblox developers by ROAR AI Team

