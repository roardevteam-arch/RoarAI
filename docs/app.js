// ROAR AI - Docs frontend script
// Handles bridge status, setup settings, and fallback demo responses.

const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const modelSelect = document.getElementById('model-select');
const refreshButton = document.getElementById('refresh-models');
const clearButton = document.getElementById('clear-chat-btn');
const sendButton = document.getElementById('send-btn');
const chatLog = document.getElementById('messages');
const promptInput = document.getElementById('prompt-input');
const typingIndicator = document.getElementById('typing-indicator');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const newChatBtn = document.getElementById('new-chat-btn');
const topbarMenu = document.getElementById('topbar-menu');
const pluginModal = document.getElementById('plugin-modal');
const welcomeScreen = document.getElementById('welcome-screen');
const setupModal = document.getElementById('setup-modal');
const setupSaveButton = document.getElementById('setup-save-btn');
const setupCloseButton = document.getElementById('setup-close-btn');
const serverUrlInput = document.getElementById('server-url-input');
const settingsPanel = document.getElementById('settings-panel');
const settingsBtn = document.getElementById('settings-btn');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const settingsSaveBtn = document.getElementById('settings-save-btn');
const clearSettingsBtn = document.getElementById('settings-clear-btn');
const settingsServerUrlInput = document.getElementById('settings-server-url');
const tempSlider = document.getElementById('temp-slider');
const tokensSlider = document.getElementById('tokens-slider');
const tempValue = document.getElementById('temp-value');
const tokensValue = document.getElementById('tokens-value');
const charCount = document.getElementById('char-count');
const ollamaSelectWrap = document.getElementById('ollama-select-wrap');
const offlineBanner = document.getElementById('offline-banner');
const configureButton = document.getElementById('configure-btn');
const pluginLink = document.getElementById('plugin-link');
const offlineBannerText = document.getElementById('offline-banner-text');

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
