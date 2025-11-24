'use client';

import React, { useState } from 'react';
import AbilityBrowser from '@/components/abilities/AbilityBrowser';
import AbilityCreator from '@/components/abilities/AbilityCreator';
import { Sword, Plus } from 'lucide-react';

export default function AbilitiesPage() {
  const [showCreator, setShowCreator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Mock data - replace with actual user/character/campaign data
  const characterId = 'test-fighter-456';
  const campaignId = 'test-campaign-456';

  const handleAbilityCreated = () => {
    setRefreshKey(prev => prev + 1); // Refresh the ability browser
    setShowCreator(false);
  };

  if (showCreator) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <AbilityCreator
            campaignId={campaignId}
            onAbilityCreated={handleAbilityCreated}
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
              <div className="p-3 bg-red-600 rounded-lg">
                <Sword className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Class Abilities</h1>
                <p className="text-gray-400">Browse martial abilities and class features</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Homebrew Ability
            </button>
          </div>
        </div>

        {/* Ability Browser */}
        <div className="flex-1 overflow-hidden">
          <AbilityBrowser
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
