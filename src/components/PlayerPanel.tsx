import { useState } from 'react';
import type { Character } from '../types';
import type { SixPointMatrix } from '../types/prompt-structure';

interface Props {
  character: Character | null;
  onCreate: (data: Partial<Character>) => void;
  onUpdate: (character: Character) => void;
}

type Tab = 'main' | 'clothing' | 'matrix' | 'likes' | 'skills';

const TAB_LABELS: Record<Tab, string> = {
  main: '📋 Main',
  clothing: '👕 Clothing',
  matrix: '📊 Matrix',
  likes: '💝 Likes/Dislikes',
  skills: '⚡ Skills',
};

// Default 6-point matrix
const DEFAULT_MATRIX: SixPointMatrix = {
  romance: 0,
  trust: 0,
  respect: 0,
  attraction: 0,
  friendship: 0,
  fear: 0,
};

function PlayerPanel({ character, onCreate, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [creating, setCreating] = useState(!character);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  
  // Clothing state
  const [clothing, setClothing] = useState({
    head: '', neck: '', torso: '', arms: '', hands: '', legs: '', feet: '', accessory: ''
  });
  
  // Likes/dislikes
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  
  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Matrix (placeholder - would need target character)
  const [matrix, setMatrix] = useState<SixPointMatrix>(DEFAULT_MATRIX);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({
      name,
      description,
      personality,
      stats: {
        health: { current: 100, max: 100 },
        mana: { current: 50, max: 50 },
        stamina: { current: 100, max: 100 },
        hunger: { current: 100, max: 100 },
        thirst: { current: 100, max: 100 },
        fatigue: { current: 0, max: 100 },
        cleanliness: { current: 100, max: 100 },
        bladder: { current: 0, max: 100 },
        arousal: { current: 0, max: 100 },
        pain: { current: 0, max: 100 },
        strength: 10,
        agility: 10,
        intelligence: 10,
        charisma: 10,
        willpower: 10,
      },
    });
    setCreating(false);
  };

  const handleAddLike = () => {
    if (newLike.trim()) {
      setLikes([...likes, newLike.trim()]);
      setNewLike('');
    }
  };

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      setDislikes([...dislikes, newDislike.trim()]);
      setNewDislike('');
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleMatrixChange = (key: keyof SixPointMatrix, value: number) => {
    setMatrix({ ...matrix, [key]: value });
  };

  if (creating) {
    return (
      <div className="player-panel creating">
        <h2>👤 Create Your Character</h2>
        <div className="create-form">
          <input
            type="text"
            placeholder="Character Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            placeholder="Description (appearance, background...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <textarea
            placeholder="Personality traits"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            rows={2}
          />
          <button onClick={handleCreate} disabled={!name.trim()}>
            Create Character
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-panel">
      {/* Tab bar */}
      <div className="tab-bar">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'main' && (
          <div className="main-info">
            <h3>{character?.name || 'Unknown'}</h3>
            <p className="description">{character?.description || 'No description'}</p>
            <p className="personality"><strong>Personality:</strong> {character?.personality || 'Unknown'}</p>
            
            <div className="quick-stats">
              <div className="stat-row">
                <span>❤️ Health</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill health" 
                    style={{ width: `${(character?.stats?.health?.current || 100) / (character?.stats?.health?.max || 100) * 100}%` }}
                  />
                </div>
                <span>{character?.stats?.health?.current || 100}/{character?.stats?.health?.max || 100}</span>
              </div>
              <div className="stat-row">
                <span>💧 Mana</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill mana" 
                    style={{ width: `${(character?.stats?.mana?.current || 50) / (character?.stats?.mana?.max || 50) * 100}%` }}
                  />
                </div>
                <span>{character?.stats?.mana?.current || 50}/{character?.stats?.mana?.max || 50}</span>
              </div>
              <div className="stat-row">
                <span>⚡ Stamina</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill stamina" 
                    style={{ width: `${(character?.stats?.stamina?.current || 100) / (character?.stats?.stamina?.max || 100) * 100}%` }}
                  />
                </div>
                <span>{character?.stats?.stamina?.current || 100}/{character?.stats?.stamina?.max || 100}</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'clothing' && (
          <div className="clothing-info">
            <h3>👕 Current Outfit</h3>
            <div className="clothing-grid">
              {Object.entries(clothing).map(([slot, item]) => (
                <div key={slot} className="clothing-slot">
                  <label>{slot.charAt(0).toUpperCase() + slot.slice(1)}</label>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => setClothing({ ...clothing, [slot]: e.target.value })}
                    placeholder="Empty"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'matrix' && (
          <div className="matrix-info">
            <h3>📊 6-Point Matrix</h3>
            <p className="matrix-note">Relationship values with selected character</p>
            <div className="matrix-grid">
              {(Object.keys(matrix) as Array<keyof SixPointMatrix>).map(key => (
                <div key={key} className="matrix-row">
                  <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={matrix[key]}
                    onChange={(e) => handleMatrixChange(key, parseInt(e.target.value))}
                  />
                  <span className={matrix[key] >= 0 ? 'positive' : 'negative'}>
                    {matrix[key] > 0 ? '+' : ''}{matrix[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'likes' && (
          <div className="likes-info">
            <h3>💝 Likes</h3>
            <div className="tag-list">
              {likes.map((like, i) => (
                <span key={i} className="tag like" onClick={() => setLikes(likes.filter((_, idx) => idx !== i))}>
                  {like} ✕
                </span>
              ))}
            </div>
            <div className="add-tag">
              <input
                type="text"
                value={newLike}
                onChange={(e) => setNewLike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLike()}
                placeholder="Add like..."
              />
              <button onClick={handleAddLike}>+</button>
            </div>
            
            <h3>💔 Dislikes</h3>
            <div className="tag-list">
              {dislikes.map((dislike, i) => (
                <span key={i} className="tag dislike" onClick={() => setDislikes(dislikes.filter((_, idx) => idx !== i))}>
                  {dislike} ✕
                </span>
              ))}
            </div>
            <div className="add-tag">
              <input
                type="text"
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDislike()}
                placeholder="Add dislike..."
              />
              <button onClick={handleAddDislike}>+</button>
            </div>
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div className="skills-info">
            <h3>⚡ Skills & Abilities</h3>
            <div className="skill-list">
              {skills.map((skill, i) => (
                <div key={i} className="skill-item" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}>
                  {skill}
                  <span className="remove">✕</span>
                </div>
              ))}
            </div>
            <div className="add-skill">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add skill..."
              />
              <button onClick={handleAddSkill}>+</button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .player-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .player-panel.creating {
          padding: 1rem;
        }
        
        .create-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .create-form input,
        .create-form textarea {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.75rem;
          border-radius: 0.5rem;
        }
        
        .create-form button {
          background: var(--accent);
          border: none;
          color: white;
          padding: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: bold;
        }
        
        .create-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .tab-bar {
          display: flex;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
        }
        
        .tab {
          flex: 1;
          padding: 0.5rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.7rem;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
        }
        
        .tab.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        
        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
        }
        
        .main-info h3 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }
        
        .main-info .description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        
        .main-info .personality {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .quick-stats {
          margin-top: 1rem;
        }
        
        .stat-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
        }
        
        .stat-bar {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .stat-fill {
          height: 100%;
          transition: width 0.3s;
        }
        
        .stat-fill.health { background: #e74c3c; }
        .stat-fill.mana { background: #3498db; }
        .stat-fill.stamina { background: #2ecc71; }
        
        .clothing-grid {
          display: grid;
          gap: 0.5rem;
        }
        
        .clothing-slot {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .clothing-slot label {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
        
        .clothing-slot input {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
        
        .matrix-note {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }
        
        .matrix-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .matrix-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .matrix-row label {
          width: 70px;
          font-size: 0.75rem;
        }
        
        .matrix-row input[type="range"] {
          flex: 1;
        }
        
        .matrix-row span {
          width: 35px;
          font-size: 0.75rem;
          text-align: right;
        }
        
        .matrix-row span.positive { color: #2ecc71; }
        .matrix-row span.negative { color: #e74c3c; }
        
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }
        
        .tag {
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.7rem;
          cursor: pointer;
        }
        
        .tag.like {
          background: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
        }
        
        .tag.dislike {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }
        
        .add-tag, .add-skill {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }
        
        .add-tag input, .add-skill input {
          flex: 1;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }
        
        .add-tag button, .add-skill button {
          background: var(--accent);
          border: none;
          color: white;
          padding: 0.4rem 0.75rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        
        .skill-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }
        
        .skill-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: var(--bg-primary);
          border-radius: 0.25rem;
          font-size: 0.8rem;
          cursor: pointer;
        }
        
        .skill-item .remove {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

export default PlayerPanel;
