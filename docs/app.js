// ROAR AI - Production Frontend
// Handles bridge status, setup, chat, and demo responses

const DOM = {
  statusText: document.getElementById('status-text'),
  statusDot: document.getElementById('status-dot'),
  modelSelect: document.getElementById('model-select'),
  refreshButton: document.getElementById('refresh-models'),
  clearButton: document.getElementById('clear-chat-btn'),
  sendButton: document.getElementById('send-btn'),
  chatLog: document.getElementById('messages'),
  promptInput: document.getElementById('prompt-input'),
  typingIndicator: document.getElementById('typing-indicator'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  newChatBtn: document.getElementById('new-chat-btn'),
  topbarMenu: document.getElementById('topbar-menu'),
  pluginModal: document.getElementById('plugin-modal'),
  welcomeScreen: document.getElementById('welcome-screen'),
  setupModal: document.getElementById('setup-modal'),
  setupSaveButton: document.getElementById('setup-save-btn'),
  setupCloseButton: document.getElementById('setup-close-btn'),
  serverUrlInput: document.getElementById('server-url-input'),
  settingsPanel: document.getElementById('settings-panel'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  settingsSaveBtn: document.getElementById('settings-save-btn'),
  clearSettingsBtn: document.getElementById('settings-clear-btn'),
  settingsServerUrlInput: document.getElementById('settings-server-url'),
  tempSlider: document.getElementById('temp-slider'),
  tokensSlider: document.getElementById('tokens-slider'),
  tempValue: document.getElementById('temp-value'),
  tokensValue: document.getElementById('tokens-value'),
  charCount: document.getElementById('char-count'),
  ollamaSelectWrap: document.getElementById('ollama-select-wrap'),
  offlineBanner: document.getElementById('offline-banner'),
  pluginLink: document.getElementById('plugin-link'),
  offlineBannerText: document.getElementById('offline-banner-text'),
};

const STORAGE = window.localStorage;
const KEYS = {
  serverUrl: 'roarai-server-url',
  model: 'roarai-model',
  temperature: 'roarai-temperature',
  tokens: 'roarai-max-tokens',
  seenSetup: 'roarai-seen-setup',
  sidebarCollapsed: 'roarai-sidebar-collapsed',
};
const DEFAULT_SERVER_URL = 'http://localhost:3000';

const FALLBACK_MODELS = [
  { id: 'roar-pro', name: 'ROAR PRO' },
  { id: 'llama3', name: 'Ollama - Llama 3' },
  { id: 'codellama', name: 'Ollama - Code Llama' },
  { id: 'mistral', name: 'Ollama - Mistral' },
];

const DEMO_RESPONSES = [
  `Here's a smooth camera follow script for Roblox:\n\n\`\`\`lua\nlocal Players = game:GetService("Players")\nlocal RunService = game:GetService("RunService")\n\nlocal player = Players.LocalPlayer\nlocal camera = workspace.CurrentCamera\n\nlocal function setupCamera()\n    local character = player.Character or player.CharacterAdded:Wait()\n    local rootPart = character:WaitForChild("HumanoidRootPart")\n    local offset = Vector3.new(0, 5, 10)\n\n    RunService.RenderStepped:Connect(function()\n        if rootPart then\n            local targetCFrame = CFrame.new(rootPart.Position + offset) * CFrame.Angles(-0.2, 0, 0)\n            camera.CFrame = camera.CFrame:Lerp(targetCFrame, 0.1)\n        end\n    end)\nend\n\nsetupCamera()\n\`\`\`\n\nThis uses linear interpolation for smooth camera movement.`,
  `Here's a DataStore system for player inventory:\n\n\`\`\`lua\nlocal DataStoreService = game:GetService("DataStoreService")\nlocal InventoryStore = DataStoreService:GetDataStore("PlayerInventory_v1")\n\nlocal Inventory = {}\n\nfunction Inventory.LoadInventory(player)\n    local success, data = pcall(function()\n        return InventoryStore:GetAsync(player.UserId)\n    end)\n    if success then\n        return data or { coins = 0, items = {}, level = 1 }\n    else\n        warn("Failed to load inventory:", data)\n        return { coins = 0, items = {}, level = 1 }\n    end\nend\n\nfunction Inventory.SaveInventory(player, data)\n    local success, err = pcall(function()\n        InventoryStore:SetAsync(player.UserId, data)\n    end)\n    if not success then\n        warn("Failed to save inventory:", err)\n    end\n    return success\nend\n\nreturn Inventory\n\`\`\`\n\nKey points: Use pcall for DataStore calls, handle failures gracefully, consider UpdateAsync for shared data.`,
  `Here's a melee combat system with hitboxes:\n\n\`\`\`lua\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal RemoteEvents = ReplicatedStorage:WaitForChild("RemoteEvents")\n\nlocal hitboxRemote = RemoteEvents:WaitForChild("HitboxAttack")\nlocal DAMAGE = 25\nlocal COOLDOWN = 0.5\nlocal playerCooldowns = {}\n\nhitboxRemote.OnServerEvent:Connect(function(player, targetPosition)\n    local now = tick()\n    if playerCooldowns[player] and now - playerCooldowns[player] < COOLDOWN then\n        return\n    end\n    playerCooldowns[player] = now\n\n    local character = player.Character\n    if not character then return end\n\n    local params = RaycastParams.new()\n    params.FilterType = Enum.RaycastFilterType.Exclude\n    params.FilterDescendantsInstances = {character}\n\n    local result = workspace:Raycast(character.HumanoidRootPart.Position, targetPosition, params)\n    if result and result.Instance:FindFirstAncestorOfClass("Model") then\n        print("Hit!")\n    end\nend)\n\`\`\``,
];

let state = {
  demoIndex: 0,
  serverAvailable: false,
  currentServerUrl: DEFAULT_SERVER_URL,
  isLoading: false,
};

// Utility Functions

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function normalizeUrl(value) {
  return value ? value.trim().replace(/\/$/, '') : '';
}

function logDebug(msg) {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log(`[ROAR] ${msg}`);
  }
}

// Settings Management

function loadStoredSettings() {
  state.currentServerUrl = normalizeUrl(STORAGE.getItem(KEYS.serverUrl) || DEFAULT_SERVER_URL);
  if (DOM.serverUrlInput) DOM.serverUrlInput.value = state.currentServerUrl;
  if (DOM.settingsServerUrlInput) DOM.settingsServerUrlInput.value = state.currentServerUrl;
  if (DOM.modelSelect) DOM.modelSelect.value = STORAGE.getItem(KEYS.model) || 'roar-pro';

  const savedTemp = parseFloat(STORAGE.getItem(KEYS.temperature) || '0.7');
  const savedTokens = parseInt(STORAGE.getItem(KEYS.tokens) || '800', 10) || 800;
  
  if (DOM.tempSlider) DOM.tempSlider.value = String(Math.round(savedTemp * 100));
  if (DOM.tokensSlider) DOM.tokensSlider.value = String(savedTokens);
  if (DOM.tempValue) DOM.tempValue.textContent = String(savedTemp.toFixed(1));
  if (DOM.tokensValue) DOM.tokensValue.textContent = String(savedTokens);

  const sidebarCollapsed = STORAGE.getItem(KEYS.sidebarCollapsed) === 'true';
  if (sidebarCollapsed && DOM.sidebar) {
    DOM.sidebar.classList.add('collapsed');
  }
}

function saveSettings(serverUrl) {
  const normalizedUrl = normalizeUrl(serverUrl || DEFAULT_SERVER_URL);
  STORAGE.setItem(KEYS.serverUrl, normalizedUrl);
  state.currentServerUrl = normalizedUrl;
  if (DOM.serverUrlInput) DOM.serverUrlInput.value = normalizedUrl;
  if (DOM.settingsServerUrlInput) DOM.settingsServerUrlInput.value = normalizedUrl;
}

function clearStoredSettings() {
  Object.values(KEYS).forEach(key => STORAGE.removeItem(key));
  state.currentServerUrl = DEFAULT_SERVER_URL;
  if (DOM.serverUrlInput) DOM.serverUrlInput.value = DEFAULT_SERVER_URL;
  if (DOM.settingsServerUrlInput) DOM.settingsServerUrlInput.value = DEFAULT_SERVER_URL;
  if (DOM.modelSelect) DOM.modelSelect.value = 'roar-pro';
  if (DOM.tempSlider) DOM.tempSlider.value = '70';
  if (DOM.tokensSlider) DOM.tokensSlider.value = '800';
  if (DOM.tempValue) DOM.tempValue.textContent = '0.7';
  if (DOM.tokensValue) DOM.tokensValue.textContent = '800';
}

// UI Updates

function updateStatus(text, variant = 'normal') {
  if (!DOM.statusText || !DOM.statusDot) return;
  DOM.statusText.textContent = text;
  DOM.statusDot.style.background = variant === 'error'
    ? '#ff6b6b'
    : variant === 'warning'
      ? '#febb69'
      : '#22c55e';
  DOM.statusDot.className = variant === 'error' ? 'error' : variant === 'warning' ? 'loading' : 'connected';
}

function updateOfflineBanner() {
  if (!DOM.offlineBanner) return;
  if (!state.serverAvailable) {
    DOM.offlineBanner.classList.remove('hidden');
  } else {
    DOM.offlineBanner.classList.add('hidden');
  }
}

function openSetupModal() {
  DOM.setupModal?.classList.remove('hidden');
}

function closeSetupModal() {
  DOM.setupModal?.classList.add('hidden');
}

function openSettingsPanel() {
  if (DOM.settingsServerUrlInput) DOM.settingsServerUrlInput.value = state.currentServerUrl;
  DOM.settingsPanel?.classList.remove('hidden');
}

function closeSettingsPanel() {
  DOM.settingsPanel?.classList.add('hidden');
}

function showWelcomeScreen() {
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.display = 'flex';
}

function hideWelcomeScreen() {
  if (DOM.welcomeScreen) DOM.welcomeScreen.style.display = 'none';
}

function showTypingIndicator() {
  if (DOM.typingIndicator) DOM.typingIndicator.style.display = 'flex';
}

function hideTypingIndicator() {
  if (DOM.typingIndicator) DOM.typingIndicator.style.display = 'none';
}

// Message Formatting

function formatCode(text) {
  return text
    .replace(/```luau\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/```lua\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/```\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, '<br>');
}

function appendMessage(role, text) {
  if (!DOM.chatLog) return;
  const bubble = document.createElement('div');
  bubble.className = `msg ${role === 'user' ? 'user' : 'roar'}`;
  const roleIcon = role === 'user' ? '👤' : '🤖';
  const roleLabel = role === 'user' ? 'You' : 'ROAR';
  
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = roleIcon;
  
  const content = document.createElement('div');
  content.className = 'msg-content';
  
  const messageBubble = document.createElement('div');
  messageBubble.className = 'msg-bubble';
  messageBubble.innerHTML = formatCode(escapeHtml(text));
  
  content.appendChild(messageBubble);
  bubble.appendChild(avatar);
  bubble.appendChild(content);
  
  DOM.chatLog.appendChild(bubble);
  DOM.chatLog.scrollTop = DOM.chatLog.scrollHeight;
  hideWelcomeScreen();
}

function updateModelCardState() {
  const roarCard = document.querySelector('.model-card[data-model="roar"]');
  const customCard = document.querySelector('.model-card[data-model="custom"]');
  if (!DOM.modelSelect || !roarCard || !customCard) return;

  if (DOM.modelSelect.value === 'roar-pro') {
    roarCard.classList.add('selected');
    customCard.classList.remove('selected');
    DOM.ollamaSelectWrap?.classList.add('hidden');
  } else {
    roarCard.classList.remove('selected');
    customCard.classList.add('selected');
    DOM.ollamaSelectWrap?.classList.remove('hidden');
  }
}

// API Communication

async function checkConnection() {
  state.serverAvailable = false;
  try {
    const res = await fetch(`${state.currentServerUrl}/api/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      state.serverAvailable = true;
      updateStatus('Bridge connected');
      logDebug('Connected to bridge');
    }
  } catch (error) {
    logDebug(`Connection failed: ${error.message}`);
  }

  if (!state.serverAvailable) {
    updateStatus('Demo mode', 'warning');
  }
  updateOfflineBanner();
}

async function fetchModels() {
  if (!DOM.modelSelect) return;
  if (!state.serverAvailable) {
    DOM.modelSelect.innerHTML = FALLBACK_MODELS.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
    return;
  }

  try {
    const response = await fetch(`${state.currentServerUrl}/api/models`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models : [];
    
    DOM.modelSelect.innerHTML = models.map((value) => {
      const label = FALLBACK_MODELS.find((item) => item.id === value)?.name || value;
      return `<option value="${value}">${label}</option>`;
    }).join('');
    
    if (models.length === 0) throw new Error('No models returned');
  } catch (error) {
    logDebug(`Failed to fetch models: ${error.message}`);
    DOM.modelSelect.innerHTML = FALLBACK_MODELS.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
  }

  const savedModel = STORAGE.getItem(KEYS.model) || 'roar-pro';
  if (DOM.modelSelect.querySelector(`option[value="${savedModel}"]`)) {
    DOM.modelSelect.value = savedModel;
  }
}

async function sendPrompt() {
  const prompt = DOM.promptInput?.value.trim();
  if (!prompt || state.isLoading) return;

  state.isLoading = true;
  const model = DOM.modelSelect?.value || 'roar-pro';
  const temperature = parseFloat(STORAGE.getItem(KEYS.temperature) || '0.7');
  const maxTokens = parseInt(STORAGE.getItem(KEYS.tokens) || '800', 10) || 800;

  STORAGE.setItem(KEYS.model, model);
  STORAGE.setItem(KEYS.temperature, String(temperature));
  STORAGE.setItem(KEYS.tokens, String(maxTokens));

  appendMessage('user', prompt);
  DOM.promptInput.value = '';
  showTypingIndicator();
  updateStatus(state.serverAvailable ? 'Generating response…' : 'Demo mode');

  if (!state.serverAvailable) {
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));
    const response = DEMO_RESPONSES[state.demoIndex % DEMO_RESPONSES.length];
    state.demoIndex += 1;
    hideTypingIndicator();
    appendMessage('roar', response);
    updateStatus('Demo mode', 'warning');
    state.isLoading = false;
    return;
  }

  try {
    const response = await fetch(`${state.currentServerUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, temperature, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const json = await response.json();
    const responseText = json.response || 'No response received from Ollama.';

    hideTypingIndicator();
    appendMessage('roar', responseText);
    updateStatus('Bridge connected');
  } catch (error) {
    hideTypingIndicator();
    appendMessage('roar', `⚠️ Error: ${error.message}\n\nMake sure Ollama is running at ${state.currentServerUrl}`);
    updateStatus('Error', 'error');
    updateOfflineBanner();
  }
  
  state.isLoading = false;
}

function handleQuickPrompt(event) {
  const prompt = event.currentTarget.dataset.prompt;
  if (prompt && DOM.promptInput) {
    DOM.promptInput.value = prompt;
    sendPrompt();
  }
}

function toggleSidebar() {
  if (!DOM.sidebar) return;
  DOM.sidebar.classList.toggle('collapsed');
  STORAGE.setItem(KEYS.sidebarCollapsed, String(DOM.sidebar.classList.contains('collapsed')));
}

function updateSliderDisplay() {
  if (DOM.tempSlider && DOM.tempValue) {
    const value = parseFloat(DOM.tempSlider.value) / 100;
    DOM.tempValue.textContent = value.toFixed(1);
    STORAGE.setItem(KEYS.temperature, String(value));
  }

  if (DOM.tokensSlider && DOM.tokensValue) {
    const value = parseInt(DOM.tokensSlider.value, 10) || 800;
    DOM.tokensValue.textContent = String(value);
    STORAGE.setItem(KEYS.tokens, String(value));
  }
}

function updateCharCount() {
  if (DOM.charCount && DOM.promptInput) {
    DOM.charCount.textContent = `${DOM.promptInput.value.length} chars`;
  }
}

// Event Listeners

DOM.refreshButton?.addEventListener('click', () => {
  updateStatus('Refreshing models...');
  fetchModels();
});

DOM.clearButton?.addEventListener('click', () => {
  if (DOM.chatLog) DOM.chatLog.innerHTML = '';
  showWelcomeScreen();
  updateStatus(state.serverAvailable ? 'Ready' : 'Demo mode', state.serverAvailable ? 'normal' : 'warning');
});

DOM.sendButton?.addEventListener('click', sendPrompt);

DOM.promptInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
});

DOM.promptInput?.addEventListener('input', updateCharCount);

DOM.sidebarToggle?.addEventListener('click', toggleSidebar);

DOM.newChatBtn?.addEventListener('click', () => {
  if (DOM.chatLog) DOM.chatLog.innerHTML = '';
  showWelcomeScreen();
});

DOM.topbarMenu?.addEventListener('click', toggleSidebar);

DOM.setupSaveButton?.addEventListener('click', () => {
  saveSettings(DOM.serverUrlInput?.value || '');
  STORAGE.setItem(KEYS.seenSetup, 'true');
  closeSetupModal();
  checkConnection().then(fetchModels);
});

DOM.setupCloseButton?.addEventListener('click', closeSetupModal);

DOM.settingsBtn?.addEventListener('click', openSettingsPanel);
DOM.settingsCloseBtn?.addEventListener('click', closeSettingsPanel);

DOM.settingsSaveBtn?.addEventListener('click', () => {
  saveSettings(DOM.settingsServerUrlInput?.value || '');
  closeSettingsPanel();
  checkConnection().then(fetchModels);
});

DOM.clearSettingsBtn?.addEventListener('click', () => {
  clearStoredSettings();
  closeSettingsPanel();
  openSetupModal();
  updateStatus('Demo mode', 'warning');
  updateOfflineBanner();
  fetchModels();
});

DOM.pluginLink?.addEventListener('click', (event) => {
  event.preventDefault();
  DOM.pluginModal?.classList.remove('hidden');
});

DOM.modelSelect?.addEventListener('change', updateModelCardState);

document.querySelectorAll('.model-card').forEach((card) => {
  card.addEventListener('click', () => {
    const targetModel = card.dataset.model;
    if (!targetModel || !DOM.modelSelect) return;

    if (targetModel === 'custom') {
      DOM.ollamaSelectWrap?.classList.remove('hidden');
      if (DOM.modelSelect.value === 'roar-pro') {
        DOM.modelSelect.value = FALLBACK_MODELS[1]?.id || 'llama3';
      }
    } else {
      DOM.modelSelect.value = 'roar-pro';
      DOM.ollamaSelectWrap?.classList.add('hidden');
    }
    updateModelCardState();
  });
});

DOM.tempSlider?.addEventListener('input', updateSliderDisplay);
DOM.tokensSlider?.addEventListener('input', updateSliderDisplay);

document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.classList.add('hidden');
    }
  });
});

document.querySelectorAll('.quick-prompt').forEach((button) => {
  button.addEventListener('click', handleQuickPrompt);
});

document.querySelectorAll('.modal-close').forEach((button) => {
  button.addEventListener('click', () => {
    const parent = button.closest('.modal-overlay');
    if (parent) parent.classList.add('hidden');
  });
});

// Initialization

async function initApp() {
  logDebug('Initializing ROAR AI...');
  loadStoredSettings();
  updateModelCardState();
  updateCharCount();
  
  await checkConnection();
  await fetchModels();
  updateModelCardState();
  
  if (!state.serverAvailable) {
    const hasSeenSetup = STORAGE.getItem(KEYS.seenSetup);
    if (!hasSeenSetup) {
      setTimeout(openSetupModal, 500);
      STORAGE.setItem(KEYS.seenSetup, 'true');
    }
  }
  
  logDebug('ROAR AI ready');
}

// Auto-reconnect every 30 seconds
setInterval(() => {
  if (!state.serverAvailable) {
    checkConnection();
  }
}, 30000);

// Start the app
initApp();


const storage = window.localStorage;
const serverUrlKey = 'roarai-server-url';
const modelKey = 'roarai-model';
const temperatureKey = 'roarai-temperature';
const tokensKey = 'roarai-max-tokens';
const seenSetupKey = 'roarai-seen-setup';
const defaultServerUrl = 'http://localhost:3000';

const fallbackModels = [
  { id: 'roar-pro', name: 'ROAR PRO' },
  { id: 'llama3', name: 'Ollama - Llama 3' },
  { id: 'codellama', name: 'Ollama - Code Llama' },
];

const demoResponses = [
  `Here's a smooth camera follow script for Roblox:

\`\`\`lua
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local function setupCamera()
    local character = player.Character or player.CharacterAdded:Wait()
    local rootPart = character:WaitForChild("HumanoidRootPart")
    local offset = Vector3.new(0, 5, 10)

    RunService.RenderStepped:Connect(function()
        if rootPart then
            local targetCFrame = CFrame.new(rootPart.Position + offset) * CFrame.Angles(-0.2, 0, 0)
            camera.CFrame = camera.CFrame:Lerp(targetCFrame, 0.1)
        end
    end)
end

setupCamera()
\`\`\`

This uses linear interpolation for smooth camera movement.
`,
  `Here's a DataStore system for player inventory:

\`\`\`lua
local DataStoreService = game:GetService("DataStoreService")
local InventoryStore = DataStoreService:GetDataStore("PlayerInventory_v1")

local Inventory = {}

function Inventory.LoadInventory(player)
    local success, data = pcall(function()
        return InventoryStore:GetAsync(player.UserId)
    end)

    if success then
        return data or { coins = 0, items = {}, level = 1 }
    else
        warn("Failed to load inventory:", data)
        return { coins = 0, items = {}, level = 1 }
    end
end

function Inventory.SaveInventory(player, data)
    local success, err = pcall(function()
        InventoryStore:SetAsync(player.UserId, data)
    end)

    if not success then
        warn("Failed to save inventory:", err)
    end

    return success
end

return Inventory
\`\`\`

Key points:
- Use pcall for DataStore calls
- Handle failures gracefully
- Consider UpdateAsync for shared data
`,
  `Here's a melee combat system with hitboxes:

\`\`\`lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RemoteEvents = ReplicatedStorage:WaitForChild("RemoteEvents")

local hitboxRemote = RemoteEvents:WaitForChild("HitboxAttack")
local damageRemote = RemoteEvents:WaitForChild("DealDamage")

local DAMAGE = 25
local COOLDOWN = 0.5
local HITBOX_SIZE = Vector3.new(6, 6, 6)
local playerCooldowns = {}

hitboxRemote.OnServerEvent:Connect(function(player, targetPosition)
    local now = tick()
    if playerCooldowns[player] and now - playerCooldowns[player] < COOLDOWN then
        return
    end
    playerCooldowns[player] = now

    local character = player.Character
    if not character then return end

    local origin = character.HumanoidRootPart.Position
    local direction = (targetPosition - origin).Unit * HITBOX_SIZE.Z

    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = {character}

    local result = workspace:Raycast(origin, direction, params)
    if result and result.Instance then
        local targetChar = result.Instance:FindFirstAncestorOfClass("Model")
        if targetChar and targetChar:FindFirstChild("Humanoid") then
            damageRemote:FireClient(player, targetChar.Name)
        end
    end
end)
\`\`\`
`,
  `Here's a movement controller with sprint and crouch:

\`\`\`lua
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local rootPart = character:WaitForChild("HumanoidRootPart")

local WALK_SPEED = 16
local SPRINT_SPEED = 24
local CROUCH_SPEED = 8
local JUMP_POWER = 50

local isSprinting = false
local isCrouching = false

local function updateSpeed()
    if isCrouching then
        humanoid.WalkSpeed = CROUCH_SPEED
        humanoid.JumpPower = 0
    elseif isSprinting then
        humanoid.WalkSpeed = SPRINT_SPEED
        humanoid.JumpPower = JUMP_POWER
    else
        humanoid.WalkSpeed = WALK_SPEED
        humanoid.JumpPower = JUMP_POWER
    end
end

UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end

    if input.KeyCode == Enum.KeyCode.LeftShift then
        isSprinting = true
        isCrouching = false
        updateSpeed()
    elseif input.KeyCode == Enum.KeyCode.LeftControl then
        isCrouching = true
        isSprinting = false
        updateSpeed()
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.LeftShift then
        isSprinting = false
        updateSpeed()
    elseif input.KeyCode == Enum.KeyCode.LeftControl then
        isCrouching = false
        updateSpeed()
    end
end)
\`\`\`
`,
];

let demoIndex = 0;
let serverAvailable = false;
let currentServerUrl = defaultServerUrl;

function normalizeUrl(value) {
  return value ? value.trim().replace(/\/$/, '') : '';
}

function loadStoredSettings() {
  currentServerUrl = normalizeUrl(storage.getItem(serverUrlKey) || defaultServerUrl);
  if (serverUrlInput) serverUrlInput.value = currentServerUrl;
  if (settingsServerUrlInput) settingsServerUrlInput.value = currentServerUrl;
  if (modelSelect) modelSelect.value = storage.getItem(modelKey) || 'roar-pro';

  const savedTemp = parseFloat(storage.getItem(temperatureKey) || '0.7');
  const savedTokens = parseInt(storage.getItem(tokensKey) || '800', 10) || 800;
  if (tempSlider) tempSlider.value = String(Math.round(savedTemp * 100));
  if (tokensSlider) tokensSlider.value = String(savedTokens);
  if (tempValue) tempValue.textContent = String(savedTemp.toFixed(1));
  if (tokensValue) tokensValue.textContent = String(savedTokens);
}

function saveSettings(serverUrl) {
  const normalizedUrl = normalizeUrl(serverUrl || defaultServerUrl);
  storage.setItem(serverUrlKey, normalizedUrl);
  currentServerUrl = normalizedUrl;
  if (serverUrlInput) serverUrlInput.value = normalizedUrl;
  if (settingsServerUrlInput) settingsServerUrlInput.value = normalizedUrl;
}

function clearStoredSettings() {
  storage.removeItem(serverUrlKey);
  storage.removeItem(modelKey);
  storage.removeItem(temperatureKey);
  storage.removeItem(tokensKey);
  storage.removeItem(seenSetupKey);
  currentServerUrl = defaultServerUrl;
  if (serverUrlInput) serverUrlInput.value = defaultServerUrl;
  if (settingsServerUrlInput) settingsServerUrlInput.value = defaultServerUrl;
  if (modelSelect) modelSelect.value = 'roar-pro';
  if (tempSlider) tempSlider.value = '70';
  if (tokensSlider) tokensSlider.value = '800';
  if (tempValue) tempValue.textContent = '0.7';
  if (tokensValue) tokensValue.textContent = '800';
}

function updateStatus(text, variant = 'normal') {
  if (!statusText || !statusDot) return;
  statusText.textContent = text;
  statusDot.style.background = variant === 'error'
    ? '#ff6b6b'
    : variant === 'warning'
      ? '#febb69'
      : '#7ce5ff';
}

function updateOfflineBanner() {
  if (!offlineBanner) return;
  if (!serverAvailable) {
    offlineBanner.classList.remove('hidden');
    if (offlineBannerText) {
      offlineBannerText.textContent = '⚠️ Local Ollama bridge unavailable. Open settings to configure the bridge URL.';
    }
  } else {
    offlineBanner.classList.add('hidden');
  }
}

function openSetupModal() {
  setupModal?.classList.remove('hidden');
}

function closeSetupModal() {
  setupModal?.classList.add('hidden');
}

function openSettingsPanel() {
  if (settingsServerUrlInput) settingsServerUrlInput.value = currentServerUrl;
  settingsPanel?.classList.remove('hidden');
}

function closeSettingsPanel() {
  settingsPanel?.classList.add('hidden');
}

function showWelcomeScreen() {
  if (welcomeScreen) welcomeScreen.style.display = 'flex';
}

function hideWelcomeScreen() {
  if (welcomeScreen) welcomeScreen.style.display = 'none';
}

function appendMessage(role, text) {
  if (!chatLog) return;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  const roleIcon = role === 'user' ? '👤' : '🤖';
  const roleLabel = role === 'user' ? 'You' : 'ROAR';
  bubble.innerHTML = `
    <div class="bubble-header"><span class="role-icon">${roleIcon}</span><span class="role-label">${roleLabel}</span></div>
    <div class="bubble-content">${formatCode(text)}</div>
  `;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  hideWelcomeScreen();
}

function updateModelCardState() {
  const roarCard = document.querySelector('.model-card[data-model="roar"]');
  const customCard = document.querySelector('.model-card[data-model="custom"]');
  if (!modelSelect || !roarCard || !customCard) return;

  if (modelSelect.value === 'roar-pro') {
    roarCard.classList.add('selected');
    customCard.classList.remove('selected');
    ollamaSelectWrap?.classList.add('hidden');
  } else {
    roarCard.classList.remove('selected');
    customCard.classList.add('selected');
    ollamaSelectWrap?.classList.remove('hidden');
  }
}

function formatCode(text) {
  return text
    .replace(/```lua\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/```luau\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/```\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
  if (typingIndicator) typingIndicator.style.display = 'flex';
}

function hideTypingIndicator() {
  if (typingIndicator) typingIndicator.style.display = 'none';
}

async function checkConnection() {
  serverAvailable = false;

  try {
    const res = await fetch(`${currentServerUrl}/api/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      serverAvailable = true;
      updateStatus('Bridge connected');
    }
  } catch {
    serverAvailable = false;
  }

  if (!serverAvailable) {
    updateStatus('Demo mode', 'warning');
  }

  updateOfflineBanner();
}

async function fetchModels() {
  if (!modelSelect) return;

  if (serverAvailable) {
    try {
      const response = await fetch(`${currentServerUrl}/api/models`);
      const data = await response.json();
      const models = Array.isArray(data.models) ? data.models : fallbackModels.map((m) => m.id);
      modelSelect.innerHTML = models.map((value) => {
        const label = fallbackModels.find((item) => item.id === value)?.name || value;
        return `<option value="${value}">${label}</option>`;
      }).join('');
    } catch {
      modelSelect.innerHTML = fallbackModels.map((model) => `<option value="${model.id}">${model.name}</option>`).join('');
    }
  } else {
    modelSelect.innerHTML = fallbackModels.map((model) => `<option value="${model.id}">${model.name}</option>`).join('');
  }

  const savedModel = storage.getItem(modelKey) || 'roar-pro';
  modelSelect.value = savedModel;
}

async function sendPrompt() {
  const prompt = promptInput?.value.trim();
  if (!prompt) return;

  const model = modelSelect?.value || 'roar-pro';
  const temperature = parseFloat(storage.getItem(temperatureKey) || '0.7');
  const maxTokens = parseInt(storage.getItem(tokensKey) || '800', 10) || 800;

  storage.setItem(modelKey, model);
  storage.setItem(temperatureKey, String(temperature));
  storage.setItem(tokensKey, String(maxTokens));

  appendMessage('user', prompt);
  promptInput.value = '';
  showTypingIndicator();
  updateStatus(serverAvailable ? 'Generating response…' : 'Demo mode');

  if (!serverAvailable) {
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 900));
    const response = demoResponses[demoIndex % demoResponses.length];
    demoIndex += 1;
    hideTypingIndicator();
    appendMessage('ai', response);
    updateStatus('Demo mode', 'warning');
    return;
  }

  try {
    let responseText = 'No response received.';

    const response = await fetch(`${currentServerUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, temperature, max_tokens: maxTokens }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const json = await response.json();
    responseText = json.response || 'No response returned from the bridge.';

    hideTypingIndicator();
    appendMessage('ai', responseText);
    updateStatus('Bridge connected');
  } catch (error) {
    hideTypingIndicator();
    appendMessage('ai', `Error: ${error.message}\n\nConfirm your local Ollama bridge is running at ${currentServerUrl}.`);
    updateStatus('Error', 'error');
    updateOfflineBanner();
  }
}

function handleQuickPrompt(event) {
  const prompt = event.currentTarget.dataset.prompt;
  if (prompt) {
    promptInput.value = prompt;
    sendPrompt();
  }
}

function toggleSidebar() {
  if (!sidebar) return;
  sidebar.classList.toggle('collapsed');
  storage.setItem('roarai-sidebar-collapsed', String(sidebar.classList.contains('collapsed')));
}

function saveSetupHandler() {
  saveSettings(serverUrlInput?.value || '');
  storage.setItem(seenSetupKey, 'true');
  closeSetupModal();
  checkConnection().then(fetchModels);
}

function saveSettingsHandler() {
  const settingsServerUrl = document.getElementById('settings-server-url');
  saveSettings(settingsServerUrl?.value || '');
  closeSettingsPanel();
  checkConnection().then(fetchModels);
}

function clearSettingsHandler() {
  clearStoredSettings();
  closeSettingsPanel();
  openSetupModal();
  updateStatus('Demo mode', 'warning');
  updateOfflineBanner();
  fetchModels();
}

function updateSliderDisplay() {
  if (tempSlider && tempValue) {
    const value = parseFloat(tempSlider.value) / 100;
    tempValue.textContent = value.toFixed(1);
    storage.setItem(temperatureKey, String(value));
  }

  if (tokensSlider && tokensValue) {
    const value = parseInt(tokensSlider.value, 10) || 800;
    tokensValue.textContent = String(value);
    storage.setItem(tokensKey, String(value));
  }
}

function updateCharCount() {
  if (charCount && promptInput) {
    charCount.textContent = `${promptInput.value.length} chars`;
  }
}

function showSetupModalIfNeeded() {
  const hasSeenSetup = storage.getItem(seenSetupKey);
  if (!hasSeenSetup) {
    setTimeout(openSetupModal, 500);
    storage.setItem(seenSetupKey, 'true');
  }
}

refreshButton?.addEventListener('click', fetchModels);
clearButton?.addEventListener('click', () => {
  if (chatLog) chatLog.innerHTML = '';
  showWelcomeScreen();
  updateStatus(serverAvailable ? 'Ready' : 'Demo mode', 'warning');
});
sendButton?.addEventListener('click', sendPrompt);
promptInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
});
promptInput?.addEventListener('input', updateCharCount);
sidebarToggle?.addEventListener('click', toggleSidebar);
newChatBtn?.addEventListener('click', () => {
  if (chatLog) chatLog.innerHTML = '';
  showWelcomeScreen();
  updateStatus(serverAvailable ? 'Ready' : 'Demo mode', 'warning');
});
topbarMenu?.addEventListener('click', toggleSidebar);
setupSaveButton?.addEventListener('click', saveSetupHandler);
setupCloseButton?.addEventListener('click', closeSetupModal);
settingsBtn?.addEventListener('click', openSettingsPanel);
settingsCloseBtn?.addEventListener('click', closeSettingsPanel);
settingsSaveBtn?.addEventListener('click', saveSettingsHandler);
clearSettingsBtn?.addEventListener('click', clearSettingsHandler);
configureButton?.addEventListener('click', openSettingsPanel);
pluginLink?.addEventListener('click', (event) => {
  event.preventDefault();
  pluginModal?.classList.remove('hidden');
});
modelSelect?.addEventListener('change', updateModelCardState);
[...document.querySelectorAll('.model-card')].forEach((card) => {
  card.addEventListener('click', () => {
    const targetModel = card.dataset.model;
    if (!targetModel || !modelSelect) return;

    if (targetModel === 'custom') {
      ollamaSelectWrap?.classList.remove('hidden');
      if (modelSelect.value === 'roar-pro') {
        modelSelect.value = fallbackModels[1]?.id || 'llama3';
      }
    } else {
      modelSelect.value = 'roar-pro';
      ollamaSelectWrap?.classList.add('hidden');
    }
    updateModelCardState();
  });
});
tempSlider?.addEventListener('input', updateSliderDisplay);
tokensSlider?.addEventListener('input', updateSliderDisplay);
[...document.querySelectorAll('.modal-overlay')].forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.classList.add('hidden');
    }
  });
});
[...document.querySelectorAll('.quick-prompt')].forEach((button) => {
  button.addEventListener('click', handleQuickPrompt);
});
[...document.querySelectorAll('.modal-close')].forEach((button) => {
  button.addEventListener('click', () => {
    const parent = button.closest('.modal-overlay');
    if (parent) parent.classList.add('hidden');
  });
});

async function initApp() {
  loadStoredSettings();
  updateModelCardState();
  updateCharCount();
  await checkConnection();
  await fetchModels();
  updateModelCardState();
  if (!serverAvailable) {
    showSetupModalIfNeeded();
  }
}

initApp();
