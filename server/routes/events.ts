import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, run, get, all } from '../database/db.js';

const router = Router();

// GET /api/events - List events
router.get('/', async (req, res) => {
  await getDb();
  const { type, active } = req.query;
  
  let query = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (active !== undefined) {
    query += ' AND active = ?';
    params.push(active === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const events = all(query, params);
  res.json(events.map(e => ({
    ...e,
    conditions: JSON.parse((e as any).conditions || '[]'),
    effects: JSON.parse((e as any).effects || '[]'),
    choices: JSON.parse((e as any).choices || '[]'),
  })));
});

// POST /api/events - Create event
router.post('/', async (req, res) => {
  await getDb();
  const id = uuid();
  const { name, description, type, conditions, effects, choices } = req.body;
  
  run(`
    INSERT INTO events (id, name, description, type, conditions, effects, choices)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, name, description || '', type || 'story', JSON.stringify(conditions || []), JSON.stringify(effects || []), JSON.stringify(choices || [])]);
  
  res.status(201).json({ id, name });
});

// POST /api/events/:id/trigger - Trigger event for character
router.post('/:id/trigger', async (req, res) => {
  await getDb();
  const { characterId } = req.body;
  
  // Check if event exists
  const event = get('SELECT * FROM events WHERE id = ?', [req.params.id]) as any;
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  // Add to character's active events
  run(`INSERT OR REPLACE INTO character_events (character_id, event_id, progress) VALUES (?, ?, '{}')`, [characterId, req.params.id]);
  
  // Mark event as active
  run('UPDATE events SET active = 1 WHERE id = ?', [req.params.id]);
  
  res.json({ 
    message: 'Event triggered',
    event: {
      ...event,
      conditions: JSON.parse(event.conditions || '[]'),
      effects: JSON.parse(event.effects || '[]'),
      choices: JSON.parse(event.choices || '[]'),
    }
  });
});

// POST /api/events/:id/complete - Complete event
router.post('/:id/complete', async (req, res) => {
  await getDb();
  const { characterId } = req.body;
  
  run('UPDATE events SET completed = 1, active = 0 WHERE id = ?', [req.params.id]);
  run('DELETE FROM character_events WHERE character_id = ? AND event_id = ?', [characterId, req.params.id]);
  
  res.json({ message: 'Event completed' });
});

export default router;
