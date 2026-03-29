#!/usr/bin/env tsx
import { initDatabase, closeDatabase } from './db.js';

console.log('Initializing database...');
await initDatabase();
closeDatabase();
console.log('Done!');
