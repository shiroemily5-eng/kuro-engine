import { useState } from 'react';
import type { Character } from '../types';

interface Props {
  character: Character | null;
  onCreate: (data: Partial<Character>) => void;
  onUpdate: (char: Character) => void;
}

function CharacterPanel({ character, onCreate }: Props) {
  const [editing, setEditing] = useState(!character);
  const [form, setForm] = useState({
    name: '',
    description: '',
    personality: '',
    appearance: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name) {
      onCreate(form);
      setEditing(false);
    }
  };

  if (!character && !editing) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Character</span>
        </div>
        <button onClick={() => setEditing(true)}>Create Character</button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Create Character</span>
        </div>
        <form className="character-create" onSubmit={handleSubmit}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <textarea
            placeholder="Personality (optional)"
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
          />
          <textarea
            placeholder="Appearance (optional)"
            value={form.appearance}
            onChange={(e) => setForm({ ...form, appearance: e.target.value })}
          />
          <button type="submit">Create</button>
        </form>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{character?.name}</span>
        <button onClick={() => setEditing(true)}>Edit</button>
      </div>
      {character?.description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {character.description}
        </p>
      )}
    </div>
  );
}

export default CharacterPanel;
