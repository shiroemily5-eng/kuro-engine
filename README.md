# AI TextRPG

A text-based RPG with full AI integration, inspired by SillyTavern and Lilith's Throne.

## Features

- 🎭 Dynamic character creation with AI assistance
- 🗺️ Procedural location/world generation
- 🎲 Roll system for actions and random events
- 💬 AI-powered narrative with multiple model support
- 📊 Character stats (needs, attributes, combat)
- 🎨 Sprite support for characters and locations

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **AI:** OpenAI-compatible API (DeepSeek, SmolProxy, etc.)

## Getting Started

```bash
# Install dependencies
npm install

# Initialize database
npm run db:init

# Start development server
npm run dev
```

This runs both the frontend (port 3000) and backend (port 3001).

## Project Structure

```
ai-textrpg/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── systems/            # Game logic systems
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── server/                 # Backend Express app
│   ├── database/           # SQLite schema & init
│   ├── routes/             # API routes
│   └── models/             # Data models
├── data/                   # SQLite database files
├── assets/                 # Sprites, maps, UI assets
└── public/                 # Static files
```

## API Endpoints

| Route | Description |
|-------|-------------|
| `/api/characters` | CRUD for characters |
| `/api/locations` | World/room management |
| `/api/events` | Quests and events |
| `/api/rolls` | Dice rolling system |
| `/api/ai/chat` | AI chat completion |
| `/api/ai/generate-*` | AI generation endpoints |
| `/api/presets` | Prompt presets |

## AI Configuration

Supports multiple AI providers via OpenAI-compatible API:

- **DeepSeek** (cheap, cheap-reasoner)
- **SmolProxy** (GPT, Gemini, GLM)
- **Custom endpoints**

Configure in Settings or via API.

## Roadmap

- [ ] Image generation (Imagen) for sprites
- [ ] Character card import (v2/v3)
- [ ] Advanced outfit system
- [ ] Map visualization
- [ ] Save/load game states
- [ ] Multi-character parties

---

Built with 💜 by Celine & Kuro
