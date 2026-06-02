const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../docs')));

const fallbackModels = [
  'llama2',
  'mistral',
  'wizardLM',
  'guanaco',
  'llama3',
];

async function fetchOllama(pathSuffix, body) {
  const url = `${ollamaHost}${pathSuffix}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', ollamaHost });
});

app.get('/api/models', async (req, res) => {
  try {
    const result = await fetchOllama('/api/models', {});
    if (Array.isArray(result)) {
      return res.json({ models: result.map((model) => model.name || model) });
    }
    if (Array.isArray(result.models)) {
      return res.json({ models: result.models.map((model) => model.name || model) });
    }
  } catch (error) {
    console.warn('Ollama models fetch failed:', error.message);
  }
  res.json({ models: fallbackModels });
});

app.post('/api/chat', async (req, res) => {
  const { model, prompt } = req.body || {};
  if (!model || !prompt) {
    return res.status(400).json({ error: 'Missing model or prompt.' });
  }

  try {
    const payload = {
      model,
      messages: [
        { role: 'system', content: 'You are a specialized Roblox AI assistant. Answer clearly and keep code snippets concise.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.9,
    };

    const result = await fetchOllama('/v1/chat/completions', payload);
    if (result?.choices?.length) {
      return res.json({ response: result.choices[0].message?.content || result.choices[0].text || '' });
    }

    if (result?.output) {
      return res.json({ response: String(result.output) });
    }

    res.status(502).json({ error: 'Unexpected Ollama response.' });
  } catch (error) {
    console.error('Chat request failed:', error.message);
    res.status(500).json({ error: 'Unable to reach Ollama. Start Ollama and verify `OLLAMA_HOST` if needed.' });
  }
});

app.post('/api/roblox', async (req, res) => {
  const body = req.body || {};
  const prompt = body.prompt || 'Please analyze this Roblox Studio selection with best practice guidance.';
  const model = body.model || 'llama2';
  const source = body.source || 'roblox';

  try {
    const input = `${source === 'roblox' ? 'Roblox Studio data:' : 'Prompt:'}\n${prompt}`;
    const payload = {
      model,
      messages: [
        { role: 'system', content: 'You are a Roblox Studio AI assistant. Provide concise, actionable advice.' },
        { role: 'user', content: input },
      ],
      max_tokens: 600,
      temperature: 0.85,
    };

    const result = await fetchOllama('/v1/chat/completions', payload);
    const response = result?.choices?.[0]?.message?.content || result?.choices?.[0]?.text || 'No answer from Ollama.';
    res.json({ response });
  } catch (error) {
    console.error('Roblox API error:', error.message);
    res.status(500).json({ error: 'Roblox AI request failed.' });
  }
});

app.listen(port, () => {
  console.log(`RoarAI bridge running at http://127.0.0.1:${port}`);
  console.log(`Using Ollama host: ${ollamaHost}`);
});
