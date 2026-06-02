const statusEl = document.getElementById('status-pill');
const modelSelect = document.getElementById('model-select');
const refreshButton = document.getElementById('refresh-models');
const clearButton = document.getElementById('clear-chat');
const sendButton = document.getElementById('send-button');
const chatLog = document.getElementById('chat-log');
const promptInput = document.getElementById('prompt-input');

const localApi = window.location.origin;
const storedModel = localStorage.getItem('roarai-model');

const fallbackModels = [
  'llama2',
  'mistral',
  'wizardLM',
  'guanaco',
  'llama3',
];

function updateStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#ffd0d0' : '#7ce5ff';
}

function appendMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `<strong>${role === 'user' ? 'You' : 'RoarAI'}</strong><p>${text.replace(/\n/g, '<br>')}</p>`;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function fetchModels() {
  updateStatus('Loading models...');
  try {
    const res = await fetch(`${localApi}/api/models`);
    const json = await res.json();
    const models = Array.isArray(json.models) && json.models.length ? json.models : fallbackModels;
    modelSelect.innerHTML = models.map((model) => `<option value="${model}">${model}</option>`).join('');

    if (storedModel && models.includes(storedModel)) {
      modelSelect.value = storedModel;
    }

    updateStatus('Ready');
  } catch (error) {
    updateStatus('Local bridge unavailable', true);
    modelSelect.innerHTML = fallbackModels.map((model) => `<option value="${model}">${model}</option>`).join('');
  }
}

async function sendPrompt() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  const model = modelSelect.value;
  localStorage.setItem('roarai-model', model);
  appendMessage('user', prompt);
  promptInput.value = '';
  updateStatus('Waiting for response...');

  try {
    const res = await fetch(`${localApi}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt }),
    });

    if (!res.ok) {
      throw new Error(`Server ${res.status}`);
    }

    const json = await res.json();
    const answer = json.response || 'No response received.';
    appendMessage('ai', answer);
    updateStatus('Ready');
  } catch (error) {
    appendMessage('ai', `Error: ${error.message}`);
    updateStatus('Bridge error', true);
  }
}

refreshButton.addEventListener('click', fetchModels);
clearButton.addEventListener('click', () => {
  chatLog.innerHTML = '';
  updateStatus('Chat cleared');
});
sendButton.addEventListener('click', sendPrompt);
promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendPrompt();
  }
});

fetchModels();
