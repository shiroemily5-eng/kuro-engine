import { useState } from 'react';

interface Props {
  onSendMessage: (message: string) => void;
  onRoll: (type: string, dice: string) => void;
  loading: boolean;
  disabled?: boolean;
}

function ActionPanel({ onSendMessage, onRoll, loading, disabled }: Props) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const quickActions = [
    { label: '🔍 Search', action: 'search', prompt: 'Look around and search the area.' },
    { label: '⚔️ Attack', action: 'attack', prompt: 'Attack!' },
    { label: '🏃 Flee', action: 'flee', prompt: 'Try to escape!' },
    { label: '💬 Talk', action: 'talk', prompt: 'Start a conversation.' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        {quickActions.map(({ label, action, prompt }) => (
          <button
            key={action}
            onClick={() => onSendMessage(prompt)}
            disabled={loading || disabled}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {label}
          </button>
        ))}
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={() => onRoll('action', '1d20')}
          disabled={loading || disabled}
          style={{
            background: disabled ? 'var(--bg-tertiary)' : 'var(--accent)',
            border: 'none',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          🎲 Roll d20
        </button>
      </div>
      
      <form className="action-panel" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={disabled ? 'Configure API key in Settings...' : loading ? 'Waiting for response...' : 'What do you do?'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || disabled}
          autoFocus
        />
        <button type="submit" disabled={loading || disabled || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ActionPanel;
