# DM Agent - Technical Specification

## Core Responsibilities

- **Narrative Generation**: Story content, descriptions, NPC dialogue
- **Rules Engine**: Enforce D&D 5e (or custom) rules, calculate modifiers
- **Encounter Management**: Balance combat, manage initiative, control enemies
- **World State Tracking**: Campaign progress, quest status, world changes
- **Adaptive Storytelling**: Respond to player choices dynamically
- **NLP Command Processing**: Interpret natural language player actions

## Input Schema

```json
{
  "sessionId": "uuid",
  "campaignState": {
    "currentLocation": "string",
    "activeQuests": ["array"],
    "partyComposition": ["array"],
    "worldState": "object",
    "ruleSystemId": "string"
  },
  "playerAction": {
    "type": "combat|social|exploration|skill_check",
    "actor": "characterId",
    "action": "string",
    "target": "string|null",
    "rollResult": "number|null"
  },
  "context": {
    "recentHistory": ["last 10 actions"],
    "npcsPresent": ["array"],
    "activeEffects": ["array"]
  }
}
```

## Output Schema

```json
{
  "narrative": {
    "description": "string",
    "dialogue": {
      "speaker": "string",
      "text": "string"
    }
  },
  "mechanics": {
    "requiredRolls": [{
      "character": "id",
      "type": "ability_check|saving_throw|attack",
      "dc": "number",
      "modifier": "string"
    }],
    "damageDealt": "number|null",
    "statusEffects": ["array"]
  },
  "stateUpdates": {
    "questProgress": "object",
    "worldChanges": "object",
    "npcsAffected": "array"
  },
  "suggestedActions": ["array of contextual options"],
  "requiresContentGeneration": {
    "type": "map|character|item",
    "prompt": "string"
  },
  "promptPlayer": {
    "type": "natural_20_kill_description|other",
    "message": "string"
  }
}
```

## LLM Configuration

- **Model**: GPT-4 Turbo or Claude 3.5 Sonnet
- **Temperature**: 0.7-0.9 (creative but consistent)
- **Max Tokens**: 1500-2000
- **Context Window**: Utilize full available context

## System Prompt Template

```
You are an expert D&D Dungeon Master. You balance storytelling with rules.

RULE SYSTEM: {ruleSystemName}
{customRulesContext}

CURRENT CAMPAIGN: {campaignSummary}
PARTY: {characterSheets}
LOCATION: {currentLocation}
ACTIVE PLOTS: {questLog}

RULES:
- Follow {ruleSystem} rules strictly
- Query rules database when uncertain
- Describe outcomes vividly but concisely
- Offer meaningful choices
- Balance challenge and fun
- Track consequences of player actions
- When players roll natural 20 on attacks, prompt them to describe killing blow

RESPONSE FORMAT: JSON with narrative, mechanics, and state updates
```

## Memory & Context Management

- **Short-term**: Last 10-20 turns (sliding window)
- **Long-term**: Campaign summary, key NPC relationships, major events (stored as embeddings)
- **RAG System**: Rules database for rule lookups (supports custom rules)
- **Session State**: Redis/in-memory for active game state

## Special Features

### Natural 20 Handling

When player rolls natural 20 on attack roll:
1. Detect critical hit
2. Return prompt: "How do you want to do this?"
3. Wait for player's kill description
4. Incorporate player's narrative into response
5. Generate dramatic outcome description

### Homebrew Rule Support

- Query vector database for relevant rules based on action
- Support custom magic systems, classes, and mechanics
- Adapt narrative style to match custom world setting
- Reference imported PDF rulebooks via RAG

## Integration Points

- **Creative Generator Agent**: Request visuals for new locations/NPCs
- **Player Agents**: Coordinate turn order and action resolution
- **Rules Vector DB**: Query for rule lookups (custom or standard)
- **Database**: Save campaign state after significant events
- **Frontend**: Send narrative and mechanical results

## Performance Optimization

- Cache common rule lookups
- Batch NPC actions in combat
- Use streaming responses for long narratives
- Parallelize independent calculations
