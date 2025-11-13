# Player Agent - Technical Specification

## Core Responsibilities

- **Character Roleplay**: Stay in character based on personality, background, alignment
- **Tactical Decision-Making**: Make combat choices appropriate to class/build
- **Social Interaction**: Engage in dialogue, negotiate, persuade
- **Goal Pursuit**: Follow character motivations and party objectives
- **Collaborative Play**: Work with other players (AI or human)

## Scalability

- **Multiple Instances**: 1 agent instance per AI player in a session
- **Independent**: Each instance maintains separate character state
- **Coordinated**: Can share party context for tactical cooperation

## Input Schema

```json
{
  "characterSheet": {
    "id": "uuid",
    "name": "string",
    "class": "string",
    "level": "number",
    "stats": "object",
    "inventory": ["array"],
    "spells": ["array"],
    "personality": {
      "traits": ["array"],
      "ideals": "string",
      "bonds": "string",
      "flaws": "string"
    }
  },
  "situation": {
    "type": "combat|social|exploration|puzzle",
    "description": "string",
    "availableActions": ["array"],
    "allies": ["array"],
    "threats": ["array"],
    "environmentFactors": ["array"]
  },
  "conversationHistory": ["last 5-10 exchanges"],
  "characterGoals": {
    "immediate": "string",
    "questRelated": ["array"],
    "personal": "string"
  },
  "ruleSystem": "string"
}
```

## Output Schema

```json
{
  "action": {
    "type": "attack|spell|skill_check|dialogue|movement|item_use",
    "description": "what the character says/does",
    "target": "string|null",
    "mechanics": {
      "ability": "string",
      "spellSlot": "number|null",
      "resource": "mana|ki|etc|null",
      "itemUsed": "string|null"
    }
  },
  "reasoning": "brief explanation for logging/debugging",
  "dialogue": "in-character speech",
  "emotionalState": "string"
}
```

## LLM Configuration

- **Model**: GPT-4o-mini or Claude 3 Haiku (faster, cost-effective)
- **Temperature**: 0.8-1.0 (high creativity for personality)
- **Max Tokens**: 500-800
- **Context Window**: Character sheet + recent history

## System Prompt Template

```
You are {characterName}, a {level} {race} {class}.

PERSONALITY:
- Traits: {traits}
- Ideals: {ideals}
- Bonds: {bonds}
- Flaws: {flaws}

BACKGROUND: {backstory}

ABILITIES:
{characterSheet}

RULE SYSTEM: {ruleSystemName}
{relevantCustomRules}

CURRENT SITUATION:
{situationDescription}

PARTY MEMBERS:
{alliesInformation}

PLAYSTYLE:
- Stay in character at all times
- Make decisions based on your personality and goals
- Collaborate with your party
- Consider tactical advantages in combat
- Roleplay dialogue naturally
- Use abilities/resources according to {ruleSystem} rules

RESPONSE FORMAT: JSON with action, dialogue, and reasoning
```

## Personality Variants

### Aggressive Fighter
- High combat initiative
- Confrontational dialogue
- Rushes into danger
- Protects party

### Cautious Rogue
- Risk-averse decisions
- Investigative approach
- Traps/ambushes focus
- Stealth preference

### Social Bard
- Diplomacy-focused
- Persuasion attempts
- Information gathering
- Performance/inspiration

### Tactical Wizard
- Optimized spell selection
- Strategic positioning
- Resource management
- Crowd control focus

### Chaotic Wildcard
- Unpredictable choices
- Entertaining decisions
- Rule-bending attempts
- Fun over optimization

## Integration Points

- **DM Agent**: Receive situations, submit actions
- **Character Service**: Access current stats, inventory, abilities
- **Other Player Agents**: Shared party context for coordination
- **Rules DB**: Query custom rules if applicable

## Cost Optimization

- Use cheaper models (GPT-4o-mini, Claude Haiku)
- Cache character personality context
- Reduce token usage with concise prompts
- Batch multiple AI player actions when possible
