'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Send, MoreVertical, Users, AlertCircle
} from 'lucide-react'
import { apiMessages } from '@/lib/api'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  content: string
  type: 'text' | 'system' | 'dice_roll' | 'image'
  metadata?: any
  reply_to_id?: string
  created_at: string
  is_read: boolean
}

interface Conversation {
  id: string
  type: 'direct' | 'group' | 'campaign'
  name?: string
  campaign_id?: string
  participants: Array<{
    user_id: string
    username: string
    is_online: boolean
  }>
  created_at: string
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [hasMore, setHasMore] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Current user (mock)
  const currentUserId = 'user-123'

  useEffect(() => {
    if (conversationId) {
      loadConversation()
      loadMessages()
      markAsRead()
      
      // Poll for typing indicators and new messages
      const interval = setInterval(() => {
        checkTyping()
        loadNewMessages()
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadConversation() {
    try {
      const response = await apiMessages.getConversation(conversationId)
      setConversation(response.data)
    } catch (err: any) {
      console.error('Failed to load conversation:', err)
    }
  }

  async function loadMessages() {
    try {
      setLoading(true)
      const response = await apiMessages.getMessages(conversationId, 50)
      setMessages(response.data)
      setHasMore(response.data.length >= 50)
    } catch (err: any) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadNewMessages() {
    if (messages.length === 0) return
    
    try {
      const lastMessage = messages[messages.length - 1]
      const response = await apiMessages.getMessages(conversationId, 20)
      
      // Add new messages that aren't already in the list
      const existingIds = new Set(messages.map(m => m.id))
      const newMessages = response.data.filter((m: Message) => !existingIds.has(m.id))
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages])
        markAsRead()
      }
    } catch (err: any) {
      console.error('Failed to load new messages:', err)
    }
  }

  async function markAsRead() {
    try {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        await apiMessages.markAsRead(conversationId, lastMessage.id)
      }
    } catch (err: any) {
      console.error('Failed to mark as read:', err)
    }
  }

  async function checkTyping() {
    try {
      const response = await apiMessages.getTyping(conversationId)
      const typing = response.data.typing_users || []
      setTypingUsers(typing.filter((id: string) => id !== currentUserId))
    } catch (err: any) {
      console.error('Failed to check typing:', err)
    }
  }

  async function sendMessage() {
    if (!messageContent.trim() || sending) return

    try {
      setSending(true)
      const content = messageContent.trim()
      setMessageContent('') // Clear input immediately
      
      const response = await apiMessages.sendMessage(conversationId, {
        content,
        type: 'text',
      })
      
      // Add the new message to the list
      setMessages(prev => [...prev, response.data])
      
      // Stop typing indicator
      await apiMessages.setTyping(conversationId, false)
    } catch (err: any) {
      console.error('Failed to send message:', err)
      alert(err.response?.data?.detail || 'Failed to send message')
      setMessageContent(content) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  async function handleTyping() {
    // Set typing indicator
    try {
      await apiMessages.setTyping(conversationId, true)
    } catch (err: any) {
      console.error('Failed to set typing:', err)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to clear typing after 3 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await apiMessages.setTyping(conversationId, false)
      } catch (err: any) {
        console.error('Failed to clear typing:', err)
      }
    }, 3000)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <p className="text-xl">Invalid conversation</p>
        </div>
      </div>
    )
  }

  // Get display name
  let displayName = 'Loading...'
  let isOnline = false
  if (conversation) {
    displayName = conversation.name || 'Unnamed Conversation'
    if (!conversation.name && conversation.type === 'direct' && conversation.participants.length > 0) {
      displayName = conversation.participants[0].username
      isOnline = conversation.participants[0].is_online
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/messages')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    {conversation?.type === 'group' || conversation?.type === 'campaign' ? (
                      <Users className="w-5 h-5 text-gray-400" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                  )}
                </div>
                
                <div>
                  <h1 className="text-lg font-semibold">{displayName}</h1>
                  {isOnline && (
                    <p className="text-xs text-green-400">Online</p>
                  )}
                  {conversation?.type === 'group' && (
                    <p className="text-xs text-gray-400">
                      {conversation.participants.length} members
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button className="p-2 hover:bg-gray-700 rounded-lg transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
              <p className="text-gray-400 mt-4">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl font-semibold mb-2">No messages yet</p>
              <p className="text-gray-400">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === currentUserId
                const showTimestamp = index === 0 || 
                  (new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime()) > 300000 // 5 minutes

                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatTimestamp(message.created_at)}
                      </div>
                    )}
                    <MessageBubble message={message} isOwn={isOwn} />
                  </div>
                )
              })}
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{typingUsers.length === 1 ? 'Someone' : `${typingUsers.length} people`} typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageContent}
              onChange={(e) => {
                setMessageContent(e.target.value)
                handleTyping()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!messageContent.trim() || sending}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (message.type === 'system') {
    return (
      <div className="text-center text-sm text-gray-400 py-2">
        {message.content}
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <p className="text-xs text-gray-400 mb-1 ml-2">{message.sender_name}</p>
        )}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-700 text-white rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

function formatTimestamp(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return 'Today ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
}
