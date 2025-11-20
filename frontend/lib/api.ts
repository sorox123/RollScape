import axios from 'axios'

// Use Next.js rewrite in production, direct URL in development
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// ===== API Functions =====

// Status
export const apiStatus = {
  getServices: () => apiClient.get('/api/status/services'),
  getHealth: () => apiClient.get('/api/status/health'),
  getMode: () => apiClient.get('/api/status/mode'),
}

// Dice
export const apiDice = {
  roll: (notation: string) => apiClient.get(`/api/dice/roll/${notation}`),
}

// Friends
export const apiFriends = {
  sendRequest: (friendId: string) => 
    apiClient.post('/api/friends/request', { friend_id: friendId }),
  acceptRequest: (friendshipId: string) => 
    apiClient.post(`/api/friends/${friendshipId}/accept`),
  declineRequest: (friendshipId: string) => 
    apiClient.post(`/api/friends/${friendshipId}/decline`),
  removeFriend: (friendshipId: string) => 
    apiClient.delete(`/api/friends/${friendshipId}`),
  getFriends: () => apiClient.get('/api/friends/list'),
  getPending: () => apiClient.get('/api/friends/pending'),
  blockUser: (userId: string, reason?: string) => 
    apiClient.post('/api/friends/block', { user_id: userId, reason }),
  unblockUser: (userId: string) => 
    apiClient.delete(`/api/friends/block/${userId}`),
  getBlocked: () => apiClient.get('/api/friends/blocked'),
}

// Messaging
export const apiMessages = {
  createConversation: (data: {
    participant_ids: string[]
    type?: string
    name?: string
    campaign_id?: string
  }) => apiClient.post('/api/messages/conversations', data),
  getConversation: (conversationId: string) => 
    apiClient.get(`/api/messages/conversations/${conversationId}`),
  getInbox: (limit?: number) => 
    apiClient.get('/api/messages/inbox', { params: { limit } }),
  sendMessage: (conversationId: string, data: {
    content: string
    message_type?: string
    metadata?: any
    reply_to_id?: string
  }) => apiClient.post(`/api/messages/conversations/${conversationId}/messages`, data),
  getMessages: (conversationId: string, limit?: number, beforeId?: string) => 
    apiClient.get(`/api/messages/conversations/${conversationId}/messages`, {
      params: { limit, before_id: beforeId }
    }),
  markAsRead: (conversationId: string, messageId: string) => 
    apiClient.post(`/api/messages/conversations/${conversationId}/read`, {
      message_id: messageId
    }),
  setTyping: (conversationId: string, isTyping: boolean) => 
    apiClient.post('/api/messages/typing', { conversation_id: conversationId, is_typing: isTyping }),
  getTyping: (conversationId: string) => 
    apiClient.get(`/api/messages/conversations/${conversationId}/typing`),
  deleteMessage: (messageId: string) => 
    apiClient.delete(`/api/messages/messages/${messageId}`),
}

// Game Sessions
export const apiSessions = {
  create: (data: {
    campaign_id: string
    dm_user_id: string
    player_character_ids: string[]
    scheduled_time?: string
  }) => apiClient.post('/api/session/create', data),
  get: (sessionId: string) => apiClient.get(`/api/session/${sessionId}`),
  getSummary: (sessionId: string) => apiClient.get(`/api/session/${sessionId}/summary`),
  start: (sessionId: string) => apiClient.post(`/api/session/${sessionId}/start`),
  end: (sessionId: string) => apiClient.post(`/api/session/${sessionId}/end`),
  addAction: (sessionId: string, data: {
    player_id: string
    character_id: string
    action_type: string
    description: string
    dice_roll?: any
    result?: string
  }) => apiClient.post(`/api/session/${sessionId}/action`, data),
  sendChat: (sessionId: string, data: {
    sender_id: string
    sender_name: string
    sender_type: string
    message: string
  }) => apiClient.post(`/api/session/${sessionId}/chat`, data),
  getChat: (sessionId: string, limit?: number) => 
    apiClient.get(`/api/session/${sessionId}/chat`, { params: { limit } }),
  getActions: (sessionId: string, limit?: number) => 
    apiClient.get(`/api/session/${sessionId}/actions`, { params: { limit } }),
  startCombat: (sessionId: string, combatants: any[]) => 
    apiClient.post(`/api/session/${sessionId}/combat/start`, { combatants }),
  getCombat: (sessionId: string) => 
    apiClient.get(`/api/session/${sessionId}/combat`),
  nextTurn: (sessionId: string) => 
    apiClient.post(`/api/session/${sessionId}/combat/next-turn`),
  endCombat: (sessionId: string) => 
    apiClient.post(`/api/session/${sessionId}/combat/end`),
}

// DM Agent
export const apiDM = {
  chat: (data: {
    message: string
    campaign_id?: string
    personality?: string
    context?: any
  }) => apiClient.post('/api/dm/chat', data),
  generateNPC: (data: any) => apiClient.post('/api/dm/generate-npc', data),
  generateEncounter: (data: any) => apiClient.post('/api/dm/generate-encounter', data),
}

// Player Agent
export const apiPlayerAgent = {
  analyzePersonality: (characterId: string) => 
    apiClient.post('/api/player-agent/analyze', { character_id: characterId }),
  generateAction: (data: {
    character_id: string
    situation: string
    available_actions?: string[]
  }) => apiClient.post('/api/player-agent/action', data),
  initiateVote: (data: {
    session_id: string
    decision: string
    options: string[]
    absent_character_ids: string[]
  }) => apiClient.post('/api/player-agent/vote', data),
  castVote: (voteId: string, data: {
    character_id: string
    option: string
  }) => apiClient.post(`/api/player-agent/vote/${voteId}/cast`, data),
  getVoteResults: (voteId: string) => 
    apiClient.get(`/api/player-agent/vote/${voteId}/results`),
}

// Characters
export const apiCharacters = {
  create: (data: any) => apiClient.post('/api/characters', data),
  get: (characterId: string) => apiClient.get(`/api/characters/${characterId}`),
  update: (characterId: string, data: any) => 
    apiClient.patch(`/api/characters/${characterId}`, data),
  delete: (characterId: string) => 
    apiClient.delete(`/api/characters/${characterId}`),
  getCampaignCharacters: (campaignId: string, includeNpcs?: boolean) => 
    apiClient.get(`/api/characters/campaign/${campaignId}`, { 
      params: { include_npcs: includeNpcs } 
    }),
  applyDamage: (characterId: string, damage: number) => 
    apiClient.post(`/api/characters/${characterId}/damage`, null, { 
      params: { damage } 
    }),
  applyHealing: (characterId: string, healing: number) => 
    apiClient.post(`/api/characters/${characterId}/heal`, null, { 
      params: { healing } 
    }),
}

export default apiClient
