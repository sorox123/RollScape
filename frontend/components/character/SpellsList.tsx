import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, CheckCircle, Circle, BookOpen } from 'lucide-react'
import { Character, Spell, SpellSlots } from '@/lib/types/character'

interface SpellsListProps {
  character: Character
  isEditing: boolean
  onSave: (updates: Partial<Character>) => void
}

export default function SpellsList({ character, isEditing, onSave }: SpellsListProps) {
  const [spells, setSpells] = useState<Spell[]>(character.spells || [])
  const [spellSlots, setSpellSlots] = useState<SpellSlots>(character.spell_slots || {})
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all')
  const [showPreparedOnly, setShowPreparedOnly] = useState(false)
  const [newSpell, setNewSpell] = useState<Partial<Spell> | null>(null)
  const [showBrowser, setShowBrowser] = useState(false)

  // Load spellbook from API
  useEffect(() => {
    if (character.id) {
      fetchSpellbook()
    }
  }, [character.id])

  async function fetchSpellbook() {
    try {
      const response = await fetch(
        `http://localhost:8000/api/spells/characters/${character.id}/spellbook`
      )
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match existing Spell type
        const apiSpells = data.map((entry: any) => ({
          id: entry.spell.id,
          name: entry.spell.name,
          level: entry.spell.level,
          school: entry.spell.school,
          castingTime: entry.spell.casting_time,
          range: entry.spell.range,
          components: entry.spell.components,
          duration: entry.spell.duration,
          description: entry.spell.description,
          prepared: entry.prepared,
          ritual: entry.spell.ritual,
          concentration: entry.spell.concentration,
          damage: entry.spell.damage_dice,
          damageType: entry.spell.damage_type,
          savingThrow: entry.spell.save_type,
        }))
        setSpells(apiSpells)
      }
    } catch (error) {
      console.error('Error fetching spellbook:', error)
    }
  }

  function handleSave() {
    onSave({ spells, spell_slots: spellSlots })
  }

  function addSpell() {
    setNewSpell({
      id: `temp-${Date.now()}`,
      name: '',
      level: 0,
      school: 'evocation',
      castingTime: '1 action',
      range: '30 feet',
      components: ['V', 'S'],
      duration: 'Instantaneous',
      description: '',
      prepared: false,
      ritual: false,
      concentration: false,
    })
  }

  function saveNewSpell() {
    if (!newSpell || !newSpell.name) return
    setSpells([...spells, newSpell as Spell])
    setNewSpell(null)
  }

  async function deleteSpell(id: string) {
    try {
      const response = await fetch(
        `http://localhost:8000/api/spells/characters/${character.id}/spellbook/${id}`,
        { method: 'DELETE' }
      )
      
      if (response.ok) {
        setSpells(spells.filter(spell => spell.id !== id))
      }
    } catch (error) {
      console.error('Error deleting spell:', error)
    }
  }

  async function togglePrepared(id: string) {
    const spell = spells.find(s => s.id === id)
    if (!spell) return

    try {
      const response = await fetch(
        `http://localhost:8000/api/spells/characters/${character.id}/spellbook/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prepared: !spell.prepared })
        }
      )
      
      if (response.ok) {
        setSpells(spells.map(s =>
          s.id === id ? { ...s, prepared: !s.prepared } : s
        ))
      }
    } catch (error) {
      console.error('Error updating spell:', error)
    }
  }

  function useSpellSlot(level: number) {
    if (!spellSlots[level] || spellSlots[level].current <= 0) return
    
    setSpellSlots({
      ...spellSlots,
      [level]: {
        ...spellSlots[level],
        current: spellSlots[level].current - 1
      }
    })
  }

  function restoreSpellSlot(level: number) {
    if (!spellSlots[level] || spellSlots[level].current >= spellSlots[level].max) return
    
    setSpellSlots({
      ...spellSlots,
      [level]: {
        ...spellSlots[level],
        current: spellSlots[level].current + 1
      }
    })
  }

  function longRest() {
    const restored = Object.entries(spellSlots).reduce((acc, [level, slots]) => ({
      ...acc,
      [level]: { ...slots, current: slots.max }
    }), {})
    setSpellSlots(restored)
  }

  // Filter spells
  let filteredSpells = spells
  if (filterLevel !== 'all') {
    filteredSpells = filteredSpells.filter(spell => spell.level === filterLevel)
  }
  if (showPreparedOnly) {
    filteredSpells = filteredSpells.filter(spell => spell.prepared)
  }

  // Group by level
  const spellsByLevel = filteredSpells.reduce((acc, spell) => {
    if (!acc[spell.level]) acc[spell.level] = []
    acc[spell.level].push(spell)
    return acc
  }, {} as Record<number, Spell[]>)

  const preparedCount = spells.filter(s => s.prepared).length
  const totalSpells = spells.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Spells</h2>
          <p className="text-sm text-gray-400 mt-1">
            Prepared: {preparedCount} / {totalSpells}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBrowser(!showBrowser)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition"
          >
            <BookOpen className="w-5 h-5" />
            {showBrowser ? 'Close Browser' : 'Browse Spells'}
          </button>
          {isEditing && (
            <>
              <button
                onClick={addSpell}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                Add Custom
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
              >
                Save Changes
              </button>
            </>
          )}
          {!isEditing && Object.keys(spellSlots).length > 0 && (
            <button
              onClick={longRest}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Long Rest
            </button>
          )}
        </div>
      </div>

      {/* Spell Slots */}
      {Object.keys(spellSlots).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Spell Slots</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(spellSlots)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, slots]) => (
                <div key={level} className="bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-400 mb-2">
                    Level {level}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => restoreSpellSlot(parseInt(level))}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded transition disabled:opacity-50"
                      disabled={slots.current >= slots.max}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-xl font-bold flex-1 text-center">
                      {slots.current} / {slots.max}
                    </span>
                    <button
                      onClick={() => useSpellSlot(parseInt(level))}
                      className="p-1 bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50"
                      disabled={slots.current <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: slots.max }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-2 rounded ${
                          i < slots.current ? 'bg-purple-500' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Filter by level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded"
            >
              <option value="all">All Levels</option>
              <option value="0">Cantrips</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPreparedOnly}
              onChange={(e) => setShowPreparedOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Prepared only</span>
          </label>
        </div>
      </div>

      {/* Spells List */}
      {Object.entries(spellsByLevel)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([level, levelSpells]) => (
          <div key={level} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              {level === '0' ? 'Cantrips' : `Level ${level} Spells`}
            </h3>
            <div className="space-y-3">
              {levelSpells.map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  isEditing={isEditing}
                  onTogglePrepared={togglePrepared}
                  onDelete={deleteSpell}
                />
              ))}
            </div>
          </div>
        ))}

      {filteredSpells.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <p className="text-gray-400">No spells found</p>
        </div>
      )}

      {/* New Spell Form */}
      {newSpell && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Add New Spell</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Spell name"
                value={newSpell.name}
                onChange={(e) => setNewSpell({ ...newSpell, name: e.target.value })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              />
              <select
                value={newSpell.level}
                onChange={(e) => setNewSpell({ ...newSpell, level: parseInt(e.target.value) })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              >
                <option value="0">Cantrip</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="School"
                value={newSpell.school}
                onChange={(e) => setNewSpell({ ...newSpell, school: e.target.value })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              />
              <input
                type="text"
                placeholder="Casting time"
                value={newSpell.castingTime}
                onChange={(e) => setNewSpell({ ...newSpell, castingTime: e.target.value })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              />
              <input
                type="text"
                placeholder="Range"
                value={newSpell.range}
                onChange={(e) => setNewSpell({ ...newSpell, range: e.target.value })}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              />
            </div>
            <textarea
              placeholder="Description"
              value={newSpell.description}
              onChange={(e) => setNewSpell({ ...newSpell, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={saveNewSpell}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
              >
                Add Spell
              </button>
              <button
                onClick={() => setNewSpell(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spell Browser Modal */}
      {showBrowser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Browse Spell Library</h2>
              <button
                onClick={() => setShowBrowser(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`/spells?characterId=${character.id}&embedded=true`}
                className="w-full h-full border-0"
                title="Spell Browser"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface SpellCardProps {
  spell: Spell
  isEditing: boolean
  onTogglePrepared: (id: string) => void
  onDelete: (id: string) => void
}

function SpellCard({ spell, isEditing, onTogglePrepared, onDelete }: SpellCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`p-3 rounded-lg ${
      spell.prepared ? 'bg-purple-900/30 border border-purple-700' : 'bg-gray-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onTogglePrepared(spell.id)}
              disabled={isEditing}
              className="disabled:cursor-not-allowed"
            >
              {spell.prepared ? (
                <CheckCircle className="w-5 h-5 text-purple-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <h4 className="font-semibold">{spell.name}</h4>
            {spell.ritual && (
              <span className="text-xs px-2 py-0.5 bg-blue-600 rounded">Ritual</span>
            )}
            {spell.concentration && (
              <span className="text-xs px-2 py-0.5 bg-yellow-600 rounded">Concentration</span>
            )}
          </div>
          
          <div className="text-sm text-gray-400 ml-7">
            <p>{spell.school} • {spell.castingTime} • {spell.range}</p>
            <p>Components: {spell.components.join(', ')} • {spell.duration}</p>
          </div>

          {expanded && (
            <p className="text-sm text-gray-300 mt-2 ml-7">{spell.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded transition"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
          {isEditing && (
            <button
              onClick={() => onDelete(spell.id)}
              className="p-1 hover:bg-red-600 rounded transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Minus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  )
}
