# Database Schema Design

## Overview

Complete database schema for the D&D app covering users, campaigns, characters, sessions, homebrew content, and social features.

## Users & Authentication

```sql
-- Users table (managed by Supabase Auth, extended here)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  -- Subscription fields
  subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('free', 'creator', 'master')) DEFAULT 'free',
  subscription_status VARCHAR(20) CHECK (subscription_status IN ('active', 'canceled', 'expired', 'trial')) DEFAULT 'active',
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  is_annual_subscription BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP,
  
  -- Usage tracking
  monthly_ai_images_used INTEGER DEFAULT 0,
  monthly_ai_images_limit INTEGER DEFAULT 10,
  last_usage_reset TIMESTAMP DEFAULT NOW(),
  
  preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

## Social Features

```sql
-- Friend relationships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Blocked users
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
```

## Rule Systems & Homebrew

```sql
-- Rule systems (D&D 5e, Pathfinder, homebrew)
CREATE TABLE rule_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id),
  base_system VARCHAR(50), -- 'dnd5e', 'pathfinder', 'custom', null
  version VARCHAR(20) DEFAULT '1.0.0',
  visibility VARCHAR(20) CHECK (visibility IN ('private', 'friends', 'public')) DEFAULT 'private',
  description TEXT,
  data JSONB NOT NULL, -- Full rule system definition
  is_official BOOLEAN DEFAULT FALSE,
  downloads_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rule_systems_creator ON rule_systems(created_by);
CREATE INDEX idx_rule_systems_visibility ON rule_systems(visibility);
CREATE INDEX idx_rule_systems_base ON rule_systems(base_system);

-- PDF imports
CREATE TABLE pdf_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_system_id UUID REFERENCES rule_systems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  file_name VARCHAR(255),
  file_size INTEGER,
  file_url TEXT,
  extracted_text TEXT,
  embeddings_index VARCHAR(255), -- Reference to vector DB
  sections JSONB,
  processed_at TIMESTAMP DEFAULT NOW()
);

-- Custom spells
CREATE TABLE custom_spells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_system_id UUID REFERENCES rule_systems(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  level INTEGER CHECK (level >= 0 AND level <= 9),
  school VARCHAR(50),
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_spells_system ON custom_spells(rule_system_id);
CREATE INDEX idx_custom_spells_level ON custom_spells(level);

-- Custom classes
CREATE TABLE custom_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_system_id UUID REFERENCES rule_systems(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hit_die VARCHAR(10),
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Custom rules
CREATE TABLE custom_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_system_id UUID REFERENCES rule_systems(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  data JSONB NOT NULL,
  validated BOOLEAN DEFAULT FALSE,
  balance_rating INTEGER CHECK (balance_rating >= 1 AND balance_rating <= 10),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_rules_system ON custom_rules(rule_system_id);
CREATE INDEX idx_custom_rules_category ON custom_rules(category);
```

## Campaigns

```sql
-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dm_user_id UUID REFERENCES users(id),
  rule_system_id UUID REFERENCES rule_systems(id),
  visibility VARCHAR(20) CHECK (visibility IN ('private', 'friends', 'public')) DEFAULT 'private',
  status VARCHAR(20) CHECK (status IN ('planning', 'active', 'paused', 'archived', 'completed')) DEFAULT 'planning',
  max_players INTEGER DEFAULT 6,
  current_players INTEGER DEFAULT 0,
  starting_level INTEGER DEFAULT 1,
  current_session INTEGER DEFAULT 0,
  world_state JSONB DEFAULT '{}'::jsonb,
  quest_log JSONB DEFAULT '[]'::jsonb,
  npc_data JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb, -- Grid type, AI DM, voice settings, etc.
  
  -- Archiving fields
  last_activity TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP,
  archived_s3_key TEXT,
  archive_notification_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_session TIMESTAMP
);

CREATE INDEX idx_campaigns_dm ON campaigns(dm_user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_visibility ON campaigns(visibility);
CREATE INDEX idx_campaigns_status_activity ON campaigns(status, last_activity);

-- Campaign members
CREATE TABLE campaign_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  role VARCHAR(20) CHECK (role IN ('dm', 'player', 'observer')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

CREATE INDEX idx_campaign_members_campaign ON campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user ON campaign_members(user_id);

-- Campaign invitations
CREATE TABLE campaign_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id),
  invitee_id UUID REFERENCES users(id),
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  responded_at TIMESTAMP
);

CREATE INDEX idx_invitations_campaign ON campaign_invitations(campaign_id);
CREATE INDEX idx_invitations_invitee ON campaign_invitations(invitee_id);
CREATE INDEX idx_invitations_status ON campaign_invitations(status);
```

## Characters

```sql
-- Characters
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rule_system_id UUID REFERENCES rule_systems(id),
  race VARCHAR(100),
  class VARCHAR(100),
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  
  -- Core stats
  strength INTEGER DEFAULT 10,
  dexterity INTEGER DEFAULT 10,
  constitution INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  wisdom INTEGER DEFAULT 10,
  charisma INTEGER DEFAULT 10,
  
  -- Combat stats
  max_hp INTEGER DEFAULT 10,
  current_hp INTEGER DEFAULT 10,
  armor_class INTEGER DEFAULT 10,
  initiative_bonus INTEGER DEFAULT 0,
  speed INTEGER DEFAULT 30,
  
  -- Resources (flexible for different systems)
  resources JSONB DEFAULT '{}'::jsonb, -- spell slots, mana, ki, etc.
  
  -- Personality
  personality JSONB DEFAULT '{}'::jsonb, -- traits, ideals, bonds, flaws
  
  -- Full character data
  inventory JSONB DEFAULT '[]'::jsonb,
  spells JSONB DEFAULT '[]'::jsonb,
  abilities JSONB DEFAULT '[]'::jsonb,
  proficiencies JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  portrait_url TEXT,
  backstory TEXT,
  notes TEXT,
  is_ai_controlled BOOLEAN DEFAULT FALSE,
  ai_personality_config JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_owner ON characters(owner_id);
CREATE INDEX idx_characters_rule_system ON characters(rule_system_id);
CREATE INDEX idx_characters_level ON characters(level);

-- Character active effects (buffs/debuffs)
CREATE TABLE character_effects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('buff', 'debuff', 'condition')),
  source VARCHAR(255), -- Who cast it
  duration_type VARCHAR(20), -- 'rounds', 'minutes', 'hours', 'until_save'
  duration_remaining INTEGER,
  effects JSONB NOT NULL, -- What it modifies
  applied_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_effects_character ON character_effects(character_id);
CREATE INDEX idx_effects_session ON character_effects(session_id);
```

## Game Sessions

```sql
-- Game sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  session_number INTEGER,
  status VARCHAR(20) CHECK (status IN ('scheduled', 'active', 'paused', 'completed')) DEFAULT 'scheduled',
  
  -- Current state
  current_turn_character_id UUID REFERENCES characters(id),
  turn_number INTEGER DEFAULT 1,
  initiative_order JSONB DEFAULT '[]'::jsonb,
  
  -- Map data
  current_map_id UUID REFERENCES generated_maps(id),
  character_positions JSONB DEFAULT '{}'::jsonb,
  
  -- Session data
  game_state JSONB DEFAULT '{}'::jsonb,
  
  -- Timing
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_campaign ON game_sessions(campaign_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);

-- Session logs (for chat, actions, rolls)
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  log_type VARCHAR(50), -- 'chat', 'action', 'roll', 'narrative', 'system'
  actor_type VARCHAR(20), -- 'player', 'dm', 'ai_player', 'ai_dm', 'system'
  actor_id UUID, -- user_id or character_id
  actor_name VARCHAR(255),
  content TEXT,
  metadata JSONB, -- Roll results, action details, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_session ON session_logs(session_id);
CREATE INDEX idx_logs_type ON session_logs(log_type);
CREATE INDEX idx_logs_created ON session_logs(created_at);
```

## Generated Content

```sql
-- Generated maps
CREATE TABLE generated_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  name VARCHAR(255),
  map_type VARCHAR(50), -- 'battle', 'world', 'dungeon', 'interior'
  grid_type VARCHAR(20), -- 'square', 'hexagonal', 'none'
  dimensions VARCHAR(50), -- '30x40'
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB, -- Features, obstacles, etc.
  generation_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_maps_campaign ON generated_maps(campaign_id);
CREATE INDEX idx_maps_creator ON generated_maps(created_by);

-- Generated images (characters, items, scenes)
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  image_type VARCHAR(50), -- 'character', 'npc', 'item', 'scene', 'monster'
  related_id UUID, -- character_id, item_id, etc.
  name VARCHAR(255),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  generation_prompt TEXT,
  style VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_images_campaign ON generated_images(campaign_id);
CREATE INDEX idx_images_type ON generated_images(image_type);
```

## Game Browser & Matchmaking

```sql
-- Public game listings
CREATE TABLE game_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  dm_name VARCHAR(255),
  rule_system_name VARCHAR(255),
  player_level_range VARCHAR(50), -- '1-5', '10-15'
  available_slots INTEGER,
  play_style JSONB, -- ['roleplay', 'combat', 'exploration']
  schedule VARCHAR(255), -- 'Fridays 7pm EST'
  requirements TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_active ON game_listings(is_active);
CREATE INDEX idx_listings_slots ON game_listings(available_slots);

-- Join requests
CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_listing_id UUID REFERENCES game_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

CREATE INDEX idx_requests_listing ON join_requests(game_listing_id);
CREATE INDEX idx_requests_user ON join_requests(user_id);
CREATE INDEX idx_requests_status ON join_requests(status);
```

## Subscription Management

```sql
-- Subscription history and changes
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  previous_tier VARCHAR(20),
  new_tier VARCHAR(20),
  change_type VARCHAR(20) CHECK (change_type IN ('upgrade', 'downgrade', 'cancel', 'renew', 'trial_start', 'trial_end')),
  change_reason TEXT,
  effective_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_date ON subscription_history(effective_date);

-- Payment transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  amount_usd DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  subscription_tier VARCHAR(20),
  is_annual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
CREATE INDEX idx_transactions_created ON payment_transactions(created_at);
```

## Enhanced Features Tables

```sql
-- Session recaps
CREATE TABLE session_recaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recap_text TEXT NOT NULL,
  key_moments JSONB DEFAULT '[]'::jsonb,
  participants JSONB DEFAULT '[]'::jsonb,
  generated_by VARCHAR(20) DEFAULT 'ai', -- 'ai' or 'manual'
  generated_at TIMESTAMP DEFAULT NOW(),
  emailed_to_players BOOLEAN DEFAULT FALSE,
  emailed_at TIMESTAMP
);

CREATE INDEX idx_recaps_session ON session_recaps(session_id);
CREATE INDEX idx_recaps_campaign ON session_recaps(campaign_id);

-- Character imports
CREATE TABLE character_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  source_platform VARCHAR(50), -- 'dnd_beyond', 'roll20', 'manual'
  import_data JSONB,
  import_status VARCHAR(20) CHECK (import_status IN ('pending', 'success', 'failed', 'partial')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_imports_user ON character_imports(user_id);
CREATE INDEX idx_imports_character ON character_imports(character_id);

-- Voice settings (per user preferences for NPCs/characters)
CREATE TABLE voice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) CHECK (entity_type IN ('npc', 'character', 'global')),
  entity_id UUID, -- npc_id or character_id, NULL for global
  voice_enabled BOOLEAN DEFAULT TRUE,
  voice_profile VARCHAR(50), -- 'male_deep', 'female_young', 'custom_url', etc.
  voice_speed DECIMAL(3,2) DEFAULT 1.0,
  voice_pitch DECIMAL(3,2) DEFAULT 1.0,
  user_audio_enabled BOOLEAN DEFAULT FALSE, -- User prefers to voice their own character
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_voice_settings_user ON voice_settings(user_id);
CREATE INDEX idx_voice_settings_entity ON voice_settings(entity_type, entity_id);

-- Shared campaign journals
CREATE TABLE campaign_journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  title VARCHAR(255),
  content TEXT,
  entry_type VARCHAR(20) CHECK (entry_type IN ('note', 'recap', 'lore', 'npc', 'location', 'item')),
  tags JSONB DEFAULT '[]'::jsonb,
  is_dm_only BOOLEAN DEFAULT FALSE,
  session_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_journal_campaign ON campaign_journal_entries(campaign_id);
CREATE INDEX idx_journal_author ON campaign_journal_entries(author_id);
CREATE INDEX idx_journal_type ON campaign_journal_entries(entry_type);

-- Smart encounter suggestions (saved for reuse)
CREATE TABLE encounter_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES users(id),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  party_level_min INTEGER,
  party_level_max INTEGER,
  party_size_min INTEGER,
  party_size_max INTEGER,
  difficulty VARCHAR(20) CHECK (difficulty IN ('trivial', 'easy', 'medium', 'hard', 'deadly')),
  monsters JSONB NOT NULL, -- Array of monster definitions
  tactics TEXT,
  environment VARCHAR(100),
  generated_by VARCHAR(20) DEFAULT 'ai', -- 'ai' or 'manual'
  is_public BOOLEAN DEFAULT FALSE,
  uses_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_encounters_creator ON encounter_templates(created_by);
CREATE INDEX idx_encounters_campaign ON encounter_templates(campaign_id);
CREATE INDEX idx_encounters_difficulty ON encounter_templates(difficulty);
CREATE INDEX idx_encounters_level ON encounter_templates(party_level_min, party_level_max);
CREATE INDEX idx_encounters_public ON encounter_templates(is_public);
```

## AI Usage Tracking

```sql
-- Track AI API usage for cost management
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES game_sessions(id),
  agent_type VARCHAR(50), -- 'dm', 'player', 'assistant', 'generator'
  action_type VARCHAR(50), -- 'generate_narrative', 'process_action', etc.
  model VARCHAR(50), -- 'gpt-4', 'dall-e-3'
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON ai_usage_logs(user_id);
CREATE INDEX idx_usage_session ON ai_usage_logs(session_id);
CREATE INDEX idx_usage_created ON ai_usage_logs(created_at);
```

## Views for Common Queries

```sql
-- Active campaigns with member count
CREATE VIEW campaign_overview AS
SELECT 
  c.*,
  COUNT(cm.id) as member_count,
  u.username as dm_username,
  rs.name as rule_system_name
FROM campaigns c
LEFT JOIN campaign_members cm ON c.id = cm.campaign_id
LEFT JOIN users u ON c.dm_user_id = u.id
LEFT JOIN rule_systems rs ON c.rule_system_id = rs.id
GROUP BY c.id, u.username, rs.name;

-- User's friends with status
CREATE VIEW user_friends AS
SELECT 
  f.user_id,
  u.id as friend_id,
  u.username as friend_username,
  u.display_name as friend_display_name,
  u.avatar_url as friend_avatar_url,
  f.status,
  f.created_at
FROM friendships f
JOIN users u ON f.friend_id = u.id
WHERE f.status = 'accepted';

-- Available game listings with details
CREATE VIEW available_games AS
SELECT 
  gl.*,
  c.name as campaign_name,
  u.username as dm_username,
  u.avatar_url as dm_avatar
FROM game_listings gl
JOIN campaigns c ON gl.campaign_id = c.id
JOIN users u ON c.dm_user_id = u.id
WHERE gl.is_active = TRUE AND gl.available_slots > 0;
```

## Row Level Security (RLS) Examples

```sql
-- Users can only see their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Campaign members can see campaign data
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select_members ON campaigns
  FOR SELECT USING (
    id IN (
      SELECT campaign_id FROM campaign_members 
      WHERE user_id = auth.uid()
    )
    OR visibility = 'public'
  );

-- Characters owned by user
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY characters_select_own ON characters
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY characters_update_own ON characters
  FOR UPDATE USING (owner_id = auth.uid());
```

## Indexes for Performance

```sql
-- Additional composite indexes
CREATE INDEX idx_session_logs_session_created ON session_logs(session_id, created_at DESC);
CREATE INDEX idx_campaigns_dm_status ON campaigns(dm_user_id, status);
CREATE INDEX idx_characters_owner_level ON characters(owner_id, level DESC);
CREATE INDEX idx_game_sessions_campaign_status ON game_sessions(campaign_id, status);
```

## Migration Strategy

```sql
-- Example migration for adding new feature
-- migrations/002_add_character_notes.sql

BEGIN;

ALTER TABLE characters 
ADD COLUMN notes TEXT,
ADD COLUMN private_notes TEXT;

COMMENT ON COLUMN characters.notes IS 'Public notes visible to party';
COMMENT ON COLUMN characters.private_notes IS 'Private notes only for owner';

COMMIT;
```
