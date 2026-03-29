import { useState, useEffect, useCallback } from 'react';
import GameScreen from './components/GameScreen';
import PlayerPanel from './components/PlayerPanel';
import WorldPanel from './components/WorldPanel';
import ActionPanel from './components/ActionPanel';
import AISettingsPanel from './components/AISettingsPanel';
import ThinkingPanel from './components/ThinkingPanel';
import PromptViewer from './components/PromptViewer';
import { Character, Location, GeminiExtendedConfig, AIMessage } from './types';
import { DEFAULT_PROMPTS, type GamePromptStructure } from './types/prompt-structure';

// Default configs for different providers
const DEFAULT_CONFIGS: Record<string, GeminiExtendedConfig> = {
  deepseek: {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
  },
  'deepseek-reasoner': {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-reasoner',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
  },
  'smolproxy-gemini': {
    provider: 'gemini',
    baseUrl: 'https://beta.smolproxy.org/google/v1beta',
    apiKey: '',
    model: 'gemini-3.1-pro-preview',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    showThoughts: true,
    thinkingLevel: 'high',
    enableWebSearch: false,
    functionCalling: false,
    useSpaceBypass: true,
  },
  'smolproxy-openai': {
    provider: 'openai',
    baseUrl: 'https://beta.smolproxy.org/openai/v1',
    apiKey: '',
    model: 'gpt-5.4',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
  },
  'google-ai': {
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: '',
    model: 'gemini-2.0-flash-thinking-exp',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    showThoughts: true,
    thinkingLevel: 'medium',
    enableWebSearch: false,
  },
};

type ViewMode = 'game' | 'prompts';

function App() {
  const [player, setPlayer] = useState<Character | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [sceneCharacters, setSceneCharacters] = useState<Character[]>([]);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [thoughts, setThoughts] = useState<string>('');
  
  // Prompt structure state
  const [promptStructure, setPromptStructure] = useState<GamePromptStructure>(() => {
    const saved = localStorage.getItem('ai-textrpg-prompts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_PROMPTS;
  });
  
  // System prompt override
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('ai-textrpg-system-prompt') || '';
  });
  
  // AI config
  const [aiConfig, setAiConfig] = useState<GeminiExtendedConfig>(() => {
    const saved = localStorage.getItem('ai-textrpg-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_CONFIGS['deepseek'];
  });
  
  // Streaming state
  const [streaming, setStreaming] = useState<boolean>(() => {
    return localStorage.getItem('ai-textrpg-streaming') === 'true';
  });
  
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('game');
  
  // Debug data
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<string>('');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('ai-textrpg-config', JSON.stringify(aiConfig));
  }, [aiConfig]);
  
  useEffect(() => {
    localStorage.setItem('ai-textrpg-prompts', JSON.stringify(promptStructure));
  }, [promptStructure]);
  
  useEffect(() => {
    localStorage.setItem('ai-textrpg-system-prompt', systemPrompt);
  }, [systemPrompt]);
  
  useEffect(() => {
    localStorage.setItem('ai-textrpg-streaming', String(streaming));
  }, [streaming]);

  const configReady = aiConfig.apiKey && aiConfig.apiKey.length > 0;

  // Load player on mount
  useEffect(() => {
    fetch('/api/characters?isPlayer=true')
      .then(res => res.json())
      .then(chars => {
        if (chars.length > 0) {
          setPlayer(chars[0]);
          if (chars[0].location_id) {
            fetch(`/api/locations/${chars[0].location_id}`)
              .then(res => res.json())
              .then(loc => {
                setLocation(loc);
                // Load characters at location
                fetch(`/api/locations/${loc.id}/characters`)
                  .then(res => res.json())
                  .then(setSceneCharacters)
                  .catch(() => setSceneCharacters([]));
              });
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleCreateCharacter = async (charData: Partial<Character>) => {
    const res = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...charData, isPlayer: true }),
    });
    const data = await res.json();
    setPlayer({ id: data.id, name: data.name, ...charData } as Character);
  };

  const buildSystemPrompt = useCallback(() => {
    // If custom system prompt is set, use it
    if (systemPrompt.trim()) {
      return systemPrompt;
    }
    
    // Otherwise build from prompt structure
    const sections = Object.values(promptStructure)
      .filter(s => s.enabled && s.role === 'system')
      .sort((a, b) => a.order - b.order)
      .slice(0, 3); // First 3 system messages
    
    return sections.map(s => s.content).join('\n\n');
  }, [promptStructure, systemPrompt]);

  const handleSendMessage = async (content: string) => {
    if (!configReady) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: '⚠️ Please configure your API key in Settings first.' 
      }]);
      setShowSettings(true);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content }]);
    setLoading(true);
    setThoughts('');

    try {
      // Build messages with system prompt
      const systemPromptContent = buildSystemPrompt();
      
      const messagesWithSystem: AIMessage[] = [
        { role: 'system', content: systemPromptContent },
        ...messages.slice(-20),
        { role: 'user', content },
      ];

      const requestBody = {
        messages: messagesWithSystem,
        config: { ...aiConfig, stream: streaming },
      };
      
      setLastRequest(requestBody);

      if (streaming) {
        // Streaming request
        const res = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let fullThoughts = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  // Update UI in real-time
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx]?.role === 'assistant') {
                      newMsgs[lastIdx] = { role: 'assistant', content: fullText };
                    } else {
                      newMsgs.push({ role: 'assistant', content: fullText });
                    }
                    return newMsgs;
                  });
                }
                if (parsed.thoughts) {
                  fullThoughts += parsed.thoughts;
                  setThoughts(fullThoughts);
                }
              } catch {}
            }
          }
        }

        setLastResponse(fullText);
      } else {
        // Non-streaming request
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`API error: ${res.status} ${error}`);
        }

        const data = await res.json();
        setLastResponse(JSON.stringify(data, null, 2));
        
        let responseText = data.response || '';
        let extractedThoughts = data.thoughts || '';
        
        const thinkingMatch = responseText.match(/<thinking>([\s\S]*?)<\/thinking>/);
        if (thinkingMatch) {
          extractedThoughts = thinkingMatch[1].trim();
          responseText = responseText.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: responseText 
        }]);
        
        if (extractedThoughts && aiConfig.showThoughts !== false) {
          setThoughts(extractedThoughts);
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `❌ Error: ${error.message}` 
      }]);
    }

    setLoading(false);
  };

  const handleRoll = async (type: string, dice: string) => {
    const [count, sides] = dice.split('d').map(Number);
    const res = await fetch('/api/rolls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: player?.id,
        type,
        dice: { count, sides },
        modifier: 0,
        context: `Action roll in ${location?.name || 'unknown location'}`,
      }),
    });
    const result = await res.json();
    setMessages(prev => [...prev, { role: 'system', content: result.description }]);
  };

  const handleSelectPreset = (presetKey: string) => {
    const preset = DEFAULT_CONFIGS[presetKey];
    if (preset) {
      const keepKey = preset.baseUrl === aiConfig.baseUrl ? aiConfig.apiKey : '';
      setAiConfig({ ...preset, apiKey: keepKey });
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎮 AI TextRPG</h1>
        <div className="header-controls">
          {/* View mode toggle */}
          <div className="view-toggle">
            <button 
              className={viewMode === 'game' ? 'active' : ''}
              onClick={() => setViewMode('game')}
            >
              🎮 Game
            </button>
            <button 
              className={viewMode === 'prompts' ? 'active' : ''}
              onClick={() => setViewMode('prompts')}
            >
              📝 Prompts
            </button>
          </div>
          
          <span style={{ 
            fontSize: '0.75rem', 
            color: configReady ? 'var(--success)' : 'var(--warning)',
            marginRight: '1rem'
          }}>
            {configReady ? `✓ ${aiConfig.model}` : '⚠️ No API Key'}
            {streaming && ' 🌊'}
          </span>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            style={{ 
              background: showSettings ? 'var(--accent)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h2>AI Configuration</h2>
              <button onClick={() => setShowSettings(false)}>✕</button>
            </div>
            
            <div className="settings-modal-body">
              {/* Quick Presets */}
              <div className="preset-buttons">
                <button onClick={() => handleSelectPreset('deepseek')}>DeepSeek Chat</button>
                <button onClick={() => handleSelectPreset('deepseek-reasoner')}>DeepSeek Reasoner</button>
                <button onClick={() => handleSelectPreset('smolproxy-gemini')}>Gemini (SmolProxy)</button>
                <button onClick={() => handleSelectPreset('smolproxy-openai')}>GPT (SmolProxy)</button>
                <button onClick={() => handleSelectPreset('google-ai')}>Google AI Studio</button>
              </div>
              
              <AISettingsPanel 
                config={aiConfig} 
                onUpdate={setAiConfig}
                streaming={streaming}
                onStreamingChange={setStreaming}
                systemPrompt={systemPrompt}
                onSystemPromptChange={setSystemPrompt}
              />
              
              <div className="settings-notice">
                <p>💡 Your API key is stored locally in your browser. It is never sent to our servers.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'game' ? (
        <main className="main">
          <aside className="sidebar left">
            <PlayerPanel 
              character={player} 
              onCreate={handleCreateCharacter}
              onUpdate={setPlayer}
            />
          </aside>

          <section className="center">
            <GameScreen 
              messages={messages} 
              loading={loading}
            />
            
            {thoughts && aiConfig.showThoughts !== false && (
              <ThinkingPanel thoughts={thoughts} />
            )}
            
            <ActionPanel 
              onSendMessage={handleSendMessage}
              onRoll={handleRoll}
              loading={loading}
              disabled={!configReady}
            />
          </section>

          <aside className="sidebar right">
            <WorldPanel 
              location={location}
              sceneCharacters={sceneCharacters}
              onLocationUpdate={setLocation}
            />
          </aside>
        </main>
      ) : (
        <main className="main prompts-view">
          <PromptViewer 
            promptStructure={promptStructure}
            messages={messages}
            rawRequest={lastRequest}
            rawResponse={lastResponse}
            systemPrompt={buildSystemPrompt()}
          />
        </main>
      )}

      <style>{`
        .app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }
        
        .header h1 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .view-toggle {
          display: flex;
          background: var(--bg-tertiary);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .view-toggle button {
          padding: 0.4rem 0.75rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .view-toggle button.active {
          background: var(--accent);
          color: white;
        }
        
        .main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .main.prompts-view {
          flex-direction: column;
        }
        
        .sidebar {
          width: 280px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          overflow: hidden;
        }
        
        .sidebar.right {
          border-right: none;
          border-left: 1px solid var(--border);
        }
        
        .center {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .settings-modal {
          background: var(--bg-secondary);
          border-radius: 1rem;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .settings-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        
        .settings-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .settings-modal-header button {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .settings-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
        }
        
        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .preset-buttons button {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.75rem;
        }
        
        .preset-buttons button:hover {
          background: var(--accent);
        }
        
        .settings-notice {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

export default App;