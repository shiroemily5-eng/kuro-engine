// @ts-nocheck
// better-sqlite3 types are complex, runtime works fine
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/game.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const db = getDb();
  
  db.exec(`
    -- Characters
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      personality TEXT,
      appearance TEXT,
      background TEXT,
      stats TEXT NOT NULL DEFAULT '{}',
      relationships TEXT DEFAULT '{}',
      location_id TEXT,
      outfit TEXT DEFAULT '{}',
      sprite_id TEXT,
      is_player INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Locations
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'room',
      parent_id TEXT,
      connections TEXT DEFAULT '[]',
      sprite_id TEXT,
      metadata TEXT DEFAULT '{}',
      FOREIGN KEY (parent_id) REFERENCES locations(id)
    );

    -- Location characters (many-to-many)
    CREATE TABLE IF NOT EXISTS location_characters (
      location_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      arrived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (location_id, character_id),
      FOREIGN KEY (location_id) REFERENCES locations(id),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    -- Items
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'misc',
      effects TEXT DEFAULT '[]',
      value INTEGER DEFAULT 0,
      weight REAL DEFAULT 0,
      sprite_id TEXT
    );

    -- Inventory (character items)
    CREATE TABLE IF NOT EXISTS inventory (
      character_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      equipped INTEGER DEFAULT 0,
      slot TEXT,
      PRIMARY KEY (character_id, item_id),
      FOREIGN KEY (character_id) REFERENCES characters(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    -- Events/Quests
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'story',
      conditions TEXT DEFAULT '[]',
      effects TEXT DEFAULT '[]',
      choices TEXT DEFAULT '[]',
      active INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Active events per character
    CREATE TABLE IF NOT EXISTS character_events (
      character_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      progress TEXT DEFAULT '{}',
      PRIMARY KEY (character_id, event_id),
      FOREIGN KEY (character_id) REFERENCES characters(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    -- Roll history
    CREATE TABLE IF NOT EXISTS rolls (
      id TEXT PRIMARY KEY,
      character_id TEXT,
      type TEXT NOT NULL,
      dice_spec TEXT NOT NULL,
      modifier INTEGER DEFAULT 0,
      target_value INTEGER,
      rolls TEXT NOT NULL,
      total INTEGER NOT NULL,
      success INTEGER,
      critical TEXT DEFAULT 'none',
      context TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    -- World state (key-value store for game state)
    CREATE TABLE IF NOT EXISTS world_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Messages/Chat history
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      character_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    -- Presets
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      system_prompt TEXT,
      post_history_instructions TEXT,
      regex_scripts TEXT DEFAULT '[]',
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- AI Configurations
    CREATE TABLE IF NOT EXISTS ai_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key TEXT NOT NULL,
      model TEXT NOT NULL,
      max_tokens INTEGER DEFAULT 4096,
      temperature REAL DEFAULT 0.7,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_characters_location ON characters(location_id);
    CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);
    CREATE INDEX IF NOT EXISTS idx_messages_character ON messages(character_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
  `);
  
  console.log('✓ Database initialized at', DB_PATH);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
