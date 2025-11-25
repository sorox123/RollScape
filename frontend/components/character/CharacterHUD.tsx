/**
 * CharacterHUD - Lightweight combat HUD for active gameplay
 * Displays alongside map/chat with essential character info
 */

'use client';

import { Character } from '@/lib/types/character';
import { formatModifier } from '@/lib/types/character';
import { useState } from 'react';

interface CharacterHUDProps {
  character: Character;
  onOpenFullSheet?: () => void;
  compact?: boolean;
}

export function CharacterHUD({ character, onOpenFullSheet, compact = false }: CharacterHUDProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const hpPercentage = (character.current_hp / character.max_hp) * 100;
  const isUnconscious = character.current_hp <= 0;
  const isBloodied = character.current_hp <= character.max_hp / 2 && character.current_hp > 0;

  const dexMod = Math.floor((character.ability_scores.dex - 10) / 2);
  const initiativeBonus = dexMod + (character.initiative_bonus || 0);

  // Get equipped weapons for quick attacks
  const equippedWeapons = character.weapons?.filter(w => w.equipped) || [];

  if (compact) {
    // Ultra-compact mode for sidebar
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        {/* Character Name & Avatar */}
        <div className="flex items-center gap-2 mb-3">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.name}
              className="w-10 h-10 rounded-full border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
              {character.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{character.name}</h3>
            <p className="text-xs text-gray-500">Lv {character.level}</p>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>HP</span>
            <span className="font-semibold">
              {character.current_hp}/{character.max_hp}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isUnconscious ? 'bg-red-900' : isBloodied ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.max(0, hpPercentage)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-gray-50 rounded p-1">
            <div className="text-gray-500">AC</div>
            <div className="font-bold">{character.armor_class}</div>
          </div>
          <div className="bg-gray-50 rounded p-1">
            <div className="text-gray-500">Init</div>
            <div className="font-bold">{formatModifier(initiativeBonus)}</div>
          </div>
          <div className="bg-gray-50 rounded p-1">
            <div className="text-gray-500">Speed</div>
            <div className="font-bold">{character.speed}</div>
          </div>
        </div>

        {/* View Full Sheet Button */}
        {onOpenFullSheet && (
          <button
            onClick={onOpenFullSheet}
            className="w-full mt-3 px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Full Sheet
          </button>
        )}
      </div>
    );
  }

  // Full HUD mode
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <div className="flex items-center gap-3">
          {character.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={character.name}
              className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 text-xl font-bold shadow-lg">
              {character.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-white">
            <h2 className="text-xl font-bold">{character.name}</h2>
            <p className="text-sm text-blue-100">
              Level {character.level} {character.race} {character.character_class}
            </p>
          </div>
          {onOpenFullSheet && (
            <button
              onClick={onOpenFullSheet}
              className="px-3 py-1.5 bg-white text-blue-600 rounded hover:bg-blue-50 text-sm font-medium"
            >
              Full Sheet
            </button>
          )}
        </div>
      </div>

      {/* HP Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Hit Points</span>
          <span className="text-2xl font-bold text-gray-900">
            {character.current_hp} / {character.max_hp}
            {character.temp_hp > 0 && (
              <span className="text-lg text-blue-600"> (+{character.temp_hp})</span>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all ${
              isUnconscious ? 'bg-red-900' : isBloodied ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.max(0, hpPercentage)}%` }}
          />
        </div>
        {isUnconscious && (
          <div className="mt-2 text-red-700 font-semibold text-sm text-center">
            ⚠️ Unconscious - Making Death Saves
          </div>
        )}
      </div>

      {/* Combat Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">AC</div>
            <div className="text-2xl font-bold text-gray-900">{character.armor_class}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Initiative</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatModifier(initiativeBonus)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Speed</div>
            <div className="text-2xl font-bold text-gray-900">{character.speed}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Prof</div>
            <div className="text-2xl font-bold text-gray-900">+{character.proficiency_bonus}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
        >
          <span>⚔️ Quick Actions</span>
          <svg
            className={`w-4 h-4 transition-transform ${showQuickActions ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showQuickActions && (
          <div className="mt-3 space-y-2">
            {/* Equipped Weapons */}
            {equippedWeapons.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">ATTACKS</h4>
                {equippedWeapons.map((weapon, index) => {
                  const strMod = Math.floor((character.ability_scores.str - 10) / 2);
                  const dexMod = Math.floor((character.ability_scores.dex - 10) / 2);
                  const attackMod = weapon.properties?.includes('Finesse')
                    ? Math.max(strMod, dexMod)
                    : weapon.properties?.includes('Ranged')
                    ? dexMod
                    : strMod;
                  const attackBonus = attackMod + character.proficiency_bonus;

                  return (
                    <button
                      key={weapon.name + index}
                      className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-left"
                      onClick={() => {
                        // TODO: Trigger dice roll in combat
                        alert(`Rolling attack: ${weapon.name}\n1d20${formatModifier(attackBonus)} to hit\n${weapon.damage} ${weapon.damage_type} damage`);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{weapon.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatModifier(attackBonus)} to hit • {weapon.damage} {weapon.damage_type}
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Spell Slots (if caster) */}
            {character.spell_slots && Object.keys(character.spell_slots).length > 1 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">SPELL SLOTS</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(character.spell_slots)
                    .filter(([level]) => parseInt(level) > 0)
                    .slice(0, 4)
                    .map(([level, slots]) => (
                      <div
                        key={level}
                        className="bg-purple-50 border border-purple-200 rounded p-2 text-center"
                      >
                        <div className="text-xs text-purple-600 font-medium">L{level}</div>
                        <div className="text-sm font-bold text-purple-900">
                          {slots.current}/{slots.max}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {character.conditions && character.conditions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">CONDITIONS</h4>
                <div className="flex flex-wrap gap-1">
                  {character.conditions.map((condition) => (
                    <span
                      key={condition}
                      className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Passive Scores (Footer) */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex justify-around text-xs text-gray-600">
          <div>
            <span className="font-medium">Perception:</span> {character.passive_perception}
          </div>
          <div>
            <span className="font-medium">Investigation:</span> {character.passive_investigation}
          </div>
          <div>
            <span className="font-medium">Insight:</span> {character.passive_insight}
          </div>
        </div>
      </div>
    </div>
  );
}
