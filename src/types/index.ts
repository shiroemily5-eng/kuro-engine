// Core game types

export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  appearance: string;
  background: string;
  
  // Stats
  stats: CharacterStats;
  
  // Relationships
  relationships: Map<string, Relationship>;
  
  // Position in world
  locationId: string | null;
  
  // Outfit system
  outfit: Outfit;
  
  // Sprite reference
  spriteId: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterStats {
  // Primary
  health: StatBar;
  mana: StatBar;
  stamina: StatBar;
  
  // Needs (LT-style)
  hunger: StatBar;
  thirst: StatBar;
  fatigue: StatBar;
  cleanliness: StatBar;
  bladder: StatBar;
  
  // Social/Combat
  arousal: StatBar;
  pain: StatBar;
  
  // Attributes
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  willpower: number;
}

export interface StatBar {
  current: number;
  max: number;
  min?: number;
  regenRate?: number;
}

export interface Relationship {
  targetId: string;
  type: 'friend' | 'enemy' | 'lover' | 'family' | 'neutral';
  value: number; // -100 to 100
  trust: number;
  attraction: number;
}

export interface Outfit {
  id: string;
  name: string;
  slots: Map<OutfitSlot, ClothingItem>;
}

export type OutfitSlot = 
  | 'head' | 'neck' | 'torso' | 'arms' 
  | 'hands' | 'legs' | 'feet' | 'accessory';

export interface ClothingItem {
  id: string;
  name: string;
  description: string;
  slot: OutfitSlot;
  effects?: StatEffect[];
  spriteId?: string;
}

export interface StatEffect {
  stat: keyof CharacterStats;
  value: number;
  type: 'flat' | 'percent';
}

// World/Location
export interface Location {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  parentId: string | null; // For nested locations (building -> room)
  children: string[];
  connections: string[]; // Connected location IDs
  characters: string[]; // Character IDs present
  items: string[];
  events: string[];
  spriteId?: string;
}

export type LocationType = 
  | 'world' | 'region' | 'city' | 'district' 
  | 'building' | 'room' | 'outdoor' | 'dungeon';

// Events/Quests
export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: 'quest' | 'random' | 'story' | 'daily';
  conditions: EventCondition[];
  effects: EventEffect[];
  choices?: EventChoice[];
  active: boolean;
  completed: boolean;
}

export interface EventCondition {
  type: 'stat' | 'location' | 'item' | 'relationship' | 'time' | 'flag';
  target: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'has';
  value: any;
}

export interface EventEffect {
  type: 'stat' | 'item' | 'relationship' | 'location' | 'flag' | 'spawn';
  target: string;
  value: any;
}

export interface EventChoice {
  id: string;
  text: string;
  conditions?: EventCondition[];
  effects?: EventEffect[];
  nextEventId?: string;
}

// Items
export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'key' | 'misc';
  effects?: StatEffect[];
  value?: number;
  weight?: number;
  spriteId?: string;
}

// Roll System
export interface RollRequest {
  id: string;
  type: 'action' | 'skill' | 'random' | 'combat';
  dice: DiceSpec;
  modifier: number;
  targetValue?: number;
  description: string;
  context: string;
}

export interface DiceSpec {
  count: number;
  sides: number;
  bonus?: number;
}

export interface RollResult {
  request: RollRequest;
  rolls: number[];
  total: number;
  success: boolean;
  critical: 'none' | 'success' | 'failure';
  description: string;
}

// AI Integration
export interface AIConfig {
  provider: 'openai' | 'deepseek' | 'gemini' | 'vertexai' | 'custom';
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Gemini-specific extensions
export interface GeminiExtendedConfig extends AIConfig {
  // Reasoning/thinking (always on for Gemini thinking models)
  thinkingLevel?: 'none' | 'low' | 'medium' | 'high';
  showThoughts?: boolean;  // Visibility only - reasoning always generates
  
  // Function calling
  functionCalling?: boolean;
  functionDeclarations?: GeminiFunctionDecl[];
  
  // Web search
  enableWebSearch?: boolean;
  
  // Image generation
  responseModalities?: ('TEXT' | 'IMAGE')[];
  
  // Additional generation config
  topK?: number;       // 0-100
  topP?: number;       // 0-1
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  
  // Content bypass
  useSpaceBypass?: boolean;  // Replace spaces with U+3164 to evade filters
  
  // Vertex AI specific
  location?: string;      // e.g., 'us-central1'
  projectId?: string;     // GCP project ID
  
  // Backward compat
  includeReasoning?: boolean;  // Deprecated: use showThoughts
}

// World creation modes
export interface WorldCreationConfig {
  mode: 'recreate' | 'create';
  // Recreate: Canon worlds from existing media
  source?: string;           // e.g., "Harry Potter", "Naruto"
  pointInTime?: string;      // Specific arc/plot point: "Season 3, Episode 5", "Post-timeskip"
  // Create: Original scenarios
  scenario?: string;         // Starting situation
  premise?: string;          // What's going on in the simulation
  // Shared
  genre?: string;
  tone?: string;
  customInstructions?: string;
}

export interface GeminiFunctionDecl {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  config: AIConfig;
  context?: GameContext;
}

export interface GameContext {
  character: Character | null;
  location: Location | null;
  recentEvents: GameEvent[];
  activeQuests: GameEvent[];
  worldState: Record<string, any>;
}

// Presets (ST-style)
export interface Preset {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  postHistoryInstructions: string;
  regexScripts: RegexScript[];
  settings: Partial<AIConfig>;
}

export interface RegexScript {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  type: 'find' | 'replace' | 'block';
  enabled: boolean;
}

// Character Card (v2/v3 format)
export interface CharacterCard {
  spec: 'chara_card_v2' | 'chara_card_v3';
  spec_version: string;
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    alternate_greetings?: string[];
    character_book?: CharacterBook;
    tags?: string[];
    creator?: string;
    character_version?: string;
    extensions?: Record<string, any>;
  };
}

export interface CharacterBook {
  entries: CharacterBookEntry[];
}

export interface CharacterBookEntry {
  keys: string[];
  content: string;
  extensions?: Record<string, any>;
  enabled: boolean;
  insertion_order: number;
}
