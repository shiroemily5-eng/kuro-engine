import type { Character } from '../types';

interface Props {
  character: Character | null;
}

function StatsPanel({ character }: Props) {
  if (!character) return null;

  const renderStatBar = (name: string, stat: { current: number; max: number }, colorClass: string) => (
    <div className="stat-bar">
      <div className="stat-bar-header">
        <span>{name}</span>
        <span>{stat.current}/{stat.max}</span>
      </div>
      <div className="stat-bar-track">
        <div 
          className={`stat-bar-fill ${colorClass}`}
          style={{ width: `${(stat.current / stat.max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Stats</span>
      </div>
      
      {renderStatBar('Health', character.stats.health, 'health')}
      {renderStatBar('Mana', character.stats.mana, 'mana')}
      {renderStatBar('Stamina', character.stats.stamina, 'stamina')}
      
      <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div className="stat-bar-header">
          <span>Needs</span>
        </div>
        {renderStatBar('Hunger', character.stats.hunger, 'hunger')}
        {renderStatBar('Thirst', character.stats.thirst, 'thirst')}
        {renderStatBar('Fatigue', character.stats.fatigue, 'fatigue')}
      </div>
      
      <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div className="stat-bar-header">
          <span>Attributes</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <div>STR: {character.stats.strength}</div>
          <div>AGI: {character.stats.agility}</div>
          <div>INT: {character.stats.intelligence}</div>
          <div>CHA: {character.stats.charisma}</div>
          <div>WIL: {character.stats.willpower}</div>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
