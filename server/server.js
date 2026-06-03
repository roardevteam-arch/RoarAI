const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (error) {
    console.error('No fetch API available in this Node runtime. Use Node 18+ or install node-fetch.');
    process.exit(1);
  }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../docs')));

const fallbackModels = [
  'roar-pro',
  'llama3',
  'codellama',
  'mistral',
  'llama2',
];

const roarSystemPrompt = `You are ROAR (Roblox Optimized Assistant & Resource), an expert AI assistant specializing in Roblox Luau game development. You have deep knowledge of:

- Roblox Studio interface, tools, and workflows
- Luau scripting syntax, best practices, and idioms
- Game architecture patterns (DataStoreService, RemoteEvents, Physics, Pathfinding)
- Performance optimization for Roblox (Instance pooling, LOD, streaming)
- Security best practices (client/server validation, exploit mitigation)
- Common frameworks and design patterns ( MVC, service modules, remotes)

When providing code:
- Use proper Luau syntax with type annotations where helpful
- Include comments explaining key sections
- Follow Roblox best practices (e.g., use WaitForChild, validate client input)
- Format code blocks clearly with syntax highlighting

Be concise but thorough. Prioritize safe, performant, and maintainable solutions.`;

async function fetchOllama(pathSuffix, body = null, method = 'POST') {
  const url = `${ollamaHost}${pathSuffix}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetchFn(url, options);
  const payload = await response.text();
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

async function probeOllama() {
  try {
    const result = await fetchOllama('/v1/models', null, 'GET');
    if (Array.isArray(result?.data) || Array.isArray(result) || Array.isArray(result?.models)) {
      return true;
    }
  } catch (error) {
    console.warn('Ollama probe failed:', error.message || error);
  }
  return false;
}

app.get('/api/status', async (req, res) => {
  const healthy = await probeOllama();
  res.json({ status: 'ok', version: '1.0.0', ollamaHost, healthy });
});

app.get('/api/models', async (req, res) => {
  try {
    let result = await fetchOllama('/v1/models', null, 'GET');

    if (result?.data && Array.isArray(result.data)) {
      return res.json({ models: result.data.map((model) => model.id || model.name || model) });
    }

    if (Array.isArray(result)) {
      return res.json({ models: result.map((model) => model.name || model.id || model) });
    }

    if (Array.isArray(result?.models)) {
      return res.json({ models: result.models.map((model) => model.name || model.id || model) });
    }

    result = await fetchOllama('/api/models', {}, 'POST');
    if (Array.isArray(result)) {
      return res.json({ models: result.map((model) => model.name || model.id || model) });
    }
    if (Array.isArray(result?.models)) {
      return res.json({ models: result.models.map((model) => model.name || model.id || model) });
    }
  } catch (error) {
    console.warn('Ollama models fetch failed:', error.message || error);
  }
  res.json({ models: fallbackModels });
});

app.post('/api/chat', async (req, res) => {
  const { model, prompt, temperature, max_tokens } = req.body || {};
  if (!model || !prompt) {
    return res.status(400).json({ error: 'Missing model or prompt.' });
  }

  try {
    const payload = {
      model,
      messages: [
        { role: 'system', content: roarSystemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: Number(max_tokens) || 600,
      temperature: Number(temperature) || 0.9,
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
    console.error('Chat request failed:', error.message || error);
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
        { role: 'system', content: roarSystemPrompt },
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
  console.log(`ROAR AI bridge running at http://127.0.0.1:${port}`);
  console.log(`Using Ollama host: ${ollamaHost}`);
});
