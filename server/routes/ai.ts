import { Router } from 'express';
import { getDb, run, all } from '../database/db.js';
import type { AIConfig, AIMessage, GeminiExtendedConfig } from '../../src/types/index.js';
import {
  callGeminiAPI,
  getGeminiModels,
  parseGeminiResponse,
  GEMINI_SAFETY,
  ALL_GAME_FUNCTIONS,
  ROLL_FUNCTIONS,
  GAME_FUNCTIONS,
} from '../providers/gemini.js';

const router = Router();

// Call AI with proper provider handling
async function callAI(
  messages: AIMessage[],
  config: AIConfig & Partial<GeminiExtendedConfig>,
  onStream?: (chunk: string, thoughts?: string) => void
): Promise<{ text: string; thoughts?: string; usage?: any }> {
  // Determine provider type
  const isGemini = config.provider === 'gemini' || 
                   config.provider === 'vertexai' ||
                   config.baseUrl.includes('smolproxy.org/google') ||
                   config.model.includes('gemini');
  
  const isDeepSeek = config.baseUrl.includes('deepseek');
  
  if (isGemini) {
    // Use Gemini provider
    const geminiConfig: GeminiExtendedConfig = {
      ...config,
      provider: config.baseUrl.includes('smolproxy') ? 'gemini' : config.provider,
    };
    
    const result = await callGeminiAPI(messages, geminiConfig, onStream);
    return {
      text: result.text,
      thoughts: result.thoughts,
      usage: result.usageMetadata,
    };
  }
  
  // OpenAI-compatible API (DeepSeek, SmolProxy OpenAI, etc.)
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status} ${await response.text()}`);
  }
  
  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    usage: data.usage,
  };
}

// POST /api/ai/chat - Standard chat (always uses reasoning for Gemini)
router.post('/chat', async (req, res) => {
  const { messages, config, stream } = req.body;
  
  // Ensure thinkingLevel is set for Gemini models
  const isGemini = config.provider === 'gemini' || 
                   config.baseUrl.includes('smolproxy.org/google') ||
                   config.model.includes('gemini');
  
  const enhancedConfig = { ...config };
  if (isGemini && !config.thinkingLevel) {
    enhancedConfig.thinkingLevel = 'high';
  }
  
  try {
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const result = await callAI(messages, enhancedConfig, (chunk, thoughts) => {
        const data = JSON.stringify({ chunk, thoughts });
        res.write(`data: ${data}\n\n`);
      });
      
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      const result = await callAI(messages, enhancedConfig);
      res.json({ 
        response: result.text,
        thoughts: result.thoughts,
        usage: result.usage,
      });
    }
  } catch (error: any) {
    console.error('AI Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat/reasoning - Chat with explicit reasoning (deprecated - reasoning always on for Gemini)
router.post('/chat/reasoning', async (req, res) => {
  const { messages, config } = req.body;
  
  // Just use the same logic as regular chat - reasoning is always on
  const enhancedConfig = {
    ...config,
    thinkingLevel: config.thinkingLevel ?? 'high',
    showThoughts: true,
  };
  
  try {
    const result = await callAI(messages, enhancedConfig);
    res.json({
      response: result.text,
      thoughts: result.thoughts,
      usage: result.usage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat/function-calling - Chat with function calling
router.post('/chat/function-calling', async (req, res) => {
  const { messages, config, functions } = req.body;
  
  const enhancedConfig = {
    ...config,
    functionCalling: true,
    functionDeclarations: functions || ALL_GAME_FUNCTIONS,
  };
  
  try {
    const result = await callAI(messages, enhancedConfig);
    res.json({
      response: result.text,
      usage: result.usage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat/web-search - Chat with web search
router.post('/chat/web-search', async (req, res) => {
  const { messages, config } = req.body;
  
  const enhancedConfig = {
    ...config,
    enableWebSearch: true,
  };
  
  try {
    const result = await callAI(messages, enhancedConfig);
    res.json({
      response: result.text,
      usage: result.usage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/generate-character - Generate character via AI
router.post('/generate-character', async (req, res) => {
  const { prompt, config } = req.body;
  
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a character generator for a text-based RPG. Generate a character based on the user's description.
Return ONLY a valid JSON object (no markdown, no code blocks) with exactly these fields:
{
  "name": "Character name",
  "description": "Brief description",
  "personality": "Personality traits",
  "appearance": "Physical appearance",
  "background": "Backstory",
  "stats": {
    "strength": <1-20>,
    "agility": <1-20>,
    "intelligence": <1-20>,
    "charisma": <1-20>,
    "willpower": <1-20>
  }
}
Be creative and detailed.`,
    },
    { role: 'user', content: prompt },
  ];
  
  try {
    const result = await callAI(messages, config);
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const character = JSON.parse(jsonMatch[0]);
      res.json({ character, raw: result.text });
    } else {
      res.json({ character: null, raw: result.text });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/generate-location - Generate location via AI
router.post('/generate-location', async (req, res) => {
  const { prompt, parentLocation, config } = req.body;
  
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a location generator for a text-based RPG. Generate a location based on the user's description.
${parentLocation ? `Parent location: ${parentLocation}` : ''}
Return ONLY a valid JSON object with exactly these fields:
{
  "name": "Location name",
  "description": "Atmospheric description (2-3 sentences)",
  "type": "one of: world, region, city, district, building, room, outdoor, dungeon",
  "connections": ["array of connected location names (can be empty)"]
}`,
    },
    { role: 'user', content: prompt },
  ];
  
  try {
    const result = await callAI(messages, config);
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const location = JSON.parse(jsonMatch[0]);
      res.json({ location, raw: result.text });
    } else {
      res.json({ location: null, raw: result.text });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/generate-event - Generate event via AI
router.post('/generate-event', async (req, res) => {
  const { prompt, context, config } = req.body;
  
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are an event generator for a text-based RPG. Generate an event based on the user's description.
${context ? `Current context: ${JSON.stringify(context)}` : ''}
Return ONLY a valid JSON object with exactly these fields:
{
  "name": "Event name",
  "description": "What happens",
  "type": "one of: quest, random, story, daily",
  "choices": [
    {"id": "choice1", "text": "What player can do"},
    {"id": "choice2", "text": "Another option"}
  ]
}
Make the event interesting with 2-4 meaningful choices.`,
    },
    { role: 'user', content: prompt },
  ];
  
  try {
    const result = await callAI(messages, config);
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const event = JSON.parse(jsonMatch[0]);
      res.json({ event, raw: result.text });
    } else {
      res.json({ event: null, raw: result.text });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/generate-image - Generate image via Gemini
router.post('/generate-image', async (req, res) => {
  const { prompt, config } = req.body;
  
  const enhancedConfig: GeminiExtendedConfig = {
    ...config,
    responseModalities: ['TEXT', 'IMAGE'],
  };
  
  const messages: AIMessage[] = [
    {
      role: 'user',
      content: `Generate an image: ${prompt}`,
    },
  ];
  
  try {
    const result = await callAI(messages, enhancedConfig);
    res.json({
      response: result.text,
      usage: result.usage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/models - Get available models
router.get('/models', async (req, res) => {
  const { provider, baseUrl, apiKey } = req.query;
  
  // Handle query params - extract string from string | string[] | ParsedQs | ParsedQs[]
  const getStringParam = (param: unknown): string => {
    if (typeof param === 'string') return param;
    if (Array.isArray(param) && typeof param[0] === 'string') return param[0];
    return '';
  };
  
  const providerStr = getStringParam(provider);
  const baseUrlStr = getStringParam(baseUrl);
  const apiKeyStr = getStringParam(apiKey);
  
  try {
    if (providerStr === 'gemini' || baseUrlStr.includes('google')) {
      const models = await getGeminiModels({
        provider: (providerStr || 'gemini') as AIConfig['provider'],
        baseUrl: baseUrlStr,
        apiKey: apiKeyStr,
        model: '',
        maxTokens: 0,
        temperature: 0,
      });
      res.json({ models });
    } else {
      // OpenAI-compatible models endpoint
      const response = await fetch(`${baseUrlStr}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKeyStr}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      res.json({ models: data.data?.map((m: any) => m.id) || [] });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/configs - List saved AI configs
router.get('/configs', async (req, res) => {
  await getDb();
  const configs = all('SELECT id, name, provider, base_url, model, is_default FROM ai_configs');
  res.json(configs);
});

// POST /api/ai/configs - Save AI config
router.post('/configs', async (req, res) => {
  await getDb();
  const { id, name, provider, baseUrl, apiKey, model, maxTokens, temperature, isDefault } = req.body;
  
  if (isDefault) {
    run('UPDATE ai_configs SET is_default = 0');
  }
  
  run(
    `INSERT OR REPLACE INTO ai_configs (id, name, provider, base_url, api_key, model, max_tokens, temperature, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, provider, baseUrl, apiKey, model, maxTokens || 4096, temperature || 0.7, isDefault ? 1 : 0]
  );
  
  res.json({ message: 'Config saved' });
});

// GET /api/ai/functions - Get available function definitions
router.get('/functions', (req, res) => {
  res.json({
    functions: ALL_GAME_FUNCTIONS,
    categories: {
      rolls: ROLL_FUNCTIONS,
      game: GAME_FUNCTIONS,
    },
  });
});

export default router;
