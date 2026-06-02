# RoarAI

RoarAI is a web-based AI console built for Roblox Studio. It includes:

- A **static web UI** compatible with **GitHub Pages**
- A **local Node.js bridge** to connect the web interface with **Ollama**
- A **Roblox Studio plugin** to open the console and send selected content
- A **model chooser** powered by Ollama local models

## Features

- Chat with Ollama models from a browser UI
- Send Roblox Studio selection data into AI prompts
- Deploy the UI to GitHub Pages with the `docs/` folder
- Local bridge handles the Ollama API calls safely on your machine

## Setup

### 1. Install Node.js

Install Node 18+ from https://nodejs.org/

### 2. Start the local bridge server

```powershell
cd server
npm install
npm start
```

This starts the bridge at `http://127.0.0.1:3000` and serves the web UI.

### 3. Install Ollama

Install Ollama and run the local server. The bridge expects Ollama at `http://127.0.0.1:11434`.

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
