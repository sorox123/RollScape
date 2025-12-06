'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface CampaignFormData {
  name: string;
  description: string;
  rule_system: string;
  max_players: number;
  visibility: 'private' | 'public' | 'invite_only';
  ai_dm_enabled: boolean;
  ai_dm_personality: string;
  ai_players_enabled: boolean;
  current_location?: string;
  current_chapter?: string;
  narrative_summary?: string;
}

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    rule_system: 'dnd_5e',
    max_players: 6,
    visibility: 'private',
    ai_dm_enabled: false,
    ai_dm_personality: 'balanced',
    ai_players_enabled: false,
    current_location: '',
    current_chapter: '',
    narrative_summary: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);

      if (!response.ok) {
        throw new Error('Campaign not found');
      }

      const data = await response.json();
      setFormData({
        name: data.name,
        description: data.description || '',
        rule_system: data.rule_system,
        max_players: data.max_players,
        visibility: data.visibility,
        ai_dm_enabled: data.ai_dm_enabled,
        ai_dm_personality: data.ai_dm_personality || 'balanced',
        ai_players_enabled: data.ai_players_enabled,
        current_location: data.current_location || '',
        current_chapter: data.current_chapter || '',
        narrative_summary: data.narrative_summary || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }

      router.push(`/campaigns/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/campaigns/${campaignId}`}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Campaign
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Edit Campaign</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="The Lost Mines of Phandelver"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A classic adventure for new players..."
                  />
                </div>
              </div>
            </div>

            {/* Game Settings */}
            <div>
              <h2 className="text-xl font-bold mb-4">Game Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rule System</label>
                  <select
                    name="rule_system"
                    value={formData.rule_system}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dnd_5e">D&D 5th Edition</option>
                    <option value="dnd_3.5e">D&D 3.5 Edition</option>
                    <option value="pathfinder">Pathfinder 1e</option>
                    <option value="pathfinder_2e">Pathfinder 2e</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Players</label>
                  <input
                    type="number"
                    name="max_players"
                    value={formData.max_players}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Visibility</label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="private">Private</option>
                    <option value="invite_only">Invite Only</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Campaign Progress */}
            <div>
              <h2 className="text-xl font-bold mb-4">Campaign Progress</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Chapter</label>
                  <input
                    type="text"
                    name="current_chapter"
                    value={formData.current_chapter}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Chapter 1: A Fateful Meeting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current Location</label>
                  <input
                    type="text"
                    name="current_location"
                    value={formData.current_location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="The Rusty Dragon Inn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Story Summary</label>
                  <textarea
                    name="narrative_summary"
                    value={formData.narrative_summary}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A brief summary of what has happened so far in the campaign..."
                  />
                </div>
              </div>
            </div>

            {/* AI Settings */}
            <div>
              <h2 className="text-xl font-bold mb-4">AI Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="ai_dm_enabled"
                    checked={formData.ai_dm_enabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm">Enable AI Dungeon Master</label>
                </div>

                {formData.ai_dm_enabled && (
                  <div>
                    <label className="block text-sm font-medium mb-2">DM Personality</label>
                    <select
                      name="ai_dm_personality"
                      value={formData.ai_dm_personality}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="balanced">Balanced</option>
                      <option value="storytelling">Storytelling</option>
                      <option value="tactical">Tactical</option>
                      <option value="humorous">Humorous</option>
                      <option value="serious">Serious</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="ai_players_enabled"
                    checked={formData.ai_players_enabled}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm">Enable AI Players</label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/campaigns/${campaignId}`}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
