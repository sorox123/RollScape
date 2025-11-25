/**
 * StatsTab - Character abilities, skills, and saving throws
 */

'use client';

import { Character } from '@/lib/types/character';
import { calculateModifier, formatModifier, STANDARD_SKILLS, ABILITY_NAMES } from '@/lib/types/character';

interface StatsTabProps {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  editable: boolean;
}

export function StatsTab({ character, updateCharacter, editable }: StatsTabProps) {
  const abilities: Array<keyof typeof ABILITY_NAMES> = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const updateAbilityScore = (ability: string, value: number) => {
    updateCharacter({
      ability_scores: {
        ...character.ability_scores,
        [ability]: Math.max(1, Math.min(30, value)),
      },
    });
  };

  const toggleSkillProficiency = (skillName: string) => {
    const currentSkill = character.skills[skillName] || { proficient: false };
    updateCharacter({
      skills: {
        ...character.skills,
        [skillName]: {
          ...currentSkill,
          proficient: !currentSkill.proficient,
        },
      },
    });
  };

  const toggleSkillExpertise = (skillName: string) => {
    const currentSkill = character.skills[skillName] || { proficient: false, expertise: false };
    updateCharacter({
      skills: {
        ...character.skills,
        [skillName]: {
          ...currentSkill,
          expertise: !currentSkill.expertise,
        },
      },
    });
  };

  const toggleSaveProficiency = (ability: string) => {
    const currentSave = character.saving_throws[ability] || { proficient: false };
    updateCharacter({
      saving_throws: {
        ...character.saving_throws,
        [ability]: {
          ...currentSave,
          proficient: !currentSave.proficient,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Ability Scores */}
      <div>
        <h2 className="text-xl font-bold mb-4">Ability Scores</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {abilities.map((ability) => {
            const score = character.ability_scores[ability] || 10;
            const modifier = calculateModifier(score);

            return (
              <div key={ability} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  {ABILITY_NAMES[ability]}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatModifier(modifier)}
                </div>
                {editable ? (
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => updateAbilityScore(ability, parseInt(e.target.value) || 10)}
                    className="w-full text-center px-2 py-1 border border-gray-300 rounded"
                    min="1"
                    max="30"
                  />
                ) : (
                  <div className="text-lg text-gray-700">{score}</div>
                )}
                <div className="text-xs text-gray-500 mt-1 uppercase">{ability}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proficiency Bonus & Inspiration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Proficiency Bonus</div>
          <div className="text-2xl font-bold text-gray-900">
            +{character.proficiency_bonus}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Inspiration</div>
          <button
            onClick={() => updateCharacter({ inspiration: !character.inspiration })}
            disabled={!editable}
            className={`text-2xl ${character.inspiration ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ⭐
          </button>
        </div>
      </div>

      {/* Saving Throws */}
      <div>
        <h2 className="text-xl font-bold mb-4">Saving Throws</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {abilities.map((ability) => {
            const score = character.ability_scores[ability] || 10;
            const modifier = calculateModifier(score);
            const save = character.saving_throws[ability];
            const isProficient = save?.proficient || false;
            const totalModifier = modifier + (isProficient ? character.proficiency_bonus : 0);

            return (
              <button
                key={ability}
                onClick={() => editable && toggleSaveProficiency(ability)}
                disabled={!editable}
                className={`
                  p-3 rounded-lg border-2 text-left transition-colors
                  ${isProficient
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                  ${editable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{ABILITY_NAMES[ability]}</span>
                  <span className="text-lg font-bold">{formatModifier(totalModifier)}</span>
                </div>
                {isProficient && (
                  <div className="text-xs text-blue-600 mt-1">Proficient</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div>
        <h2 className="text-xl font-bold mb-4">Skills</h2>
        <div className="space-y-2">
          {STANDARD_SKILLS.map((skill) => {
            const skillKey = skill.name.toLowerCase().replace(/ /g, '_');
            const skillData = character.skills[skillKey] || { proficient: false, expertise: false };
            const abilityScore = character.ability_scores[skill.ability] || 10;
            const abilityMod = calculateModifier(abilityScore);
            
            let bonus = abilityMod;
            if (skillData.expertise) {
              bonus += character.proficiency_bonus * 2;
            } else if (skillData.proficient) {
              bonus += character.proficiency_bonus;
            }

            return (
              <div
                key={skillKey}
                className={`
                  flex items-center justify-between p-3 rounded-lg border
                  ${skillData.expertise
                    ? 'border-purple-500 bg-purple-50'
                    : skillData.proficient
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {editable && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleSkillProficiency(skillKey)}
                        className={`
                          w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold
                          ${skillData.proficient
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        {skillData.proficient && '✓'}
                      </button>
                      <button
                        onClick={() => toggleSkillExpertise(skillKey)}
                        className={`
                          w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold
                          ${skillData.expertise
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                        title="Expertise"
                      >
                        {skillData.expertise && '★'}
                      </button>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-xs text-gray-500 uppercase">{skill.ability}</div>
                  </div>
                </div>
                <div className="text-lg font-bold">
                  {formatModifier(bonus)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Passive Scores */}
      <div>
        <h2 className="text-xl font-bold mb-4">Passive Scores</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Perception</div>
            <div className="text-2xl font-bold text-gray-900">
              {character.passive_perception || 10}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Investigation</div>
            <div className="text-2xl font-bold text-gray-900">
              {character.passive_investigation || 10}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Insight</div>
            <div className="text-2xl font-bold text-gray-900">
              {character.passive_insight || 10}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
