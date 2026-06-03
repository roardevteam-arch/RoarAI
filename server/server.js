const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const requestTimeout = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
const nodeEnv = process.env.NODE_ENV || 'development';

// Logger utility
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  debug: (msg) => nodeEnv === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`),
};

// Fetch wrapper with timeout and error handling
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (error) {
    logger.error('No fetch API available. Use Node 18+ or install node-fetch.');
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '1mb' }));
app.use(express.static(path.join(__dirname, '../docs')));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(requestTimeout, () => {
    logger.warn(`Request timeout: ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  next();
});

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
- Common frameworks and design patterns (MVC, service modules, remotes)

When providing code:
- Use proper Luau syntax with type annotations where helpful
- Include comments explaining key sections
- Follow Roblox best practices (e.g., use WaitForChild, validate client input)
- Format code blocks clearly with syntax highlighting

Be concise but thorough. Prioritize safe, performant, and maintainable solutions.`;

// Fetch wrapper with timeout and proper error handling
async function fetchOllama(pathSuffix, body = null, method = 'POST') {
  const url = `${ollamaHost}${pathSuffix}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    timeout: requestTimeout,
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await Promise.race([
      fetchFn(url, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), requestTimeout)
      )
    ]);

    if (!response.ok && response.status !== 200) {
      logger.warn(`Ollama returned ${response.status} for ${pathSuffix}`);
    }

    const payload = await response.text();
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  } catch (error) {
    logger.error(`Fetch error: ${error.message}`);
    throw error;
  }
}

// Health check for Ollama
async function probeOllama() {
  try {
    const result = await fetchOllama('/api/tags', null, 'GET');
    if (result?.models !== undefined) {
      return true;
    }
  } catch {
    // Try alternative endpoint
    try {
      await fetchOllama('/v1/models', null, 'GET');
      return true;
    } catch (error) {
      logger.debug(`Ollama probe failed: ${error.message}`);
    }
  }
  return false;
}

// API Routes

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', async (req, res) => {
  try {
    const healthy = await probeOllama();
    res.json({
      status: 'ok',
      version: '1.0.0',
      ollamaHost,
      healthy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Status check failed: ${error.message}`);
    res.status(500).json({ error: 'Status check failed' });
  }
});

app.get('/api/models', async (req, res) => {
  try {
    let result = null;

    // Try /api/tags endpoint (newer Ollama)
    try {
      result = await fetchOllama('/api/tags', null, 'GET');
      if (result?.models && Array.isArray(result.models)) {
        const models = result.models.map((m) => m.name || m.id || m);
        logger.debug(`Retrieved ${models.length} models from /api/tags`);
        return res.json({ models, source: 'ollama' });
      }
    } catch (e) {
      logger.debug(`/api/tags failed, trying alternative: ${e.message}`);
    }

    // Try /v1/models endpoint
    try {
      result = await fetchOllama('/v1/models', null, 'GET');
      if (result?.data && Array.isArray(result.data)) {
        const models = result.data.map((m) => m.id || m.name || m);
        logger.debug(`Retrieved ${models.length} models from /v1/models`);
        return res.json({ models, source: 'ollama' });
      }
      if (Array.isArray(result?.models)) {
        const models = result.models.map((m) => m.name || m.id || m);
        return res.json({ models, source: 'ollama' });
      }
    } catch (e) {
      logger.debug(`/v1/models failed: ${e.message}`);
    }

    // Fallback to demo models
    logger.warn('Unable to fetch models from Ollama, using fallback');
    res.json({ models: fallbackModels, source: 'fallback' });
  } catch (error) {
    logger.error(`Models endpoint error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch models', models: fallbackModels });
  }
});

app.post('/api/chat', async (req, res) => {
  const { model, prompt, temperature, max_tokens } = req.body || {};

  if (!model || !prompt) {
    return res.status(400).json({ error: 'Missing model or prompt.' });
  }

  if (prompt.length > 10000) {
    return res.status(400).json({ error: 'Prompt too long (max 10000 chars).' });
  }

  logger.debug(`Chat request: model=${model}, prompt_len=${prompt.length}`);

  try {
    const payload = {
      model,
      messages: [
        { role: 'system', content: roarSystemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: Math.min(Number(max_tokens) || 800, 4096),
      temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
      stream: false,
    };

    const result = await fetchOllama('/v1/chat/completions', payload);

    if (result?.choices?.length > 0) {
      const response = result.choices[0].message?.content || result.choices[0].text || '';
      logger.debug(`Chat response received: ${response.length} chars`);
      return res.json({ response });
    }

    if (result?.output) {
      logger.debug(`Chat response (via output): ${String(result.output).length} chars`);
      return res.json({ response: String(result.output) });
    }

    logger.error('Unexpected Ollama response format');
    res.status(502).json({ error: 'Unexpected response format from Ollama.' });
  } catch (error) {
    logger.error(`Chat request failed: ${error.message}`);
    res.status(503).json({
      error: 'Unable to reach Ollama. Ensure Ollama is running and OLLAMA_HOST is set correctly.',
      hint: `Expected Ollama at: ${ollamaHost}`,
    });
  }
});

app.post('/api/roblox', async (req, res) => {
  const body = req.body || {};
  const prompt = (body.prompt || 'Please analyze this Roblox Studio selection with best practice guidance.').slice(0, 10000);
  const model = body.model || 'roar-pro';
  const source = body.source || 'roblox';

  logger.debug(`Roblox API request: model=${model}, source=${source}`);

  try {
    const input = `${source === 'roblox' ? 'Roblox Studio data:' : 'Prompt:'}\n${prompt}`;
    const payload = {
      model,
      messages: [
        { role: 'system', content: roarSystemPrompt },
        { role: 'user', content: input },
      ],
      max_tokens: 1024,
      temperature: 0.8,
    };

    const result = await fetchOllama('/v1/chat/completions', payload);
    const response = result?.choices?.[0]?.message?.content || 
                   result?.choices?.[0]?.text || 
                   (result?.output ? String(result.output) : 'No answer from Ollama.');
    
    logger.debug(`Roblox API response: ${response.length} chars`);
    res.json({ response });
  } catch (error) {
    logger.error(`Roblox API error: ${error.message}`);
    res.status(503).json({ error: 'Roblox AI request failed.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    error: 'Internal server error',
    message: nodeEnv === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(port, () => {
  logger.info(`ROAR AI bridge started`);
  logger.info(`Server running at http://127.0.0.1:${port}`);
  logger.info(`Ollama host: ${ollamaHost}`);
  logger.info(`Environment: ${nodeEnv}`);
  logger.info(`Request timeout: ${requestTimeout}ms`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 5000);
});

module.exports = app;

