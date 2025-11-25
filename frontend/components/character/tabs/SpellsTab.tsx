/**
 * SpellsTab - Spell list, slot tracking, and spellcasting management
 */

'use client';

import { Character, Spell } from '@/lib/types/character';
import { formatModifier } from '@/lib/types/character';
import { useState } from 'react';

interface SpellsTabProps {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  editable: boolean;
}

export function SpellsTab({ character, updateCharacter, editable }: SpellsTabProps) {
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');

  const spellsByLevel = character.spells.reduce((acc, spell) => {
    const level = spell.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(spell);
    return acc;
  }, {} as Record<number, Spell[]>);

  const toggleSpellPrepared = (spellId: string) => {
    if (!editable) return;
    
    const updatedSpells = character.spells.map(spell =>
      spell.id === spellId ? { ...spell, prepared: !spell.prepared } : spell
    );
    updateCharacter({ spells: updatedSpells });
  };

  const useSpellSlot = (level: number) => {
    if (!editable || !character.spell_slots?.[level]) return;
    
    const currentSlots = character.spell_slots[level].current;
    if (currentSlots <= 0) return;

    updateCharacter({
      spell_slots: {
        ...character.spell_slots,
        [level]: {
          ...character.spell_slots[level],
          current: currentSlots - 1,
        },
      },
    });
  };

  const restoreSpellSlot = (level: number) => {
    if (!editable || !character.spell_slots?.[level]) return;
    
    const maxSlots = character.spell_slots[level].max;
    const currentSlots = character.spell_slots[level].current;
    if (currentSlots >= maxSlots) return;

    updateCharacter({
      spell_slots: {
        ...character.spell_slots,
        [level]: {
          ...character.spell_slots[level],
          current: currentSlots + 1,
        },
      },
    });
  };

  const restoreAllSlots = () => {
    if (!editable || !character.spell_slots) return;

    const restoredSlots = Object.keys(character.spell_slots).reduce((acc, level) => {
      const levelNum = parseInt(level);
      acc[levelNum] = {
        ...character.spell_slots![levelNum],
        current: character.spell_slots![levelNum].max,
      };
      return acc;
    }, {} as typeof character.spell_slots);

    updateCharacter({ spell_slots: restoredSlots });
  };

  const spellLevelNames = ['Cantrips', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

  const filteredSpells = filterLevel === 'all'
    ? character.spells
    : character.spells.filter(s => s.level === filterLevel);

  const preparedCount = character.spells.filter(s => s.prepared && s.level > 0).length;
  const maxPrepared = character.spellcasting_ability
    ? Math.max(
        1,
        character.level +
          Math.floor(
            (character.ability_scores[character.spellcasting_ability.toLowerCase() as keyof typeof character.ability_scores] - 10) / 2
          )
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Spellcasting Stats */}
      <div>
        <h2 className="text-xl font-bold mb-4">Spellcasting</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Spellcasting Ability</div>
            {editable ? (
              <select
                value={character.spellcasting_ability || ''}
                onChange={(e) => updateCharacter({ spellcasting_ability: e.target.value as any })}
                className="w-full text-center text-lg font-bold text-gray-900 border border-gray-300 rounded"
              >
                <option value="">None</option>
                <option value="INT">Intelligence</option>
                <option value="WIS">Wisdom</option>
                <option value="CHA">Charisma</option>
              </select>
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {character.spellcasting_ability || 'None'}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Spell Save DC</div>
            {editable ? (
              <input
                type="number"
                value={character.spell_save_dc || 10}
                onChange={(e) => updateCharacter({ spell_save_dc: parseInt(e.target.value) || 10 })}
                className="w-full text-center text-2xl font-bold text-gray-900 border border-gray-300 rounded"
              />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{character.spell_save_dc || 10}</div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Spell Attack</div>
            {editable ? (
              <input
                type="number"
                value={character.spell_attack_bonus || 0}
                onChange={(e) => updateCharacter({ spell_attack_bonus: parseInt(e.target.value) || 0 })}
                className="w-full text-center text-2xl font-bold text-gray-900 border border-gray-300 rounded"
              />
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {formatModifier(character.spell_attack_bonus || 0)}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">Prepared Spells</div>
            <div className="text-2xl font-bold text-gray-900">
              {preparedCount} / {maxPrepared}
            </div>
          </div>
        </div>
      </div>

      {/* Spell Slots */}
      {character.spell_slots && Object.keys(character.spell_slots).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Spell Slots</h2>
            {editable && (
              <button
                onClick={restoreAllSlots}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Long Rest (Restore All)
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(character.spell_slots)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, slots]) => {
                const levelNum = parseInt(level);
                if (levelNum === 0) return null; // Skip cantrips

                return (
                  <div key={level} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-600 mb-2 text-center">
                      {spellLevelNames[levelNum]}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {editable && (
                        <button
                          onClick={() => restoreSpellSlot(levelNum)}
                          disabled={slots.current >= slots.max}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                        >
                          +
                        </button>
                      )}
                      <span className="text-xl font-bold text-gray-900 px-2">
                        {slots.current}/{slots.max}
                      </span>
                      {editable && (
                        <button
                          onClick={() => useSpellSlot(levelNum)}
                          disabled={slots.current <= 0}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                        >
                          -
                        </button>
                      )}
                    </div>
                    {/* Visual dots */}
                    <div className="flex flex-wrap gap-1 justify-center">
                      {Array.from({ length: slots.max }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < slots.current ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Spell List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Spell List</h2>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Levels</option>
            {spellLevelNames.map((name, level) => (
              <option key={level} value={level}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {character.spells.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            No spells added yet
          </div>
        ) : (
          <div className="space-y-2">
            {spellLevelNames.map((levelName, level) => {
              const spellsAtLevel = spellsByLevel[level] || [];
              if (spellsAtLevel.length === 0 && filterLevel !== 'all' && filterLevel !== level) return null;
              if (spellsAtLevel.length === 0 && filterLevel === 'all') return null;

              return (
                <div key={level}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">{levelName}</h3>
                  <div className="space-y-2">
                    {spellsAtLevel.map((spell) => (
                      <div
                        key={spell.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {spell.level > 0 && editable && (
                                  <input
                                    type="checkbox"
                                    checked={spell.prepared || false}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleSpellPrepared(spell.id);
                                    }}
                                    className="w-5 h-5 text-blue-600 rounded"
                                    title="Prepared"
                                  />
                                )}
                                <div>
                                  <h4 className="font-semibold text-gray-900">{spell.name}</h4>
                                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                    <span>{spell.school}</span>
                                    {spell.ritual && <span className="text-purple-600">Ritual</span>}
                                    {spell.concentration && <span className="text-orange-600">Concentration</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <div>{spell.castingTime}</div>
                              <div>{spell.range}</div>
                            </div>
                          </div>
                        </div>

                        {expandedSpell === spell.id && (
                          <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-semibold">Duration:</span> {spell.duration}
                              </div>
                              <div>
                                <span className="font-semibold">Components:</span> {spell.components.join(', ')}
                              </div>
                              <div className="mt-3 text-gray-700 whitespace-pre-line">
                                {spell.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Spell Button (placeholder) */}
      {editable && (
        <button
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
          onClick={() => {
            // TODO: Open spell selection modal
            alert('Spell selection modal coming soon! Will integrate with the spells library.');
          }}
        >
          + Add Spell
        </button>
      )}
    </div>
  );
}
