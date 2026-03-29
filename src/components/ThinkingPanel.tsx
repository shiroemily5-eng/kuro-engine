import { useState } from 'react';

interface Props {
  thoughts: string;
}

function ThinkingPanel({ thoughts }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  if (!thoughts) return null;
  
  return (
    <div className="thinking-panel">
      <button 
        className="thinking-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="thinking-icon">🧠</span>
        <span className="thinking-label">
          {expanded ? 'Hide' : 'Show'} Reasoning
        </span>
        <span className="thinking-arrow">{expanded ? '▼' : '▶'}</span>
      </button>
      
      {expanded && (
        <div className="thinking-content">
          {thoughts}
        </div>
      )}
      
      <style>{`
        .thinking-panel {
          margin: 0.5rem 0;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .thinking-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-secondary);
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 0.8rem;
        }
        .thinking-toggle:hover {
          background: var(--bg-tertiary);
        }
        .thinking-icon {
          font-size: 1rem;
        }
        .thinking-label {
          flex: 1;
          text-align: left;
        }
        .thinking-arrow {
          font-size: 0.7rem;
          opacity: 0.6;
        }
        .thinking-content {
          padding: 0.75rem;
          background: var(--bg-primary);
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
          line-height: 1.5;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}

export default ThinkingPanel;
