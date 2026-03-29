import { useState } from 'react';
import type { Location, Character } from '../types';
import type { SixPointMatrix } from '../types/prompt-structure';

interface Props {
  location: Location | null;
  sceneCharacters: Character[];
  onLocationUpdate?: (location: Location) => void;
}

type Tab = 'world' | string; // 'world' or character ID

function WorldPanel({ location, sceneCharacters, onLocationUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('world');
  const [matrices, setMatrices] = useState<Record<string, SixPointMatrix>>({});
  
  // Get active character
  const activeCharacter = activeTab !== 'world' 
    ? sceneCharacters.find(c => c.id === activeTab) 
    : null;

  const handleMatrixChange = (charId: string, key: keyof SixPointMatrix, value: number) => {
    setMatrices(prev => ({
      ...prev,
      [charId]: {
        ...(prev[charId] || { romance: 0, trust: 0, respect: 0, attraction: 0, friendship: 0, fear: 0 }),
        [key]: value,
      },
    }));
  };

  const getDefaultMatrix = (charId: string): SixPointMatrix => {
    return matrices[charId] || { romance: 0, trust: 0, respect: 0, attraction: 0, friendship: 0, fear: 0 };
  };

  return (
    <div className="world-panel">
      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'world' ? 'active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          🌍 World
        </button>
        {sceneCharacters.map(char => (
          <button
            key={char.id}
            className={`tab ${activeTab === char.id ? 'active' : ''}`}
            onClick={() => setActiveTab(char.id)}
          >
            👤 {char.name}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'world' && (
          <div className="world-info">
            <h3>{location?.name || 'Unknown Location'}</h3>
            <p className="location-desc">{location?.description || 'You are nowhere...'}</p>
            
            <div className="world-details">
              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value">{location?.type || 'Unknown'}</span>
              </div>
              
              {location?.connections && location.connections.length > 0 && (
                <div className="connections">
                  <span className="label">Connected to:</span>
                  <div className="connection-list">
                    {location.connections.map(connId => (
                      <span key={connId} className="connection-tag">{connId}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {sceneCharacters.length > 0 && (
                <div className="present-characters">
                  <span className="label">Characters present:</span>
                  <div className="character-list">
                    {sceneCharacters.map(char => (
                      <span 
                        key={char.id} 
                        className="character-tag"
                        onClick={() => setActiveTab(char.id)}
                      >
                        {char.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="world-notes">
              <h4>📝 Notes</h4>
              <textarea 
                placeholder="Add notes about this location..."
                defaultValue=""
              />
            </div>
          </div>
        )}
        
        {activeCharacter && (
          <div className="character-info">
            <h3>{activeCharacter.name}</h3>
            <p className="char-desc">{activeCharacter.description || 'No description available'}</p>
            
            <div className="char-details">
              <div className="detail-row">
                <span className="label">Personality:</span>
                <span className="value">{activeCharacter.personality || 'Unknown'}</span>
              </div>
              
              {activeCharacter.background && (
                <div className="detail-row">
                  <span className="label">Background:</span>
                  <span className="value">{activeCharacter.background}</span>
                </div>
              )}
            </div>
            
            <div className="char-stats">
              <h4>📊 Stats</h4>
              {activeCharacter.stats && (
                <div className="mini-stats">
                  <div className="mini-stat">
                    <span>❤️</span>
                    <span>{activeCharacter.stats.health?.current}/{activeCharacter.stats.health?.max}</span>
                  </div>
                  <div className="mini-stat">
                    <span>💧</span>
                    <span>{activeCharacter.stats.mana?.current}/{activeCharacter.stats.mana?.max}</span>
                  </div>
                  <div className="mini-stat">
                    <span>⚡</span>
                    <span>{activeCharacter.stats.stamina?.current}/{activeCharacter.stats.stamina?.max}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="matrix-section">
              <h4>📊 Relationship Matrix</h4>
              <p className="matrix-note">Your relationship with {activeCharacter.name}</p>
              <div className="matrix-grid">
                {(Object.keys(getDefaultMatrix(activeCharacter.id)) as Array<keyof SixPointMatrix>).map(key => (
                  <div key={key} className="matrix-row">
                    <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={getDefaultMatrix(activeCharacter.id)[key]}
                      onChange={(e) => handleMatrixChange(activeCharacter.id, key, parseInt(e.target.value))}
                    />
                    <span className={getDefaultMatrix(activeCharacter.id)[key] >= 0 ? 'positive' : 'negative'}>
                      {getDefaultMatrix(activeCharacter.id)[key] > 0 ? '+' : ''}{getDefaultMatrix(activeCharacter.id)[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .world-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .tab-bar {
          display: flex;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
        }
        
        .tab {
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.75rem;
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
        
        .world-info h3 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }
        
        .location-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        
        .world-details {
          margin-bottom: 1rem;
        }
        
        .detail-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }
        
        .detail-row .label {
          color: var(--text-secondary);
        }
        
        .detail-row .value {
          color: var(--text-primary);
        }
        
        .connections, .present-characters {
          margin-top: 0.75rem;
        }
        
        .connections .label, .present-characters .label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        
        .connection-list, .character-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        
        .connection-tag {
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 0.25rem;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
        
        .character-tag {
          padding: 0.25rem 0.5rem;
          background: rgba(var(--accent-rgb, 139, 92, 246), 0.2);
          border-radius: 0.25rem;
          font-size: 0.7rem;
          color: var(--accent);
          cursor: pointer;
        }
        
        .character-tag:hover {
          background: rgba(var(--accent-rgb, 139, 92, 246), 0.3);
        }
        
        .world-notes h4 {
          margin: 0 0 0.5rem;
          font-size: 0.85rem;
          color: var(--text-primary);
        }
        
        .world-notes textarea {
          width: 100%;
          min-height: 60px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.5rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          resize: vertical;
        }
        
        .character-info h3 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }
        
        .char-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        
        .char-details {
          margin-bottom: 1rem;
        }
        
        .char-stats h4, .matrix-section h4 {
          margin: 0 0 0.5rem;
          font-size: 0.85rem;
          color: var(--text-primary);
        }
        
        .mini-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .mini-stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
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
      `}</style>
    </div>
  );
}

export default WorldPanel;
