import express from 'express';
import cors from 'cors';
import { initDatabase } from './database/db.js';
import charactersRouter from './routes/characters.js';
import locationsRouter from './routes/locations.js';
import eventsRouter from './routes/events.js';
import rollsRouter from './routes/rolls.js';
import aiRouter from './routes/ai.js';
import presetsRouter from './routes/presets.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/characters', charactersRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/rolls', rollsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/presets', presetsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`🎮 AI TextRPG Server running on http://localhost:${PORT}`);
});
