# Homebrew & Modularity System Architecture

## Overview

The modularity system allows players to create custom rule systems, magic mechanics, classes, and worlds. It also supports importing PDF rulebooks and selectively using their content.

## Core Components

### 1. Rule System Manager (Backend Service)

**Responsibilities:**
- Load and manage rule system modules
- Parse PDF rulebooks into structured data
- Validate custom rules for consistency
- Provide rule context to agents via RAG
- Handle rule versioning and updates

**Rule System Structure:**
```json
{
  "ruleSystemId": "uuid",
  "name": "My Cyberpunk Fantasy",
  "version": "1.0.0",
  "createdBy": "userId",
  "baseSystem": "dnd5e|pathfinder|custom|null",
  "visibility": "private|friends|public",
  
  "components": {
    "useBaseRules": true,
    "useBaseWorld": false,
    "useBaseSpells": false,
    "useBaseClasses": true,
    "customModules": [
      "magic_system",
      "world_lore",
      "character_creation",
      "combat_rules"
    ]
  },
  
  "magicSystem": {
    "type": "mana|spell_slots|custom",
    "name": "Mana Pool System",
    "description": "Characters have mana instead of spell slots",
    "rules": {
      "resourceType": "mana",
      "calculation": "level * 10 + Intelligence modifier * 5",
      "regeneration": {
        "shortRest": "50%",
        "longRest": "100%"
      },
      "spellCost": {
        "formula": "spell_level * 2",
        "customCosts": {
          "cantrip": 0,
          "level_1": 2,
          "level_2": 4
        }
      }
    }
  },
  
  "customSpells": [{
    "id": "spell_001",
    "name": "Arcane Missile",
    "level": 3,
    "school": "evocation",
    "castingTime": "1 action",
    "range": "120 feet",
    "components": ["V", "S"],
    "duration": "Instantaneous",
    "resourceCost": 6,
    "description": "You create glowing bolts of magical energy...",
    "mechanicalEffect": {
      "damage": "3d4",
      "damageType": "force",
      "targets": "up to 3",
      "canSplit": true
    }
  }],
  
  "customClasses": [{
    "id": "class_001",
    "name": "Tech Mage",
    "hitDie": "d8",
    "primaryAbility": "Intelligence",
    "savingThrows": ["Intelligence", "Dexterity"],
    "skills": {
      "choose": 2,
      "from": ["Arcana", "Technology", "Investigation"]
    },
    "features": [
      "Cybernetic Enhancement",
      "Spellcasting",
      "Tech Integration"
    ]
  }],
  
  "customRules": [{
    "id": "rule_001",
    "name": "Dual Wielding Bonus",
    "category": "combat",
    "description": "When wielding two weapons, you get +2 to AC...",
    "mechanicalEffect": {
      "modifiesAC": 2,
      "modifiesAttack": "bonus_action_extra",
      "requirements": ["Two weapons equipped"]
    },
    "conflictsWith": ["dnd5e_two_weapon_fighting"],
    "balanceRating": 7,
    "validated": true
  }],
  
  "worldLore": {
    "setting": "Cyberpunk city with magic",
    "era": "Near future (2150)",
    "geography": "Mega-city sprawl",
    "factions": [
      {
        "name": "The Techno-Mages",
        "description": "Guild that blends technology and magic",
        "relationship": "neutral"
      }
    ],
    "themes": ["Corporate intrigue", "Magic vs Technology"],
    "keyLocations": []
  },
  
  "pdfSource": {
    "originalFileName": "my_rulebook.pdf",
    "uploadedAt": "timestamp",
    "extractedText": "full text content",
    "embeddingsIndex": "vector_db_id",
    "sections": {
      "rules": ["page 1-50"],
      "spells": ["page 51-100"],
      "classes": ["page 101-150"],
      "world": ["page 151-200"]
    }
  }
}
```

### 2. PDF Import Pipeline

**Step-by-Step Process:**

```
┌─────────────────────────────────────────────┐
│  1. PDF Upload                              │
│     - User uploads PDF file                 │
│     - Max size: 50MB                        │
│     - Format validation                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  2. Text Extraction                         │
│     - Use PyPDF2 or pdfplumber              │
│     - Preserve structure (headers, lists)   │
│     - Extract tables and stat blocks        │
│     - Handle multi-column layouts           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3. Structure Analysis (LLM)                │
│     - Identify rulebook type/system         │
│     - Categorize sections:                  │
│       • Character creation                  │
│       • Combat rules                        │
│       • Magic system                        │
│       • Classes/races                       │
│       • Spells                              │
│       • World lore                          │
│       • Monsters                            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  4. Content Parsing (LLM)                   │
│     - Extract structured data from text     │
│     - Parse spell descriptions → JSON       │
│     - Parse stat blocks → JSON              │
│     - Identify rule mechanics               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  5. Create Embeddings                       │
│     - Chunk text (500-1000 tokens)          │
│     - Generate embeddings                   │
│     - Store in vector database              │
│     - Tag with metadata                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  6. User Selection                          │
│     User chooses what to import:            │
│     □ Rules only                            │
│     □ World/lore only                       │
│     □ Everything                            │
│     □ Custom selection by section           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  7. Generate Rule Module                    │
│     - Create rule system JSON               │
│     - Map to standard format                │
│     - Generate compatibility layer          │
│     - Validate and test                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  8. Integration Test                        │
│     - Test sample scenarios                 │
│     - Check for errors                      │
│     - Present to user for approval          │
└─────────────────────────────────────────────┘
```

**Implementation Example:**

```python
async def import_pdf_rulebook(pdf_file, user_id):
    # Step 1: Extract text
    text = extract_text_from_pdf(pdf_file)
    
    # Step 2: Analyze structure
    structure_prompt = f"""
    Analyze this RPG rulebook and identify its structure.
    
    TEXT (first 5000 characters):
    {text[:5000]}
    
    Identify:
    1. Rulebook name and system
    2. Table of contents / section headers
    3. Main categories (rules, classes, spells, world, etc.)
    
    OUTPUT: JSON
    """
    
    structure = await llm.parse(structure_prompt)
    
    # Step 3: Parse each section
    sections = {}
    for section_name, page_range in structure['sections'].items():
        section_text = extract_section(text, page_range)
        
        parse_prompt = f"""
        Extract structured data from this {section_name} section:
        
        {section_text}
        
        Convert to JSON format compatible with our system.
        """
        
        sections[section_name] = await llm.parse(parse_prompt)
    
    # Step 4: Create embeddings
    embeddings_id = await create_embeddings(text, metadata={
        'user_id': user_id,
        'type': 'rulebook',
        'sections': structure['sections']
    })
    
    # Step 5: Generate rule module
    rule_module = {
        'name': structure['name'],
        'baseSystem': detect_base_system(text),
        'customSpells': sections.get('spells', []),
        'customClasses': sections.get('classes', []),
        'worldLore': sections.get('world', {}),
        'pdfSource': {
            'originalFileName': pdf_file.name,
            'embeddingsIndex': embeddings_id,
            'sections': structure['sections']
        }
    }
    
    return rule_module
```

### 3. Custom Magic System Builder

**UI Flow:**

```
┌──────────────────────────────────────────────┐
│ Magic System Designer                        │
├──────────────────────────────────────────────┤
│                                              │
│ Base System: [D&D 5e Spell Slots ▼]         │
│                                              │
│ ○ Use base system as-is                     │
│ ● Modify base system                         │
│ ○ Create from scratch                       │
│                                              │
├──────────────────────────────────────────────┤
│ Resource Type                                │
│ ● Mana Pool                                  │
│ ○ Spell Slots (modified)                    │
│ ○ Spell Points                               │
│ ○ Custom: [____________________]             │
│                                              │
├──────────────────────────────────────────────┤
│ Mana Pool Calculation                        │
│ Base: [10] × Character Level                 │
│ Plus: [5] × [Intelligence ▼] Modifier        │
│ Plus: [0] × [Class Feature ▼]                │
│                                              │
│ Example: Level 5 Wizard (Int 16, +3)        │
│ Mana = 10×5 + 5×3 = 65 mana                  │
│                                              │
├──────────────────────────────────────────────┤
│ Regeneration                                 │
│ Short Rest: [50]%                            │
│ Long Rest: [100]%                            │
│ Per Round in Combat: [0]                     │
│                                              │
├──────────────────────────────────────────────┤
│ Spell Costs                                  │
│ ● Formula-based                              │
│   Cost = [2] × Spell Level                   │
│                                              │
│ ○ Per-level costs                            │
│   Cantrip: [0]                               │
│   Level 1: [__]                              │
│   Level 2: [__]                              │
│   ...                                        │
│                                              │
├──────────────────────────────────────────────┤
│ Special Rules                                │
│ □ Casting without mana causes damage         │
│ □ Mana can be sacrificed for extra damage    │
│ □ Mana regenerates faster out of combat      │
│                                              │
├──────────────────────────────────────────────┤
│ [Test Magic System] [Save] [Cancel]          │
└──────────────────────────────────────────────┘
```

**Backend Implementation:**

```python
class MagicSystemValidator:
    def validate(self, magic_system):
        warnings = []
        
        # Check if resource generation is balanced
        if magic_system['regeneration']['shortRest'] > 75:
            warnings.append("High short rest regeneration may be overpowered")
        
        # Check spell costs
        if magic_system['spellCost']['formula']:
            max_level_cost = eval_formula(
                magic_system['spellCost']['formula'],
                spell_level=9
            )
            
            typical_mana = magic_system['calculation']['base'] * 20
            
            if max_level_cost > typical_mana:
                warnings.append("9th level spells may be too expensive")
        
        # Balance rating
        balance_score = self.calculate_balance(magic_system)
        
        return {
            'valid': True,
            'warnings': warnings,
            'balanceScore': balance_score,
            'suggestions': self.generate_suggestions(magic_system)
        }
```

### 4. Agent Integration with Custom Rules

**DM Agent Enhanced with RAG:**

```python
class DMAgent:
    def __init__(self, campaign):
        self.rule_system = load_rule_system(campaign.rule_system_id)
        self.rules_vector_db = VectorDatabase()
        
    async def process_spell_cast(self, character, spell_name):
        # Query rules database for spell info
        spell_rules = await self.rules_vector_db.search(
            query=f"spell {spell_name} casting rules cost effect",
            filter={
                'rule_system_id': self.rule_system.id,
                'category': 'spell'
            },
            top_k=3
        )
        
        # Build context for LLM
        context = f"""
        MAGIC SYSTEM: {self.rule_system.magicSystem.name}
        {self.rule_system.magicSystem.description}
        
        SPELL RULES:
        {format_rules(spell_rules)}
        
        CHARACTER: {character.name}
        Current Mana: {character.currentMana} / {character.maxMana}
        """
        
        # Generate response
        response = await self.llm.generate(
            system_prompt=self.get_system_prompt(),
            context=context,
            user_message=f"{character.name} casts {spell_name}"
        )
        
        return response
```

**Campaign Assistant for Homebrew:**

```python
class HomebrewAssistant:
    async def guide_magic_system_creation(self, user_input):
        conversation_state = self.load_state()
        
        if conversation_state['step'] == 'choose_base':
            return {
                'message': "Let's design your magic system! Do you want to start from D&D 5e spell slots, or create something completely new?",
                'options': [
                    'Modify D&D 5e spell slots',
                    'Mana pool system',
                    'Spell points system',
                    'Completely custom'
                ]
            }
        
        elif conversation_state['step'] == 'define_resource':
            # Validate user's resource definition
            validation = self.validate_resource(user_input)
            
            if validation['warnings']:
                return {
                    'message': f"I see some potential issues: {validation['warnings']}. Would you like to adjust?",
                    'suggestions': validation['suggestions']
                }
            else:
                conversation_state['step'] = 'regeneration_rules'
                return {
                    'message': "Great! Now let's define how this resource regenerates. How much should characters recover on a short rest?",
                    'inputType': 'percentage'
                }
```

### 5. Rule Conflict Detection

```python
class RuleConflictDetector:
    def check_conflicts(self, new_rule, existing_rules):
        conflicts = []
        
        # Check for direct conflicts
        for existing in existing_rules:
            if self.rules_conflict(new_rule, existing):
                conflicts.append({
                    'type': 'direct_conflict',
                    'with': existing['name'],
                    'reason': f"Both rules modify {new_rule['modifies']}",
                    'resolution': 'override|merge|rename'
                })
        
        # Use LLM for semantic conflict detection
        conflict_check_prompt = f"""
        Check if these rules conflict:
        
        NEW RULE:
        {json.dumps(new_rule)}
        
        EXISTING RULES:
        {json.dumps(existing_rules)}
        
        Identify:
        1. Direct conflicts (same mechanic, different values)
        2. Semantic conflicts (rules that contradict each other)
        3. Balance issues (new rule makes existing rules obsolete)
        
        OUTPUT: JSON with conflicts and suggestions
        """
        
        semantic_conflicts = await self.llm.analyze(conflict_check_prompt)
        
        return conflicts + semantic_conflicts['conflicts']
```

### 6. Content Sharing & Community

**Optional Feature:**

```json
{
  "homebrewMarketplace": {
    "enabled": true,
    "features": [
      "Browse community homebrew",
      "Rate and review rule systems",
      "Download and import",
      "Version compatibility checking",
      "Report inappropriate content"
    ]
  }
}
```

## Database Schema

```sql
-- Rule Systems
CREATE TABLE rule_systems (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  created_by UUID REFERENCES users(id),
  base_system VARCHAR(50),
  version VARCHAR(20),
  visibility VARCHAR(20),
  data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- PDF Imports
CREATE TABLE pdf_imports (
  id UUID PRIMARY KEY,
  rule_system_id UUID REFERENCES rule_systems(id),
  user_id UUID REFERENCES users(id),
  file_name VARCHAR(255),
  file_size INTEGER,
  extracted_text TEXT,
  embeddings_index VARCHAR(255),
  sections JSONB,
  processed_at TIMESTAMP
);

-- Custom Spells
CREATE TABLE custom_spells (
  id UUID PRIMARY KEY,
  rule_system_id UUID REFERENCES rule_systems(id),
  name VARCHAR(255),
  level INTEGER,
  data JSONB
);

-- Custom Rules
CREATE TABLE custom_rules (
  id UUID PRIMARY KEY,
  rule_system_id UUID REFERENCES rule_systems(id),
  name VARCHAR(255),
  category VARCHAR(50),
  data JSONB,
  validated BOOLEAN,
  balance_rating INTEGER
);
```

## Cost Implications

**PDF Import:**
- Text extraction: Free (PyPDF2)
- Structure analysis: ~$0.10 per rulebook (GPT-4)
- Content parsing: ~$0.50-1.00 per rulebook
- Embeddings: ~$0.02 per 1000 pages
- **Total per import: ~$0.60-1.10**

**Rule Validation:**
- Per custom rule: ~$0.01-0.02
- Balance checking: ~$0.02-0.05

**Gameplay with Custom Rules:**
- RAG queries add ~$0.001 per action
- Minimal impact on overall session cost
