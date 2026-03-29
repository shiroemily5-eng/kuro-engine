import { useState, useEffect } from 'react';
import type { Location, Character } from '../types';

interface Props {
  location: Location | null;
  character: Character | null;
  onLocationChange: (loc: Location) => void;
}

function LocationPanel({ location, character, onLocationChange }: Props) {
  const [exits, setExits] = useState<Location[]>([]);

  useEffect(() => {
    if (location) {
      fetch(`/api/locations/${location.id}/exit`)
        .then(res => res.json())
        .then(setExits)
        .catch(console.error);
    }
  }, [location]);

  const handleMove = async (targetId: string) => {
    if (!character) return;
    
    const res = await fetch(`/api/locations/${targetId}/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: character.id }),
    });
    
    if (res.ok) {
      const locRes = await fetch(`/api/locations/${targetId}`);
      const newLoc = await locRes.json();
      onLocationChange(newLoc);
    }
  };

  if (!location) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Location</span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          No location set. Generate a starting location.
        </p>
        <button 
          style={{ marginTop: '0.5rem', width: '100%' }}
          onClick={async () => {
            const res = await fetch('/api/locations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name: 'Starting Area', 
                description: 'A quiet clearing in a forest. Birds sing overhead.',
                type: 'outdoor' 
              }),
            });
            const data = await res.json();
            const locRes = await fetch(`/api/locations/${data.id}`);
            onLocationChange(await locRes.json());
          }}
        >
          Generate Starting Location
        </button>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{location.name}</span>
      </div>
      
      <p className="location-desc">{location.description}</p>
      
      {location.characters && location.characters.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Present:
          </div>
          <ul className="location-characters">
            {location.characters.map((c: any) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </div>
      )}
      
      {exits.length > 0 && (
        <div className="location-exits">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Exits:
          </div>
          {exits.map((exit: any) => (
            <button key={exit.id} onClick={() => handleMove(exit.id)}>
              → {exit.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationPanel;
