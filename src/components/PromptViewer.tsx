import { useState } from 'react';
import type { AIMessage } from '../types';
import { DEFAULT_PROMPTS, promptStructureToMessages, type GamePromptStructure } from '../types/prompt-structure';

interface Props {
  promptStructure: GamePromptStructure;
  messages: AIMessage[];
  rawRequest?: any;
  rawResponse?: string;
  systemPrompt?: string;
}

type Tab = 'structure' | 'prompts' | 'request' | 'response';

function PromptViewer({ promptStructure, messages, rawRequest, rawResponse, systemPrompt }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('structure');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const prompts = promptStructure || DEFAULT_PROMPTS;

  const handleEditPrompt = (id: string, content: string) => {
    setEditingPrompt(id);
    setEditedContent(content);
  };

  const handleSavePrompt = () => {
    // TODO: Save to state
    setEditingPrompt(null);
  };

  const renderPromptSection = (key: string, section: typeof prompts.mainInstruction) => {
    const isEditing = editingPrompt === section.id;
    
    return (
      <div key={key} className={`prompt-section ${section.role}`}>
        <div className="section-header">
          <span className="section-name">{section.name}</span>
          <div className="section-meta">
            <span className="role-badge">{section.role}</span>
            <span className="order">Order: {section.order}</span>
            <label className="enabled-toggle">
              <input type="checkbox" checked={section.enabled} readOnly />
              Enabled
            </label>
          </div>
        </div>
        {isEditing ? (
          <div className="section-edit">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={10}
            />
            <div className="edit-actions">
              <button onClick={handleSavePrompt}>Save</button>
              <button onClick={() => setEditingPrompt(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="section-content" onClick={() => handleEditPrompt(section.id, section.content)}>
            <pre>{section.content}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="prompt-viewer">
      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'structure' ? 'active' : ''}`}
          onClick={() => setActiveTab('structure')}
        >
          📋 Structure
        </button>
        <button
          className={`tab ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          📝 Prompts
        </button>
        <button
          className={`tab ${activeTab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          📤 Request
        </button>
        <button
          className={`tab ${activeTab === 'response' ? 'active' : ''}`}
          onClick={() => setActiveTab('response')}
        >
          📥 Response
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'structure' && (
          <div className="structure-view">
            <h3>📊 Prompt Structure Overview</h3>
            <p className="structure-desc">
              The prompts are sent in strict order. First 3 system messages become systemInstruction for Gemini.
            </p>
            
            <div className="structure-flow">
              {(Object.entries(prompts) as [string, typeof prompts.mainInstruction][])
                .sort(([, a], [, b]) => a.order - b.order)
                .map(([key, section], index) => (
                  <div key={key} className={`flow-item ${section.role} ${!section.enabled ? 'disabled' : ''}`}>
                    <div className="flow-order">{index + 1}</div>
                    <div className="flow-info">
                      <span className="flow-name">{section.name}</span>
                      <span className="flow-role">{section.role}</span>
                    </div>
                    {index < Object.keys(prompts).length - 1 && (
                      <div className="flow-arrow">↓</div>
                    )}
                  </div>
                ))}
            </div>
            
            {systemPrompt && (
              <div className="system-prompt-preview">
                <h4>System Instruction (Gemini)</h4>
                <pre>{systemPrompt.substring(0, 500)}...</pre>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'prompts' && (
          <div className="prompts-view">
            <h3>📝 Edit Prompts</h3>
            <div className="prompts-list">
              {(Object.entries(prompts) as [string, typeof prompts.mainInstruction][])
                .sort(([, a], [, b]) => a.order - b.order)
                .map(([key, section]) => renderPromptSection(key, section))}
            </div>
          </div>
        )}
        
        {activeTab === 'request' && (
          <div className="request-view">
            <h3>📤 Raw API Request</h3>
            {rawRequest ? (
              <pre className="code-block">{JSON.stringify(rawRequest, null, 2)}</pre>
            ) : (
              <p className="no-data">No request data yet. Send a message to see the raw request.</p>
            )}
          </div>
        )}
        
        {activeTab === 'response' && (
          <div className="response-view">
            <h3>📥 Raw API Response</h3>
            {rawResponse ? (
              <pre className="code-block">{rawResponse}</pre>
            ) : (
              <p className="no-data">No response data yet. Send a message to see the raw response.</p>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        .prompt-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary);
        }
        
        .tab-bar {
          display: flex;
          border-bottom: 1px solid var(--border);
          background: var(--bg-primary);
        }
        
        .tab {
          flex: 1;
          padding: 0.75rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.85rem;
          border-bottom: 2px solid transparent;
        }
        
        .tab.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
          background: var(--bg-secondary);
        }
        
        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        
        .structure-view h3,
        .prompts-view h3,
        .request-view h3,
        .response-view h3 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }
        
        .structure-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        
        .structure-flow {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .flow-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background: var(--bg-primary);
        }
        
        .flow-item.system {
          border-left: 3px solid var(--accent);
        }
        
        .flow-item.user {
          border-left: 3px solid #2ecc71;
        }
        
        .flow-item.disabled {
          opacity: 0.5;
        }
        
        .flow-order {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: bold;
        }
        
        .flow-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
        }
        
        .flow-name {
          font-size: 0.85rem;
          color: var(--text-primary);
        }
        
        .flow-role {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        
        .flow-arrow {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.75rem;
          margin-left: 24px;
        }
        
        .system-prompt-preview {
          margin-top: 1.5rem;
          padding: 0.75rem;
          background: var(--bg-primary);
          border-radius: 0.5rem;
        }
        
        .system-prompt-preview h4 {
          margin: 0 0 0.5rem;
          font-size: 0.85rem;
          color: var(--accent);
        }
        
        .system-prompt-preview pre {
          font-size: 0.7rem;
          color: var(--text-secondary);
          overflow: hidden;
        }
        
        .prompts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .prompt-section {
          background: var(--bg-primary);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .prompt-section.system {
          border: 1px solid var(--accent);
        }
        
        .prompt-section.user {
          border: 1px solid #2ecc71;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
        }
        
        .section-name {
          font-weight: 500;
          font-size: 0.85rem;
        }
        
        .section-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .role-badge {
          padding: 0.125rem 0.5rem;
          background: var(--bg-secondary);
          border-radius: 0.25rem;
          font-size: 0.65rem;
          text-transform: uppercase;
        }
        
        .order {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
        
        .enabled-toggle {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          cursor: pointer;
        }
        
        .section-content {
          padding: 0.75rem;
          cursor: pointer;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .section-content pre {
          margin: 0;
          font-size: 0.7rem;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .section-edit textarea {
          width: 100%;
          min-height: 200px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.75rem;
          font-family: monospace;
          font-size: 0.8rem;
          resize: vertical;
        }
        
        .edit-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--bg-tertiary);
        }
        
        .edit-actions button {
          padding: 0.4rem 1rem;
          border-radius: 0.25rem;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .edit-actions button:first-child {
          background: var(--accent);
          color: white;
        }
        
        .edit-actions button:last-child {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        
        .code-block {
          background: var(--bg-primary);
          padding: 1rem;
          border-radius: 0.5rem;
          font-size: 0.7rem;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .no-data {
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-align: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}

export default PromptViewer;
