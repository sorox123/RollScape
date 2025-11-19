# Player Agent & Voting System

AI-controlled player characters with democratic voting for handling absent players.

## Overview

The Player Agent system allows AI to control player characters when players are absent, maintaining character personality and decision-making based on chat history and past actions.

## Features

### Player Agent
- **Personality Analysis**: Learns from chat logs and action history
- **In-Character Roleplay**: Maintains character voice and decision patterns
- **Context-Aware Actions**: Considers party dynamics and situation
- **Risk Assessment**: Follows character's established risk tolerance
- **Combat Intelligence**: Makes tactical decisions aligned with class/personality

### Voting System
- **Democratic Control**: Majority vote required for AI activation
- **Two Options**: Skip turn or enable AI control
- **Time-Limited Votes**: Configurable expiration (default 10 minutes)
- **Session-Based**: AI control only for current session
- **Player Priority**: Deactivates when player returns

## Usage

### Analyzing a Character

Build a personality profile from history:

```python
POST /api/player-agent/analyze-character
{
  "character_id": "char_123",
  "character_name": "Theron Ironforge",
  "character_class": "Fighter (Battle Master)",
  "chat_history": [
    {"speaker": "Theron", "message": "I'll protect the party."},
    {"speaker": "Theron", "message": "We need a strategy first."}
  ],
  "action_history": [
    "Stepped in front of wizard",
    "Examined dungeon entrance",
    "Suggested defensive formation"
  ]
}
```

Returns personality traits, combat style, risk tolerance, and decision patterns.

### AI Action Decision

Have AI decide what to do:

```python
POST /api/player-agent/decide-action
{
  "character_id": "char_123",
  "situation": "Dark tavern. Hooded figure beckons you over.",
  "available_actions": [
    "Approach alone",
    "Approach with party",
    "Ignore",
    "Observe from distance"
  ],
  "party_context": "Party is at the bar discussing rumors"
}
```

Returns action, reasoning, potential dialogue, and confidence level.

### AI NPC Response

Generate in-character dialogue:

```python
POST /api/player-agent/respond-to-npc
{
  "character_id": "char_123",
  "npc_name": "Mysterious Stranger",
  "npc_dialogue": "I have info... for 500 gold.",
  "context": "Party needs artifact. Only has 300 gold."
}
```

Returns character's response in their voice.

## Voting System

### Initiating a Vote

When a player is absent:

```python
POST /api/player-agent/vote/initiate
{
  "session_id": "session_uuid",
  "campaign_id": "campaign_uuid",
  "absent_character_id": "character_uuid",
  "vote_type": "ai_control",  // or "skip_turn"
  "initiated_by": "voter_char_uuid",
  "reason": "Player is sick, we need the wizard for this dungeon",
  "expires_in_minutes": 10
}
```

### Vote Types

**SKIP_TURN**
- Character takes no actions this session
- Party continues without them
- Simpler but reduces party effectiveness

**AI_CONTROL**
- AI takes over character decisions
- Maintains character personality
- Keeps party at full strength
- Character acts as they normally would

### Casting Votes

```python
POST /api/player-agent/vote/cast
{
  "vote_id": "vote_uuid",
  "character_id": "voter_char_uuid",
  "vote_for": true  // true = approve, false = reject
}
```

### Vote Requirements

- **Majority Rule**: > 50% of present players must vote yes
- **Eligible Voters**: Only present player characters
- **One Vote Per Character**: Can change vote before resolution
- **Auto-Resolution**: Passes when majority reached or fails when impossible

### Checking Vote Status

```python
GET /api/player-agent/vote/status/{vote_id}
```

Returns current vote count, status, and whether AI is activated.

### Active Votes in Session

```python
GET /api/player-agent/vote/session/{session_id}
```

Lists all active votes for the session.

### AI-Controlled Characters

```python
GET /api/player-agent/vote/ai-controlled/{session_id}
```

Returns list of character IDs currently under AI control.

### Deactivating AI Control

When player returns:

```python
POST /api/player-agent/vote/deactivate-ai/{vote_id}
```

Or deactivate the agent directly:

```python
DELETE /api/player-agent/deactivate/{character_id}
```

## How It Works

### Character Analysis

1. **Chat History Analysis**: Identifies speech patterns, common phrases, personality traits
2. **Action Pattern Recognition**: Learns decision-making tendencies
3. **Relationship Mapping**: Notes interactions with NPCs and party members
4. **Combat Style**: Analyzes tactical choices and risk behavior
5. **Profile Building**: Creates comprehensive personality model

### AI Decision Making

When making decisions, the AI considers:

- **Character Personality**: Established traits and patterns
- **Past Behavior**: Historical actions in similar situations
- **Risk Tolerance**: Character's comfort with danger
- **Party Relationships**: How they interact with each member
- **Class Role**: Fighter protects, wizard supports, etc.
- **Current Context**: What's happening now

### Example Flow

1. **Player Absent**: DM notices player missing from session
2. **Vote Initiated**: Present player suggests AI control vote
3. **Party Votes**: Each present player votes yes/no
4. **Vote Passes**: Majority approves AI control
5. **AI Activates**: PlayerAgent takes over character
6. **Session Continues**: AI makes decisions in character's voice
7. **Player Returns**: Vote deactivated, player resumes control

## Database Schema

```sql
CREATE TABLE absentee_votes (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES game_sessions(id),
    campaign_id UUID REFERENCES campaigns(id),
    absent_character_id UUID REFERENCES characters(id),
    vote_type VARCHAR(20), -- 'skip_turn' or 'ai_control'
    status VARCHAR(20),    -- 'active', 'passed', 'failed', 'expired'
    votes_for JSON,        -- Array of character IDs
    votes_against JSON,
    eligible_voters JSON,
    required_votes INTEGER,
    initiated_at TIMESTAMP,
    expires_at TIMESTAMP,
    resolved_at TIMESTAMP,
    ai_agent_active BOOLEAN,
    ai_agent_config JSON,
    initiated_by UUID REFERENCES characters(id),
    reason TEXT
);
```

## Configuration

### Environment Variables

```
OPENAI_API_KEY=sk-...         # Required for Player Agent
```

### Agent Settings

- **Temperature**: 0.7 (balanced creativity)
- **Model**: GPT-4 Turbo (best roleplay)
- **Max Tokens**: 1000 per response
- **History Window**: Last 50 chat messages, 20 actions

### Vote Settings

- **Default Expiration**: 10 minutes
- **Vote Threshold**: 50% (majority)
- **Max Voters**: All present players in session

## Best Practices

### For DMs

1. **Initiate Early**: Start vote as soon as player absence confirmed
2. **Set Context**: Explain why AI control might be needed
3. **Monitor AI**: Review AI decisions to ensure they fit character
4. **Deactivate Promptly**: Turn off AI as soon as player returns

### For Players

1. **Vote Thoughtfully**: Consider if AI will help or hinder
2. **Trust the System**: AI uses actual character behavior
3. **Communicate**: Discuss concerns before voting
4. **Be Flexible**: Both skip and AI options have merit

### For Character Development

1. **Stay In Character**: AI learns from your consistency
2. **Use Distinctive Phrases**: Helps AI match your voice
3. **Document Relationships**: Note NPC connections in chat
4. **Show Patterns**: Clear decision-making helps AI learn

## Limitations

- AI cannot make complex strategic plans
- May not catch subtle party dynamics
- Requires significant chat/action history for accuracy
- Works best for straightforward situations
- No memory between sessions (unless explicitly saved)

## Future Enhancements

- [ ] Long-term memory across sessions
- [ ] Voice integration for seamless immersion
- [ ] Real-time learning during session
- [ ] Multi-character coordination
- [ ] Advanced combat tactics
- [ ] Emotional state modeling
- [ ] Integration with character sheets
- [ ] Automatic personality updates

## Testing

Run test suite:

```bash
python test_player_agent.py
```

Tests:
- ✅ Character personality analysis
- ✅ Action decision making
- ✅ NPC response generation
- ✅ Combat situation handling
- ✅ Voting system flow

## API Documentation

Interactive docs: http://127.0.0.1:8000/docs

Look for `/api/player-agent/*` endpoints.

## Troubleshooting

### "OpenAI API key not configured"
Add `OPENAI_API_KEY` to `.env`

### Vote fails to pass
Check that majority of eligible voters have voted yes

### AI decisions feel wrong
Ensure sufficient chat/action history for analysis

### Database errors
Run migrations: `alembic upgrade head`

## Cost Estimates

GPT-4 Turbo per session with AI player:
- Analysis: ~$0.02 (one-time)
- Decision: ~$0.01-0.02 per action
- Response: ~$0.01 per dialogue

Typical 4-hour session with AI player: ~$0.50-1.00

## License

See main project LICENSE.
