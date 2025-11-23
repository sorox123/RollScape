'use client';

import React, { useState } from 'react';
import SpellBrowser from '@/components/spells/SpellBrowser';
import SpellCreator from '@/components/spells/SpellCreator';
import { BookOpen, Plus, Sparkles } from 'lucide-react';

export default function SpellsPage() {
  const [showCreator, setShowCreator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Mock data - replace with actual user/character/campaign data
  const characterId = 'test-wizard-123';
  const campaignId = 'test-campaign-456';

  const handleSpellCreated = () => {
    setRefreshKey(prev => prev + 1); // Refresh the spell browser
    setShowCreator(false);
  };

  if (showCreator) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <SpellCreator
            campaignId={campaignId}
            onSpellCreated={handleSpellCreated}
            onClose={() => setShowCreator(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Spell Library</h1>
                <p className="text-gray-400">Browse and manage your spells</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all font-medium"
            >
              <Sparkles className="w-5 h-5" />
              Create Homebrew Spell
            </button>
          </div>
        </div>

        {/* Spell Browser */}
        <div className="flex-1 overflow-hidden">
          <SpellBrowser
            key={refreshKey}
            characterId={characterId}
            campaignId={campaignId}
            showAddButton={true}
          />
        </div>
      </div>
    </div>
  );
}
