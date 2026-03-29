import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, run, get, all } from '../database/db.js';

const router = Router();

router.get('/', async (req, res) => {
  await getDb();
  const presets = all('SELECT id, name, description, created_at FROM presets ORDER BY name ASC');
  res.json(presets);
});

router.get('/:id', async (req, res) => {
  await getDb();
  const preset = get('SELECT * FROM presets WHERE id = ?', [req.params.id]);
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  res.json({
    ...preset,
    regex_scripts: JSON.parse((preset as any).regex_scripts || '[]'),
    settings: JSON.parse((preset as any).settings || '{}'),
  });
});

router.post('/', async (req, res) => {
  await getDb();
  const id = uuid();
  const { name, description, systemPrompt, postHistoryInstructions, regexScripts, settings } = req.body;
  
  run(`INSERT INTO presets (id, name, description, system_prompt, post_history_instructions, regex_scripts, settings) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, description || '', systemPrompt || '', postHistoryInstructions || '', JSON.stringify(regexScripts || []), JSON.stringify(settings || {})]);
  
  res.status(201).json({ id, name });
});

router.put('/:id', async (req, res) => {
  await getDb();
  const { name, description, systemPrompt, postHistoryInstructions, regexScripts, settings } = req.body;
  
  run(`UPDATE presets SET name = COALESCE(?, name), description = COALESCE(?, description), system_prompt = COALESCE(?, system_prompt), post_history_instructions = COALESCE(?, post_history_instructions), regex_scripts = COALESCE(?, regex_scripts), settings = COALESCE(?, settings) WHERE id = ?`,
    [name, description, systemPrompt, postHistoryInstructions, regexScripts ? JSON.stringify(regexScripts) : null, settings ? JSON.stringify(settings) : null, req.params.id]);
  
  res.json({ message: 'Preset updated' });
});

router.delete('/:id', async (req, res) => {
  await getDb();
  run('DELETE FROM presets WHERE id = ?', [req.params.id]);
  res.json({ message: 'Preset deleted' });
});

router.post('/import', async (req, res) => {
  await getDb();
  const preset = req.body;
  
  const id = uuid();
  run(`INSERT INTO presets (id, name, description, system_prompt, post_history_instructions, regex_scripts, settings) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, preset.name, preset.description || '', preset.systemPrompt || preset.system_prompt || '', preset.postHistoryInstructions || preset.post_history_instructions || '', JSON.stringify(preset.regexScripts || preset.regex_scripts || []), JSON.stringify(preset.settings || {})]);
  
  res.status(201).json({ id, name: preset.name });
});

router.get('/export/:id', async (req, res) => {
  await getDb();
  const preset = get('SELECT * FROM presets WHERE id = ?', [req.params.id]) as any;
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  
  const exportData = {
    name: preset.name,
    description: preset.description,
    systemPrompt: preset.system_prompt,
    postHistoryInstructions: preset.post_history_instructions,
    regexScripts: JSON.parse(preset.regex_scripts || '[]'),
    settings: JSON.parse(preset.settings || '{}'),
    exportedAt: new Date().toISOString(),
  };
  
  res.setHeader('Content-Disposition', `attachment; filename="${preset.name}.json"`);
  res.json(exportData);
});

export default router;
