# RoarAI Roblox Plugin

This plugin connects Roblox Studio to the RoarAI web console.

## Installation

1. Open Roblox Studio.
2. Create a new plugin or open an existing plugin project.
3. Copy `plugin/RobloxAIPlugin.lua` into the plugin source.
4. Enable HTTP requests in Studio settings.

## Usage

- Click the **RoarAI** toolbar button to toggle the plugin panel.
- Click **Open RoarAI Console** to open the local AI web UI.
- Select objects in Explorer and click **Send Selection to AI** to send Roblox Studio data to the AI.

## Requirements

- Local bridge server running: `cd server && npm install && npm start`
- Ollama running locally at `http://127.0.0.1:11434`
- Studio HTTP requests enabled

## Notes

- The plugin uses `http://127.0.0.1:3000` as the local bridge URL.
- The web UI is served from `docs/` for GitHub Pages compatibility.
