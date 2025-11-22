import { useState } from 'react'
import { Dices } from 'lucide-react'
import { Character, calculateModifier, formatModifier, ABILITY_NAMES } from '@/lib/types/character'
import { apiDice } from '@/lib/api'

interface AbilityScoresProps {
  character: Character
  isEditing: boolean
  onSave: (updates: Partial<Character>) => void
  onRoll: (ability: keyof Character['ability_scores']) => void
}

export default function AbilityScores({ character, isEditing, onSave, onRoll }: AbilityScoresProps) {
  const [scores, setScores] = useState(character.ability_scores)

  const abilities: (keyof Character['ability_scores'])[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  function handleScoreChange(ability: keyof Character['ability_scores'], value: string) {
    const numValue = parseInt(value) || 0
    setScores({ ...scores, [ability]: Math.max(1, Math.min(30, numValue)) })
  }

  function handleSave() {
    onSave({ ability_scores: scores })
  }

  async function rollSavingThrow(ability: keyof Character['ability_scores']) {
    const savingThrow = character.saving_throws[ability]
    const abilityMod = calculateModifier(scores[ability])
    const profBonus = Math.ceil(character.level / 4) + 1
    const modifier = abilityMod + (savingThrow?.proficient ? profBonus : 0)
    
    try {
      const response = await apiDice.roll(`1d20${formatModifier(modifier)}`)
      if (response.data) {
        alert(`${ABILITY_NAMES[ability]} Saving Throw: ${response.data.total}`)
      }
    } catch (err) {
      console.error('Failed to roll:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ability Scores</h2>
        {isEditing && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {abilities.map((ability) => {
          const score = scores[ability]
          const modifier = calculateModifier(score)
          const savingThrow = character.saving_throws[ability]
          const savingThrowMod = modifier + (savingThrow?.proficient ? Math.ceil(character.level / 4) + 1 : 0)

          return (
            <div 
              key={ability}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="text-center">
                <p className="text-sm text-gray-400 uppercase font-semibold mb-2">
                  {ABILITY_NAMES[ability]}
                </p>
                
                {isEditing ? (
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => handleScoreChange(ability, e.target.value)}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-2xl font-bold mb-2"
                    min="1"
                    max="30"
                  />
                ) : (
                  <p className="text-4xl font-bold mb-2">{score}</p>
                )}

                <div className={`text-2xl font-semibold mb-3 ${
                  modifier >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatModifier(modifier)}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => onRoll(ability)}
                    className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center justify-center gap-1 transition"
                  >
                    <Dices className="w-3 h-3" />
                    Check
                  </button>
                  
                  <button
                    onClick={() => rollSavingThrow(ability)}
                    className={`w-full px-3 py-1.5 rounded text-sm transition ${
                      savingThrow?.proficient
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    Save {formatModifier(savingThrowMod)}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Saving Throws Info */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold mb-3">Saving Throw Proficiencies</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {abilities.map((ability) => {
            const savingThrow = character.saving_throws[ability]
            const isProficient = savingThrow?.proficient || false
            
            return (
              <div 
                key={ability}
                className={`px-3 py-2 rounded ${
                  isProficient ? 'bg-green-900/30 border border-green-700' : 'bg-gray-700'
                }`}
              >
                <span className="font-semibold">{ABILITY_NAMES[ability]}</span>
                {isProficient && (
                  <span className="ml-2 text-xs text-green-400">Proficient</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
