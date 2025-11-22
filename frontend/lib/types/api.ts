// API types matching backend schemas

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'pro'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing'
export type CampaignStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived'
export type CampaignVisibility = 'private' | 'friends_only' | 'public'

// ============= USER TYPES =============

export interface User {
  id: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  monthly_ai_images_used: number
  ai_image_quota: number
  ai_player_quota: number
  pdf_import_quota: number
  created_at: string
  last_login_at?: string
}

export interface UserCreate {
  email: string
  username: string
  password: string
  display_name?: string
}

export interface UserUpdate {
  display_name?: string
  avatar_url?: string
  bio?: string
  preferences?: Record<string, any>
}

// ============= CAMPAIGN TYPES =============

export interface Campaign {
  id: string
  name: string
  description?: string
  dm_user_id: string
  rule_system: string
  max_players: number
  visibility: CampaignVisibility
  status: CampaignStatus
  current_session_number: number
  ai_dm_enabled: boolean
  ai_players_enabled: boolean
  current_location?: string
  current_chapter?: string
  banner_image_url?: string
  thumbnail_url?: string
  created_at: string
  updated_at?: string
  last_activity: string
}

export interface CampaignCreate {
  name: string
  description: string
  rule_system?: string
  max_players?: number
  visibility?: CampaignVisibility
  ai_dm_enabled?: boolean
  ai_players_enabled?: boolean
}

export interface CampaignUpdate {
  name?: string
  description?: string
  status?: CampaignStatus
  visibility?: CampaignVisibility
  max_players?: number
  current_location?: string
  current_chapter?: string
  ai_dm_personality?: string
  banner_image_url?: string
}

export interface CampaignListItem {
  id: string
  name: string
  description?: string
  dm_user_id: string
  status: CampaignStatus
  visibility: CampaignVisibility
  rule_system: string
  current_session_number: number
  thumbnail_url?: string
  created_at: string
}

// ============= GAME SESSION TYPES =============

export interface GameSession {
  id: string
  campaign_id: string
  session_number: number
  title?: string
  description?: string
  status: string
  scheduled_at?: string
  started_at?: string
  ended_at?: string
  duration_minutes?: number
  current_scene?: string
  summary?: string
  ai_requests_count: number
  ai_tokens_used: number
  ai_images_generated: number
  created_at: string
}

export interface GameSessionCreate {
  campaign_id: string
  dm_user_id: string
  player_character_ids: string[]
  scheduled_time?: string
}

export interface GameSessionUpdate {
  title?: string
  status?: string
  current_scene?: string
  summary?: string
}

export interface SessionAction {
  player_id: string
  character_id: string
  action_type: string
  description: string
  dice_roll?: any
  result?: string
}

export interface ChatMessage {
  sender_id: string
  sender_name: string
  sender_type: string
  message: string
}

export interface Combatant {
  character_id: string
  initiative: number
  is_player: boolean
}

// ============= DM AGENT TYPES =============

export interface DMChatRequest {
  message: string
  campaign_id?: string
  personality?: string
  context?: Record<string, any>
}

export interface DMChatResponse {
  response: string
  dm_style?: string
  suggested_actions?: string[]
  context?: Record<string, any>
}

export interface NPCGenerateRequest {
  race?: string
  character_class?: string
  level?: number
  personality_traits?: string[]
  role?: string
  campaign_id?: string
}

export interface EncounterGenerateRequest {
  party_level: number
  party_size: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly'
  environment?: string
  campaign_id?: string
}

// ============= PLAYER AGENT TYPES =============

export interface PersonalityAnalysis {
  character_id: string
  personality_summary: string
  behavioral_traits: string[]
  decision_style: string
  confidence_level: number
}

export interface ActionGenerateRequest {
  character_id: string
  situation: string
  available_actions?: string[]
}

export interface ActionGenerateResponse {
  suggested_action: string
  reasoning: string
  confidence: number
  alternative_actions?: string[]
}

export interface VoteInitiate {
  session_id: string
  decision: string
  options: string[]
  absent_character_ids: string[]
}

export interface VoteCast {
  character_id: string
  option: string
}

export interface VoteResults {
  vote_id: string
  decision: string
  options: string[]
  votes: Record<string, string>
  ai_votes: Record<string, string>
  winning_option?: string
  is_complete: boolean
}

// ============= DICE TYPES =============

export interface DiceRoll {
  notation: string
  total: number
  rolls: number[]
  modifier: number
  individual_rolls?: Array<{
    die: string
    rolls: number[]
  }>
}

// ============= MESSAGING TYPES =============

export interface Conversation {
  id: string
  type: string
  name?: string
  campaign_id?: string
  participant_ids?: string[]
  participants?: Array<{
    user_id: string
    username: string
    is_online: boolean
  }>
  created_at: string
  updated_at?: string
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name?: string
  content: string
  type?: 'text' | 'system' | 'dice_roll' | 'image'
  message_type?: string
  metadata?: Record<string, any>
  reply_to_id?: string
  is_read: boolean
  created_at: string
  updated_at?: string
}

export interface ConversationCreate {
  participant_ids: string[]
  type?: string
  name?: string
  campaign_id?: string
}

export interface MessageCreate {
  content: string
  message_type?: string
  metadata?: Record<string, any>
  reply_to_id?: string
}

export interface TypingStatus {
  user_id: string
  is_typing: boolean
  last_update: string
}

// ============= FRIEND TYPES =============

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  user_id_1?: string
  user_id_2?: string
  requester_id?: string
  blocker_id?: string
  blocked_id?: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at?: string
}

export interface FriendRequest {
  friend_id: string
}

export interface BlockUser {
  user_id: string
  reason?: string
}

// ============= STATUS TYPES =============

export interface ServiceStatus {
  database: boolean
  redis: boolean
  openai: boolean
  supabase: boolean
}

export interface HealthCheck {
  status: string
  timestamp: string
  uptime_seconds: number
}

export interface ModeInfo {
  auth_mode: string
  db_type: string
  redis_enabled: boolean
  features: string[]
}

export interface CostInfo {
  free: {
    ai_images_per_month: number
    ai_players_per_campaign: number
    pdf_imports_per_month: number
    max_campaigns: number
    max_characters_per_campaign: number
  }
  basic: {
    price_usd: number
    ai_images_per_month: number
    ai_players_per_campaign: number
    pdf_imports_per_month: number
    max_campaigns: number
    max_characters_per_campaign: number
  }
  premium: {
    price_usd: number
    ai_images_per_month: number
    ai_players_per_campaign: number
    pdf_imports_per_month: number
    max_campaigns: number
    max_characters_per_campaign: number
  }
  pro: {
    price_usd: number
    ai_images_per_month: string
    ai_players_per_campaign: string
    pdf_imports_per_month: string
    max_campaigns: string
    max_characters_per_campaign: string
  }
}

// ============= AI IMAGE TYPES =============

export interface ImageGenerateRequest {
  prompt: string
  type: 'character' | 'scene' | 'map' | 'item' | 'creature'
  campaign_id?: string
  character_id?: string
  style?: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
}

export interface ImageGenerateResponse {
  id: string
  url: string
  prompt: string
  revised_prompt?: string
  type: string
  campaign_id?: string
  character_id?: string
  created_at: string
}

// ============= SUBSCRIPTION TYPES =============

export interface SubscriptionInfo {
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  monthly_ai_images_used: number
  ai_image_quota: number
  ai_player_quota: number
  pdf_import_quota: number
}

export interface SubscriptionUpgrade {
  tier: SubscriptionTier
  payment_method_id?: string
}

// ============= COMMON TYPES =============

export interface MessageResponse {
  message: string
  detail?: string
}

export interface ErrorResponse {
  error: string
  detail?: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ============= API RESPONSE WRAPPER =============

export interface ApiResponse<T = any> {
  data?: T
  error?: ErrorResponse
  status: number
}
