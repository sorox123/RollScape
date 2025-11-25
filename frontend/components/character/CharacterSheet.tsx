/**
 * CharacterSheet - Comprehensive D&D 5e character sheet
 * 
 * Full-featured character sheet with tabs for:
 * - Stats (abilities, skills, saves)
 * - Combat (HP, AC, attacks)
 * - Spells
 * - Equipment & Inventory
 * - Features & Traits
 * - Biography
 */

'use client';

import { useState, useEffect } from 'react';
import { Character } from '@/lib/types/character';
import { StatsTab } from './tabs/StatsTab';
import { CombatTab } from './tabs/CombatTab';
import { SpellsTab } from './tabs/SpellsTab';
import { EquipmentTab } from './tabs/EquipmentTab';
import { FeaturesTab } from './tabs/FeaturesTab';
import { BiographyTab } from './tabs/BiographyTab';

interface CharacterSheetProps {
  characterId: string;
  editable?: boolean;
}

type TabType = 'stats' | 'combat' | 'spells' | 'equipment' | 'features' | 'biography';

export function CharacterSheet({ characterId, editable = true }: CharacterSheetProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load character data
  useEffect(() => {
    loadCharacter();
  }, [characterId]);

  const loadCharacter = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/characters/${characterId}`);
      if (response.ok) {
        const data = await response.json();
        setCharacter(data);
      }
    } catch (error) {
      console.error('Failed to load character:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save when character data changes
  const updateCharacter = async (updates: Partial<Character>) => {
    if (!character || !editable) return;

    const updatedCharacter = { ...character, ...updates };
    setCharacter(updatedCharacter);

    // Debounced auto-save
    setSaving(true);
    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to save character:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading character...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Character not found</div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'combat', label: 'Combat', icon: '⚔️' },
    { id: 'spells', label: 'Spells', icon: '✨' },
    { id: 'equipment', label: 'Equipment', icon: '🎒' },
    { id: 'features', label: 'Features', icon: '🌟' },
    { id: 'biography', label: 'Biography', icon: '📖' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{character.name}</h1>
            <p className="text-gray-600 mt-1">
              Level {character.level} {character.race} {character.character_class}
              {character.subclass && ` (${character.subclass})`}
            </p>
          </div>
          <div className="text-right">
            {editable && (
              <div className="text-sm">
                {saving ? (
                  <span className="text-blue-600">💾 Saving...</span>
                ) : lastSaved ? (
                  <span className="text-green-600">
                    ✓ Saved {lastSaved.toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Experience bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Experience</span>
            <span>{character.experience_points?.toLocaleString()} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min((character.experience_points || 0) % 1000 / 10, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'stats' && (
            <StatsTab character={character} updateCharacter={updateCharacter} editable={editable} />
          )}
          {activeTab === 'combat' && (
            <CombatTab character={character} updateCharacter={updateCharacter} editable={editable} />
          )}
          {activeTab === 'spells' && (
            <SpellsTab character={character} updateCharacter={updateCharacter} editable={editable} />
          )}
          {activeTab === 'equipment' && (
            <EquipmentTab character={character} updateCharacter={updateCharacter} editable={editable} />
          )}
          {activeTab === 'features' && (
            <FeaturesTab character={character} updateCharacter={updateCharacter} editable={editable} />
          )}
          {activeTab === 'biography' && (
            <BiographyTab character={character} updateCharacter={updateCharacter} editable={editable} />
          )}
        </div>
      </div>
    </div>
  );
}
