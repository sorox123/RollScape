'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_system: 'dnd_5e',
    max_players: 6,
    visibility: 'private',
    ai_dm_enabled: false,
    ai_dm_personality: 'balanced',
    ai_players_enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/campaigns/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create campaign');
      }

      const campaign = await response.json();
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseInt(value)
          : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/campaigns"
            className="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-2"
          >
            ← Back to Campaigns
          </Link>
          <h1 className="text-4xl font-bold mb-2">Create New Campaign</h1>
          <p className="text-gray-400">Set up your D&D adventure</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="The Lost Mines of Phandelver"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="A classic adventure of mystery and peril..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Game Settings */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">Game Settings</h2>

            <div>
              <label htmlFor="rule_system" className="block text-sm font-medium mb-2">
                Rule System
              </label>
              <select
                id="rule_system"
                name="rule_system"
                value={formData.rule_system}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="dnd_5e">D&D 5th Edition</option>
                <option value="dnd_3.5e">D&D 3.5 Edition</option>
                <option value="pathfinder">Pathfinder</option>
                <option value="pathfinder_2e">Pathfinder 2e</option>
                <option value="custom">Custom Rules</option>
              </select>
            </div>

            <div>
              <label htmlFor="max_players" className="block text-sm font-medium mb-2">
                Maximum Players
              </label>
              <input
                type="number"
                id="max_players"
                name="max_players"
                value={formData.max_players}
                onChange={handleChange}
                min={1}
                max={10}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium mb-2">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="private">Private - Only invited players</option>
                <option value="invite_only">Invite Only - Request to join</option>
                <option value="public">Public - Anyone can join</option>
              </select>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">AI Settings</h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ai_dm_enabled"
                name="ai_dm_enabled"
                checked={formData.ai_dm_enabled}
                onChange={handleChange}
                className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-600"
              />
              <div>
                <label htmlFor="ai_dm_enabled" className="font-medium cursor-pointer">
                  Enable AI Dungeon Master
                </label>
                <p className="text-sm text-gray-400">
                  Let the AI guide your adventure with narrative and encounters
                </p>
              </div>
            </div>

            {formData.ai_dm_enabled && (
              <div>
                <label htmlFor="ai_dm_personality" className="block text-sm font-medium mb-2">
                  DM Personality
                </label>
                <select
                  id="ai_dm_personality"
                  name="ai_dm_personality"
                  value={formData.ai_dm_personality}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="balanced">Balanced - Mix of story and combat</option>
                  <option value="storytelling">Storytelling - Narrative focused</option>
                  <option value="tactical">Tactical - Combat and strategy focused</option>
                  <option value="humorous">Humorous - Light-hearted and fun</option>
                  <option value="serious">Serious - Dark and dramatic</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ai_players_enabled"
                name="ai_players_enabled"
                checked={formData.ai_players_enabled}
                onChange={handleChange}
                className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-600"
              />
              <div>
                <label htmlFor="ai_players_enabled" className="font-medium cursor-pointer">
                  Allow AI Players
                </label>
                <p className="text-sm text-gray-400">
                  Fill empty slots with AI-controlled party members
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
            <Link
              href="/campaigns"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
