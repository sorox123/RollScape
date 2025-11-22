'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, UserPlus, UserCheck, UserX, Clock, Ban, 
  MessageCircle, Search, Shield, ArrowLeft 
} from 'lucide-react'
import { apiFriends } from '@/lib/api'
import type { Friendship } from '@/lib/types/api'

interface Friend extends Friendship {
  friend_info?: {
    id: string
    username: string
    is_online: boolean
  }
}

interface BlockedUser extends Friendship {
  reason?: string
  blocked_user_info?: {
    username: string
  }
}

type Tab = 'friends' | 'pending' | 'blocked'

export default function FriendsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [pending, setPending] = useState<Friend[]>([])
  const [blocked, setBlocked] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [newFriendId, setNewFriendId] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    try {
      setLoading(true)
      
      if (activeTab === 'friends') {
        const response = await apiFriends.getFriends()
        setFriends(response.data || [])
      } else if (activeTab === 'pending') {
        const response = await apiFriends.getPending()
        setPending(response.data || [])
      } else if (activeTab === 'blocked') {
        const response = await apiFriends.getBlocked()
        setBlocked(response.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  async function sendFriendRequest() {
    if (!newFriendId.trim()) return
    
    try {
      await apiFriends.sendRequest(newFriendId)
      setNewFriendId('')
      setShowAddFriend(false)
      alert('Friend request sent!')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send request')
    }
  }

  async function acceptRequest(friendshipId: string) {
    try {
      await apiFriends.acceptRequest(friendshipId)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to accept')
    }
  }

  async function declineRequest(friendshipId: string) {
    try {
      await apiFriends.declineRequest(friendshipId)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to decline')
    }
  }

  async function removeFriend(friendshipId: string) {
    if (!confirm('Remove this friend?')) return
    
    try {
      await apiFriends.removeFriend(friendshipId)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove')
    }
  }

  async function blockUser(userId: string) {
    const reason = prompt('Reason for blocking (optional):')
    
    try {
      await apiFriends.blockUser(userId, reason || undefined)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to block')
    }
  }

  async function unblockUser(userId: string) {
    if (!confirm('Unblock this user?')) return
    
    try {
      await apiFriends.unblockUser(userId)
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to unblock')
    }
  }

  const filteredFriends = friends.filter(f => 
    f.friend_info?.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                  <Users className="w-8 h-8" />
                  Friends
                </h1>
                <p className="text-gray-400 mt-1">
                  {friends.length} friends • {friends.filter(f => f.friend_info?.is_online).length} online
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddFriend(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition"
            >
              <UserPlus className="w-5 h-5" />
              Add Friend
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition ${
                activeTab === 'friends'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition ${
                activeTab === 'pending'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending ({pending.length})
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition ${
                activeTab === 'blocked'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Ban className="w-4 h-4" />
              Blocked ({blocked.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'friends' && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>
            </div>

            {/* Friends List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
                <p className="text-gray-400 mt-4">Loading friends...</p>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl font-semibold mb-2">No friends yet</p>
                <p className="text-gray-400 mb-6">Add friends to start playing together!</p>
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg inline-flex items-center gap-2 transition"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Friend
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFriends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onMessage={(friendId: string) => router.push(`/messages?user=${friendId}`)}
                    onRemove={() => removeFriend(friend.id)}
                    onBlock={() => blockUser(friend.friend_info!.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl font-semibold mb-2">No pending requests</p>
              </div>
            ) : (
              pending.map((request) => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => acceptRequest(request.id)}
                  onDecline={() => declineRequest(request.id)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto" />
              </div>
            ) : blocked.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl font-semibold mb-2">No blocked users</p>
              </div>
            ) : (
              blocked.map((block) => (
                <BlockedUserCard
                  key={block.id}
                  block={block}
                  onUnblock={() => block.blocked_id && unblockUser(block.blocked_id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Add Friend</h2>
            <p className="text-gray-400 mb-4">Enter your friend's user ID</p>
            
            <input
              type="text"
              value={newFriendId}
              onChange={(e) => setNewFriendId(e.target.value)}
              placeholder="User ID (UUID)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={sendFriendRequest}
                disabled={!newFriendId.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition"
              >
                Send Request
              </button>
              <button
                onClick={() => {
                  setShowAddFriend(false)
                  setNewFriendId('')
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FriendCard({ friend, onMessage, onRemove, onBlock }: any) {
  const isOnline = friend.friend_info?.is_online

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`} />
          </div>
          <div>
            <p className="font-semibold">{friend.friend_info?.username || 'Unknown'}</p>
            <p className="text-sm text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onMessage(friend.friend_info?.id)}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center justify-center gap-1 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </button>
        <button
          onClick={onRemove}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition"
        >
          <UserX className="w-4 h-4" />
        </button>
        <button
          onClick={onBlock}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
        >
          <Ban className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function PendingRequestCard({ request, onAccept, onDecline }: any) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="font-semibold">{request.friend_info?.username || 'Unknown User'}</p>
          <p className="text-sm text-gray-400">Friend request</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
        >
          Decline
        </button>
      </div>
    </div>
  )
}

function BlockedUserCard({ block, onUnblock }: any) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center">
          <Ban className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p className="font-semibold">{block.blocked_user_info?.username || 'Unknown User'}</p>
          {block.reason && (
            <p className="text-sm text-gray-400">Reason: {block.reason}</p>
          )}
        </div>
      </div>

      <button
        onClick={onUnblock}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
      >
        Unblock
      </button>
    </div>
  )
}
