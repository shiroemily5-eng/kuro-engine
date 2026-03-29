import { useState } from 'react';
import type { AIConfig, GeminiExtendedConfig } from '../types';

interface Props {
  config: GeminiExtendedConfig;
  onUpdate: (config: GeminiExtendedConfig) => void;
  streaming?: boolean;
  onStreamingChange?: (streaming: boolean) => void;
  systemPrompt?: string;
  onSystemPromptChange?: (prompt: string) => void;
}

function AISettingsPanel({ 
  config, 
  onUpdate, 
  streaming = false, 
  onStreamingChange,
  systemPrompt = '',
  onSystemPromptChange 
}: Props) {
  const [showKey, setShowKey] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  
  const isGemini = config.provider === 'gemini' || 
                   config.baseUrl.includes('smolproxy.org/google') ||
                   config.model.includes('gemini');
  
  const updateConfig = (updates: Partial<GeminiExtendedConfig>) => {
    onUpdate({ ...config, ...updates });
  };
  
  return (
    <div className="settings-form">
      {/* API Key - ALWAYS show this */}
      <div className="setting-group">
        <label>API Key {!config.apiKey && <span style={{ color: 'var(--warning)' }}>* Required</span>}</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey || ''}
            onChange={(e) => updateConfig({ apiKey: e.target.value })}
            placeholder={config.provider === 'gemini' && !config.baseUrl.includes('smolproxy')
              ? 'AIza... (from aistudio.google.com)'
              : config.provider === 'deepseek'
              ? 'sk-... (from platform.deepseek.com)'
              : 'Enter your API key'}
            style={{ flex: 1 }}
          />
          <button 
            type="button"
            onClick={() => setShowKey(!showKey)}
            style={{ 
              padding: '0.5rem', 
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          >
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>
        {config.provider === 'gemini' && !config.baseUrl.includes('smolproxy') && (
          <a 
            href="https://aistudio.google.com/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--accent)' }}
          >
            Get your free Gemini API key →
          </a>
        )}
        {config.provider === 'deepseek' && (
          <a 
            href="https://platform.deepseek.com/api_keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--accent)' }}
          >
            Get your DeepSeek API key →
          </a>
        )}
      </div>
      
      {/* Provider Selection */}
      <div className="setting-group">
        <label>Provider</label>
        <select 
          value={config.provider}
          onChange={(e) => {
            const provider = e.target.value as AIConfig['provider'];
            updateConfig({ provider });
          }}
        >
          <option value="deepseek">DeepSeek</option>
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI / Compatible</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      {/* Base URL - editable */}
      <div className="setting-group">
        <label>API Endpoint</label>
        <input
          type="text"
          value={config.baseUrl}
          onChange={(e) => updateConfig({ baseUrl: e.target.value })}
          placeholder="https://api.example.com/v1"
        />
        <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
          Change this to use a custom proxy or self-hosted endpoint
        </small>
      </div>
      
      {/* Model Selection */}
      <div className="setting-group">
        <label>Model</label>
        <input
          type="text"
          value={config.model}
          onChange={(e) => updateConfig({ model: e.target.value })}
          placeholder="model-name"
        />
        <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
          Common: deepseek-chat, gpt-4o, gemini-2.0-flash
        </small>
      </div>
      
      {/* Temperature */}
      <div className="setting-group">
        <label>Temperature: {config.temperature}</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={config.temperature}
          onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>
      
      {/* Top P - fully customizable */}
      <div className="setting-group">
        <label>Top P</label>
        <input
          type="number"
          value={config.topP ?? 0.95}
          onChange={(e) => updateConfig({ topP: parseFloat(e.target.value) || 0.95 })}
          min={0}
          max={1}
          step={0.01}
        />
        <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
          0-1: Lower = more focused, Higher = more diverse
        </small>
      </div>
      
      {/* Top K */}
      <div className="setting-group">
        <label>Top K: {config.topK ?? 'auto'}</label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={config.topK ?? 40}
          onChange={(e) => updateConfig({ topK: parseInt(e.target.value) })}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <span>0 = disabled</span>
          <span>100 = most options</span>
        </div>
      </div>
      
      {/* Max Tokens */}
      <div className="setting-group">
        <label>Max Tokens</label>
        <input
          type="number"
          value={config.maxTokens}
          onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) || 4096 })}
          min={1}
          max={128000}
        />
      </div>
      
      {/* Gemini-specific settings */}
      {isGemini && (
        <>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--accent)' }}>
              ✨ Gemini Features
            </div>
          </div>
          
          {/* Thinking Level - always visible, reasoning is always on */}
          <div className="setting-group">
            <label>Reasoning Effort</label>
            <select
              value={config.thinkingLevel || 'high'}
              onChange={(e) => updateConfig({ thinkingLevel: e.target.value as any })}
            >
              <option value="none">None</option>
              <option value="low">Low (Quick)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Deep)</option>
            </select>
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
              Higher = more thorough reasoning, but slower
            </small>
          </div>
          
          {/* Show Thoughts - visibility only */}
          <div className="setting-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.showThoughts ?? true}
                onChange={(e) => updateConfig({ showThoughts: e.target.checked })}
              />
              <span>
                <strong>Show Thinking</strong>
                <small>Display reasoning in the UI</small>
              </span>
            </label>
          </div>
          
          {/* Web Search */}
          <div className="setting-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.enableWebSearch || false}
                onChange={(e) => updateConfig({ enableWebSearch: e.target.checked })}
              />
              <span>
                <strong>Enable Web Search</strong>
                <small>Let model search the web</small>
              </span>
            </label>
          </div>
          
          {/* Function Calling */}
          <div className="setting-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.functionCalling || false}
                onChange={(e) => updateConfig({ functionCalling: e.target.checked })}
              />
              <span>
                <strong>Enable Function Calling</strong>
                <small>Let model call game functions</small>
              </span>
            </label>
          </div>
          
          {/* Image Generation */}
          <div className="setting-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.responseModalities?.includes('IMAGE') || false}
                onChange={(e) => updateConfig({ 
                  responseModalities: e.target.checked ? ['TEXT', 'IMAGE'] : ['TEXT']
                })}
              />
              <span>
                <strong>Enable Image Generation</strong>
                <small>Generate images inline</small>
              </span>
            </label>
          </div>
          
          {/* Space Bypass */}
          <div className="setting-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.useSpaceBypass ?? false}
                onChange={(e) => updateConfig({ useSpaceBypass: e.target.checked })}
              />
              <span>
                <strong>Space Bypass (U+3164)</strong>
                <small>Evade content filters by encoding spaces</small>
              </span>
            </label>
          </div>
        </>
      )}
      
      {/* General settings */}
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--accent)' }}>
          ⚙️ General
        </div>
      </div>
      
      {/* Streaming Toggle */}
      <div className="setting-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={streaming}
            onChange={(e) => onStreamingChange?.(e.target.checked)}
          />
          <span>
            <strong>Enable Streaming 🌊</strong>
            <small>Stream responses in real-time</small>
          </span>
        </label>
      </div>
      
      {/* System Prompt Override */}
      <div className="setting-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>System Prompt Override</label>
          <button
            type="button"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          >
            {showSystemPrompt ? 'Hide' : 'Show'}
          </button>
        </div>
        {showSystemPrompt && (
          <>
            <textarea
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange?.(e.target.value)}
              placeholder="Override the default system prompt structure..."
              rows={8}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
              }}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
              If set, this replaces the default prompt structure for the first 3 system messages
            </small>
          </>
        )}
      </div>
      
      <style>{`
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .setting-group > label {
          font-size: 0.8rem;
          font-weight: 500;
        }
        .setting-group input[type="text"],
        .setting-group input[type="password"],
        .setting-group input[type="number"],
        .setting-group select,
        .setting-group textarea {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }
        .setting-group input:focus,
        .setting-group select:focus,
        .setting-group textarea:focus {
          outline: none;
          border-color: var(--accent);
        }
        .setting-group input[type="range"] {
          width: 100%;
          margin-top: 0.25rem;
        }
        .checkbox-group label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          padding: 0.75rem;
          background: var(--bg-primary);
          border-radius: 0.5rem;
          border: 1px solid var(--border);
        }
        .checkbox-group input[type="checkbox"] {
          margin-top: 0.25rem;
          width: 1rem;
          height: 1rem;
          cursor: pointer;
        }
        .checkbox-group span {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .checkbox-group small {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}

export default AISettingsPanel;
