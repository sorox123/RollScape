'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastContainer';
import BattleMap from '@/components/combat/BattleMap';
import InitiativeTracker from '@/components/combat/InitiativeTracker';
import Button from '@/components/ui/Button';
import { Swords, Plus, Play, Square } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  position: { x: number; y: number };
  color: string;
  size: number;
  isPlayer: boolean;
  hp?: number;
  maxHp?: number;
}

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

export default function CombatPage() {
  const { showToast } = useToast();
  const [combatId, setCombatId] = useState<string | null>(null);
  const [combatStatus, setCombatStatus] = useState<'setup' | 'active' | 'ended'>('setup');
  const [round, setRound] = useState(1);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);

  // Sample data for demonstration
  useEffect(() => {
    // Initialize with sample combatants
    const sampleCombatants: Combatant[] = [
      {
        id: '1',
        name: 'Thorin Ironbeard',
        initiative: 18,
        max_hp: 47,
        current_hp: 47,
        armor_class: 18,
        is_player: true,
        is_npc: false,
        is_dead: false,
        is_unconscious: false,
        conditions: []
      },
      {
        id: '2',
        name: 'Elara Moonshadow',
        initiative: 16,
        max_hp: 28,
        current_hp: 28,
        armor_class: 14,
        is_player: true,
        is_npc: false,
        is_dead: false,
        is_unconscious: false,
        conditions: []
      },
      {
        id: '3',
        name: 'Goblin Scout',
        initiative: 14,
        max_hp: 7,
        current_hp: 7,
        armor_class: 15,
        is_player: false,
        is_npc: true,
        is_dead: false,
        is_unconscious: false,
        conditions: []
      },
      {
        id: '4',
        name: 'Orc Warrior',
        initiative: 12,
        max_hp: 15,
        current_hp: 15,
        armor_class: 13,
        is_player: false,
        is_npc: true,
        is_dead: false,
        is_unconscious: false,
        conditions: []
      }
    ];

    const sampleTokens: Token[] = [
      {
        id: '1',
        name: 'Thorin',
        position: { x: 80, y: 80 },
        color: '#3b82f6',
        size: 40,
        isPlayer: true,
        hp: 47,
        maxHp: 47
      },
      {
        id: '2',
        name: 'Elara',
        position: { x: 160, y: 80 },
        color: '#8b5cf6',
        size: 40,
        isPlayer: true,
        hp: 28,
        maxHp: 28
      },
      {
        id: '3',
        name: 'Goblin',
        position: { x: 480, y: 240 },
        color: '#ef4444',
        size: 40,
        isPlayer: false,
        hp: 7,
        maxHp: 7
      },
      {
        id: '4',
        name: 'Orc',
        position: { x: 560, y: 240 },
        color: '#dc2626',
        size: 40,
        isPlayer: false,
        hp: 15,
        maxHp: 15
      }
    ];

    setCombatants(sampleCombatants);
    setTokens(sampleTokens);
  }, []);

  const handleStartCombat = () => {
    setCombatStatus('active');
    setRound(1);
    setCurrentTurn(combatants[0]?.id || null);
    showToast('Combat started!', 'success');
  };

  const handleNextTurn = () => {
    const currentIndex = combatants.findIndex(c => c.id === currentTurn);
    let nextIndex = (currentIndex + 1) % combatants.length;
    
    // Skip dead combatants
    while (combatants[nextIndex]?.is_dead && nextIndex !== currentIndex) {
      nextIndex = (nextIndex + 1) % combatants.length;
    }

    // Check if we wrapped around (new round)
    if (nextIndex <= currentIndex) {
      setRound(r => r + 1);
    }

    setCurrentTurn(combatants[nextIndex]?.id || null);
  };

  const handleDamage = (combatantId: string, amount: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id === combatantId) {
        const newHp = Math.max(0, c.current_hp - amount);
        const isDead = newHp === 0;
        return {
          ...c,
          current_hp: newHp,
          is_dead: isDead,
          is_unconscious: isDead,
          conditions: isDead ? [...c.conditions, 'unconscious'] : c.conditions
        };
      }
      return c;
    }));

    // Update token HP
    setTokens(prev => prev.map(t => {
      if (t.id === combatantId) {
        return { ...t, hp: Math.max(0, (t.hp || 0) - amount) };
      }
      return t;
    }));

    showToast(`${combatants.find(c => c.id === combatantId)?.name} takes ${amount} damage!`, 'error');
  };

  const handleHeal = (combatantId: string, amount: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id === combatantId) {
        const newHp = Math.min(c.max_hp, c.current_hp + amount);
        const wasUnconscious = c.is_unconscious;
        return {
          ...c,
          current_hp: newHp,
          is_dead: false,
          is_unconscious: false,
          conditions: wasUnconscious ? c.conditions.filter(cond => cond !== 'unconscious') : c.conditions
        };
      }
      return c;
    }));

    // Update token HP
    setTokens(prev => prev.map(t => {
      const combatant = combatants.find(c => c.id === t.id);
      if (t.id === combatantId && combatant) {
        return { ...t, hp: Math.min(combatant.max_hp, (t.hp || 0) + amount) };
      }
      return t;
    }));

    showToast(`${combatants.find(c => c.id === combatantId)?.name} is healed for ${amount} HP!`, 'success');
  };

  const handleTokenMove = (tokenId: string, newPosition: { x: number; y: number }) => {
    setTokens(prev => prev.map(t => 
      t.id === tokenId ? { ...t, position: newPosition } : t
    ));
  };

  const handleEndCombat = () => {
    setCombatStatus('ended');
    showToast('Combat ended!', 'info');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Swords className="w-8 h-8 text-red-500" />
                Combat Encounter
              </h1>
              <p className="text-gray-400 mt-1">
                {combatStatus === 'setup' && 'Set up combatants and start combat'}
                {combatStatus === 'active' && `Round ${round} - ${combatants.find(c => c.id === currentTurn)?.name}'s turn`}
                {combatStatus === 'ended' && 'Combat has ended'}
              </p>
            </div>

            <div className="flex gap-2">
              {combatStatus === 'setup' && (
                <Button onClick={handleStartCombat} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Start Combat
                </Button>
              )}
              {combatStatus === 'active' && (
                <Button onClick={handleEndCombat} variant="danger" size="lg">
                  <Square className="w-5 h-5 mr-2" />
                  End Combat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Battle Map */}
          <div className="lg:col-span-2">
            <BattleMap
              width={800}
              height={600}
              gridSize={40}
              showGrid={true}
              tokens={tokens}
              onTokenMove={handleTokenMove}
            />
          </div>

          {/* Initiative Tracker */}
          <div>
            <InitiativeTracker
              combatants={combatants}
              currentTurn={combatStatus === 'active' ? currentTurn : null}
              round={round}
              onNextTurn={combatStatus === 'active' ? handleNextTurn : undefined}
              onDamage={handleDamage}
              onHeal={handleHeal}
            />
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Combat Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <strong className="text-white">Battle Map:</strong>
              <p className="mt-1">Click and drag tokens to move them around the battlefield. Each grid square represents 5 feet.</p>
            </div>
            <div>
              <strong className="text-white">Initiative Tracker:</strong>
              <p className="mt-1">Track combatant HP, conditions, and turn order. Enter damage/healing amounts and click the buttons to apply.</p>
            </div>
            <div>
              <strong className="text-white">Turn Management:</strong>
              <p className="mt-1">Click "Next Turn" to advance to the next combatant. The tracker automatically handles round progression.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
