'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Dices } from 'lucide-react'
import { apiCharacters, apiDice } from '@/lib/api'
import { CharacterCreateData, AbilityScores, calculateModifier, ABILITY_NAMES } from '@/lib/types/character'

type Step = 'basics' | 'abilities' | 'details' | 'personality' | 'review'

const DND_RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 
  'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
]

const DND_CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
  'Warlock', 'Wizard'
]

const BACKGROUNDS = [
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero',
  'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage',
  'Sailor', 'Soldier', 'Urchin'
]

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
]

export default function NewCharacterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basics')
  const [creating, setCreating] = useState(false)
  
  const [formData, setFormData] = useState<CharacterCreateData>({
    name: '',
    campaign_id: 'demo-campaign-id', // TODO: Get from context
    race: 'Human',
    character_class: 'Fighter',
    level: 1,
    background: 'Folk Hero',
    alignment: 'Neutral Good',
    ability_scores: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    max_hp: 10,
    armor_class: 10,
    speed: 30,
    description: '',
    backstory: '',
    personality_traits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    dm_notes: '',
  })

  async function handleCreate() {
    try {
      setCreating(true)
      const response = await apiCharacters.create(formData)
      if (response.data) {
        router.push(`/characters/${response.data.id}`)
      }
    } catch (err: any) {
      if (err.response?.status === 501) {
        alert('Character creation requires authentication. This will be implemented when auth is added.')
      } else {
        alert(err.response?.data?.detail || 'Failed to create character')
      }
    } finally {
      setCreating(false)
    }
  }

  async function rollAbilityScores() {
    const scores: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    
    for (const ability of Object.keys(scores) as (keyof AbilityScores)[]) {
      try {
        // Roll 4d6, drop lowest
        const response = await apiDice.roll('4d6dl1')
        if (response.data) {
          scores[ability] = response.data.total
        }
      } catch (err) {
        console.error('Failed to roll:', err)
      }
    }
    
    setFormData({ ...formData, ability_scores: scores })
  }

  function useStandardArray() {
    const standardArray = [15, 14, 13, 12, 10, 8]
    const abilities: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    const scores: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    
    abilities.forEach((ability, i) => {
      scores[ability] = standardArray[i]
    })
    
    setFormData({ ...formData, ability_scores: scores })
  }

  const steps: Step[] = ['basics', 'abilities', 'details', 'personality', 'review']
  const currentStepIndex = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/characters')}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Create Character</h1>
              <p className="text-gray-400 mt-1">Step {currentStepIndex + 1} of {steps.length}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          {step === 'basics' && (
            <BasicsStep formData={formData} setFormData={setFormData} />
          )}
          {step === 'abilities' && (
            <AbilitiesStep 
              formData={formData} 
              setFormData={setFormData}
              onRoll={rollAbilityScores}
              onStandardArray={useStandardArray}
            />
          )}
          {step === 'details' && (
            <DetailsStep formData={formData} setFormData={setFormData} />
          )}
          {step === 'personality' && (
            <PersonalityStep formData={formData} setFormData={setFormData} />
          )}
          {step === 'review' && (
            <ReviewStep formData={formData} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              const prevIndex = Math.max(0, currentStepIndex - 1)
              setStep(steps[prevIndex])
            }}
            disabled={currentStepIndex === 0}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={() => {
                const nextIndex = Math.min(steps.length - 1, currentStepIndex + 1)
                setStep(steps[nextIndex])
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating || !formData.name}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Character'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BasicsStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Basic Information</h2>

      <div>
        <label className="block text-sm font-semibold mb-2">Character Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          placeholder="Enter character name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Race</label>
          <select
            value={formData.race}
            onChange={(e) => setFormData({ ...formData, race: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            {DND_RACES.map(race => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Class</label>
          <select
            value={formData.character_class}
            onChange={(e) => setFormData({ ...formData, character_class: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            {DND_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Background</label>
          <select
            value={formData.background}
            onChange={(e) => setFormData({ ...formData, background: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            {BACKGROUNDS.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Alignment</label>
          <select
            value={formData.alignment}
            onChange={(e) => setFormData({ ...formData, alignment: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            {ALIGNMENTS.map(align => (
              <option key={align} value={align}>{align}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function AbilitiesStep({ formData, setFormData, onRoll, onStandardArray }: any) {
  const abilities: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ability Scores</h2>
        <div className="flex gap-2">
          <button
            onClick={onRoll}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition"
          >
            <Dices className="w-5 h-5" />
            Roll 4d6
          </button>
          <button
            onClick={onStandardArray}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Standard Array
          </button>
        </div>
      </div>

      <p className="text-gray-400 text-sm">
        Use "Roll 4d6" to randomly generate scores, or "Standard Array" for [15, 14, 13, 12, 10, 8].
        You can also manually adjust the values below.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {abilities.map((ability) => {
          const score = formData.ability_scores[ability]
          const modifier = calculateModifier(score)

          return (
            <div key={ability} className="bg-gray-700 rounded-lg p-4">
              <label className="block text-sm font-semibold mb-2 text-center">
                {ABILITY_NAMES[ability]}
              </label>
              <input
                type="number"
                value={score}
                onChange={(e) => setFormData({
                  ...formData,
                  ability_scores: {
                    ...formData.ability_scores,
                    [ability]: Math.max(1, Math.min(30, parseInt(e.target.value) || 10))
                  }
                })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-center text-2xl font-bold mb-2"
                min="1"
                max="30"
              />
              <p className={`text-center text-xl font-semibold ${
                modifier >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {modifier >= 0 ? '+' : ''}{modifier}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailsStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Additional Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Max HP</label>
          <input
            type="number"
            value={formData.max_hp}
            onChange={(e) => setFormData({ ...formData, max_hp: parseInt(e.target.value) || 10 })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Armor Class</label>
          <input
            type="number"
            value={formData.armor_class}
            onChange={(e) => setFormData({ ...formData, armor_class: parseInt(e.target.value) || 10 })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Speed (ft)</label>
          <input
            type="number"
            value={formData.speed}
            onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 30 })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            min="0"
            step="5"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          rows={4}
          placeholder="Physical appearance, mannerisms, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Backstory</label>
        <textarea
          value={formData.backstory}
          onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          rows={6}
          placeholder="Character history and background story"
        />
      </div>
    </div>
  )
}

function PersonalityStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Personality & Background</h2>

      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          ℹ️ These fields help flesh out your character's personality and motivations.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Personality Traits</label>
        <textarea
          value={formData.personality_traits || ''}
          onChange={(e) => setFormData({ ...formData, personality_traits: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          rows={3}
          placeholder="How does your character behave? (e.g., 'I always have a plan for what to do when things go wrong.')"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Ideals</label>
        <textarea
          value={formData.ideals || ''}
          onChange={(e) => setFormData({ ...formData, ideals: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          rows={2}
          placeholder="What principles drive your character? (e.g., 'Freedom: Chains are meant to be broken.')"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Bonds</label>
        <textarea
          value={formData.bonds || ''}
          onChange={(e) => setFormData({ ...formData, bonds: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          rows={2}
          placeholder="What connections matter most? (e.g., 'I would die to recover an ancient relic.')"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Flaws</label>
        <textarea
          value={formData.flaws || ''}
          onChange={(e) => setFormData({ ...formData, flaws: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          rows={2}
          placeholder="What weaknesses does your character have? (e.g., 'I can't resist a pretty face.')"
        />
      </div>

      <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
        <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
          <span>👁️</span> 
          <span>Visible to DM/AI DM Only</span>
        </h3>
        <p className="text-sm text-yellow-200 mb-3">
          The fields above (personality, ideals, bonds, flaws) are visible to the DM and AI DM to help craft personal storylines, 
          but remain hidden from other players by default.
        </p>
      </div>

      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
        <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
          <span>🔒</span>
          <span>DM Notes Only</span>
        </h3>
        <p className="text-sm text-red-200 mb-3">
          This section is completely private and only visible to the DM. Use it for secret motivations, 
          hidden plot hooks, or any information that should never be revealed to players.
        </p>
        <textarea
          value={formData.dm_notes || ''}
          onChange={(e) => setFormData({ ...formData, dm_notes: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg"
          rows={4}
          placeholder="Secret information, plot hooks, hidden agendas, or anything the DM should know that players shouldn't..."
        />
      </div>
    </div>
  )
}

function ReviewStep({ formData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review</h2>

      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-xl font-bold mb-2">{formData.name || 'Unnamed Character'}</h3>
        <p className="text-gray-300">
          Level 1 {formData.race} {formData.character_class}
        </p>
        <p className="text-gray-400 text-sm">
          {formData.background} • {formData.alignment}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(formData.ability_scores).map(([ability, score]) => (
          <div key={ability} className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-400 uppercase mb-1">
              {ABILITY_NAMES[ability as keyof typeof ABILITY_NAMES]}
            </p>
            <p className="text-2xl font-bold">{score as number}</p>
            <p className={`text-sm ${
              calculateModifier(score as number) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {calculateModifier(score as number) >= 0 ? '+' : ''}
              {calculateModifier(score as number)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-400 mb-1">HP</p>
          <p className="text-2xl font-bold text-red-400">{formData.max_hp}</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-400 mb-1">AC</p>
          <p className="text-2xl font-bold text-blue-400">{formData.armor_class}</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-400 mb-1">Speed</p>
          <p className="text-2xl font-bold text-green-400">{formData.speed} ft</p>
        </div>
      </div>
    </div>
  )
}
