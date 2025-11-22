import axios, { AxiosResponse } from 'axios'
import type {
  User, UserUpdate, Campaign, CampaignCreate, CampaignUpdate, CampaignListItem,
  GameSession, GameSessionCreate, GameSessionUpdate, SessionAction, ChatMessage, Combatant,
  DMChatRequest, DMChatResponse, NPCGenerateRequest, EncounterGenerateRequest,
  PersonalityAnalysis, ActionGenerateRequest, ActionGenerateResponse, VoteInitiate, VoteCast, VoteResults,
  DiceRoll, Conversation, ConversationCreate, Message, MessageCreate, TypingStatus,
  Friendship, FriendRequest, BlockUser,
  ServiceStatus, HealthCheck, ModeInfo, CostInfo,
  ImageGenerateRequest, ImageGenerateResponse,
  SubscriptionInfo, SubscriptionUpgrade,
  MessageResponse, ApiResponse
} from './types/api'
import type { Character, CharacterCreateData, CharacterUpdateData } from './types/character'

// Use Next.js rewrite in production, direct URL in development
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor (for auth tokens when implemented)
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Add auth token when auth is implemented
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor (for error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: Redirect to login when auth is implemented
      console.error('Unauthorized')
    }
    return Promise.reject(error)
  }
)

// ===== API HELPER =====

/**
 * Wraps API responses in a standard format for consistent error handling
 */
async function handleResponse<T>(promise: Promise<AxiosResponse<T>>): Promise<ApiResponse<T>> {
  try {
    const response = await promise
    return {
      data: response.data,
      status: response.status,
    }
  } catch (error: any) {
    return {
      error: {
        error: error.response?.data?.error || error.message || 'Unknown error',
        detail: error.response?.data?.detail,
        code: error.response?.status?.toString(),
      },
      status: error.response?.status || 500,
    }
  }
}

// ===== API FUNCTIONS =====

// Status
export const apiStatus = {
  getServices: () => handleResponse<ServiceStatus>(apiClient.get('/api/status/services')),
  getHealth: () => handleResponse<HealthCheck>(apiClient.get('/api/status/health')),
  getMode: () => handleResponse<ModeInfo>(apiClient.get('/api/status/mode')),
  getCosts: () => handleResponse<CostInfo>(apiClient.get('/api/status/costs')),
}

// Users
export const apiUsers = {
  getCurrent: () => handleResponse<User>(apiClient.get('/api/users/me')),
  getProfile: (userId: string) => handleResponse<User>(apiClient.get(`/api/users/${userId}`)),
  updateProfile: (data: UserUpdate) => handleResponse<User>(apiClient.patch('/api/users/me', data)),
  getQuota: () => handleResponse<{ ai_images: number; ai_players: number; pdf_imports: number }>(
    apiClient.get('/api/users/me/quota')
  ),
}

// Campaigns
export const apiCampaigns = {
  create: (data: CampaignCreate) => handleResponse<Campaign>(apiClient.post('/api/campaigns', data)),
  get: (campaignId: string) => handleResponse<Campaign>(apiClient.get(`/api/campaigns/${campaignId}`)),
  update: (campaignId: string, data: CampaignUpdate) => handleResponse<Campaign>(
    apiClient.patch(`/api/campaigns/${campaignId}`, data)
  ),
  delete: (campaignId: string) => handleResponse<MessageResponse>(apiClient.delete(`/api/campaigns/${campaignId}`)),
  list: () => handleResponse<CampaignListItem[]>(apiClient.get('/api/campaigns')),
  getMyCampaigns: () => handleResponse<CampaignListItem[]>(apiClient.get('/api/campaigns/my')),
  getMembers: (campaignId: string) => handleResponse<User[]>(apiClient.get(`/api/campaigns/${campaignId}/members`)),
  addMember: (campaignId: string, userId: string) => handleResponse<MessageResponse>(
    apiClient.post(`/api/campaigns/${campaignId}/members`, { user_id: userId })
  ),
  removeMember: (campaignId: string, userId: string) => handleResponse<MessageResponse>(
    apiClient.delete(`/api/campaigns/${campaignId}/members/${userId}`)
  ),
}

// Dice
export const apiDice = {
  roll: (notation: string) => handleResponse<DiceRoll>(apiClient.get(`/api/dice/roll/${notation}`)),
  rollMultiple: (rolls: string[]) => handleResponse<DiceRoll[]>(
    apiClient.post('/api/dice/roll-multiple', { rolls })
  ),
}

// Friends
export const apiFriends = {
  sendRequest: (friendId: string) => handleResponse<MessageResponse>(
    apiClient.post('/api/friends/request', { friend_id: friendId })
  ),
  acceptRequest: (friendshipId: string) => handleResponse<MessageResponse>(
    apiClient.post(`/api/friends/${friendshipId}/accept`)
  ),
  declineRequest: (friendshipId: string) => handleResponse<MessageResponse>(
    apiClient.post(`/api/friends/${friendshipId}/decline`)
  ),
  removeFriend: (friendshipId: string) => handleResponse<MessageResponse>(
    apiClient.delete(`/api/friends/${friendshipId}`)
  ),
  getFriends: () => handleResponse<Friendship[]>(apiClient.get('/api/friends/list')),
  getPending: () => handleResponse<Friendship[]>(apiClient.get('/api/friends/pending')),
  blockUser: (userId: string, reason?: string) => handleResponse<MessageResponse>(
    apiClient.post('/api/friends/block', { user_id: userId, reason })
  ),
  unblockUser: (userId: string) => handleResponse<MessageResponse>(
    apiClient.delete(`/api/friends/block/${userId}`)
  ),
  getBlocked: () => handleResponse<Friendship[]>(apiClient.get('/api/friends/blocked')),
}

// Messaging
export const apiMessages = {
  createConversation: (data: ConversationCreate) => handleResponse<Conversation>(
    apiClient.post('/api/messages/conversations', data)
  ),
  getConversation: (conversationId: string) => handleResponse<Conversation>(
    apiClient.get(`/api/messages/conversations/${conversationId}`)
  ),
  getInbox: (limit?: number) => handleResponse<Conversation[]>(
    apiClient.get('/api/messages/inbox', { params: { limit } })
  ),
  sendMessage: (conversationId: string, data: MessageCreate) => handleResponse<Message>(
    apiClient.post(`/api/messages/conversations/${conversationId}/messages`, data)
  ),
  getMessages: (conversationId: string, limit?: number, beforeId?: string) => handleResponse<Message[]>(
    apiClient.get(`/api/messages/conversations/${conversationId}/messages`, {
      params: { limit, before_id: beforeId }
    })
  ),
  markAsRead: (conversationId: string, messageId: string) => handleResponse<MessageResponse>(
    apiClient.post(`/api/messages/conversations/${conversationId}/read`, { message_id: messageId })
  ),
  setTyping: (conversationId: string, isTyping: boolean) => handleResponse<MessageResponse>(
    apiClient.post('/api/messages/typing', { conversation_id: conversationId, is_typing: isTyping })
  ),
  getTyping: (conversationId: string) => handleResponse<TypingStatus[]>(
    apiClient.get(`/api/messages/conversations/${conversationId}/typing`)
  ),
  deleteMessage: (messageId: string) => handleResponse<MessageResponse>(
    apiClient.delete(`/api/messages/messages/${messageId}`)
  ),
}

// Game Sessions
export const apiSessions = {
  create: (data: GameSessionCreate) => handleResponse<GameSession>(
    apiClient.post('/api/session/create', data)
  ),
  get: (sessionId: string) => handleResponse<GameSession>(
    apiClient.get(`/api/session/${sessionId}`)
  ),
  getSummary: (sessionId: string) => handleResponse<string>(
    apiClient.get(`/api/session/${sessionId}/summary`)
  ),
  start: (sessionId: string) => handleResponse<GameSession>(
    apiClient.post(`/api/session/${sessionId}/start`)
  ),
  end: (sessionId: string) => handleResponse<GameSession>(
    apiClient.post(`/api/session/${sessionId}/end`)
  ),
  addAction: (sessionId: string, data: SessionAction) => handleResponse<MessageResponse>(
    apiClient.post(`/api/session/${sessionId}/action`, data)
  ),
  sendChat: (sessionId: string, data: ChatMessage) => handleResponse<MessageResponse>(
    apiClient.post(`/api/session/${sessionId}/chat`, data)
  ),
  getChat: (sessionId: string, limit?: number) => handleResponse<ChatMessage[]>(
    apiClient.get(`/api/session/${sessionId}/chat`, { params: { limit } })
  ),
  getActions: (sessionId: string, limit?: number) => handleResponse<SessionAction[]>(
    apiClient.get(`/api/session/${sessionId}/actions`, { params: { limit } })
  ),
  startCombat: (sessionId: string, combatants: Combatant[]) => handleResponse<MessageResponse>(
    apiClient.post(`/api/session/${sessionId}/combat/start`, { combatants })
  ),
  getCombat: (sessionId: string) => handleResponse<any>(
    apiClient.get(`/api/session/${sessionId}/combat`)
  ),
  nextTurn: (sessionId: string) => handleResponse<MessageResponse>(
    apiClient.post(`/api/session/${sessionId}/combat/next-turn`)
  ),
  endCombat: (sessionId: string) => handleResponse<MessageResponse>(
    apiClient.post(`/api/session/${sessionId}/combat/end`)
  ),
}

// DM Agent
export const apiDM = {
  chat: (data: DMChatRequest) => handleResponse<DMChatResponse>(
    apiClient.post('/api/dm/chat', data)
  ),
  generateNarrative: (data: { campaign_id: string; context?: any }) => handleResponse<{ narrative: string }>(
    apiClient.post('/api/dm/narrative', data)
  ),
  generateNPC: (data: NPCGenerateRequest) => handleResponse<Character>(
    apiClient.post('/api/dm/generate-npc', data)
  ),
  generateEncounter: (data: EncounterGenerateRequest) => handleResponse<any>(
    apiClient.post('/api/dm/generate-encounter', data)
  ),
  getStats: (campaignId: string) => handleResponse<any>(
    apiClient.get(`/api/dm/stats/${campaignId}`)
  ),
}

// Player Agent
export const apiPlayerAgent = {
  analyzePersonality: (characterId: string) => handleResponse<PersonalityAnalysis>(
    apiClient.post('/api/player-agent/analyze', { character_id: characterId })
  ),
  generateAction: (data: ActionGenerateRequest) => handleResponse<ActionGenerateResponse>(
    apiClient.post('/api/player-agent/action', data)
  ),
  initiateVote: (data: VoteInitiate) => handleResponse<{ vote_id: string }>(
    apiClient.post('/api/player-agent/vote', data)
  ),
  castVote: (voteId: string, data: VoteCast) => handleResponse<MessageResponse>(
    apiClient.post(`/api/player-agent/vote/${voteId}/cast`, data)
  ),
  getVoteResults: (voteId: string) => handleResponse<VoteResults>(
    apiClient.get(`/api/player-agent/vote/${voteId}/results`)
  ),
}

// Characters
export const apiCharacters = {
  create: (data: CharacterCreateData) => handleResponse<Character>(
    apiClient.post('/api/characters', data)
  ),
  get: (characterId: string) => handleResponse<Character>(
    apiClient.get(`/api/characters/${characterId}`)
  ),
  update: (characterId: string, data: CharacterUpdateData) => handleResponse<Character>(
    apiClient.patch(`/api/characters/${characterId}`, data)
  ),
  delete: (characterId: string) => handleResponse<MessageResponse>(
    apiClient.delete(`/api/characters/${characterId}`)
  ),
  getCampaignCharacters: (campaignId: string, includeNpcs?: boolean) => handleResponse<Character[]>(
    apiClient.get(`/api/characters/campaign/${campaignId}`, { 
      params: { include_npcs: includeNpcs } 
    })
  ),
  applyDamage: (characterId: string, damage: number) => handleResponse<Character>(
    apiClient.post(`/api/characters/${characterId}/damage`, null, { 
      params: { damage } 
    })
  ),
  applyHealing: (characterId: string, healing: number) => handleResponse<Character>(
    apiClient.post(`/api/characters/${characterId}/heal`, null, { 
      params: { healing } 
    })
  ),
}

// AI Images
export const apiAIImages = {
  generate: (data: ImageGenerateRequest) => handleResponse<ImageGenerateResponse>(
    apiClient.post('/api/ai-images/generate', data)
  ),
  getHistory: (limit?: number, type?: string) => handleResponse<ImageGenerateResponse[]>(
    apiClient.get('/api/ai-images/history', { params: { limit, type } })
  ),
  getImage: (imageId: string) => handleResponse<ImageGenerateResponse>(
    apiClient.get(`/api/ai-images/${imageId}`)
  ),
  delete: (imageId: string) => handleResponse<MessageResponse>(
    apiClient.delete(`/api/ai-images/${imageId}`)
  ),
}

// Subscriptions
export const apiSubscriptions = {
  getCurrent: () => handleResponse<SubscriptionInfo>(
    apiClient.get('/api/subscription/current')
  ),
  upgrade: (data: SubscriptionUpgrade) => handleResponse<SubscriptionInfo>(
    apiClient.post('/api/subscription/upgrade', data)
  ),
  cancel: () => handleResponse<MessageResponse>(
    apiClient.post('/api/subscription/cancel')
  ),
  reactivate: () => handleResponse<SubscriptionInfo>(
    apiClient.post('/api/subscription/reactivate')
  ),
}

export default apiClient
