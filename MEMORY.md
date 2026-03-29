# AI TextRPG - Project Memory

## Project Overview
- **Location:** `D:/ai-textrpg`
- **Stack:** React + Vite (frontend), Express + SQLite (backend)
- **Goal:** Lilith's Throne inspired text RPG with AI-powered storytelling

## Key Features
- Character creation with detailed schema
- AI integration (DeepSeek, Gemini via SmolProxy, Google AI Studio)
- Space bypass (U+3164) for Gemini content filter evasion
- World creation modes: RECREATE (canon) / CREATE (original)
- Reasoning/thinking display for supported models
- Streaming responses
- Tabbed UI panels

## UI Structure
### Left Panel (Player)
- 📋 Main - Basic info, quick stats
- 👕 Clothing - Outfit slots
- 📊 Matrix - 6-point relationship values
- 💝 Likes/Dislikes - Preferences
- ⚡ Skills - Abilities list

### Right Panel (World + Characters)
- 🌍 World - Current location, notes
- 👤 [CharName] - Per-character tabs with relationship matrix

### Header
- View toggle: Game / Prompts
- Settings modal

### Prompts View
- Structure overview
- Edit prompts
- Raw API request/response

## Gemini Space Bypass
- **Character:** U+3164 (HANGUL FILLER `ㅤ`) - looks like space
- **Purpose:** Evade content filters by encoding spaces
- **Usage:** Enable `useSpaceBypass: true` in config
- **Implementation:** 
  - Encode: `text.replace(/ /g, '\u3164')` before sending
  - Decode: `text.replace(/\u3164/g, ' ')` for display
- **Preset location:** `D:/content/preset.json`

## Prompt Structure
Files: `src/types/prompt-structure.ts`
1. Main Instruction (system)
2. Reasoning Engine v0.1 (system)
3. Structure (system)
4. Space Replacement (user)
5. Style / Main Instructions (system)
6. Database (system)
7. Chat History (user)
8. Postfill (user)

First 3 system prompts → systemInstruction for Gemini

## World Creation
| Mode | Description | Fields |
|------|-------------|--------|
| **RECREATE** | Canon worlds from existing media | `source`, `pointInTime` |
| **CREATE** | Original scenarios | `scenario`, `premise` |

## Character Schema
Full schema at `src/types/character-schema.ts`:
- Basic info (name, species, height, weight, age, gender, orientation)
- Physical appearance (build, hair, eyes, face, skin, etc.)
- Clothing style
- Skills & abilities
- Speech patterns
- Personality traits
- Sexuality details
- Backstory

## Development
- **Dev server:** `npm run dev` (frontend :5173, backend :3001)
- **Database:** `data/game.db` (SQLite)
- **TypeScript:** ✅ Compiles cleanly
