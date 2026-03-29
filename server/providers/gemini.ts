/**
 * Gemini AI Provider
 * Based on SillyTavern's implementation
 * https://github.com/SillyTavern/SillyTavern/blob/release/src/endpoints/google.js
 * 
 * Features:
 * - Reasoning/thinking support
 * - Function calling (tool declarations)
 * - Web search via google_search tool
 * - Image generation via responseModalities
 * - Streaming SSE support
 * - Space bypass (U+3164) for content filtering evasion
 */

import type { AIMessage, AIConfig, GeminiExtendedConfig } from '../../src/types/index.js';

// Space bypass character - U+3164 (HANGUL FILLER)
// Looks like a space but bypasses content filters
export const SPACE_BYPASS_CHAR = '\u3164'; // ㅤ

/**
 * Encode spaces to bypass character
 * Replaces regular spaces with U+3164 to evade content filters
 */
export function encodeSpaces(text: string): string {
  return text.replace(/ /g, SPACE_BYPASS_CHAR);
}

/**
 * Decode bypass character back to regular spaces
 * For displaying to the user
 */
export function decodeSpaces(text: string): string {
  return text.replace(new RegExp(SPACE_BYPASS_CHAR, 'g'), ' ');
}

/**
 * Apply space bypass to all text content in messages
 */
export function applySpaceBypass(messages: AIMessage[]): AIMessage[] {
  return messages.map(msg => ({
    ...msg,
    content: encodeSpaces(msg.content),
  }));
}

// Gemini safety settings
export const GEMINI_SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

export type ThinkingLevel = 'none' | 'low' | 'medium' | 'high';

export interface GeminiFunctionDecl {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description?: string;
      enum?: string[];
      items?: any;
    }>;
    required?: string[];
  };
}

interface GeminiPart {
  text?: string;
  thoughtText?: string;
  inlineData?: { mimeType: string; data: string };
  functionCall?: { name: string; args: Record<string, any> };
  functionResponse?: { name: string; response: any };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: GeminiPart[] };
  tools?: any[];
  generationConfig: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseModalities?: string[];
    thinkingConfig?: { includeThoughts?: boolean; thinkingLevel?: 'none' | 'low' | 'medium' | 'high' };
  };
  safetySettings?: typeof GEMINI_SAFETY;
}

// Convert OpenAI messages to Gemini format (from ST)
export function convertToGeminiFormat(messages: AIMessage[]): { contents: GeminiContent[]; systemInstruction: string } {
  const contents: GeminiContent[] = [];
  let systemInstruction = '';
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction += (systemInstruction ? '\n\n' : '') + msg.content;
    } else if (msg.role === 'user') {
      const lastContent = contents[contents.length - 1];
      if (lastContent && lastContent.role === 'user') {
        lastContent.parts.push({ text: msg.content });
      } else {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      }
    } else if (msg.role === 'assistant') {
      const lastContent = contents[contents.length - 1];
      if (lastContent && lastContent.role === 'model') {
        lastContent.parts.push({ text: msg.content });
      } else {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }
  }
  
  return { contents, systemInstruction };
}

// Build Gemini request
export function buildGeminiRequest(messages: AIMessage[], config: GeminiExtendedConfig): GeminiRequest {
  // Apply space bypass if enabled
  const processedMessages = config.useSpaceBypass ? applySpaceBypass(messages) : messages;
  
  const { contents, systemInstruction } = convertToGeminiFormat(processedMessages);
  
  const request: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens ?? 8192,
    },
    safetySettings: GEMINI_SAFETY,
  };
  
  // Add optional params
  if (config.topP !== undefined) request.generationConfig.topP = config.topP;
  if (config.topK !== undefined) request.generationConfig.topK = config.topK;
  if (config.stopSequences) request.generationConfig.stopSequences = config.stopSequences;
  if (config.responseModalities) request.generationConfig.responseModalities = config.responseModalities;
  
  // System instruction with "start with" for reasoning
  let fullSystemInstruction = systemInstruction;
  const thinkingLevel = config.thinkingLevel ?? 'high';
  
  if (thinkingLevel !== 'none' && config.showThoughts !== false) {
    // Add "start with" instruction to output reasoning in <thinking> tags
    fullSystemInstruction += `\n\n[INSTRUCTION: Start your response with <thinking> tags containing your reasoning process. Write your analysis, considerations, and decision-making inside <thinking></thinking> tags, then provide your actual response after the closing tag.]`;
  }
  
  // Apply space bypass to system instruction if enabled
  if (config.useSpaceBypass && fullSystemInstruction) {
    fullSystemInstruction = encodeSpaces(fullSystemInstruction);
  }
  
  if (fullSystemInstruction) {
    request.systemInstruction = { parts: [{ text: fullSystemInstruction }] };
  }
  
  // Thinking config for Gemini thinking models
  // Always include if thinkingLevel is set (reasoning is always on for thinking models)
  if (thinkingLevel !== 'none') {
    // Always use includeThoughts: false
    // Reasoning is extracted via <thinking> tags in response text (via "start with" prompt)
    request.generationConfig.thinkingConfig = {
      includeThoughts: false,
      thinkingLevel: thinkingLevel,
    };
  }
  
  // Tools
  const tools: any[] = [];
  
  if (config.functionCalling && config.functionDeclarations?.length) {
    tools.push({ functionDeclarations: config.functionDeclarations });
  }
  
  if (config.enableWebSearch) {
    tools.push({ googleSearch: {} });
  }
  
  if (tools.length > 0) {
    request.tools = tools;
  }
  
  return request;
}

// Parse Gemini response
export interface GeminiResponse {
  text: string;
  thoughts?: string;
  functionCalls?: Array<{ name: string; args: Record<string, any> }>;
  finishReason?: string;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    thoughtsTokenCount?: number;
  };
}

export function parseGeminiResponse(data: any, useSpaceBypass: boolean = false): GeminiResponse {
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('No candidates in Gemini response');
  }
  
  const result: GeminiResponse = {
    text: '',
    finishReason: candidate.finishReason,
    usageMetadata: data.usageMetadata,
  };
  
  // Debug: log the response structure
  console.log('[Gemini] Parsing response:', JSON.stringify(candidate.content?.parts, null, 2).substring(0, 500));
  
  for (const part of candidate.content?.parts ?? []) {
    // Thought text (explicit thoughtText field)
    if (part.thoughtText) {
      result.thoughts = (result.thoughts || '') + part.thoughtText;
    }
    // Regular text - might contain <thinking> tags
    else if (part.text) {
      // Check if this is a thought part (some models return thoughts as regular text)
      if (part.thought || part.isThought) {
        result.thoughts = (result.thoughts || '') + part.text;
      } else {
        result.text = (result.text || '') + part.text;
      }
    }
    // Function call
    if (part.functionCall) {
      if (!result.functionCalls) result.functionCalls = [];
      result.functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args,
      });
    }
  }
  
  // Decode spaces if bypass was used
  if (useSpaceBypass) {
    result.text = decodeSpaces(result.text);
    if (result.thoughts) {
      result.thoughts = decodeSpaces(result.thoughts);
    }
  }
  
  // Extract <thinking> tags from text if present
  const thinkingMatch = result.text.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (thinkingMatch) {
    result.thoughts = (result.thoughts || '') + thinkingMatch[1].trim();
    result.text = result.text.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
  }
  
  console.log('[Gemini] Parsed:', { textLength: result.text.length, thoughtsLength: result.thoughts?.length || 0 });
  
  return result;
}

// Main API call function
export async function callGeminiAPI(
  messages: AIMessage[],
  config: GeminiExtendedConfig,
  onStream?: (chunk: string, thoughts?: string) => void
): Promise<GeminiResponse> {
  const request = buildGeminiRequest(messages, config);
  
  // Determine endpoint type
  const isGoogleAI = config.baseUrl.includes('generativelanguage.googleapis.com');
  const isVertexAI = config.provider === 'vertexai';
  const isSmolProxyGemini = config.baseUrl.includes('smolproxy.org/google');
  const isSmolProxyOpenAI = config.baseUrl.includes('smolproxy.org/openai');
  
  let url: string;
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // SmolProxy OpenAI uses OpenAI-compatible format
  if (isSmolProxyOpenAI) {
    // Apply space bypass to messages if enabled
    const processedMessages = config.useSpaceBypass ? applySpaceBypass(messages) : messages;
    
    const openaiMessages = processedMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content,
    }));
    
    url = `${config.baseUrl}/chat/completions`;
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: openaiMessages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: config.topP,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SmolProxy error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    return {
      text: config.useSpaceBypass ? decodeSpaces(text) : text,
      usageMetadata: {
        promptTokenCount: data.usage?.prompt_tokens || 0,
        candidatesTokenCount: data.usage?.completion_tokens || 0,
        totalTokenCount: data.usage?.total_tokens || 0,
      },
    };
  }
  
  // Everything else uses native Gemini format
  // (Google AI Studio, SmolProxy Gemini, Vertex AI, custom Gemini endpoints)
  if (isGoogleAI) {
    // Google AI Studio - uses ?key= param
    const method = onStream ? 'streamGenerateContent' : 'generateContent';
    url = `${config.baseUrl}/models/${config.model}:${method}?key=${config.apiKey}`;
  } else if (isVertexAI) {
    // Vertex AI
    const location = config.location || 'us-central1';
    url = `https://${location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${location}/publishers/google/models/${config.model}:${onStream ? 'streamGenerateContent' : 'generateContent'}`;
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  } else {
    // SmolProxy Gemini or custom Gemini-compatible endpoint
    // For proxies, use native Gemini format
    const method = onStream ? 'streamGenerateContent' : 'generateContent';
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    url = `${baseUrl}/models/${config.model}:${method}`;
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    
    console.log('[Gemini] Native format URL:', url);
  }
  
  // Non-streaming
  if (!onStream) {
    console.log('[Gemini] Request:', JSON.stringify({ url, request }, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] Error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[Gemini] Response:', JSON.stringify(data, null, 2).substring(0, 500));
    return parseGeminiResponse(data, config.useSpaceBypass);
  }
  
  // Streaming
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }
  
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let fullThoughts = '';
  let finalData: any = null;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr.trim() === '[DONE]') continue;
        
        try {
          const data = JSON.parse(jsonStr);
          finalData = data;
          
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.text && !part.thoughtText) {
              const text = config.useSpaceBypass ? decodeSpaces(part.text) : part.text;
              fullText += text;
              onStream(text);
            }
            if (part.thoughtText) {
              const thoughts = config.useSpaceBypass ? decodeSpaces(part.thoughtText) : part.thoughtText;
              fullThoughts += thoughts;
              onStream('', thoughts);
            }
          }
        } catch {}
      }
    }
  }
  
  // Decode spaces in final result if bypass was used
  return {
    text: config.useSpaceBypass ? decodeSpaces(fullText) : fullText,
    thoughts: config.useSpaceBypass ? decodeSpaces(fullThoughts) : fullThoughts,
    usageMetadata: finalData?.usageMetadata,
  };
}

// Get available models
export async function getGeminiModels(config: AIConfig): Promise<string[]> {
  const isGoogleAI = config.baseUrl.includes('generativelanguage.googleapis.com');
  
  let url: string;
  let headers: Record<string, string> = {};
  
  if (isGoogleAI) {
    url = `${config.baseUrl}/models?key=${config.apiKey}`;
  } else if (config.baseUrl.includes('smolproxy')) {
    url = `${config.baseUrl}/models`;
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  } else {
    url = `${config.baseUrl}/models`;
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.models) {
    return data.models.map((m: any) => m.name?.replace('models/', '') || m.name);
  }
  if (data.data) {
    return data.data.map((m: any) => m.id);
  }
  
  return [];
}

// Pre-built function declarations
export const ROLL_FUNCTIONS: GeminiFunctionDecl[] = [
  {
    name: 'roll_dice',
    description: 'Roll dice for an action or check',
    parameters: {
      type: 'object',
      properties: {
        dice: { type: 'string', description: 'Dice notation (e.g., "1d20", "2d6+3")' },
        reason: { type: 'string', description: 'Why this roll is being made' },
        modifier: { type: 'number', description: 'Modifier to add' },
      },
      required: ['dice', 'reason'],
    },
  },
];

export const GAME_FUNCTIONS: GeminiFunctionDecl[] = [
  {
    name: 'update_stat',
    description: 'Update a character stat',
    parameters: {
      type: 'object',
      properties: {
        character: { type: 'string', description: 'Character name or "player"' },
        stat: { type: 'string', description: 'Stat name' },
        value: { type: 'number', description: 'New value' },
      },
      required: ['character', 'stat', 'value'],
    },
  },
  {
    name: 'move_character',
    description: 'Move a character to a new location',
    parameters: {
      type: 'object',
      properties: {
        character: { type: 'string', description: 'Character name' },
        location: { type: 'string', description: 'Target location' },
      },
      required: ['character', 'location'],
    },
  },
];

export const ALL_GAME_FUNCTIONS = [...ROLL_FUNCTIONS, ...GAME_FUNCTIONS];
