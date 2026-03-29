import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, run, get, all } from '../database/db.js';

const router = Router();

// GET /api/locations - List all locations
router.get('/', async (req, res) => {
  await getDb();
  const locations = all(`
    SELECT l.*, 
           (SELECT COUNT(*) FROM location_characters WHERE location_id = l.id) as character_count
    FROM locations l
    ORDER BY l.name ASC
  `);
  res.json(locations);
});

// GET /api/locations/:id - Get location with characters
router.get('/:id', async (req, res) => {
  await getDb();
  const location = get('SELECT * FROM locations WHERE id = ?', [req.params.id]);
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  const characters = all(`
    SELECT c.id, c.name, c.description, c.sprite_id
    FROM characters c
    JOIN location_characters lc ON c.id = lc.character_id
    WHERE lc.location_id = ?
  `, [req.params.id]);
  
  const children = all('SELECT id, name, type FROM locations WHERE parent_id = ?', [req.params.id]);
  
  res.json({
    ...location,
    characters,
    children,
    connections: JSON.parse((location as any).connections || '[]'),
    metadata: JSON.parse((location as any).metadata || '{}'),
  });
});

// POST /api/locations - Create location
router.post('/', async (req, res) => {
  await getDb();
  const id = uuid();
  const { name, description, type, parentId, connections, metadata } = req.body;
  
  run(`
    INSERT INTO locations (id, name, description, type, parent_id, connections, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, name, description || '', type || 'room', parentId || null, JSON.stringify(connections || []), JSON.stringify(metadata || {})]);
  
  res.status(201).json({ id, name });
});

// POST /api/locations/:id/enter - Move character to location
router.post('/:id/enter', async (req, res) => {
  await getDb();
  const { characterId } = req.body;
  
  // Remove from current location
  run('DELETE FROM location_characters WHERE character_id = ?', [characterId]);
  
  // Add to new location
  run('INSERT INTO location_characters (location_id, character_id) VALUES (?, ?)', [req.params.id, characterId]);
  
  // Update character's location_id
  run('UPDATE characters SET location_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id, characterId]);
  
  res.json({ message: 'Character moved', locationId: req.params.id });
});

// GET /api/locations/:id/exit - Get connected locations
router.get('/:id/exit', async (req, res) => {
  await getDb();
  const location = get('SELECT connections, parent_id FROM locations WHERE id = ?', [req.params.id]) as any;
  
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  
  const connections = JSON.parse(location.connections || '[]');
  const destinations = connections.length > 0 
    ? all(`SELECT id, name, type FROM locations WHERE id IN (${connections.map(() => '?').join(',')})`, connections)
    : [];
  
  if (location.parent_id) {
    const parent = get('SELECT id, name, type FROM locations WHERE id = ?', [location.parent_id]);
    if (parent) {
      destinations.push({ ...parent, relation: 'parent' });
    }
  }
  
  res.json(destinations);
});

export default router;
