'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, User, Heart, Shield, Trash2 } from 'lucide-react'
import { apiCharacters } from '@/lib/api'
import { Character } from '@/lib/types/character'

export default function CharactersPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCharacters()
  }, [])

  async function loadCharacters() {
    try {
      setLoading(true)
      // TODO: Get user's campaign ID from context/auth
      const campaignId = 'demo-campaign-id'
      const response = await apiCharacters.getCampaignCharacters(campaignId, false)
      setCharacters(response.data || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load characters')
      // For demo, use empty array
      setCharacters([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(characterId: string) {
    if (!confirm('Are you sure you want to delete this character?')) return
    
    try {
      await apiCharacters.delete(characterId)
      setCharacters(characters.filter(c => c.id !== characterId))
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete character')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading characters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Characters</h1>
              <p className="text-gray-400 mt-1">
                {characters.length} {characters.length === 1 ? 'character' : 'characters'}
              </p>
            </div>
            
            <button
              onClick={() => router.push('/characters/new')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              New Character
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-yellow-400">{error}</p>
            <p className="text-sm text-gray-400 mt-1">
              Demo mode: Create a character to get started
            </p>
          </div>
        )}

        {characters.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-bold mb-2">No characters yet</h2>
            <p className="text-gray-400 mb-6">
              Create your first character to begin your adventure
            </p>
            <button
              onClick={() => router.push('/characters/new')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 mx-auto transition"
            >
              <Plus className="w-5 h-5" />
              Create Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onView={() => router.push(`/characters/${character.id}`)}
                onDelete={() => handleDelete(character.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CharacterCardProps {
  character: Character
  onView: () => void
  onDelete: () => void
}

function CharacterCard({ character, onView, onDelete }: CharacterCardProps) {
  const hpPercent = (character.current_hp / character.max_hp) * 100
  const isBloodied = character.current_hp <= character.max_hp / 2
  const isDying = character.current_hp <= 0

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-red-500 transition group">
      <div className="relative">
        {character.avatar_url ? (
          <img 
            src={character.avatar_url} 
            alt={character.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <User className="w-24 h-24 text-gray-600" />
          </div>
        )}
        
        {/* HP Bar overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isDying ? 'bg-red-700' : isBloodied ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
            />
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold mb-1">{character.name}</h3>
        <p className="text-gray-400 text-sm mb-3">
          Level {character.level} {character.race} {character.character_class}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <Heart className={`w-4 h-4 ${isDying ? 'text-red-700' : 'text-red-500'}`} />
            <span>{character.current_hp}/{character.max_hp}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>{character.armor_class}</span>
          </div>
        </div>

        <button
          onClick={onView}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          View Character
        </button>
      </div>
    </div>
  )
}
