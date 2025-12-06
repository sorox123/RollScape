'use client';

import { useState } from 'react';

interface DiceRoll {
  id: string;
  formula: string;
  result: number;
  breakdown: string;
  timestamp: Date;
  type?: 'normal' | 'advantage' | 'disadvantage' | 'critical';
}

interface DiceRollerProps {
  onRoll?: (roll: DiceRoll) => void;
  showHistory?: boolean;
  compact?: boolean;
}

export function DiceRoller({ onRoll, showHistory = true, compact = false }: DiceRollerProps) {
  const [customFormula, setCustomFormula] = useState('');
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  // Common dice types
  const commonDice = [
    { sides: 4, color: 'bg-red-600' },
    { sides: 6, color: 'bg-orange-600' },
    { sides: 8, color: 'bg-yellow-600' },
    { sides: 10, color: 'bg-green-600' },
    { sides: 12, color: 'bg-blue-600' },
    { sides: 20, color: 'bg-purple-600' },
    { sides: 100, color: 'bg-pink-600' },
  ];

  // Parse and roll dice formula (e.g., "2d6+3", "1d20", "3d8-2")
  const parseDiceFormula = (formula: string): { result: number; breakdown: string } => {
    try {
      // Remove spaces
      formula = formula.trim().toLowerCase();

      // Pattern: XdY+Z or XdY-Z
      const match = formula.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
      
      if (!match) {
        throw new Error('Invalid dice formula');
      }

      const count = parseInt(match[1] || '1');
      const sides = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : 0;

      if (count < 1 || count > 100) {
        throw new Error('Number of dice must be between 1 and 100');
      }

      if (sides < 2 || sides > 1000) {
        throw new Error('Dice sides must be between 2 and 1000');
      }

      // Roll the dice
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }

      const rollSum = rolls.reduce((sum, roll) => sum + roll, 0);
      const total = rollSum + modifier;

      // Create breakdown string
      let breakdown = `[${rolls.join(', ')}]`;
      if (modifier !== 0) {
        breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`;
      }
      breakdown += ` = ${total}`;

      return { result: total, breakdown };
    } catch (error) {
      console.error('Error parsing dice formula:', error);
      return { result: 0, breakdown: 'Invalid formula' };
    }
  };

  // Roll advantage (2d20, take higher)
  const rollAdvantage = (): { result: number; breakdown: string } => {
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const result = Math.max(roll1, roll2);
    const breakdown = `[${roll1}, ${roll2}] → ${result} (advantage)`;
    return { result, breakdown };
  };

  // Roll disadvantage (2d20, take lower)
  const rollDisadvantage = (): { result: number; breakdown: string } => {
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const result = Math.min(roll1, roll2);
    const breakdown = `[${roll1}, ${roll2}] → ${result} (disadvantage)`;
    return { result, breakdown };
  };

  // Execute a roll
  const executeRoll = (
    formula: string,
    type: 'normal' | 'advantage' | 'disadvantage' | 'critical' = 'normal'
  ) => {
    setRolling(true);

    let rollResult: { result: number; breakdown: string };

    if (type === 'advantage') {
      rollResult = rollAdvantage();
    } else if (type === 'disadvantage') {
      rollResult = rollDisadvantage();
    } else if (type === 'critical') {
      // Critical hit: double the dice (not the modifier)
      const match = formula.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
      if (match) {
        const count = parseInt(match[1] || '1') * 2; // Double the dice
        const sides = match[2];
        const modifier = match[3] || '';
        formula = `${count}d${sides}${modifier}`;
      }
      rollResult = parseDiceFormula(formula);
    } else {
      rollResult = parseDiceFormula(formula);
    }

    const roll: DiceRoll = {
      id: Date.now().toString(),
      formula,
      result: rollResult.result,
      breakdown: rollResult.breakdown,
      timestamp: new Date(),
      type,
    };

    setLastResult(rollResult.result);
    setRollHistory([roll, ...rollHistory]);

    if (onRoll) {
      onRoll(roll);
    }

    // Animation
    setTimeout(() => setRolling(false), 500);
  };

  // Quick roll buttons
  const quickRoll = (sides: number) => {
    executeRoll(`1d${sides}`);
  };

  // Roll custom formula
  const rollCustom = () => {
    if (customFormula.trim()) {
      executeRoll(customFormula);
    }
  };

  const clearHistory = () => {
    setRollHistory([]);
    setLastResult(null);
  };

  const getRollTypeColor = (type?: string) => {
    switch (type) {
      case 'advantage':
        return 'text-green-400';
      case 'disadvantage':
        return 'text-red-400';
      case 'critical':
        return 'text-yellow-400';
      default:
        return 'text-white';
    }
  };

  if (compact) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex gap-2 mb-3">
          {commonDice.slice(0, 3).map((die) => (
            <button
              key={die.sides}
              onClick={() => quickRoll(die.sides)}
              className={`flex-1 ${die.color} hover:opacity-80 text-white font-bold py-2 px-3 rounded transition-all ${
                rolling ? 'animate-pulse' : ''
              }`}
            >
              d{die.sides}
            </button>
          ))}
          <button
            onClick={() => quickRoll(20)}
            className="flex-1 bg-purple-600 hover:opacity-80 text-white font-bold py-2 px-3 rounded transition-all"
          >
            d20
          </button>
        </div>
        {lastResult !== null && (
          <div className="text-center text-3xl font-bold text-white">
            {lastResult}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">🎲 Dice Roller</h2>

      {/* Result Display */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6 text-center">
        {rolling ? (
          <div className="text-6xl font-bold text-white animate-pulse">
            🎲
          </div>
        ) : lastResult !== null ? (
          <div className="text-6xl font-bold text-white">
            {lastResult}
          </div>
        ) : (
          <div className="text-gray-500 text-xl">
            Roll some dice!
          </div>
        )}
      </div>

      {/* Quick Roll Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Roll</h3>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {commonDice.map((die) => (
            <button
              key={die.sides}
              onClick={() => quickRoll(die.sides)}
              disabled={rolling}
              className={`${die.color} hover:opacity-80 disabled:opacity-50 text-white font-bold py-3 px-4 rounded transition-all transform hover:scale-105 active:scale-95`}
            >
              d{die.sides}
            </button>
          ))}
        </div>

        {/* D20 Special Rolls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => executeRoll('1d20', 'advantage')}
            disabled={rolling}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Advantage
          </button>
          <button
            onClick={() => executeRoll('1d20', 'normal')}
            disabled={rolling}
            className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Normal d20
          </button>
          <button
            onClick={() => executeRoll('1d20', 'disadvantage')}
            disabled={rolling}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Disadvantage
          </button>
        </div>
      </div>

      {/* Custom Formula */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Custom Formula</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customFormula}
            onChange={(e) => setCustomFormula(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && rollCustom()}
            placeholder="e.g., 2d6+3, 8d8, 1d20+5"
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={rollCustom}
            disabled={rolling || !customFormula.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
          >
            Roll
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Format: XdY+Z (e.g., 2d6+3 = roll 2 six-sided dice, add 3)
        </p>
      </div>

      {/* Common Formulas */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Common Rolls</h3>
        <div className="flex flex-wrap gap-2">
          {['2d6', '3d6', '1d20+5', '2d8+2', '8d6', '1d12+3'].map((formula) => (
            <button
              key={formula}
              onClick={() => executeRoll(formula)}
              disabled={rolling}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {formula}
            </button>
          ))}
        </div>
      </div>

      {/* Roll History */}
      {showHistory && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400">Roll History</h3>
            {rollHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-y-auto">
            {rollHistory.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No rolls yet
              </p>
            ) : (
              <div className="space-y-2">
                {rollHistory.map((roll) => (
                  <div
                    key={roll.id}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{roll.formula}</span>
                        {roll.type !== 'normal' && (
                          <span className={`text-xs ${getRollTypeColor(roll.type)}`}>
                            {roll.type}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">{roll.breakdown}</div>
                    </div>
                    <div className={`text-2xl font-bold ${getRollTypeColor(roll.type)} ml-4`}>
                      {roll.result}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
