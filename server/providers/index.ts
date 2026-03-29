// Re-export types
export type { GeminiFunctionDecl, GeminiResponse, ThinkingLevel } from './gemini.js';
export type { GeminiExtendedConfig } from '../../src/types/index.js';

// Re-export from gemini.js
export {
  GEMINI_SAFETY,
  callGeminiAPI,
  getGeminiModels,
  buildGeminiRequest,
  parseGeminiResponse,
  convertToGeminiFormat,
  ALL_GAME_FUNCTIONS,
  ROLL_FUNCTIONS,
  GAME_FUNCTIONS,
  // Space bypass
  SPACE_BYPASS_CHAR,
  encodeSpaces,
  decodeSpaces,
  applySpaceBypass,
} from './gemini.js';

// DeepSeek provider
export interface DeepSeekConfig {
  baseUrl: string;
  apiKey: string;
  model: 'deepseek-chat' | 'deepseek-reasoner';
  maxTokens: number;
  temperature: number;
}

export async function callDeepSeek(
  messages: { role: string; content: string }[],
  config: DeepSeekConfig,
  onStream?: (chunk: string) => void
): Promise<{ text: string; reasoning?: string; usage?: any }> {
  const url = `${config.baseUrl}/chat/completions`;
  
  // DeepSeek reasoner outputs reasoning in a separate field
  const isReasoner = config.model === 'deepseek-reasoner';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: !!onStream,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`DeepSeek error: ${response.status} ${await response.text()}`);
  }
  
  if (onStream) {
    // Handle streaming
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let fullReasoning = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          if (jsonStr.trim() === '[DONE]') continue;
          
          try {
            const data = JSON.parse(jsonStr);
            const delta = data.choices?.[0]?.delta;
            if (delta?.content) {
              fullText += delta.content;
              onStream(delta.content);
            }
            if (delta?.reasoning_content) {
              fullReasoning += delta.reasoning_content;
            }
          } catch {}
        }
      }
    }
    
    return { text: fullText, reasoning: fullReasoning };
  }
  
  const data = await response.json();
  
  return {
    text: data.choices[0].message.content,
    reasoning: data.choices[0].message.reasoning_content,
    usage: data.usage,
  };
}

// OpenAI-compatible provider (generic)
export async function callOpenAICompatible(
  messages: { role: string; content: string }[],
  config: { baseUrl: string; apiKey: string; model: string; maxTokens: number; temperature: number }
): Promise<{ text: string; usage?: any }> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${await response.text()}`);
  }
  
  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    usage: data.usage,
  };
}
