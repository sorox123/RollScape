'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  visibility: 'private' | 'public' | 'invite_only';
  rule_system: string;
  max_players: number;
  current_session_number: number;
  ai_dm_enabled: boolean;
  current_location?: string;
  current_chapter?: string;
  banner_image_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'my' | 'public'>('my');

  useEffect(() => {
    loadCampaigns();
  }, [view]);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = view === 'my' 
        ? '/api/campaigns/my-campaigns' 
        : '/api/campaigns?visibility=public';
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load campaigns');
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600';
      case 'planning':
        return 'bg-blue-600';
      case 'paused':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-purple-600';
      case 'archived':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Campaigns</h1>
            <p className="text-gray-400">Manage your D&D campaigns</p>
          </div>
          <Link
            href="/campaigns/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            + New Campaign
          </Link>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('my')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'my'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            My Campaigns
          </button>
          <button
            onClick={() => setView('public')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'public'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Browse Public Games
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-400">Loading campaigns...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadCampaigns}
              className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && campaigns.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-bold mb-2">
              {view === 'my' ? 'No campaigns yet' : 'No public campaigns available'}
            </h3>
            <p className="text-gray-400 mb-6">
              {view === 'my'
                ? 'Create your first campaign to get started'
                : 'Check back later or create your own campaign'}
            </p>
            {view === 'my' && (
              <Link
                href="/campaigns/new"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Create Campaign
              </Link>
            )}
          </div>
        )}

        {/* Campaigns Grid */}
        {!loading && !error && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="block bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group"
              >
                {/* Banner Image */}
                <div className="h-40 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
                  {campaign.banner_image_url ? (
                    <img
                      src={campaign.banner_image_url}
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl">
                      🎲
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        campaign.status
                      )}`}
                    >
                      {getStatusLabel(campaign.status)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                    {campaign.name}
                  </h3>

                  {campaign.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>📖</span>
                      <span>{campaign.rule_system.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>👥</span>
                      <span>{campaign.max_players} players</span>
                    </div>
                    {campaign.ai_dm_enabled && (
                      <div className="flex items-center gap-1">
                        <span>🤖</span>
                        <span>AI DM</span>
                      </div>
                    )}
                  </div>

                  {campaign.current_location && (
                    <div className="mt-3 text-sm text-gray-400">
                      📍 {campaign.current_location}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                    Session {campaign.current_session_number} • Created{' '}
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
