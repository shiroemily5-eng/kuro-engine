import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, run, get, all, saveDb } from '../database/db.js';
import type { Character, CharacterStats } from '../../src/types/index.js';

const router = Router();

const DEFAULT_STATS: CharacterStats = {
  health: { current: 100, max: 100 },
  mana: { current: 100, max: 100 },
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
};

// GET /api/characters - List all characters
router.get('/', async (req, res) => {
  await getDb();
  const characters = all(`
    SELECT id, name, description, location_id, is_player, created_at 
    FROM characters 
    ORDER BY is_player DESC, name ASC
  `);
  res.json(characters);
});

// GET /api/characters/:id - Get character by ID
router.get('/:id', async (req, res) => {
  await getDb();
  const char = get('SELECT * FROM characters WHERE id = ?', [req.params.id]);
  if (!char) {
    return res.status(404).json({ error: 'Character not found' });
  }
  res.json({
    ...char,
    stats: JSON.parse(char.stats as string || '{}'),
    relationships: JSON.parse(char.relationships as string || '{}'),
    outfit: JSON.parse(char.outfit as string || '{}'),
  });
});

// POST /api/characters - Create new character
router.post('/', async (req, res) => {
  await getDb();
  const id = uuid();
  const { name, description, personality, appearance, background, isPlayer, stats } = req.body;
  
  const finalStats = { ...DEFAULT_STATS, ...stats };
  
  run(`
    INSERT INTO characters (id, name, description, personality, appearance, background, stats, is_player)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, name, description || '', personality || '', appearance || '', background || '', JSON.stringify(finalStats), isPlayer ? 1 : 0]);
  
  res.status(201).json({ id, name, message: 'Character created' });
});

// PUT /api/characters/:id - Update character
router.put('/:id', async (req, res) => {
  await getDb();
  const { name, description, personality, appearance, background, stats, locationId } = req.body;
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (personality !== undefined) { updates.push('personality = ?'); values.push(personality); }
  if (appearance !== undefined) { updates.push('appearance = ?'); values.push(appearance); }
  if (background !== undefined) { updates.push('background = ?'); values.push(background); }
  if (stats !== undefined) { updates.push('stats = ?'); values.push(JSON.stringify(stats)); }
  if (locationId !== undefined) { updates.push('location_id = ?'); values.push(locationId); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  
  run(`UPDATE characters SET ${updates.join(', ')} WHERE id = ?`, values);
  res.json({ message: 'Character updated' });
});

// PUT /api/characters/:id/stats - Update specific stat
router.put('/:id/stats', async (req, res) => {
  await getDb();
  const { stat, value, max } = req.body;
  
  const char = get('SELECT stats FROM characters WHERE id = ?', [req.params.id]) as any;
  if (!char) {
    return res.status(404).json({ error: 'Character not found' });
  }
  
  const stats = JSON.parse(char.stats);
  
  if (stats[stat]) {
    if (value !== undefined) stats[stat].current = value;
    if (max !== undefined) stats[stat].max = max;
  } else {
    return res.status(400).json({ error: 'Invalid stat' });
  }
  
  run('UPDATE characters SET stats = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(stats), req.params.id]);
  
  res.json({ stat, value: stats[stat] });
});

// DELETE /api/characters/:id
router.delete('/:id', async (req, res) => {
  await getDb();
  run('DELETE FROM characters WHERE id = ?', [req.params.id]);
  res.json({ message: 'Character deleted' });
});

// POST /api/characters/import - Import from Character Card
router.post('/import', async (req, res) => {
  await getDb();
  const card = req.body; // CharacterCard format
  
  if (!card.data?.name) {
    return res.status(400).json({ error: 'Invalid character card format' });
  }
  
  const id = uuid();
  const { name, description, personality, scenario, first_mes, system_prompt } = card.data;
  
  run(`
    INSERT INTO characters (id, name, description, personality, background, stats)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, name, description || '', personality || '', scenario || '', JSON.stringify(DEFAULT_STATS)]);
  
  res.status(201).json({ id, name, firstMessage: first_mes, systemPrompt: system_prompt });
});

export default router;
