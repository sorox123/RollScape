# RollScape

A browser-based virtual tabletop for D&D 5e: character sheets, campaigns, combat tracking, a battle map, and physics-based 3D dice. It can also run an automated Dungeon Master and AI party members through the OpenAI API, with a mock mode so the whole app runs locally without API keys.

> **Status:** Personal project, work in progress. Not deployed. Last active December 2025.

---

## What it does

- **Character sheets** for D&D 5e: ability scores, skills, combat stats, spells, equipment, biography. Includes import from a filled-in character sheet PDF.
- **Campaigns and sessions**: create public or private campaigns, invite players, track sessions and logs.
- **Combat**: initiative tracker and a 2D battle map (Konva canvas).
- **Dice**: a notation parser on the backend (`2d20kh1`, `4d6dl1`, modifiers) and a 3D dice roller on the frontend using Three.js and cannon-es physics. Includes hand-tuned geometry, face detection and texture atlases for d4 through d20 plus d100.
- **Spells and abilities**: browse and create, seeded from SRD data.
- **Real-time play** over WebSockets.
- **Optional AI features**: DM agent, player agents that vote on party decisions, and generated NPCs, items, maps and portraits.

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic |
| Database | PostgreSQL 15, Redis 7 (both in `docker-compose.yml`) |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind, Zustand |
| Graphics | Three.js + cannon-es (3D dice), Konva (battle map) |
| Other | WebSockets, Stripe (payments scaffold), OpenAI API, pytest, Jest |

## Data model

About 24 PostgreSQL tables managed through Alembic migrations. The core ones:

- `users`, `friendships`, `blocked_users`
- `campaigns`, `campaign_members`, `game_sessions`, `session_logs`
- `characters`, `character_effects`, `spells`, `character_spells`
- `conversations`, `conversation_participants`, `messages`
- `lore_entries`, `worlds`, plus tables for generated content and dice textures

Models are in [`backend/models/`](backend/models/) and migrations in [`backend/migrations/`](backend/migrations/). The reasoning behind choosing PostgreSQL is written up in [`docs/DATABASE_DECISION.md`](docs/DATABASE_DECISION.md).

## Project structure

```
backend/
  api/          FastAPI routers (characters, campaigns, combat, dice, spells, ...)
  models/       SQLAlchemy models
  migrations/   Alembic migrations
  game_logic/   Combat, inventory and session managers
  services/     External service wrappers, each with a mock version
  agents/       DM and player agents
frontend/
  app/          Next.js routes
  components/   UI, character sheet, dice, combat, map, ...
docs/           Design docs, dice geometry notes, API reference
```

## Running it locally

**Requirements:** Python 3.11+, Node 18+, Docker (for Postgres and Redis).

```bash
# 1. Start PostgreSQL and Redis
docker-compose up -d

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # MOCK_MODE=true by default, no API keys needed
alembic upgrade head
uvicorn main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

- App: http://localhost:3000
- API docs (Swagger): http://localhost:8000/docs

With `MOCK_MODE=true`, the OpenAI, image-generation and Redis services are replaced by local mocks, so everything runs for free. Set it to `false` and add real keys in `.env` to use the live services.

## Tests

```bash
cd backend && pytest
```

Backend tests cover dice, auth, campaigns, characters, combat, spells, inventory and the agents. The frontend has Jest configured but no tests yet.

## What's not done

- Not deployed anywhere; local development only
- Multiplayer sync and homebrew content are partly built
- Payments and the marketplace are scaffolded, not production-ready

## License

N/A, conceptual work.
