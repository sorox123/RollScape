'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageCircle, Plus, Search, ArrowLeft, Users
} from 'lucide-react'
import { apiMessages } from '@/lib/api'
import type { Conversation } from '@/lib/types/api'

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)

  useEffect(() => {
    loadInbox()
  }, [])

  async function loadInbox() {
    try {
      setLoading(true)
      const response = await apiMessages.getInbox(50)
      setConversations(response.data || [])
    } catch (err: any) {
      console.error('Failed to load inbox:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const query = searchQuery.toLowerCase()
    return (
      conv.name?.toLowerCase().includes(query) ||
      conv.participants?.some(p => p.username.toLowerCase().includes(query)) ||
      conv.last_message?.content.toLowerCase().includes(query)
    )
  })

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <MessageCircle className="w-8 h-8" />
                  Messages
                </h1>
                <p className="text-gray-400 mt-1">
                  {conversations.length} conversations
                  {totalUnread > 0 && ` • ${totalUnread} unread`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNewConversation(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              New Message
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-gray-400 mt-4">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl font-semibold mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="text-gray-400 mb-6">
              {searchQuery ? 'Try a different search' : 'Start a conversation with your friends!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewConversation(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                New Message
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                onClick={() => router.push(`/messages/${conversation.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal
          onClose={() => setShowNewConversation(false)}
          onCreated={(convId: string) => {
            setShowNewConversation(false)
            router.push(`/messages/${convId}`)
          }}
        />
      )}
    </div>
  )
}

function ConversationCard({ conversation, onClick }: any) {
  const isUnread = conversation.unread_count > 0
  
  // Get display name
  let displayName = conversation.name
  if (!displayName && conversation.type === 'direct' && conversation.participants.length > 0) {
    displayName = conversation.participants[0].username
  }

  // Get online status for direct messages
  const isOnline = conversation.type === 'direct' && 
                   conversation.participants.length > 0 &&
                   conversation.participants[0].is_online

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border transition text-left ${
        isUnread
          ? 'bg-blue-900/20 border-blue-700 hover:bg-blue-900/30'
          : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
            {conversation.type === 'group' || conversation.type === 'campaign' ? (
              <Users className="w-6 h-6 text-gray-400" />
            ) : (
              <MessageCircle className="w-6 h-6 text-gray-400" />
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className={`font-semibold truncate ${isUnread ? 'text-white' : 'text-gray-200'}`}>
                {displayName || 'Unnamed Conversation'}
              </p>
              {conversation.type === 'group' && (
                <span className="text-xs px-2 py-0.5 bg-purple-600 rounded">Group</span>
              )}
              {conversation.type === 'campaign' && (
                <span className="text-xs px-2 py-0.5 bg-green-600 rounded">Campaign</span>
              )}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {conversation.last_message && formatTime(conversation.last_message.created_at)}
            </span>
          </div>

          {conversation.last_message && (
            <p className={`text-sm truncate ${isUnread ? 'text-gray-300' : 'text-gray-400'}`}>
              <span className="font-medium">{conversation.last_message.sender_name}:</span>{' '}
              {conversation.last_message.content}
            </p>
          )}

          {conversation.unread_count > 0 && (
            <div className="mt-2">
              <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-600 rounded-full">
                {conversation.unread_count} new
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function NewConversationModal({ onClose, onCreated }: any) {
  const [participantIds, setParticipantIds] = useState('')
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct')
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)

  async function createConversation() {
    const ids = participantIds.split(',').map(id => id.trim()).filter(Boolean)
    
    if (ids.length === 0) {
      alert('Enter at least one participant ID')
      return
    }

    if (conversationType === 'group' && !groupName.trim()) {
      alert('Enter a group name')
      return
    }

    try {
      setCreating(true)
      const response = await apiMessages.createConversation({
        participant_ids: ids,
        type: conversationType,
        name: conversationType === 'group' ? groupName : undefined,
      })
      if (response.data?.id) {
        onCreated(response.data.id)
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create conversation')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">New Conversation</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setConversationType('direct')}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  conversationType === 'direct'
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Direct
              </button>
              <button
                onClick={() => setConversationType('group')}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  conversationType === 'group'
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Group
              </button>
            </div>
          </div>

          {conversationType === 'group' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Participant IDs (comma-separated)
            </label>
            <textarea
              value={participantIds}
              onChange={(e) => setParticipantIds(e.target.value)}
              placeholder="user-id-1, user-id-2, ..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter user IDs separated by commas
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={createConversation}
              disabled={creating}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
