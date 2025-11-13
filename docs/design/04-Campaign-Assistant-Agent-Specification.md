# Campaign Assistant Agent - Technical Specification

## Core Responsibilities

- **Guided Campaign Creation**: Walk users through campaign setup step-by-step
- **Content Suggestions**: Offer themes, villains, plot hooks, locations
- **Balance Validation**: Ensure encounters are appropriate for party level
- **Campaign Arc Design**: Help structure beginning/middle/end
- **NPC Generation**: Create memorable NPCs with motivations
- **Homebrew Guidance**: Help users design custom rules and magic systems
- **PDF Import Assistance**: Guide users through importing rulebooks

## Input Schema

```json
{
  "sessionId": "uuid",
  "conversationStep": "number",
  "mode": "standard|homebrew|pdf_import",
  "userInput": {
    "text": "string",
    "selections": ["array of choices"]
  },
  "campaignDraft": {
    "title": "string|null",
    "ruleSystem": "dnd5e|custom|imported",
    "theme": "string|null",
    "setting": "string|null",
    "partyLevel": "number|null",
    "partySize": "number|null",
    "mainVillain": "object|null",
    "plotHooks": ["array"],
    "keyLocations": ["array"],
    "npcs": ["array"],
    "customRules": ["array"],
    "customMagicSystem": "object|null"
  },
  "userPreferences": {
    "tone": "serious|humorous|dark|heroic",
    "complexity": "simple|moderate|complex",
    "combatFocus": "low|medium|high"
  }
}
```

## Output Schema

```json
{
  "response": {
    "message": "conversational response to user",
    "suggestions": ["array of options"],
    "examples": ["array of concrete examples"]
  },
  "nextStep": {
    "question": "next question to ask",
    "inputType": "text|multiple_choice|number|boolean",
    "options": ["array if multiple choice"]
  },
  "campaignUpdate": {
    "fieldsToUpdate": "object"
  },
  "completionStatus": {
    "percentComplete": "number",
    "missingElements": ["array"],
    "readyToGenerate": "boolean"
  },
  "requestVisuals": {
    "type": "map|character|location",
    "description": "string"
  },
  "validation": {
    "warnings": ["array"],
    "suggestions": ["array"]
  }
}
```

## LLM Configuration

- **Model**: GPT-4 or Claude 3.5 Sonnet
- **Temperature**: 0.7 (balanced creativity and coherence)
- **Max Tokens**: 1000-1500
- **Context Window**: Full campaign draft + conversation history

## System Prompt Template

### Standard Mode
```
You are a Campaign Design Assistant helping a user create a D&D campaign.

CURRENT PROGRESS:
{campaignDraft}

YOUR APPROACH:
- Ask one clear question at a time
- Offer specific, inspiring suggestions
- Explain how elements connect thematically
- Validate mechanical balance
- Keep the user excited and engaged
- Provide concrete examples from published adventures

CONVERSATION FLOW:
1. Theme & setting
2. Main conflict & villain
3. Party composition & starting level
4. Key locations (3-5)
5. Major NPCs (2-4)
6. Opening scene
7. Act structure
8. Climax concept

RESPONSE FORMAT: JSON with conversational response, next step, and campaign updates
```

### Homebrew Mode
```
You are a Homebrew Campaign Assistant helping a user create custom rules and worlds.

CURRENT PROGRESS:
{campaignDraft}

YOUR APPROACH:
- Guide through rule system design
- Help balance custom mechanics
- Validate against base system (if applicable)
- Suggest creative alternatives
- Check for rule conflicts
- Ensure consistency

HOMEBREW WORKFLOW:
1. Choose foundation (base system or from scratch)
2. Define magic system
3. Create custom classes/races
4. Build world lore
5. Set house rules
6. Generate sample encounters
7. Test balance

RESPONSE FORMAT: JSON with guidance, validation warnings, and suggestions
```

### PDF Import Mode
```
You are helping a user import and adapt a rulebook PDF.

CURRENT PROGRESS:
{pdfAnalysis}
{campaignDraft}

YOUR APPROACH:
- Guide user through import options
- Explain what can be extracted
- Help choose components to use
- Validate compatibility
- Suggest adaptations if needed

IMPORT WORKFLOW:
1. Confirm PDF upload and extraction
2. Identify rulebook type/system
3. Ask what to import (rules/world/all)
4. Map rules to system format
5. Generate rule module
6. Test integration

RESPONSE FORMAT: JSON with step-by-step guidance and extracted content
```

## Conversation Management

- **State Persistence**: Save draft after each exchange
- **Branching Logic**: Adapt questions based on previous answers
- **Validation Rules**: Check party level vs encounter difficulty
- **Example Library**: Reference published adventures for inspiration
- **Undo Support**: Allow users to go back and change answers

## Special Features

### Balance Validation

Check encounter difficulty:
```python
def validate_encounter(party_level, party_size, monsters):
    total_xp = sum(monster.xp for monster in monsters)
    difficulty_threshold = get_threshold(party_level, party_size)
    
    if total_xp > difficulty_threshold * 1.5:
        return "WARNING: This encounter may be too deadly"
    elif total_xp < difficulty_threshold * 0.5:
        return "WARNING: This encounter may be too easy"
    else:
        return "Encounter difficulty: Balanced"
```

### Homebrew Rule Validation

```python
def validate_custom_rule(rule, base_system):
    prompt = f"""
    Evaluate this custom rule for a {base_system} campaign:
    
    CUSTOM RULE:
    {json.dumps(rule)}
    
    Check for:
    1. Conflicts with existing rules
    2. Balance issues (overpowered/underpowered)
    3. Logical inconsistencies
    4. Edge cases
    
    Provide:
    - Conflict warnings
    - Balance rating (1-10)
    - Suggestions for improvement
    """
    
    return llm.analyze(prompt)
```

## Integration Points

- **Creative Generator Agent**: Request artwork for villain, locations, NPCs
- **Database**: Save campaign template for later editing
- **DM Agent**: Export completed campaign for gameplay
- **Rules Vector DB**: Store custom rules for later retrieval
- **PDF Service**: Receive extracted rulebook content

## Conversation Examples

### Standard Campaign Creation
```
Assistant: "Let's create your campaign! What setting interests you?"
Suggestions: [High Fantasy, Dark Gothic, Steampunk, Oriental, Homebrew]

User: "High Fantasy"