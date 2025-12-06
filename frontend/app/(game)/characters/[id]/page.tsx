'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Heart, Shield, Zap, Sword, BookOpen, Backpack, 
  User, Save, Edit2, ArrowLeft, Dices 
} from 'lucide-react'
import { apiCharacters, apiDice } from '@/lib/api'
import { Character, calculateModifier, formatModifier, calculateProficiencyBonus } from '@/lib/types/character'
import AbilityScores from '@/components/character/AbilityScores'
import CombatStats from '@/components/character/CombatStats'
import SkillsList from '@/components/character/SkillsList'
import SpellsList from '@/components/character/SpellsList'
import EquipmentList from '@/components/character/EquipmentList'
import Biography from '@/components/character/Biography'

type Tab = 'stats' | 'combat' | 'skills' | 'spells' | 'equipment' | 'bio'

export default function CharacterSheetPage() {
  const params = useParams()
  const router = useRouter()
  const characterId = (params?.id as string) || ''
  
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCharacter()
  }, [characterId])

  async function loadCharacter() {
    try {
      setLoading(true)
      const response = await apiCharacters.get(characterId)
      setCharacter(response.data || null)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load character')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(updates: Partial<Character>) {
    if (!character) return
    
    try {
      setSaving(true)
      const response = await apiCharacters.update(characterId, updates)
      if (response.data) {
        setCharacter(response.data)
      }
      setIsEditing(false)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save character')
    } finally {
      setSaving(false)
    }
  }

  async function rollAbilityCheck(ability: keyof Character['ability_scores']) {
    if (!character) return
    
    const score = character.ability_scores[ability]
    const modifier = calculateModifier(score)
    
    try {
      const response = await apiDice.roll(`1d20${formatModifier(modifier)}`)
      if (response.data) {
        alert(`${ability.toUpperCase()} Check: ${response.data.total} (${response.data.notation})`)
      }
    } catch (err) {
      console.error('Failed to roll dice:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Dices className="w-16 h-16 mx-auto mb-4 animate-spin text-red-500" />
          <p className="text-gray-400">Loading character...</p>
        </div>
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || 'Character not found'}</p>
          <button
            onClick={() => router.push('/characters')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Back to Characters
          </button>
        </div>
      </div>
    )
  }

  const proficiencyBonus = calculateProficiencyBonus(character.level)

  const tabs = [
    { id: 'stats' as Tab, label: 'Stats', icon: User },
    { id: 'combat' as Tab, label: 'Combat', icon: Sword },
    { id: 'skills' as Tab, label: 'Skills', icon: Zap },
    { id: 'spells' as Tab, label: 'Spells', icon: BookOpen },
    { id: 'equipment' as Tab, label: 'Equipment', icon: Backpack },
    { id: 'bio' as Tab, label: 'Biography', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/characters')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {character.avatar_url ? (
                <img 
                  src={character.avatar_url} 
                  alt={character.name}
                  className="w-16 h-16 rounded-full border-2 border-red-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border-2 border-red-500">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-bold">{character.name}</h1>
                <p className="text-gray-400">
                  Level {character.level} {character.race} {character.character_class}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick stats */}
              <div className="flex items-center gap-4 px-4 py-2 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>{character.current_hp}/{character.max_hp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span>{character.armor_class}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>+{proficiencyBonus}</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                  isEditing 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isEditing ? (
                  <>
                    <Save className="w-5 h-5" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-5 h-5" />
                    Edit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'stats' && (
          <AbilityScores 
            character={character}
            isEditing={isEditing}
            onSave={handleSave}
            onRoll={rollAbilityCheck}
          />
        )}
        
        {activeTab === 'combat' && (
          <CombatStats 
            character={character}
            isEditing={isEditing}
            onSave={handleSave}
          />
        )}
        
        {activeTab === 'skills' && (
          <SkillsList 
            character={character}
            isEditing={isEditing}
            onSave={handleSave}
          />
        )}
        
        {activeTab === 'spells' && (
          <SpellsList 
            character={character}
            isEditing={isEditing}
            onSave={handleSave}
          />
        )}
        
        {activeTab === 'equipment' && (
          <EquipmentList 
            character={character}
            isEditing={isEditing}
            onSave={handleSave}
          />
        )}
        
        {activeTab === 'bio' && (
          <Biography 
            character={character}
            isEditing={isEditing}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Save indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          Saving...
        </div>
      )}
    </div>
  )
}
