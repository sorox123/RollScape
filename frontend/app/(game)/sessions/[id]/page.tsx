/**
 * Game Session Page - Battle map + chat + character HUD
 */

'use client';

import { useState, useEffect } from 'react';
import { CharacterHUD } from '@/components/character/CharacterHUD';
import { Character } from '@/lib/types/character';

export default function GameSessionPage({ params }: { params: { id: string } }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [showFullSheet, setShowFullSheet] = useState(false);
  const [hudMode, setHudMode] = useState<'compact' | 'full'>('compact');

  useEffect(() => {
    // TODO: Fetch character for current user in this session
    // For now, mock data
    const mockCharacter: Partial<Character> = {
      id: '1',
      name: 'Theron Brightblade',
      level: 5,
      race: 'Human',
      character_class: 'Fighter',
      subclass: 'Champion',
      avatar_url: '',
      
      // Combat stats
      max_hp: 42,
      current_hp: 28,
      temp_hp: 5,
      armor_class: 18,
      initiative_bonus: 1,
      speed: 30,
      proficiency_bonus: 3,
      
      // Ability scores
      ability_scores: {
        str: 16,
        dex: 14,
        con: 15,
        int: 10,
        wis: 12,
        cha: 8,
      },
      
      // Passive scores
      passive_perception: 14,
      passive_investigation: 11,
      passive_insight: 13,
      
      // Equipment
      weapons: [
        {
          name: 'Longsword',
          damage: '1d8+5',
          damage_type: 'slashing',
          properties: ['Versatile'],
          equipped: true,
        },
        {
          name: 'Longbow',
          damage: '1d8+2',
          damage_type: 'piercing',
          properties: ['Ranged', 'Two-Handed'],
          equipped: true,
        },
      ],
      
      // Status
      conditions: ['Blessed'],
      
      // Other required fields
      campaign_id: params.id,
      character_type: 'player' as any,
      is_active: true,
      background: 'Soldier',
      alignment: 'Lawful Good',
      skills: {},
      saving_throws: {},
      proficiencies: [],
      languages: [],
      features: [],
      equipment: [],
      spells: [],
      experience_points: 6500,
      created_at: new Date().toISOString(),
    };

    setCharacter(mockCharacter as Character);
  }, [params.id]);

  if (!character) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Game Session</h1>
            <p className="text-sm text-gray-500">Campaign: The Lost Mine of Phandelver</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setHudMode(hudMode === 'compact' ? 'full' : 'compact')}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            >
              {hudMode === 'compact' ? '📊 Expand HUD' : '📉 Compact HUD'}
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              🎲 Roll Dice
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Character HUD */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <CharacterHUD
            character={character}
            compact={hudMode === 'compact'}
            onOpenFullSheet={() => setShowFullSheet(true)}
          />

          {/* Party Members (Compact HUDs) */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Party Members</h3>
            <div className="space-y-2 opacity-50">
              {/* Mock party members */}
              <div className="bg-white border border-gray-200 rounded p-2 text-xs text-gray-500 text-center">
                Party member HUDs here
              </div>
            </div>
          </div>
        </div>

        {/* Center - Battle Map */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-800 relative overflow-hidden">
            {/* Battle Map Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-32 h-32 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-lg font-medium">Battle Map</p>
                <p className="text-sm">Map display will appear here</p>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button className="px-3 py-2 bg-gray-700 text-white rounded shadow-lg hover:bg-gray-600">
                🔍 Zoom In
              </button>
              <button className="px-3 py-2 bg-gray-700 text-white rounded shadow-lg hover:bg-gray-600">
                🔎 Zoom Out
              </button>
              <button className="px-3 py-2 bg-gray-700 text-white rounded shadow-lg hover:bg-gray-600">
                📏 Measure
              </button>
            </div>

            {/* Combat Tracker Overlay */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-64">
              <h3 className="font-bold text-gray-900 mb-3">Initiative Order</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium text-blue-900">👤 {character.name}</span>
                  <span className="text-blue-600 font-bold">18</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded opacity-50">
                  <span className="text-gray-600">🐉 Goblin</span>
                  <span className="text-gray-500">15</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded opacity-50">
                  <span className="text-gray-600">👤 Party Member</span>
                  <span className="text-gray-500">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom - Chat */}
          <div className="h-64 bg-white border-t border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  DM
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <p className="text-sm">A goblin jumps out from behind the rocks!</p>
                  </div>
                  <span className="text-xs text-gray-500">2:45 PM</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {character.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-sm">I draw my sword and prepare for battle!</p>
                  </div>
                  <span className="text-xs text-gray-500">2:46 PM</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  🎲
                </div>
                <div className="flex-1">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                    <p className="text-sm font-medium">
                      {character.name} rolled Initiative: <span className="text-purple-600 font-bold">18</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">2:46 PM</span>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Character Sheet Modal */}
      {showFullSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Character Sheet</h2>
              <button
                onClick={() => setShowFullSheet(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center">
                Full CharacterSheet component would render here
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
