import { Character } from '@/lib/types/character'

interface BiographyProps {
  character: Character
  isEditing: boolean
  onSave: (updates: Partial<Character>) => void
}

export default function Biography({ character, isEditing, onSave }: BiographyProps) {
  // TODO: Get actual user role (DM/Player) from context or API
  const isDM = true // For now, assume current user can see DM content

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Biography</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoSection title="Background" content={character.background} />
          <InfoSection title="Alignment" content={character.alignment} />
        </div>

        <InfoSection title="Description" content={character.description} />
        <InfoSection title="Backstory" content={character.backstory} />
        
        {/* DM-Visible Section */}
        <div className="bg-yellow-900/10 border border-yellow-600/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">👁️</span>
            <h3 className="text-lg font-bold text-yellow-400">DM/AI DM Visible</h3>
            <span className="text-xs text-yellow-300 bg-yellow-900/30 px-2 py-1 rounded">
              Hidden from other players
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoSection title="Personality Traits" content={character.personality_traits} />
            <InfoSection title="Ideals" content={character.ideals} />
            <InfoSection title="Bonds" content={character.bonds} />
            <InfoSection title="Flaws" content={character.flaws} />
          </div>
        </div>

        {/* DM-Only Section */}
        {isDM && (
          <div className="bg-red-900/10 border border-red-600/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔒</span>
              <h3 className="text-lg font-bold text-red-400">DM Only</h3>
              <span className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
                Completely private
              </span>
            </div>
            
            <InfoSection title="DM Notes" content={character.dm_notes} />
          </div>
        )}

        <InfoSection title="Player Notes" content={character.player_notes} />
      </div>
    )
  }

  return (
    <EditableBiography character={character} onSave={onSave} isDM={isDM} />
  )
}

function InfoSection({ title, content }: { title: string; content?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-300 whitespace-pre-wrap">
        {content || <span className="text-gray-500 italic">Not provided</span>}
      </p>
    </div>
  )
}

function EditableBiography({ character, onSave, isDM }: { character: Character; onSave: (updates: Partial<Character>) => void; isDM: boolean }) {
  const [formData, setFormData] = React.useState({
    description: character.description || '',
    backstory: character.backstory || '',
    personality_traits: character.personality_traits || '',
    ideals: character.ideals || '',
    bonds: character.bonds || '',
    flaws: character.flaws || '',
    player_notes: character.player_notes || '',
    dm_notes: character.dm_notes || '',
  })

  function handleSave() {
    onSave(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Biography</h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          Save Changes
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <label className="block text-sm font-semibold mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
            rows={4}
            placeholder="Physical description, mannerisms, etc."
          />
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <label className="block text-sm font-semibold mb-2">Backstory</label>
          <textarea
            value={formData.backstory}
            onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
            rows={6}
            placeholder="Character history and background story"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-semibold mb-2">Personality Traits</label>
            <textarea
              value={formData.personality_traits}
              onChange={(e) => setFormData({ ...formData, personality_traits: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              rows={3}
              placeholder="How does your character behave?"
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-semibold mb-2">Ideals</label>
            <textarea
              value={formData.ideals}
              onChange={(e) => setFormData({ ...formData, ideals: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              rows={3}
              placeholder="What does your character believe in?"
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-semibold mb-2">Bonds</label>
            <textarea
              value={formData.bonds}
              onChange={(e) => setFormData({ ...formData, bonds: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              rows={3}
              placeholder="Who or what is your character connected to?"
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-semibold mb-2">Flaws</label>
            <textarea
              value={formData.flaws}
              onChange={(e) => setFormData({ ...formData, flaws: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              rows={3}
              placeholder="What are your character's weaknesses?"
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <label className="block text-sm font-semibold mb-2">Player Notes</label>
          <textarea
            value={formData.player_notes}
            onChange={(e) => setFormData({ ...formData, player_notes: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
            rows={4}
            placeholder="Your personal notes about this character"
          />
        </div>

        {isDM && (
          <div className="bg-red-900/10 border border-red-600/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔒</span>
              <h3 className="text-lg font-bold text-red-400">DM Only</h3>
            </div>
            <label className="block text-sm font-semibold mb-2">DM Notes</label>
            <textarea
              value={formData.dm_notes}
              onChange={(e) => setFormData({ ...formData, dm_notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              rows={4}
              placeholder="Private notes visible only to the DM..."
            />
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'
