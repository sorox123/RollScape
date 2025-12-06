'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import InvitePlayerModal from '@/components/campaign/InvitePlayerModal';
import CampaignMembersList from '@/components/campaign/CampaignMembersList';

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
  ai_dm_personality?: string;
  ai_players_enabled: boolean;
  current_location?: string;
  current_chapter?: string;
  narrative_summary?: string;
  banner_image_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
  dm_user_id: string;
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
      checkUserSubscription();
    }
  }, [campaignId]);

  const checkUserSubscription = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        setIsPaidUser(user.subscription_tier !== 'free');
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const loadCampaign = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);

      if (!response.ok) {
        throw new Error('Campaign not found');
      }

      const data = await response.json();
      setCampaign(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
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

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
            <p className="text-red-400 mb-4">{error || 'This campaign does not exist'}</p>
            <Link
              href="/campaigns"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Banner */}
      <div className="h-64 bg-gradient-to-br from-blue-600 to-purple-600 relative">
        {campaign.banner_image_url ? (
          <img
            src={campaign.banner_image_url}
            alt={campaign.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-9xl">🎲</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative">
        {/* Header Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{campaign.name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {getStatusLabel(campaign.status)}
                </span>
              </div>
              {campaign.description && (
                <p className="text-gray-400">{campaign.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📖</span>
              <span>{campaign.rule_system.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">👥</span>
              <span>{campaign.max_players} players max</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🎬</span>
              <span>Session {campaign.current_session_number}</span>
            </div>
            {campaign.ai_dm_enabled && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">🤖</span>
                <span>AI DM ({campaign.ai_dm_personality})</span>
              </div>
            )}
            {campaign.ai_players_enabled && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">👤</span>
                <span>AI Players Enabled</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status */}
            {(campaign.current_location || campaign.current_chapter) && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Current Status</h2>
                {campaign.current_chapter && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-500 mb-1">Chapter</div>
                    <div className="text-lg font-medium">{campaign.current_chapter}</div>
                  </div>
                )}
                {campaign.current_location && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Location</div>
                    <div className="text-lg">📍 {campaign.current_location}</div>
                  </div>
                )}
              </div>
            )}

            {/* Narrative Summary */}
            {campaign.narrative_summary && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Story So Far</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{campaign.narrative_summary}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={`/game/${campaign.id}`}
                  className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-center font-medium transition-colors"
                >
                  🎮 Play Session
                </Link>
                {isPaidUser ? (
                  <Link
                    href={`/map?campaign=${campaign.id}`}
                    className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-center font-medium transition-colors"
                  >
                    🗺️ Battle Map
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-center font-medium transition-colors relative"
                  >
                    <span className="absolute top-1 right-1 text-xs bg-yellow-600 px-2 py-0.5 rounded">Premium</span>
                    🗺️ Battle Map
                  </Link>
                )}
                <Link
                  href={`/campaigns/${campaign.id}/characters`}
                  className="p-4 bg-green-600 hover:bg-green-700 rounded-lg text-center font-medium transition-colors"
                >
                  👥 Characters
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/spells`}
                  className="p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-center font-medium transition-colors"
                >
                  📖 Spell Library
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/notes`}
                  className="p-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-center font-medium transition-colors"
                >
                  📝 Notes
                </Link>
                <Link
                  href={`/abilities`}
                  className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-center font-medium transition-colors"
                >
                  ⚔️ Abilities
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Members */}
            {currentUser && (
              <CampaignMembersList
                campaignId={campaign.id}
                currentUserId={currentUser.id}
                isDM={campaign.dm_user_id === currentUser.id}
                onMemberRemoved={() => {
                  // Refresh campaign data if needed
                }}
              />
            )}

            {/* Invite Button (DM Only) */}
            {currentUser && campaign.dm_user_id === currentUser.id && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>➕</span>
                <span>Invite Player</span>
              </button>
            )}

            {/* Campaign Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold mb-4">Campaign Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Visibility</div>
                  <div className="capitalize">{campaign.visibility.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Created</div>
                  <div>{new Date(campaign.created_at).toLocaleDateString()}</div>
                </div>
                {campaign.updated_at && (
                  <div>
                    <div className="text-gray-500 mb-1">Last Updated</div>
                    <div>{new Date(campaign.updated_at).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Management Actions */}
            {currentUser && campaign.dm_user_id === currentUser.id && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="font-bold mb-4">Manage</h3>
                <div className="space-y-2">
                  <Link
                    href={`/campaigns/${campaign.id}/edit`}
                    className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center font-medium transition-colors"
                  >
                    ✏️ Edit Campaign
                  </Link>
                  <button className="w-full px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded font-medium transition-colors">
                    🗑️ Archive Campaign
                  </button>
                </div>
              </div>
            )}

            {/* Back Link */}
            <Link
              href="/campaigns"
              className="block text-center text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Campaigns
            </Link>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {campaign && (
        <InvitePlayerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          campaignId={campaign.id}
          campaignName={campaign.name}
          onInviteSent={() => {
            // Refresh members list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
