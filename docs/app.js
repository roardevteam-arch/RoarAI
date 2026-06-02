// ROAR AI - Web Console
// Specialized AI for Roblox Luau Development

const statusEl = document.getElementById('status-pill');
const modelSelect = document.getElementById('model-select');
const refreshButton = document.getElementById('refresh-models');
const clearButton = document.getElementById('clear-chat');
const sendButton = document.getElementById('send-button');
const chatLog = document.getElementById('chat-log');
const promptInput = document.getElementById('prompt-input');
const typingIndicator = document.getElementById('typing-indicator');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const pluginModal = document.getElementById('plugin-modal');
const welcomeScreen = document.getElementById('welcome-screen');
const temperatureSlider = document.getElementById('temperature-slider');
const temperatureValue = document.getElementById('temperature-value');
const maxTokensSlider = document.getElementById('max-tokens-slider');
const maxTokensValue = document.getElementById('max-tokens-value');

const localApi = window.location.origin;
const storedModel = localStorage.getItem('roarai-model') || 'roar-pro';

const fallbackModels = [
  { id: 'roar-pro', name: 'ROAR PRO', description: 'Specialized for Roblox Luau' },
  { id: 'llama3', name: 'Ollama - Llama 3', description: 'General purpose' },
  { id: 'codellama', name: 'Ollama - Code Llama', description: 'Code focused' },
];

function updateStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#ff6b6b' : '#7ce5ff';
}

function appendMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  const roleLabel = role === 'user' ? 'You' : 'RoarAI';
  const roleIcon = role === 'user' ? '🐺' : '🎯';
  bubble.innerHTML = `<div class="bubble-header"><span class="role-icon">${roleIcon}</span><span class="role-label">${roleLabel}</span></div><div class="bubble-content">${formatCode(text)}</div>`;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  
  // Hide welcome screen on first message
  if (welcomeScreen) {
    welcomeScreen.style.display = 'none';
  }
}

function formatCode(text) {
  // Format code blocks with syntax highlighting
  return text
    .replace(/```lua\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/```luau\n([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.style.display = 'flex';
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function hideTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.style.display = 'none';
  }
}

async function fetchModels() {
  updateStatus('Loading models...');
  try {
    const res = await fetch(`${localApi}/api/models`);
    const json = await res.json();
    
    if (Array.isArray(json.models) && json.models.length) {
      const ollamaModels = json.models.map(m => ({
        id: m.name || m,
        name: `Ollama - ${m.name || m}`,
        description: 'Local model'
      }));
      
      modelSelect.innerHTML = fallbackModels.map(m => 
        `<option value="${m.id}">${m.name}</option>`
      ).join('');
      
      ollamaModels.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.name;
        modelSelect.appendChild(option);
      });
    } else {
      modelSelect.innerHTML = fallbackModels.map(m => 
        `<option value="${m.id}">${m.name}</option>`
      ).join('');
    }

    if (storedModel) {
      modelSelect.value = storedModel;
    }

    updateStatus('Ready');
  } catch (error) {
    updateStatus('Local bridge unavailable', true);
    modelSelect.innerHTML = fallbackModels.map(m => 
      `<option value="${m.id}">${m.name}</option>`
    ).join('');
  }
}

async function sendPrompt() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  const model = modelSelect.value;
  const temperature = parseFloat(temperatureSlider?.value || 0.7);
  const maxTokens = parseInt(maxTokensSlider?.value || 2048);
  
  localStorage.setItem('roarai-model', model);
  localStorage.setItem('roarai-temperature', temperature);
  localStorage.setItem('roarai-max-tokens', maxTokens);
  
  appendMessage('user', prompt);
  promptInput.value = '';
  showTypingIndicator();
  updateStatus('Generating...');

  try {
    const res = await fetch(`${localApi}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model, 
        prompt,
        temperature,
        max_tokens: maxTokens
      }),
    });

    if (!res.ok) {
      throw new Error(`Server ${res.status}`);
    }

    const json = await res.json();
    const answer = json.response || 'No response received.';
    hideTypingIndicator();
    appendMessage('ai', answer);
    updateStatus('Ready');
  } catch (error) {
    hideTypingIndicator();
    appendMessage('ai', `Error: ${error.message}`);
    updateStatus('Bridge error', true);
  }
}

function sendQuickPrompt(prompt) {
  promptInput.value = prompt;
  sendPrompt();
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem('roarai-sidebar-collapsed', isCollapsed);
}

function openPluginModal() {
  if (pluginModal) {
    pluginModal.style.display = 'flex';
  }
}

function closePluginModal() {
  if (pluginModal) {
    pluginModal.style.display = 'none';
  }
}

// Event Listeners
refreshButton.addEventListener('click', fetchModels);
clearButton.addEventListener('click', () => {
  chatLog.innerHTML = '';
  if (welcomeScreen) {
    welcomeScreen.style.display = 'flex';
  }
  updateStatus('Chat cleared');
});
sendButton.addEventListener('click', sendPrompt);
promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
});

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', toggleSidebar);
}

// Settings sliders
if (temperatureSlider) {
  temperatureSlider.addEventListener('input', () => {
    temperatureValue.textContent = temperatureSlider.value;
  });
}

if (maxTokensSlider) {
  maxTokensSlider.addEventListener('input', () => {
    maxTokensValue.textContent = maxTokensSlider.value;
  });
}

// Quick prompts
document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt;
    if (prompt) sendQuickPrompt(prompt);
  });
});

// Plugin modal close
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', closePluginModal);
});

// Close modal on outside click
if (pluginModal) {
  pluginModal.addEventListener('click', (e) => {
    if (e.target === pluginModal) {
      closePluginModal();
    }
  });
}

// Restore settings from localStorage
const storedTemp = localStorage.getItem('roarai-temperature');
const storedMaxTokens = localStorage.getItem('roarai-max-tokens');
const sidebarCollapsed = localStorage.getItem('roarai-sidebar-collapsed') === 'true';

if (sidebarCollapsed && sidebar) {
  sidebar.classList.add('collapsed');
}

if (storedTemp && temperatureSlider) {
  temperatureSlider.value = storedTemp;
  temperatureValue.textContent = storedTemp;
}

if (storedMaxTokens && maxTokensSlider) {
  maxTokensSlider.value = storedMaxTokens;
  maxTokensValue.textContent = storedMaxTokens;
}

// Initialize
fetchModels();
