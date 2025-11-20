import { useState } from 'react'
import { Dices, CheckCircle, Circle } from 'lucide-react'
import { Character, STANDARD_SKILLS, getSkillModifier, formatModifier, ABILITY_NAMES } from '@/lib/types/character'
import { apiDice } from '@/lib/api'

interface SkillsListProps {
  character: Character
  isEditing: boolean
  onSave: (updates: Partial<Character>) => void
}

export default function SkillsList({ character, isEditing, onSave }: SkillsListProps) {
  const [skills, setSkills] = useState(character.skills)

  function toggleProficiency(skillName: string) {
    const skill = skills[skillName] || STANDARD_SKILLS.find(s => s.name === skillName)
    if (!skill) return

    setSkills({
      ...skills,
      [skillName]: {
        ...skill,
        proficient: !skill.proficient,
      }
    })
  }

  function toggleExpertise(skillName: string) {
    const skill = skills[skillName]
    if (!skill || !skill.proficient) return

    setSkills({
      ...skills,
      [skillName]: {
        ...skill,
        expertise: !skill.expertise,
      }
    })
  }

  function handleSave() {
    onSave({ skills })
  }

  async function rollSkill(skillName: string, advantage: 'normal' | 'advantage' | 'disadvantage' = 'normal') {
    const skill = skills[skillName] || STANDARD_SKILLS.find(s => s.name === skillName)
    if (!skill) return

    const modifier = getSkillModifier(character, skillName)
    let notation = ''
    
    if (advantage === 'advantage') {
      notation = `2d20kh1${formatModifier(modifier)}`
    } else if (advantage === 'disadvantage') {
      notation = `2d20kl1${formatModifier(modifier)}`
    } else {
      notation = `1d20${formatModifier(modifier)}`
    }

    try {
      const response = await apiDice.roll(notation)
      const advantageText = advantage === 'advantage' ? ' (Advantage)' : advantage === 'disadvantage' ? ' (Disadvantage)' : ''
      alert(`${skillName}${advantageText}: ${response.data.result}`)
    } catch (err) {
      console.error('Failed to roll:', err)
    }
  }

  // Group skills by ability
  const skillsByAbility = STANDARD_SKILLS.reduce((acc, standardSkill) => {
    const ability = standardSkill.ability
    if (!acc[ability]) acc[ability] = []
    
    const skill = skills[standardSkill.name] || { ...standardSkill, proficient: false }
    acc[ability].push({ ...standardSkill, ...skill })
    
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Skills</h2>
        {isEditing && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(skillsByAbility).map(([ability, abilitySkills]) => (
            <div key={ability}>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">
                {ABILITY_NAMES[ability as keyof typeof ABILITY_NAMES]} Skills
              </h3>
              <div className="space-y-2">
                {abilitySkills.map((skill) => {
                  const modifier = getSkillModifier(character, skill.name)
                  const isProficient = skill.proficient || false
                  const hasExpertise = skill.expertise || false

                  return (
                    <div
                      key={skill.name}
                      className={`p-3 rounded-lg transition ${
                        hasExpertise
                          ? 'bg-purple-900/30 border border-purple-700'
                          : isProficient
                          ? 'bg-green-900/30 border border-green-700'
                          : 'bg-gray-700 border border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleProficiency(skill.name)}
                                className="p-1"
                              >
                                {isProficient ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-500" />
                                )}
                              </button>
                              {isProficient && (
                                <button
                                  onClick={() => toggleExpertise(skill.name)}
                                  className="px-2 py-0.5 text-xs rounded bg-purple-600 hover:bg-purple-700"
                                >
                                  {hasExpertise ? 'Expert' : 'Expertise?'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="w-5 h-5 flex items-center justify-center">
                              {hasExpertise ? (
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                              ) : isProficient ? (
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-gray-500" />
                              )}
                            </div>
                          )}
                          
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-sm text-gray-400">
                            ({ability.toUpperCase()})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${
                            modifier >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatModifier(modifier)}
                          </span>

                          {!isEditing && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => rollSkill(skill.name, 'disadvantage')}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                                title="Roll with disadvantage"
                              >
                                Dis
                              </button>
                              <button
                                onClick={() => rollSkill(skill.name)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition"
                                title="Roll skill check"
                              >
                                <Dices className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => rollSkill(skill.name, 'advantage')}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition"
                                title="Roll with advantage"
                              >
                                Adv
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Not Proficient</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Proficient (+{Math.ceil(character.level / 4) + 1})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Expertise (×2)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
