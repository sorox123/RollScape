'use client';

import React, { useState, useEffect } from 'react';
import { Sword, Zap, Plus, Sunset, Moon } from 'lucide-react';

interface Ability {
  id: string;
  name: string;
  description: string;
  ability_type: string;
  level_required: number;
  action_type?: string;
  subclass?: string;
  resource_type?: string;
  resource_cost?: number;
  uses_per_rest?: number;
  recharge_on?: string;
  damage_dice?: string;
  damage_type?: string;
  save_type?: string;
  attack_bonus?: boolean;
  duration?: string;
  range?: string;
  conditions_applied?: string[];
  enhancement_text?: string;
  classes: string[];
  tags?: string[];
  source: string;
  created_by?: string;
  campaign_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface CharacterAbility {
  ability_id: string;
  character_id: string;
  source: string;
  item_id?: string;
  uses_remaining?: number;
  notes?: string;
  added_at: string;
  ability: Ability;
}

interface AbilitiesListProps {
  characterId: string;
  onBrowseAbilities?: () => void;
}

export default function AbilitiesList({ characterId, onBrowseAbilities }: AbilitiesListProps) {
  const [abilities, setAbilities] = useState<CharacterAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingAbility, setUsingAbility] = useState<string | null>(null);
  const [resting, setResting] = useState(false);

  useEffect(() => {
    fetchAbilities();
  }, [characterId]);

  const fetchAbilities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/abilities/characters/${characterId}/abilities`);
      if (response.ok) {
        const data = await response.json();
        setAbilities(data);
      }
    } catch (error) {
      console.error('Error fetching abilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseAbility = async (abilityId: string) => {
    try {
      setUsingAbility(abilityId);
      const response = await fetch('http://localhost:8000/api/abilities/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ability_id: abilityId,
          character_id: characterId,
          target_ids: [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Used ${result.ability.name}!\nUses Remaining: ${result.uses_remaining ?? 'Unlimited'}`);
        fetchAbilities(); // Refresh to update uses
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error using ability:', error);
      alert('Error using ability');
    } finally {
      setUsingAbility(null);
    }
  };

  const handleRest = async (restType: 'short_rest' | 'long_rest') => {
    try {
      setResting(true);
      const response = await fetch(
        `http://localhost:8000/api/abilities/characters/${characterId}/rest?rest_type=${restType}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`${restType === 'short_rest' ? 'Short' : 'Long'} rest completed!\nRestored ${result.restored_count} abilities.`);
        fetchAbilities(); // Refresh to update uses
      }
    } catch (error) {
      console.error('Error resting:', error);
      alert('Error during rest');
    } finally {
      setResting(false);
    }
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      maneuver: 'text-red-400',
      ki_ability: 'text-blue-400',
      rage: 'text-orange-400',
      channel_divinity: 'text-yellow-400',
      fighting_style: 'text-green-400',
      feature: 'text-green-400',
      passive: 'text-gray-400',
      reaction: 'text-purple-400',
      bonus_action: 'text-cyan-400',
      action: 'text-red-400',
    };
    return colors[type] || 'text-gray-400';
  };

  const getResourceIcon = (resourceType?: string): string => {
    if (!resourceType || resourceType === 'none') return '';
    const icons: Record<string, string> = {
      superiority_dice: '🎲',
      ki_points: '⚡',
      rage_uses: '💢',
      channel_divinity: '✨',
      uses_per_short_rest: '🌅',
      uses_per_long_rest: '🌙',
      daily: '📅',
    };
    return icons[resourceType] || '💠';
  };

  const formatAbilityType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatActionType = (type?: string): string => {
    if (!type) return '';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const groupAbilitiesByType = () => {
    const grouped: Record<string, CharacterAbility[]> = {};
    abilities.forEach(charAbility => {
      const type = charAbility.ability.ability_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(charAbility);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Loading abilities...</div>
      </div>
    );
  }

  const groupedAbilities = groupAbilitiesByType();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sword className="w-6 h-6 text-red-500" />
          Class Abilities
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleRest('short_rest')}
            disabled={resting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            <Sunset className="w-4 h-4" />
            Short Rest
          </button>
          <button
            onClick={() => handleRest('long_rest')}
            disabled={resting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            <Moon className="w-4 h-4" />
            Long Rest
          </button>
          {onBrowseAbilities && (
            <button
              onClick={onBrowseAbilities}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Browse Abilities
            </button>
          )}
        </div>
      </div>

      {/* Abilities List */}
      {abilities.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <Sword className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No abilities yet</p>
          {onBrowseAbilities && (
            <button
              onClick={onBrowseAbilities}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Browse Abilities
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAbilities).map(([type, typeAbilities]) => (
            <div key={type} className="space-y-3">
              <h3 className={`text-lg font-semibold ${getTypeColor(type)}`}>
                {formatAbilityType(type)} ({typeAbilities.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeAbilities.map(charAbility => {
                  const ability = charAbility.ability;
                  const hasUses = ability.uses_per_rest !== undefined && ability.uses_per_rest > 0;
                  const usesRemaining = charAbility.uses_remaining ?? ability.uses_per_rest ?? 0;
                  const maxUses = ability.uses_per_rest ?? 0;

                  return (
                    <div
                      key={charAbility.ability_id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-red-500 transition-colors"
                    >
                      {/* Ability Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{ability.name}</h4>
                            {ability.subclass && (
                              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                                {ability.subclass}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            {ability.action_type && (
                              <span>{formatActionType(ability.action_type)}</span>
                            )}
                            {ability.level_required > 1 && (
                              <span>• Level {ability.level_required}</span>
                            )}
                          </div>
                        </div>
                        {charAbility.source !== 'class' && (
                          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                            {charAbility.source}
                          </span>
                        )}
                      </div>

                      {/* Resource Info */}
                      {ability.resource_type && ability.resource_type !== 'none' && (
                        <div className="mb-2 flex items-center gap-2 text-sm">
                          <span className="text-lg">{getResourceIcon(ability.resource_type)}</span>
                          <span className="text-gray-400">
                            Cost: {ability.resource_cost || 1}
                          </span>
                          {hasUses && (
                            <span className={`font-semibold ${usesRemaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ({usesRemaining}/{maxUses} uses)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{ability.description}</p>

                      {/* Enhancement Text */}
                      {ability.enhancement_text && (
                        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
                          {ability.enhancement_text}
                        </div>
                      )}

                      {/* Mechanics Summary */}
                      {(ability.damage_dice || ability.save_type || ability.conditions_applied) && (
                        <div className="mb-3 flex flex-wrap gap-2 text-xs">
                          {ability.damage_dice && (
                            <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                              Damage: {ability.damage_dice} {ability.damage_type}
                            </span>
                          )}
                          {ability.save_type && (
                            <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                              Save: {ability.save_type.toUpperCase()}
                            </span>
                          )}
                          {ability.conditions_applied && ability.conditions_applied.length > 0 && (
                            <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                              Conditions: {ability.conditions_applied.join(', ')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Use Button */}
                      <button
                        onClick={() => handleUseAbility(ability.id)}
                        disabled={usingAbility === ability.id || (hasUses && usesRemaining <= 0)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
                      >
                        {usingAbility === ability.id ? (
                          'Using...'
                        ) : hasUses && usesRemaining <= 0 ? (
                          'No Uses Remaining'
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Use Ability
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
