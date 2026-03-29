import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, run, all } from '../database/db.js';

const router = Router();

interface DiceSpec {
  count: number;
  sides: number;
  bonus?: number;
}

function rollDice(spec: DiceSpec): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < spec.count; i++) {
    rolls.push(Math.floor(Math.random() * spec.sides) + 1);
  }
  return rolls;
}

function evaluateRoll(rolls: number[], target?: number): { success: boolean; critical: 'none' | 'success' | 'failure' } {
  if (rolls.length === 1 && rolls[0] === 20) {
    return { success: true, critical: 'success' };
  }
  if (rolls.length === 1 && rolls[0] === 1) {
    return { success: false, critical: 'failure' };
  }
  
  const total = rolls.reduce((a, b) => a + b, 0);
  if (target !== undefined) {
    return { success: total >= target, critical: 'none' };
  }
  
  return { success: true, critical: 'none' };
}

router.post('/', async (req, res) => {
  await getDb();
  const { characterId, type, dice, modifier, targetValue, description, context } = req.body;
  
  const diceSpec: DiceSpec = dice;
  const rolls = rollDice(diceSpec);
  const total = rolls.reduce((a, b) => a + b, 0) + (modifier || 0);
  const { success, critical } = evaluateRoll(rolls, targetValue);
  
  const id = uuid();
  
  run(`INSERT INTO rolls (id, character_id, type, dice_spec, modifier, target_value, rolls, total, success, critical, context) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, characterId || null, type, JSON.stringify(diceSpec), modifier || 0, targetValue || null, JSON.stringify(rolls), total, success ? 1 : 0, critical, context || '']);
  
  const rollDesc = generateRollDescription(type, rolls, total, success, critical);
  
  res.json({
    request: { id, type, dice: diceSpec, modifier: modifier || 0, targetValue, description, context: context || '' },
    rolls,
    total,
    success,
    critical,
    description: rollDesc,
  });
});

function generateRollDescription(type: string, rolls: number[], total: number, success: boolean, critical: string): string {
  const rollStr = rolls.join(' + ');
  
  if (critical === 'success') {
    return `🎯 CRITICAL SUCCESS! Natural ${rolls[0]}! Total: ${total}`;
  }
  if (critical === 'failure') {
    return `💀 CRITICAL FAILURE! Natural ${rolls[0]}! Total: ${total}`;
  }
  
  return `🎲 Rolled [${rollStr}] = ${total} (${success ? '✓ Success' : '✗ Failure'})`;
}

router.get('/history', async (req, res) => {
  await getDb();
  const { characterId, limit = 50 } = req.query;
  
  let query = 'SELECT * FROM rolls WHERE 1=1';
  const params: any[] = [];
  
  if (characterId) {
    query += ' AND character_id = ?';
    params.push(characterId);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit));
  
  const rolls = all(query, params);
  res.json(rolls.map(r => ({
    ...r,
    dice_spec: JSON.parse((r as any).dice_spec || '{}'),
    rolls: JSON.parse((r as any).rolls || '[]'),
  })));
});

router.post('/random-event', async (req, res) => {
  await getDb();
  const { characterId, locationId } = req.body;
  
  const dice = { count: 1, sides: 100 };
  const rolls = rollDice(dice);
  const roll = rolls[0];
  
  let eventType = null;
  let eventRarity = 'common';
  
  if (roll >= 95) {
    eventType = 'rare';
    eventRarity = 'rare';
  } else if (roll >= 80) {
    eventType = 'uncommon';
    eventRarity = 'uncommon';
  } else if (roll >= 50) {
    eventType = 'common';
    eventRarity = 'common';
  }
  
  res.json({
    roll,
    eventType,
    eventRarity,
    message: eventType 
      ? `🎲 Random event check: ${roll} - ${eventRarity.toUpperCase()} event triggered!`
      : `🎲 Random event check: ${roll} - Nothing unusual happens.`,
  });
});

export default router;
