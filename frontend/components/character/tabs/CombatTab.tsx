/**
 * CombatTab - HP, AC, death saves, attacks, and combat stats
 */

'use client';

import { Character } from '@/lib/types/character';
import { calculateModifier, formatModifier } from '@/lib/types/character';
import { useState } from 'react';

interface CombatTabProps {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  editable: boolean;
}

export function CombatTab({ character, updateCharacter, editable }: CombatTabProps) {
  const [hpChange, setHpChange] = useState('');
  const [tempHpInput, setTempHpInput] = useState('');

  const applyDamage = () => {
    const damage = parseInt(hpChange) || 0;
    if (damage === 0) return;

    let remaining = damage;
    let newTempHp = character.temp_hp || 0;
    let newCurrentHp = character.current_hp;

    // Damage temp HP first
    if (newTempHp > 0) {
      if (remaining >= newTempHp) {
        remaining -= newTempHp;
        newTempHp = 0;
      } else {
        newTempHp -= remaining;
        remaining = 0;
      }
    }

    // Then damage actual HP
    if (remaining > 0) {
      newCurrentHp = Math.max(0, newCurrentHp - remaining);
    }

    updateCharacter({
      current_hp: newCurrentHp,
      temp_hp: newTempHp,
    });
    setHpChange('');
  };

  const applyHealing = () => {
    const healing = parseInt(hpChange) || 0;
    if (healing === 0) return;

    updateCharacter({
      current_hp: Math.min(character.max_hp, character.current_hp + healing),
    });
    setHpChange('');
  };

  const applyTempHP = () => {
    const temp = parseInt(tempHpInput) || 0;
    if (temp === 0) return;

    // Temp HP doesn't stack, take the higher value
    updateCharacter({
      temp_hp: Math.max(character.temp_hp || 0, temp),
    });
    setTempHpInput('');
  };

  const updateDeathSave = (type: 'success' | 'failure', value: number) => {
    if (type === 'success') {
      updateCharacter({ death_save_successes: Math.max(0, Math.min(3, value)) });
    } else {
      updateCharacter({ death_save_failures: Math.max(0, Math.min(3, value)) });
    }
  };

  const resetDeathSaves = () => {
    updateCharacter({
      death_save_successes: 0,
      death_save_failures: 0,
    });
  };

  const longRest = () => {
    updateCharacter({
      current_hp: character.max_hp,
      temp_hp: 0,
      hit_dice_remaining: character.hit_dice_total || 1,
      death_save_successes: 0,
      death_save_failures: 0,
      exhaustion_level: Math.max(0, (character.exhaustion_level || 0) - 1),
    });
  };

  const shortRest = () => {
    // Reset death saves on short rest too
    updateCharacter({
      death_save_successes: 0,
      death_save_failures: 0,
    });
  };

  const hpPercentage = (character.current_hp / character.max_hp) * 100;
  const isUnconscious = character.current_hp <= 0;
  const isBloodied = character.current_hp <= character.max_hp / 2 && character.current_hp > 0;

  const dexMod = calculateModifier(character.ability_scores.dex || 10);
  const initiativeBonus = dexMod + (character.initiative_bonus || 0);

  return (
    <div className="space-y-6">
      {/* HP Management */}
      <div>
        <h2 className="text-xl font-bold mb-4">Hit Points</h2>
        
        {/* HP Bar */}
        <div className="bg-gray-200 rounded-lg h-16 overflow-hidden relative mb-4">
          <div
            className={`h-full transition-all duration-300 ${
              isUnconscious
                ? 'bg-red-900'
                : isBloodied
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.max(0, hpPercentage)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {character.current_hp} / {character.max_hp}
              {character.temp_hp > 0 && (
                <span className="text-blue-200"> (+{character.temp_hp})</span>
              )}
            </span>
          </div>
        </div>

        {/* HP Controls */}
        {editable && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Damage / Healing
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={hpChange}
                  onChange={(e) => setHpChange(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={applyDamage}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Damage
                </button>
                <button
                  onClick={applyHealing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Heal
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Temporary HP
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tempHpInput}
                  onChange={(e) => setTempHpInput(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={applyTempHP}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Max HP adjustment */}
        {editable && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max HP
            </label>
            <input
              type="number"
              value={character.max_hp}
              onChange={(e) => updateCharacter({ max_hp: parseInt(e.target.value) || 10 })}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}
      </div>

      {/* Death Saves (shown when unconscious) */}
      {isUnconscious && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <h3 className="text-lg font-bold text-red-900 mb-3">Death Saves</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-900">Successes</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <button
                    key={`success-${i}`}
                    onClick={() =>
                      editable &&
                      updateDeathSave(
                        'success',
                        (character.death_save_successes || 0) === i ? i - 1 : i
                      )
                    }
                    disabled={!editable}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      (character.death_save_successes || 0) >= i
                        ? 'bg-green-500 border-green-600'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-900">Failures</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <button
                    key={`failure-${i}`}
                    onClick={() =>
                      editable &&
                      updateDeathSave(
                        'failure',
                        (character.death_save_failures || 0) === i ? i - 1 : i
                      )
                    }
                    disabled={!editable}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      (character.death_save_failures || 0) >= i
                        ? 'bg-red-600 border-red-700'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          {editable && (
            <button
              onClick={resetDeathSaves}
              className="mt-3 w-full px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50"
            >
              Reset Death Saves
            </button>
          )}
        </div>
      )}

      {/* Combat Stats */}
      <div>
        <h2 className="text-xl font-bold mb-4">Combat Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Armor Class</div>
            {editable ? (
              <input
                type="number"
                value={character.armor_class}
                onChange={(e) => updateCharacter({ armor_class: parseInt(e.target.value) || 10 })}
                className="w-full text-center text-2xl font-bold text-gray-900 border border-gray-300 rounded"
              />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{character.armor_class}</div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Initiative</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatModifier(initiativeBonus)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Speed</div>
            {editable ? (
              <input
                type="number"
                value={character.speed}
                onChange={(e) => updateCharacter({ speed: parseInt(e.target.value) || 30 })}
                className="w-full text-center text-2xl font-bold text-gray-900 border border-gray-300 rounded"
              />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{character.speed} ft</div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Prof. Bonus</div>
            <div className="text-2xl font-bold text-gray-900">
              +{character.proficiency_bonus}
            </div>
          </div>
        </div>
      </div>

      {/* Hit Dice */}
      <div>
        <h2 className="text-xl font-bold mb-4">Hit Dice</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">
              {character.hit_dice_remaining || 0} / {character.hit_dice_total || 1} {character.hit_die_type || 'd8'}
            </span>
            {editable && (
              <button
                onClick={() =>
                  updateCharacter({
                    hit_dice_remaining: Math.max(
                      0,
                      (character.hit_dice_remaining || 1) - 1
                    ),
                  })
                }
                disabled={(character.hit_dice_remaining || 0) <= 0}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Spend Hit Die
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${((character.hit_dice_remaining || 0) / (character.hit_dice_total || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Conditions & Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Exhaustion Level</div>
            {editable ? (
              <input
                type="number"
                value={character.exhaustion_level || 0}
                onChange={(e) =>
                  updateCharacter({
                    exhaustion_level: Math.max(0, Math.min(6, parseInt(e.target.value) || 0)),
                  })
                }
                min="0"
                max="6"
                className="w-full text-center text-2xl font-bold text-gray-900 border border-gray-300 rounded"
              />
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {character.exhaustion_level || 0}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">0-6 (6 = death)</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Active Conditions</div>
            <div className="flex flex-wrap gap-1">
              {(character.conditions || []).length === 0 ? (
                <span className="text-gray-400 text-sm">None</span>
              ) : (
                character.conditions?.map((condition) => (
                  <span
                    key={condition}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                  >
                    {condition}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rest Buttons */}
      {editable && (
        <div className="flex gap-4">
          <button
            onClick={shortRest}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Short Rest
          </button>
          <button
            onClick={longRest}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Long Rest
          </button>
        </div>
      )}
    </div>
  );
}
