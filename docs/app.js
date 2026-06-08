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
  `Here's a movement controller with sprint and crouch:\n\n\`\`\`lua\nlocal Players = game:GetService("Players")\nlocal UserInputService = game:GetService("UserInputService")\n\nlocal player = Players.LocalPlayer\nlocal character = player.Character or player.CharacterAdded:Wait()\nlocal humanoid = character:WaitForChild("Humanoid")\n\nlocal WALK_SPEED = 16\nlocal SPRINT_SPEED = 24\nlocal CROUCH_SPEED = 8\nlocal isSprinting = false\nlocal isCrouching = false\n\nlocal function updateSpeed()\n    if isCrouching then\n        humanoid.WalkSpeed = CROUCH_SPEED\n    elseif isSprinting then\n        humanoid.WalkSpeed = SPRINT_SPEED\n    else\n        humanoid.WalkSpeed = WALK_SPEED\n    end\nend\n\nUserInputService.InputBegan:Connect(function(input, processed)\n    if processed then return end\n    if input.KeyCode == Enum.KeyCode.LeftShift then\n        isSprinting = true\n        isCrouching = false\n        updateSpeed()\n    elseif input.KeyCode == Enum.KeyCode.LeftControl then\n        isCrouching = true\n        isSprinting = false\n        updateSpeed()\n    end\nend)\n\nUserInputService.InputEnded:Connect(function(input)\n    if input.KeyCode == Enum.KeyCode.LeftShift then\n        isSprinting = false\n        updateSpeed()\n    elseif input.KeyCode == Enum.KeyCode.LeftControl then\n        isCrouching = false\n        updateSpeed()\n    end\nend)\n\`\`\``,
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
  updateCharCount();
  showTypingIndicator();
  updateStatus(state.serverAvailable ? 'Generating response...' : 'Demo mode');

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
    appendMessage('roar', `Error: ${error.message}\n\nMake sure Ollama is running at ${state.currentServerUrl}`);
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
  updateStatus(state.serverAvailable ? 'Ready' : 'Demo mode', state.serverAvailable ? 'normal' : 'warning');
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
