# Feature Requirements - Complete List

## Core Campaign Features

### Campaign Creation
- ✅ Create campaigns with DM or player role selection
- ✅ Configure number of AI players (0-5)
- ✅ Choose between AI DM or human DM
- ✅ Interactive campaign builder with step-by-step guidance
- ✅ Campaign persistence and save/load functionality
- ✅ Support for multiple concurrent campaigns

### Campaign Archiving System
- ✅ Auto-archive campaigns after 30 days of inactivity
- ✅ Archived campaigns accessible in "Archived" section
- ✅ One-click campaign restoration/reload
- ✅ Archived campaigns don't count toward active campaign limits
- ✅ Export archived campaigns to JSON/ZIP
- ✅ Manual archive/unarchive option
- ✅ Warning notification at 25 days of inactivity
- ✅ Archive status indicator in campaign list

### Character Management
- ✅ Edition-specific character creation (D&D 3.5e, 5e, Pathfinder, custom)
- ✅ Character sheet UI with full stat display
- ✅ Character sheet persistence and versioning
- ✅ Character portrait generation
- ✅ Inventory management
- ✅ Spell/ability tracking
- ✅ Level progression and XP tracking

## Gameplay Features

### Interaction Modes
- ✅ Natural language processing for chat-based commands
- ✅ Chat-only mode (pure text-based gameplay)
- ✅ Map + Chat mode (visual battle map with chat)
- ✅ Toggle between modes during gameplay

### Battle Map System
- ✅ Square grid option (5ft squares)
- ✅ Hexagonal grid option (configurable size)
- ✅ Character token display
- ✅ Movement range highlighting based on character speed
- ✅ Action range visualization
- ✅ Target selection UI (click action → click target)
- ✅ Self-targeted actions via double-click
- ✅ Fog of war (optional)
- ✅ Dynamic lighting (optional)

### Combat & Turn Management
- ✅ Initiative tracking and turn order display
- ✅ Automatic turn progression
- ✅ Action economy enforcement (action, bonus action, reaction)
- ✅ Movement speed limitations
- ✅ Attack range validation
- ✅ Spell range validation
- ✅ Opportunity attack detection

### Buffs, Debuffs & Effects
- ✅ Active effect tracking (buffs, debuffs, conditions)
- ✅ Automatic stat recalculation when effects applied
- ✅ Duration tracking (rounds, minutes, hours)
- ✅ Visual indicators on character tokens
- ✅ Effect expiration at end of duration
- ✅ Concentration tracking for spells
- ✅ Effect stacking rules enforcement

### Dice Rolling System
- ✅ Automatic dice rolling for all checks
- ✅ Roll result display in chat with player name
- ✅ Advantage/disadvantage support
- ✅ Critical hit/miss detection
- ✅ Modifier application
- ✅ Roll history log

### Special Combat Features
- ✅ Natural 20 attack rolls: Player describes how enemy dies
- ✅ Natural 20 skill checks: Player describes dramatic success
- ✅ Automatic damage calculation
- ✅ Death saves tracking
- ✅ Legendary actions/reactions
- ✅ Lair actions

## AI-Powered Enhancement Features

### Session Management
- ✅ Session recap AI generator (auto-summarize sessions)
- ✅ Email session summaries to players
- ✅ Session timeline and key moments extraction
- ✅ Campaign arc tracking and suggestions

### Smart Assistance
- ✅ Smart encounter suggestions (AI-balanced for party)
- ✅ Encounter difficulty calculator
- ✅ Voice-to-text command processing
- ✅ Text-to-voice for accessibility (optional)
- ✅ Context-aware rule lookups
- ✅ Plot hook generator (on-demand side quests)

### Character Import
- ✅ D&D Beyond character import (JSON)
- ✅ Roll20 character import
- ✅ Generic character sheet import (CSV/JSON)
- ✅ Automatic stat conversion between editions

### Voice Synthesis (Optional)
- ✅ NPC voice synthesis with text-to-speech
- ✅ Multiple voice profiles per NPC
- ✅ User preference: AI voice OR self-voiced
- ✅ Voice settings per character/NPC
- ✅ Mute/unmute voice synthesis toggle

### Collaborative Tools
- ✅ Shared campaign journal
- ✅ Collaborative note-taking
- ✅ Party timeline tracking
- ✅ Shared lore database
- ✅ In-game calendar with events

## Content Generation

### AI-Generated Assets
- ✅ Battle map generation (various terrains)
- ✅ Character portraits
- ✅ NPC portraits
- ✅ Monster illustrations
- ✅ Item/artifact artwork
- ✅ Location/environment scenes
- ✅ Map obstacles and props

### Map Generation
- ✅ Dungeon layouts
- ✅ Outdoor/wilderness maps
- ✅ Urban/city maps
- ✅ Interior locations (taverns, castles, etc.)
- ✅ World maps
- ✅ Custom dimensions
- ✅ Terrain variety

## Social & Multiplayer Features

### User Management
- ✅ User accounts and authentication
- ✅ User profiles with avatars
- ✅ Character roster per user
- ✅ Campaign history

### Social Features
- ✅ Find available games/campaigns
- ✅ Game browser with filters (level, theme, system)
- ✅ Join requests and approvals
- ✅ Friend system (add/remove friends)
- ✅ Friend list display
- ✅ Block user functionality
- ✅ Report user functionality
- ✅ Private messaging (optional)
- ✅ Party chat during sessions

### Multiplayer Session Management
- ✅ Real-time synchronization
- ✅ Session invitations
- ✅ Session scheduling
- ✅ Drop-in/drop-out support
- ✅ Session recording/playback (optional)

## Homebrew & Modularity Features

### Custom Rule Systems
- ✅ Create custom rule systems from scratch
- ✅ Modify existing rule systems (D&D 5e base + changes)
- ✅ Custom magic systems (mana, spell points, etc.)
- ✅ Custom classes and races
- ✅ Custom abilities and feats
- ✅ House rules implementation
- ✅ Rule conflict detection and warnings
- ✅ Balance validation for custom rules

### PDF Import System
- ✅ Upload PDF rulebooks
- ✅ Automatic text extraction
- ✅ Structure analysis and parsing
- ✅ Rule categorization (combat, magic, classes, etc.)
- ✅ Selective import options:
  - Rules only
  - World/lore only
  - Everything
- ✅ PDF content searchable via RAG
- ✅ Reference PDF sections during gameplay

### Custom Content Creation
- ✅ Custom spells with mechanics
- ✅ Custom items and equipment
- ✅ Custom monsters with stat blocks
- ✅ Custom classes with progression
- ✅ Custom races with traits
- ✅ Custom worlds and lore
- ✅ Custom campaign templates

### Modularity Features
- ✅ Rule system switching between campaigns
- ✅ Import/export custom content
- ✅ Share homebrew content with community (optional)
- ✅ Version control for custom rules
- ✅ Compatibility checking between modules

## Agent Responsibilities Summary

### DM Agent
- Rules enforcement (custom or standard)
- Narrative generation
- NPC control
- Encounter management
- Turn coordination
- Natural language command processing
- Natural 20 kill description prompting
- Query rule database for custom rules
- Session recap generation
- Smart encounter suggestions
- Voice command interpretation
- Plot hook generation on-demand

### Player Agent (AI Players)
- Character roleplay
- Combat decisions
- Social interaction
- Goal pursuit
- Party coordination

### Campaign Assistant Agent
- Campaign creation guidance
- Balance validation
- NPC generation suggestions
- Homebrew rule design assistance
- PDF import guidance
- Content suggestions
- Encounter difficulty analysis
- Campaign arc tracking
- Character import parsing and validation

### Creative Generator Agent
- Map generation (square/hex grids)
- Character artwork
- Item visualization
- Environment scenes
- Style consistency maintenance

## Non-Agent Features (Traditional Code)

### Backend Services
- Authentication & authorization
- Database operations (CRUD)
- Game state management
- Real-time synchronization
- Social features (friends, blocking, matchmaking)
- File upload handling
- PDF processing pipeline
- Rules vector database
- Session management
- Campaign archiving service (scheduled job)
- Email service (session recaps)
- Character import parsers
- Voice synthesis service (text-to-speech)
- Web Speech API integration (voice-to-text)
- Subscription & billing management
- Usage tracking and quota enforcement

### Frontend Components
- Character sheet UI
- Battle map renderer (square/hex)
- Chat interface
- Dice roller animations
- Buff/debuff indicators
- Turn order display
- Target selection interface
- Game browser
- User profile pages
- Campaign management UI
- Homebrew content editor
- Session recap viewer
- Campaign archive browser
- Character import wizard
- Voice settings panel
- Shared journal editor
- Subscription management dashboard
- Usage quota display
- Encounter builder UI

### Calculation & Validation
- Stat calculations
- Movement range computation
- Attack range validation
- Buff/debuff modifier application
- Grid distance calculations (square/hex)
- Collision detection
- Line of sight calculations
