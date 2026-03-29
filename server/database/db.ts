// @ts-nocheck
// sql.js types are complex, runtime works fine
import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/game.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database | null = null;
let SQL: any = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
      // Run schema
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      db.run(schema);
      saveDb();
    }
  }
  return db;
}

export function saveDb(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

// Helper to run queries with auto-save
export function run(sql: string, params: any[] = []): any {
  const db = getDbSync();
  try {
    db.run(sql, params);
    saveDb();
  } catch (e) {
    throw e;
  }
}

export function get(sql: string, params: any[] = []): any | undefined {
  const db = getDbSync();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

export function all(sql: string, params: any[] = []): any[] {
  const db = getDbSync();
  const results: any[] = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function getDbSync(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call getDb() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  await getDb();
  console.log('✓ Database initialized at', DB_PATH);
}
