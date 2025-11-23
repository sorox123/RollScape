'use client';

import React from 'react';
import { Heart, Shield, Zap, Skull, Clock } from 'lucide-react';
import Button from '../ui/Button';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  max_hp: number;
  current_hp: number;
  temp_hp?: number;
  armor_class: number;
  is_player: boolean;
  is_npc: boolean;
  is_dead: boolean;
  is_unconscious: boolean;
  conditions: string[];
}

interface InitiativeTrackerProps {
  combatants: Combatant[];
  currentTurn?: string | null;
  round: number;
  onNextTurn?: () => void;
  onDamage?: (combatantId: string, amount: number) => void;
  onHeal?: (combatantId: string, amount: number) => void;
}

export default function InitiativeTracker({
  combatants,
  currentTurn,
  round,
  onNextTurn,
  onDamage,
  onHeal
}: InitiativeTrackerProps) {
  const [damageInput, setDamageInput] = React.useState<{ [key: string]: string }>({});

  const handleDamage = (combatantId: string) => {
    const amount = parseInt(damageInput[combatantId] || '0');
    if (amount > 0 && onDamage) {
      onDamage(combatantId, amount);
      setDamageInput({ ...damageInput, [combatantId]: '' });
    }
  };

  const handleHeal = (combatantId: string) => {
    const amount = parseInt(damageInput[combatantId] || '0');
    if (amount > 0 && onHeal) {
      onHeal(combatantId, amount);
      setDamageInput({ ...damageInput, [combatantId]: '' });
    }
  };

  const getHPColor = (current: number, max: number) => {
    const percent = (current / max) * 100;
    if (percent > 50) return 'text-green-400';
    if (percent > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHPBarColor = (current: number, max: number) => {
    const percent = (current / max) * 100;
    if (percent > 50) return 'bg-green-500';
    if (percent > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Initiative Tracker</h3>
            <p className="text-sm text-gray-400">Round {round}</p>
          </div>
          {onNextTurn && (
            <Button onClick={onNextTurn} size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Next Turn
            </Button>
          )}
        </div>
      </div>

      {/* Combatants List */}
      <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
        {combatants.map((combatant) => (
          <div
            key={combatant.id}
            className={`p-4 transition-colors ${
              currentTurn === combatant.id
                ? 'bg-blue-900/30 border-l-4 border-blue-500'
                : 'hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Initiative */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{combatant.initiative}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Name and Type */}
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold text-white truncate">
                    {combatant.name}
                  </h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    combatant.is_player ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {combatant.is_player ? 'Player' : 'NPC'}
                  </span>
                  {combatant.is_dead && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400 flex items-center gap-1">
                      <Skull className="w-3 h-3" />
                      Dead
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-2 text-sm">
                  {/* HP */}
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className={`font-semibold ${getHPColor(combatant.current_hp, combatant.max_hp)}`}>
                      {combatant.current_hp}/{combatant.max_hp}
                    </span>
                    {combatant.temp_hp && combatant.temp_hp > 0 && (
                      <span className="text-blue-400">+{combatant.temp_hp}</span>
                    )}
                  </div>

                  {/* AC */}
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{combatant.armor_class}</span>
                  </div>
                </div>

                {/* HP Bar */}
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all ${getHPBarColor(combatant.current_hp, combatant.max_hp)}`}
                    style={{ width: `${(combatant.current_hp / combatant.max_hp) * 100}%` }}
                  />
                </div>

                {/* Conditions */}
                {combatant.conditions && combatant.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {combatant.conditions.map((condition, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                )}

                {/* Damage/Heal Controls */}
                {!combatant.is_dead && (onDamage || onHeal) && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount"
                      value={damageInput[combatant.id] || ''}
                      onChange={(e) => setDamageInput({ ...damageInput, [combatant.id]: e.target.value })}
                      className="w-20 px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                    {onDamage && (
                      <button
                        onClick={() => handleDamage(combatant.id)}
                        className="px-3 py-1 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded transition-colors"
                        disabled={!damageInput[combatant.id]}
                      >
                        Damage
                      </button>
                    )}
                    {onHeal && (
                      <button
                        onClick={() => handleHeal(combatant.id)}
                        className="px-3 py-1 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded transition-colors"
                        disabled={!damageInput[combatant.id]}
                      >
                        Heal
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Current Turn Indicator */}
              {currentTurn === combatant.id && (
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {combatants.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No combatants yet. Add combatants to start combat.
        </div>
      )}
    </div>
  );
}
