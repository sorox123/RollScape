# DM Agent - AI Dungeon Master

The DM Agent is RollScape's AI-powered Dungeon Master using LangChain and GPT-4 Turbo.

## Features

- **Multiple Personality Styles**: Balanced, Storytelling, Tactical, Humorous, Serious
- **Context-Aware Narratives**: Tracks campaign, location, characters, and recent events
- **Conversation History**: Maintains multi-turn conversations for continuity
- **Dynamic Responses**: Detects when dice rolls or combat is needed
- **Campaign Tools**: Generate opening scenes, NPCs, and combat encounters

## Setup

### 1. Install Dependencies

```bash
pip install langchain langchain-openai
```

### 2. Add OpenAI API Key

Add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=sk-your-api-key-here
```

Get an API key at: https://platform.openai.com

### 3. Start the Server

```bash
cd backend
python -m uvicorn main:app --reload
```

Server will run at: http://127.0.0.1:8000

## API Endpoints

### Test DM Availability

```bash
GET /api/dm/test
```

Check if the DM Agent is configured and ready.

### Get DM Response

```bash
POST /api/dm/respond
Content-Type: application/json

{
  "player_input": "I push open the tavern door and step inside.",
  "campaign_name": "Lost Mines of Phandelver",
  "current_location": "Phandalin Village",
  "active_characters": ["Theron (Fighter)", "Lyra (Wizard)"],
  "recent_events": ["Arrived in town", "Heard about goblin attacks"]
}
```

Returns narrative response with roll/combat detection.

### Start a Campaign

```bash
POST /api/dm/start-campaign
Content-Type: application/json

{
  "campaign_name": "Curse of Strahd",
  "setting": "gothic horror",
  "personality": "storytelling"
}
```

Generates an engaging opening scene.

### Generate NPC

```bash
POST /api/dm/generate-npc?npc_name=Thaddeus&npc_role=mysterious tavern keeper
```

Creates a detailed NPC with personality and description.

### Generate Combat Encounter

```bash
POST /api/dm/generate-encounter?party_level=5&difficulty=hard
```

Creates a balanced combat encounter.

### View Conversation History

```bash
GET /api/dm/history
```

Returns recent DM-player exchanges.

### Clear History

```bash
POST /api/dm/clear-history
```

Resets conversation for a new session.

## Usage Examples

### Interactive API Documentation

Visit http://127.0.0.1:8000/docs for Swagger UI with live testing.

### Python Example

```python
from agents.dm_agent import DMAgent, GameContext, DMPersonality

# Create DM with personality
dm = DMAgent(personality=DMPersonality.STORYTELLING)

# Set up game context
context = GameContext(
    campaign_name="Lost Mines",
    current_location="Goblin Cave",
    active_characters=["Theron", "Lyra"],
    recent_events=["Found goblin tracks"]
)

# Get DM response
response = dm.respond_sync(
    "I carefully peek around the corner.",
    context=context
)

print(response.narrative)

if response.requires_roll:
    print(f"Roll needed: {response.requires_roll}")
```

### Test Suite

Run the test suite (requires OpenAI API key):

```bash
python test_dm.py
```

Tests:
- ✅ DM availability check
- ✅ Campaign opening generation
- ✅ Player action responses
- ✅ NPC generation
- ✅ Combat encounter generation
- ✅ Multi-turn conversations

### Example Script

Run example scenarios (requires OpenAI API key):

```bash
python example_dm.py
```

Shows:
- Basic DM responses
- Context-aware narratives
- Campaign openings
- NPC generation
- Combat encounters
- Different personality styles

## DM Personalities

### Balanced
- Mix of combat and roleplay
- Encourages strategy and storytelling
- Steady pacing

### Storytelling
- Rich descriptions and emotional moments
- Compelling NPCs with depth
- Narrative-driven combat
- Character development focus

### Tactical
- Clear tactical descriptions
- Complex strategic encounters
- Strict rule enforcement
- Detailed environmental information

### Humorous
- Witty NPCs and amusing situations
- Light-hearted tone
- Fun and energetic gameplay

### Serious
- Dark, gritty atmosphere
- Moral dilemmas and consequences
- Complex NPC motivations
- Tense, dangerous encounters

## Architecture

```
agents/
  dm_agent.py         # Core DM Agent class
  __init__.py         # Package exports

api/
  dm.py              # FastAPI endpoints

backend/
  example_dm.py      # Usage examples
  test_dm.py         # Test suite
```

### DMAgent Class

```python
class DMAgent:
    def __init__(
        self,
        api_key: Optional[str] = None,
        personality: str = DMPersonality.BALANCED,
        temperature: float = 0.8
    )
    
    async def respond(
        self,
        player_input: str,
        context: Optional[GameContext] = None,
        include_history: bool = True
    ) -> DMResponse
    
    def start_campaign(campaign_name: str, setting: str) -> str
    def describe_npc(npc_name: str, npc_role: str) -> str
    def generate_encounter(party_level: int, difficulty: str) -> str
```

### GameContext

Provides campaign state to the DM:

```python
class GameContext:
    campaign_name: str
    rule_system: str = "D&D 5e"
    current_location: Optional[str]
    active_characters: List[str]
    recent_events: List[str]
    quest_objectives: List[str]
```

### DMResponse

```python
class DMResponse:
    narrative: str              # DM's narrative response
    requires_roll: Optional[str]  # Type of roll needed
    combat_initiated: bool      # Whether combat started
```

## Configuration

### Environment Variables

```
OPENAI_API_KEY=sk-...         # Required for DM Agent
OPENAI_MODEL=gpt-4-turbo-preview  # Optional (default)
```

### Temperature Setting

Controls creativity (0.0-1.0):
- **0.3-0.5**: Consistent, predictable
- **0.7-0.8**: Balanced creativity (default)
- **0.9-1.0**: Highly creative, unpredictable

## Cost Estimates

GPT-4 Turbo pricing (as of 2024):
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens

Typical DM response:
- Input: ~500-1000 tokens (with context)
- Output: ~200-400 tokens

Cost per response: ~$0.01-0.02

## Future Enhancements

- [ ] RAG integration for homebrew rules (pgvector)
- [ ] Memory management for long campaigns
- [ ] Multi-agent collaboration (Player Agents)
- [ ] Voice integration (TTS/STT)
- [ ] Map and image generation (DALL-E 3)
- [ ] Real-time streaming responses
- [ ] Combat automation with dice integration
- [ ] Session summary generation

## Troubleshooting

### "OpenAI API key not configured"

Add `OPENAI_API_KEY=your-key` to `.env` file.

### Import errors

Install dependencies:
```bash
pip install langchain langchain-openai
```

### Server won't start

Check for syntax errors:
```bash
python -c "import main"
```

### Slow responses

- Check internet connection
- Reduce temperature for faster generation
- Use shorter context/history

## Documentation

- API Docs: http://127.0.0.1:8000/docs
- LangChain: https://python.langchain.com/
- OpenAI: https://platform.openai.com/docs

## License

See main project LICENSE file.
