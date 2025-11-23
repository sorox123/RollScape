# RollScape API Reference

Complete REST API documentation for RollScape backend.

**Base URL (Development)**: `http://localhost:8000`  
**Base URL (Production)**: TBD

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Characters](#characters)
- [Campaigns](#campaigns)
- [Game Sessions](#game-sessions)
- [Dice Rolling](#dice-rolling)
- [DM Agent](#dm-agent)
- [Player Agent](#player-agent)
- [AI Image Generation](#ai-image-generation)
- [PDF Import](#pdf-import)
- [Messaging](#messaging)
- [Friends](#friends)
- [Subscriptions](#subscriptions)
- [Error Handling](#error-handling)

---

## Authentication

### Register User
Create a new user account.

**Endpoint**: `POST /api/users/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "player123",
  "password": "securePassword123!"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "username": "player123",
  "subscription_tier": "free",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors**:
- `400`: Email/username already exists
- `422`: Invalid email format or weak password

---

### Login
Authenticate and receive access token.

**Endpoint**: `POST /api/users/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "player123"
  }
}
```

**Errors**:
- `401`: Invalid credentials

---

### Get Current User
Get authenticated user's profile.

**Endpoint**: `GET /api/users/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "username": "player123",
  "subscription_tier": "creator",
  "ai_images_used": 15,
  "ai_images_quota": 50,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Characters

### Create Character
Create a new D&D character.

**Endpoint**: `POST /api/characters`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "name": "Thorin Ironbeard",
  "race": "Dwarf",
  "class": "Fighter",
  "level": 5,
  "background": "Soldier",
  "ability_scores": {
    "strength": 18,
    "dexterity": 14,
    "constitution": 16,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 8
  },
  "max_hit_points": 47,
  "current_hit_points": 47,
  "armor_class": 18,
  "proficiency_bonus": 3,
  "speed": 25,
  "backstory": "A veteran warrior seeking redemption...",
  "personality_traits": "Gruff but loyal",
  "ideals": "Honor above all",
  "bonds": "My squad is my family",
  "flaws": "I hold grudges forever"
}
```

**Response**: `201 Created`
```json
{
  "id": "char-uuid",
  "user_id": "user-uuid",
  "name": "Thorin Ironbeard",
  "race": "Dwarf",
  "class": "Fighter",
  "level": 5,
  "ability_scores": { ... },
  "created_at": "2024-01-15T11:00:00Z"
}
```

---

### Get Character
Retrieve a character by ID.

**Endpoint**: `GET /api/characters/{character_id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "id": "char-uuid",
  "name": "Thorin Ironbeard",
  "race": "Dwarf",
  "class": "Fighter",
  "level": 5,
  "ability_scores": {
    "strength": 18,
    "dexterity": 14,
    "constitution": 16,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 8
  },
  "max_hit_points": 47,
  "current_hit_points": 35,
  "armor_class": 18
}
```

**Errors**:
- `403`: Character belongs to another user
- `404`: Character not found

---

### List User's Characters
Get all characters owned by authenticated user.

**Endpoint**: `GET /api/characters`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "characters": [
    {
      "id": "char-uuid-1",
      "name": "Thorin Ironbeard",
      "race": "Dwarf",
      "class": "Fighter",
      "level": 5
    },
    {
      "id": "char-uuid-2",
      "name": "Elara Moonshadow",
      "race": "Elf",
      "class": "Wizard",
      "level": 3
    }
  ],
  "total": 2
}
```

---

### Update Character
Update character attributes.

**Endpoint**: `PATCH /api/characters/{character_id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (partial update):
```json
{
  "current_hit_points": 40,
  "level": 6,
  "experience_points": 14000
}
```

**Response**: `200 OK`
```json
{
  "id": "char-uuid",
  "name": "Thorin Ironbeard",
  "level": 6,
  "current_hit_points": 40,
  "updated_at": "2024-01-15T12:00:00Z"
}
```

---

### Delete Character
Permanently delete a character.

**Endpoint**: `DELETE /api/characters/{character_id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `204 No Content`

**Errors**:
- `403`: Character belongs to another user
- `404`: Character not found

---

## Campaigns

### Create Campaign
Create a new campaign.

**Endpoint**: `POST /api/campaigns`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "title": "Curse of Strahd",
  "description": "A gothic horror campaign set in Barovia",
  "setting": "Ravenloft",
  "system": "D&D 5e",
  "max_players": 5,
  "is_ai_dm": false,
  "is_public": true
}
```

**Response**: `201 Created`
```json
{
  "id": "campaign-uuid",
  "title": "Curse of Strahd",
  "description": "A gothic horror campaign set in Barovia",
  "dm_id": "user-uuid",
  "max_players": 5,
  "is_ai_dm": false,
  "is_public": true,
  "created_at": "2024-01-15T13:00:00Z"
}
```

**Errors**:
- `403`: User subscription tier doesn't allow more campaigns

---

### Get Campaign
Retrieve campaign details.

**Endpoint**: `GET /api/campaigns/{campaign_id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "id": "campaign-uuid",
  "title": "Curse of Strahd",
  "description": "A gothic horror campaign set in Barovia",
  "dm_id": "user-uuid",
  "dm_username": "masterDM",
  "players": [
    {
      "user_id": "player-uuid-1",
      "username": "player1",
      "character_id": "char-uuid-1",
      "character_name": "Thorin Ironbeard"
    }
  ],
  "current_session_id": "session-uuid",
  "created_at": "2024-01-15T13:00:00Z"
}
```

---

### List Campaigns
Get all campaigns visible to user.

**Endpoint**: `GET /api/campaigns`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `is_public` (boolean): Filter public campaigns
- `is_ai_dm` (boolean): Filter AI DM campaigns
- `has_openings` (boolean): Filter campaigns with open slots
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 100)

**Example**: `GET /api/campaigns?is_public=true&has_openings=true&page=1&limit=10`

**Response**: `200 OK`
```json
{
  "campaigns": [
    {
      "id": "campaign-uuid",
      "title": "Curse of Strahd",
      "dm_username": "masterDM",
      "player_count": 3,
      "max_players": 5,
      "is_ai_dm": false
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 5
}
```

---

### Join Campaign
Join a public campaign.

**Endpoint**: `POST /api/campaigns/{campaign_id}/join`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "character_id": "char-uuid"
}
```

**Response**: `200 OK`
```json
{
  "message": "Successfully joined campaign",
  "campaign_id": "campaign-uuid",
  "character_id": "char-uuid"
}
```

**Errors**:
- `400`: Campaign is full
- `403`: Campaign is private
- `404`: Campaign or character not found

---

### Leave Campaign
Leave a campaign you're in.

**Endpoint**: `POST /api/campaigns/{campaign_id}/leave`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "message": "Successfully left campaign"
}
```

---

## Game Sessions

### Create Session
Start a new game session in a campaign.

**Endpoint**: `POST /api/campaigns/{campaign_id}/sessions`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "title": "Session 1: Entering Barovia",
  "description": "The party arrives at the fog-shrouded land"
}
```

**Response**: `201 Created`
```json
{
  "id": "session-uuid",
  "campaign_id": "campaign-uuid",
  "title": "Session 1: Entering Barovia",
  "status": "active",
  "started_at": "2024-01-15T19:00:00Z"
}
```

---

### End Session
End the current game session.

**Endpoint**: `POST /api/sessions/{session_id}/end`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "id": "session-uuid",
  "status": "completed",
  "ended_at": "2024-01-15T23:30:00Z",
  "duration_minutes": 270
}
```

---

### Get Session History
Retrieve chat/action history for a session.

**Endpoint**: `GET /api/sessions/{session_id}/history`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (int): Page number
- `limit` (int): Messages per page (default: 50, max: 200)

**Response**: `200 OK`
```json
{
  "messages": [
    {
      "id": "msg-uuid-1",
      "type": "narration",
      "speaker": "DM",
      "content": "You arrive at the gates of Barovia...",
      "timestamp": "2024-01-15T19:05:00Z"
    },
    {
      "id": "msg-uuid-2",
      "type": "action",
      "speaker": "Thorin Ironbeard",
      "content": "I investigate the gate for traps",
      "dice_roll": {
        "type": "investigation",
        "total": 18,
        "modifier": 2
      },
      "timestamp": "2024-01-15T19:06:30Z"
    }
  ],
  "total": 127,
  "page": 1
}
```

---

## Dice Rolling

### Roll Dice
Roll dice and optionally apply modifiers.

**Endpoint**: `POST /api/dice/roll`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "dice_notation": "2d20kh1+5",
  "context": "Attack roll with advantage",
  "character_id": "char-uuid",
  "session_id": "session-uuid"
}
```

**Supported Notations**:
- Standard: `1d20`, `3d6`, `1d12+5`
- Advantage: `2d20kh1` (keep highest)
- Disadvantage: `2d20kl1` (keep lowest)
- Drop lowest: `4d6dl1` (drop lowest)
- Exploding: `1d6!` (reroll on max)

**Response**: `200 OK`
```json
{
  "id": "roll-uuid",
  "dice_notation": "2d20kh1+5",
  "rolls": [18, 7],
  "kept": [18],
  "modifier": 5,
  "total": 23,
  "context": "Attack roll with advantage",
  "timestamp": "2024-01-15T19:15:00Z"
}
```

---

### Get Roll History
Retrieve dice roll history.

**Endpoint**: `GET /api/dice/history`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `session_id` (uuid): Filter by session
- `character_id` (uuid): Filter by character
- `limit` (int): Number of rolls (default: 50, max: 200)

**Response**: `200 OK`
```json
{
  "rolls": [
    {
      "id": "roll-uuid-1",
      "dice_notation": "1d20+5",
      "total": 23,
      "context": "Attack roll",
      "timestamp": "2024-01-15T19:15:00Z"
    }
  ],
  "total": 87
}
```

---

## DM Agent

### Send DM Prompt
Send a message to the AI DM agent.

**Endpoint**: `POST /api/dm/chat`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "session_id": "session-uuid",
  "message": "I want to investigate the mysterious chest in the corner",
  "character_id": "char-uuid"
}
```

**Response**: `200 OK`
```json
{
  "response": "As you approach the ornate chest, you notice intricate carvings of ravens along its edges. The wood is dark and aged, but the lock appears untouched. Make an Investigation check.",
  "requires_roll": true,
  "suggested_roll": "1d20+2",
  "timestamp": "2024-01-15T19:20:00Z"
}
```

---

### Get DM Suggestions
Get AI-generated suggestions for next actions.

**Endpoint**: `POST /api/dm/suggestions`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "session_id": "session-uuid",
  "context": "party is in a tavern"
}
```

**Response**: `200 OK`
```json
{
  "suggestions": [
    "Speak with the bartender about local rumors",
    "Approach the hooded figure in the corner",
    "Order food and listen to nearby conversations",
    "Ask about available rooms for the night"
  ]
}
```

---

## Player Agent

### Create AI Player
Add an AI-controlled player to a campaign.

**Endpoint**: `POST /api/player-agent/create`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "campaign_id": "campaign-uuid",
  "character_name": "Lyra Swiftwind",
  "race": "Elf",
  "class": "Ranger",
  "level": 4,
  "personality": "Cautious scout who trusts nature over people",
  "backstory": "Former city guard turned wilderness guide..."
}
```

**Response**: `201 Created`
```json
{
  "id": "ai-player-uuid",
  "character_id": "char-uuid",
  "campaign_id": "campaign-uuid",
  "character_name": "Lyra Swiftwind",
  "personality": "Cautious scout who trusts nature over people",
  "created_at": "2024-01-15T14:00:00Z"
}
```

**Errors**:
- `403`: User has reached AI player limit for their tier

---

### Get AI Player Action
Get the AI player's next action in response to situation.

**Endpoint**: `POST /api/player-agent/action`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "ai_player_id": "ai-player-uuid",
  "session_id": "session-uuid",
  "situation": "The party stands before a locked door. Sounds of combat echo from beyond.",
  "recent_actions": [
    "Thorin tried to break down the door but failed",
    "The wizard cast Detect Magic"
  ]
}
```

**Response**: `200 OK`
```json
{
  "action": "I'll attempt to pick the lock. I pull out my thieves' tools and carefully examine the mechanism.",
  "action_type": "skill_check",
  "suggested_roll": "1d20+5",
  "reasoning": "With combat nearby, breaking down the door is too loud. A subtle approach is better."
}
```

---

### Vote on Decision
AI player votes on party decision.

**Endpoint**: `POST /api/player-agent/vote`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "ai_player_id": "ai-player-uuid",
  "decision_prompt": "Should the party accept the mysterious stranger's quest?",
  "options": ["Accept the quest", "Decline and leave", "Ask for more information"]
}
```

**Response**: `200 OK`
```json
{
  "vote": "Ask for more information",
  "reasoning": "This stranger appeared out of nowhere. We should be cautious and learn more before committing to anything."
}
```

---

## AI Image Generation

### Generate Character Art
Generate portrait art for a character.

**Endpoint**: `POST /api/ai-images/character-art`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "character_name": "Thorin Ironbeard",
  "race": "Dwarf",
  "class": "Fighter",
  "description": "Grizzled veteran with a braided beard and weathered armor",
  "art_style": "fantasy_portrait",
  "additional_details": "Battle-scarred, holding a warhammer"
}
```

**Response**: `200 OK`
```json
{
  "image_url": "https://cdn.rollscape.com/images/char-uuid-12345.png",
  "prompt_used": "Fantasy portrait of Thorin Ironbeard, a dwarf fighter...",
  "style": "fantasy_portrait",
  "created_at": "2024-01-15T15:00:00Z",
  "images_remaining": 34
}
```

**Errors**:
- `403`: User has exceeded image generation quota
- `400`: Invalid art style

---

### Generate Map
Generate a battle map or dungeon map.

**Endpoint**: `POST /api/ai-images/map`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "map_type": "battle_map",
  "environment": "forest_clearing",
  "size": "medium",
  "description": "A clearing with ancient stone ruins and a small creek",
  "grid": true,
  "style": "top_down"
}
```

**Map Types**:
- `battle_map`: Tactical combat map (30x30 ft)
- `dungeon`: Dungeon layout
- `world_map`: Regional or world map
- `town`: Settlement map

**Response**: `200 OK`
```json
{
  "image_url": "https://cdn.rollscape.com/maps/map-uuid-67890.png",
  "map_type": "battle_map",
  "grid_size": 5,
  "dimensions": "30x30",
  "created_at": "2024-01-15T15:30:00Z"
}
```

---

### Generate Token
Generate a token/avatar for characters or monsters.

**Endpoint**: `POST /api/ai-images/token`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "subject": "Goblin Scout",
  "description": "Sneaky goblin with a bow and leather armor",
  "style": "token_portrait",
  "background": "transparent"
}
```

**Response**: `200 OK`
```json
{
  "image_url": "https://cdn.rollscape.com/tokens/token-uuid-11111.png",
  "style": "token_portrait",
  "has_transparency": true,
  "created_at": "2024-01-15T16:00:00Z"
}
```

---

### Get Image Generation Quota
Check remaining AI image generation quota.

**Endpoint**: `GET /api/ai-images/quota`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "tier": "creator",
  "monthly_quota": 50,
  "used_this_month": 16,
  "remaining": 34,
  "resets_at": "2024-02-01T00:00:00Z"
}
```

---

## PDF Import

### Import Character from PDF
Extract character data from a D&D character sheet PDF.

**Endpoint**: `POST /api/pdf/import-character`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (multipart form):
- `file`: PDF file (max 10MB)

**Response**: `200 OK`
```json
{
  "extracted_data": {
    "name": "Thorin Ironbeard",
    "race": "Mountain Dwarf",
    "class": "Fighter",
    "level": 5,
    "background": "Soldier",
    "ability_scores": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 8
    },
    "armor_class": 18,
    "max_hit_points": 47,
    "speed": 25,
    "proficiencies": ["Athletics", "Intimidation", "Perception"]
  },
  "confidence": 87,
  "fields_extracted": 15,
  "total_fields": 20,
  "warnings": [
    "Could not extract equipment list - manual entry required"
  ]
}
```

**Errors**:
- `400`: File too large or not a PDF
- `422`: Confidence too low (< 20%)

**Confidence Levels**:
- 80-100%: Excellent extraction
- 60-79%: Good extraction (some manual review needed)
- 40-59%: Partial extraction (significant manual entry needed)
- 20-39%: Poor extraction (mostly manual entry needed)
- < 20%: Failed extraction (rejected)

---

### Get Supported PDF Formats
Get information about supported character sheet PDF formats.

**Endpoint**: `GET /api/pdf/supported-formats`

**Response**: `200 OK`
```json
{
  "formats": [
    {
      "name": "D&D 5e Official Character Sheet",
      "source": "Wizards of the Coast",
      "confidence": "high"
    },
    {
      "name": "D&D Beyond Character Sheet Export",
      "source": "D&D Beyond",
      "confidence": "high"
    },
    {
      "name": "Generic 5e Character Sheet",
      "source": "Community",
      "confidence": "medium"
    }
  ],
  "notes": "Best results with official WotC character sheets. Ensure text is selectable (not scanned images)."
}
```

---

## Messaging

### Send Message
Send a message to another user.

**Endpoint**: `POST /api/messages`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "recipient_id": "user-uuid",
  "content": "Hey, want to join my campaign this weekend?"
}
```

**Response**: `201 Created`
```json
{
  "id": "message-uuid",
  "sender_id": "user-uuid",
  "recipient_id": "recipient-uuid",
  "content": "Hey, want to join my campaign this weekend?",
  "read": false,
  "sent_at": "2024-01-15T17:00:00Z"
}
```

---

### Get Conversations
List all message conversations.

**Endpoint**: `GET /api/messages/conversations`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "conversations": [
    {
      "user_id": "other-user-uuid",
      "username": "player123",
      "last_message": "Sounds great!",
      "last_message_at": "2024-01-15T17:05:00Z",
      "unread_count": 2
    }
  ]
}
```

---

### Get Messages with User
Get all messages exchanged with a specific user.

**Endpoint**: `GET /api/messages/{user_id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "messages": [
    {
      "id": "msg-uuid-1",
      "sender_id": "user-uuid",
      "recipient_id": "other-user-uuid",
      "content": "Hey, want to join my campaign?",
      "read": true,
      "sent_at": "2024-01-15T17:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "sender_id": "other-user-uuid",
      "recipient_id": "user-uuid",
      "content": "Sounds great!",
      "read": false,
      "sent_at": "2024-01-15T17:05:00Z"
    }
  ]
}
```

---

## Friends

### Send Friend Request
Send a friend request to another user.

**Endpoint**: `POST /api/friends/request`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "target_username": "player123"
}
```

**Response**: `201 Created`
```json
{
  "id": "friendship-uuid",
  "status": "pending",
  "created_at": "2024-01-15T18:00:00Z"
}
```

---

### Accept Friend Request
Accept an incoming friend request.

**Endpoint**: `POST /api/friends/{friendship_id}/accept`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "id": "friendship-uuid",
  "status": "accepted",
  "accepted_at": "2024-01-15T18:05:00Z"
}
```

---

### List Friends
Get all accepted friends.

**Endpoint**: `GET /api/friends`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "friends": [
    {
      "user_id": "friend-uuid-1",
      "username": "player123",
      "online_status": "online",
      "current_campaign": "Curse of Strahd"
    },
    {
      "user_id": "friend-uuid-2",
      "username": "dmMaster",
      "online_status": "away",
      "current_campaign": null
    }
  ],
  "total": 2
}
```

---

### Remove Friend
Remove a friend connection.

**Endpoint**: `DELETE /api/friends/{friendship_id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `204 No Content`

---

## Subscriptions

### Get Subscription Info
Get current subscription details.

**Endpoint**: `GET /api/subscriptions/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "tier": "creator",
  "status": "active",
  "current_period_start": "2024-01-01T00:00:00Z",
  "current_period_end": "2024-02-01T00:00:00Z",
  "cancel_at_period_end": false,
  "quotas": {
    "campaigns": "unlimited",
    "ai_players": 5,
    "ai_images": 50,
    "pdf_imports": 3
  },
  "usage": {
    "campaigns": 3,
    "ai_players": 2,
    "ai_images": 16,
    "pdf_imports": 1
  }
}
```

---

### Upgrade Subscription
Upgrade to a higher tier.

**Endpoint**: `POST /api/subscriptions/upgrade`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "tier": "master",
  "billing_period": "annual"
}
```

**Response**: `200 OK`
```json
{
  "tier": "master",
  "status": "active",
  "amount": 143.88,
  "billing_period": "annual",
  "next_billing_date": "2025-01-15T00:00:00Z"
}
```

---

### Cancel Subscription
Cancel subscription (effective at period end).

**Endpoint**: `POST /api/subscriptions/cancel`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "message": "Subscription will be canceled at the end of the current period",
  "cancel_at": "2024-02-01T00:00:00Z"
}
```

---

## Error Handling

### Standard Error Format

All errors follow this format:

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "field": "field_name"  // Optional: for validation errors
}
```

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `204 No Content`: Request succeeded, no body to return
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: User lacks permission
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: Must be logged in
- `INVALID_CREDENTIALS`: Wrong email/password
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `PERMISSION_DENIED`: User lacks access to resource
- `VALIDATION_ERROR`: Request data failed validation
- `QUOTA_EXCEEDED`: User has exceeded subscription quota
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Unexpected server error

### Example Error Response

```json
{
  "detail": "AI image generation quota exceeded. Upgrade to Creator tier for 50 images/month.",
  "code": "QUOTA_EXCEEDED",
  "current_usage": 10,
  "quota_limit": 10,
  "tier": "free"
}
```

---

## Rate Limiting

### Limits by Endpoint Category

- **Authentication**: 5 requests/minute
- **Dice Rolling**: 60 requests/minute
- **AI Generation**: 10 requests/minute
- **General API**: 100 requests/minute

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705334400
```

### Rate Limit Exceeded Response

`429 Too Many Requests`
```json
{
  "detail": "Rate limit exceeded. Try again in 23 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 23
}
```

---

## Pagination

### Standard Pagination Parameters

- `page`: Page number (1-indexed, default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Pagination Response Format

```json
{
  "items": [...],
  "total": 156,
  "page": 1,
  "pages": 8,
  "has_next": true,
  "has_prev": false
}
```

---

## WebSocket Events (Real-Time)

### Connection

Connect to WebSocket at: `ws://localhost:8000/ws`

Send authentication after connection:
```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

### Event Types

#### Session Updates
```json
{
  "type": "session_update",
  "session_id": "session-uuid",
  "data": {
    "message": "DM narration text...",
    "speaker": "DM",
    "timestamp": "2024-01-15T19:30:00Z"
  }
}
```

#### Dice Rolls
```json
{
  "type": "dice_roll",
  "session_id": "session-uuid",
  "data": {
    "character_name": "Thorin Ironbeard",
    "dice_notation": "1d20+5",
    "total": 23,
    "rolls": [18],
    "context": "Attack roll"
  }
}
```

#### Combat Updates
```json
{
  "type": "combat_update",
  "session_id": "session-uuid",
  "data": {
    "current_turn": "Thorin Ironbeard",
    "initiative_order": [...],
    "round": 3
  }
}
```

---

## API Versioning

Current API version: **v1**

All endpoints are prefixed with `/api/` (implicit v1).

Future versions will use explicit versioning: `/api/v2/`

---

## Authentication Details

### JWT Token

- **Type**: Bearer token
- **Location**: `Authorization` header
- **Format**: `Bearer <token>`
- **Expiration**: 24 hours
- **Refresh**: Use `/api/users/refresh` endpoint

### Refresh Token

**Endpoint**: `POST /api/users/refresh`

**Headers**:
```
Authorization: Bearer <expired_token>
```

**Response**: `200 OK`
```json
{
  "access_token": "new-jwt-token",
  "token_type": "bearer"
}
```

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get current user (with token)
curl http://localhost:8000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Register
response = requests.post(f"{BASE_URL}/api/users/register", json={
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#"
})
print(response.json())

# Login
response = requests.post(f"{BASE_URL}/api/users/login", json={
    "email": "test@example.com",
    "password": "Test123!@#"
})
token = response.json()["access_token"]

# Get current user
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
print(response.json())
```

---

## Additional Resources

- **Interactive API Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)
- **GitHub Repository**: https://github.com/sorox123/RollScape
- **Discord Community**: Coming soon

---

**Last Updated**: January 2024  
**API Version**: v1  
**Documentation Version**: 1.0.0
