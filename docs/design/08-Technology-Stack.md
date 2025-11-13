# Technology Stack Recommendations

## Backend

### Primary Language: Python
**Rationale**: Best LLM framework support, strong AI/ML ecosystem

### Web Framework: FastAPI
- Async support for real-time features
- Automatic API documentation
- Built-in WebSocket support
- Type hints and validation (Pydantic)
- High performance

### Alternative: Node.js + Express
- Good for real-time (Socket.io)
- Large ecosystem
- Easy deployment

## AI & Agent Orchestration

### Agent Framework Options

#### Option 1: LangChain + LangGraph (Recommended)
**Pros:**
- Mature ecosystem
- Built-in agent workflows
- Strong LLM integration
- RAG support out of the box
- Good documentation

**Cons:**
- Can be complex for simple use cases
- Some performance overhead

```python
from langgraph.graph import StateGraph
from langchain.agents import AgentExecutor

# DM Agent workflow
dm_workflow = StateGraph()
dm_workflow.add_node("process_action", process_action)
dm_workflow.add_node("query_rules", query_rules_db)
dm_workflow.add_node("generate_narrative", generate_narrative)
```

#### Option 2: AutoGen (Microsoft Research)
**Pros:**
- Excellent multi-agent conversations
- Good at agent-to-agent collaboration
- Newer, actively developed

**Cons:**
- Less mature than LangChain
- Smaller community

#### Option 3: Custom with Redis Pub/Sub
**Pros:**
- Maximum control
- Lightweight
- Good for microservices

**Cons:**
- More development work
- Need to build abstractions

### LLM Providers

#### Primary: OpenAI
- **GPT-4 Turbo**: DM Agent, Campaign Assistant
- **GPT-4o-mini**: Player Agents (cost-effective)
- **DALL-E 3**: Image generation
- **text-embedding-3**: Embeddings for RAG

**Pricing:**
- GPT-4 Turbo: $0.01/1K input, $0.03/1K output
- GPT-4o-mini: $0.0001/1K input, $0.0004/1K output
- DALL-E 3 (1024): $0.040/image

#### Alternative: Anthropic Claude
- **Claude 3.5 Sonnet**: DM Agent (excellent reasoning)
- **Claude 3 Haiku**: Player Agents (fast, cheap)

**Pricing:**
- Sonnet: $0.003/1K input, $0.015/1K output
- Haiku: $0.00025/1K input, $0.00125/1K output

#### Self-Hosted Option: Ollama
- **Llama 3**: For cost-sensitive deployments
- **Mistral**: Good balance of quality/speed
- **Requires**: GPU server (NVIDIA A100 or similar)

## Database

### Primary: PostgreSQL
**For:**
- User accounts
- Character sheets
- Campaign data
- Rule systems
- Relational data

**Schema Example:**
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  dm_user_id UUID REFERENCES users(id),
  rule_system_id UUID REFERENCES rule_systems(id),
  created_at TIMESTAMP
);

CREATE TABLE characters (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  owner_id UUID REFERENCES users(id),
  class VARCHAR(100),
  level INTEGER,
  stats JSONB,
  created_at TIMESTAMP
);
```

### Document Store: MongoDB (Optional)
**For:**
- Session logs
- Complex nested data
- Flexible schema evolution

### Cache & Session State: Redis
**For:**
- Active game sessions
- Real-time state
- Rate limiting
- Message queue

```python
# Store active game state
redis.setex(
    f"session:{session_id}",
    3600,  # 1 hour TTL
    json.dumps(game_state)
)
```

### Vector Database: Pinecone or Weaviate

#### Pinecone (Cloud, Recommended)
**Pros:**
- Managed service
- Easy setup
- Good performance
- Generous free tier

**Use for:**
- Rule system embeddings
- PDF content search
- Campaign lore search

```python
import pinecone

# Initialize
pinecone.init(api_key="key")
index = pinecone.Index("dnd-rules")

# Query for rules
results = index.query(
    vector=embedding,
    filter={"rule_system_id": "abc123"},
    top_k=5
)
```

#### Weaviate (Self-Hosted Alternative)
**Pros:**
- Open source
- GraphQL API
- Can run locally

## Frontend

### Framework: Next.js 14+ (React)
**Rationale:**
- Server and client components
- Built-in API routes
- Excellent performance
- Great developer experience
- Static + dynamic rendering

**Alternatives:**
- **SvelteKit**: Lighter, faster
- **Vue + Nuxt**: Good ergonomics

### UI Components: shadcn/ui + Tailwind CSS
**Rationale:**
- Beautiful, accessible components
- Fully customizable
- Copy-paste approach (not a dependency)
- Built on Radix UI primitives

**Alternative:** Material-UI (MUI)

### State Management: Zustand
**Rationale:**
- Simple, minimal boilerplate
- Good TypeScript support
- Small bundle size

```typescript
import create from 'zustand'

interface GameState {
  currentTurn: string;
  characters: Character[];
  nextTurn: () => void;
}

const useGameStore = create<GameState>((set) => ({
  currentTurn: null,
  characters: [],
  nextTurn: () => set((state) => ({
    currentTurn: getNextCharacter(state.characters)
  }))
}));
```

**Alternative:** Redux Toolkit (for complex state)

### Real-Time Communication: Socket.io
**For:**
- Multiplayer synchronization
- Live dice rolls
- Turn updates
- Chat messages

```typescript
// Client
const socket = io('https://api.example.com');

socket.on('turn_update', (data) => {
  updateGameState(data);
});

// Server
io.to(sessionId).emit('turn_update', {
  currentTurn: characterId,
  timestamp: Date.now()
});
```

### Battle Map Rendering

#### Option 1: Pixi.js
**Pros:**
- High performance WebGL
- Good for complex maps
- Rich feature set

```typescript
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
  width: 800,
  height: 600
});

// Render grid
const graphics = new PIXI.Graphics();
graphics.lineStyle(1, 0x000000, 0.3);
for (let x = 0; x < 40; x++) {
  graphics.moveTo(x * 20, 0);
  graphics.lineTo(x * 20, 600);
}
```

#### Option 2: Konva.js
**Pros:**
- Canvas-based
- Easier than Pixi
- Good docs

#### Option 3: React-based (Simple)
**Pros:**
- Pure React
- Easy to understand
- Good for MVP

```tsx
const BattleMap = () => {
  return (
    <div className="grid grid-cols-30 gap-0">
      {Array(900).fill(0).map((_, i) => (
        <GridSquare key={i} index={i} />
      ))}
    </div>
  );
};
```

### Dice Roller: dice-ui or Custom
**Library:** `dice-ui` or build with Framer Motion

```tsx
import { motion } from 'framer-motion';

const DiceRoller = ({ onRoll }) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.5 }}
      onClick={onRoll}
    >
      🎲
    </motion.div>
  );
};
```

## File Storage

### Images/Assets: AWS S3 or Cloudflare R2
**For:**
- Generated images
- Character portraits
- Maps
- User uploads

**CDN:** CloudFlare (free, fast)

```python
# Upload to S3
import boto3

s3 = boto3.client('s3')
s3.upload_file(
    'generated_map.png',
    'dnd-app-assets',
    f'maps/{session_id}/{map_id}.png'
)
```

### PDFs: AWS S3 with presigned URLs
**For:**
- User-uploaded rulebooks
- Private access
- Temporary download links

## PDF Processing

### Text Extraction: PyPDF2 or pdfplumber
```python
import pdfplumber

with pdfplumber.open('rulebook.pdf') as pdf:
    text = ''
    for page in pdf.pages:
        text += page.extract_text()
```

### Table Extraction: Camelot or Tabula
**For:** Extracting stat blocks and tables

## Authentication & Authorization

### Auth Provider: Supabase or Auth0
**Supabase (Recommended):**
- Open source
- PostgreSQL integration
- Row-level security
- Real-time subscriptions

**Auth0:**
- Mature
- Many integrations
- Social login

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Sign up
const { user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

## Deployment

### Backend: Docker + Kubernetes
**Or:** AWS ECS, Google Cloud Run, Railway

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend: Vercel
**Best for Next.js:**
- One-click deploy
- Edge functions
- Excellent performance
- Free tier

**Alternative:** Netlify, CloudFlare Pages

### Database: Supabase (managed Postgres)
**Alternative:** AWS RDS, Neon, PlanetScale

## Development Tools

### API Documentation: FastAPI auto-docs + Swagger UI
```python
from fastapi import FastAPI

app = FastAPI(
    title="D&D App API",
    version="1.0.0",
    docs_url="/api/docs"
)
```

### Testing
- **Backend:** pytest
- **Frontend:** Vitest + React Testing Library
- **E2E:** Playwright

### Type Safety
- **Backend:** Python type hints + mypy
- **Frontend:** TypeScript (strict mode)

### Code Quality
- **Linting:** ESLint, Prettier (frontend); Black, Ruff (backend)
- **Pre-commit hooks:** Husky

## Monitoring & Logging

### Application Monitoring: Sentry
- Error tracking
- Performance monitoring
- User feedback

### Logging: Structured JSON logs
```python
import structlog

log = structlog.get_logger()
log.info("dm_action_processed", 
         session_id=session_id,
         action_type=action_type,
         duration_ms=duration)
```

### Metrics: Prometheus + Grafana (optional)

## Cost Estimates (Monthly)

### MVP (100 active users, 500 sessions/month):
- **OpenAI API**: $300-500
- **Image Generation**: $200-300
- **Database (Supabase)**: $25
- **Vector DB (Pinecone)**: $0 (free tier)
- **File Storage (S3)**: $20
- **Hosting (Railway/Render)**: $50-100
- **CDN (CloudFlare)**: $0 (free)
- **Auth (Supabase)**: Included
- **Total: $600-950/month**

### Scale (1000 active users, 5000 sessions/month):
- **OpenAI API**: $3,000-5,000
- **Image Generation**: $2,000-3,000
- **Database**: $100-200
- **Vector DB**: $70
- **File Storage**: $200
- **Hosting**: $500-1000
- **Total: $5,870-9,470/month**

## Recommended Starting Stack

```yaml
Backend:
  Framework: FastAPI
  Language: Python 3.11+
  Agent: LangChain + LangGraph
  LLM: OpenAI (GPT-4 Turbo + GPT-4o-mini)
  Image: DALL-E 3

Database:
  Primary: Supabase (PostgreSQL)
  Cache: Redis
  Vector: Pinecone

Frontend:
  Framework: Next.js 14
  Language: TypeScript
  UI: shadcn/ui + Tailwind
  State: Zustand
  Realtime: Socket.io
  Map: Konva.js or Pixi.js

Storage:
  Files: AWS S3
  CDN: CloudFlare

Auth: Supabase Auth

Deployment:
  Frontend: Vercel
  Backend: Railway or Render
  Database: Supabase

Monitoring: Sentry
```

This stack provides:
- ✅ Fast development velocity
- ✅ Excellent DX (developer experience)
- ✅ Production-ready
- ✅ Scalable
- ✅ Cost-effective at MVP stage
- ✅ Type-safe end-to-end
