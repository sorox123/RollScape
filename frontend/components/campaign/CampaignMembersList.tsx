'use client';

import { useState, useEffect } from 'react';
import { Users, UserMinus, Shield, Eye, Crown } from 'lucide-react';

interface CampaignMember {
  id: string;
  user_id: string;
  user_username: string;
  user_display_name?: string;
  role: 'dm' | 'player' | 'observer';
  joined_at: string;
}

interface CampaignMembersListProps {
  campaignId: string;
  currentUserId: string;
  isDM: boolean;
  onMemberRemoved?: () => void;
}

export default function CampaignMembersList({
  campaignId,
  currentUserId,
  isDM,
  onMemberRemoved,
}: CampaignMembersListProps) {
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [campaignId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the campaign?`)) {
      return;
    }

    setRemoving(memberId);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberId));
        onMemberRemoved?.();
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to remove member');
      }
    } catch (error) {
      alert('Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'dm':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'player':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'observer':
        return <Eye className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'dm':
        return 'Dungeon Master';
      case 'player':
        return 'Player';
      case 'observer':
        return 'Observer';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-bold">Campaign Members</h3>
        </div>
        <p className="text-gray-400 text-sm">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-bold">Campaign Members</h3>
          <span className="text-sm text-gray-400">({members.length})</span>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-gray-400 text-sm">No members yet</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const canRemove = isDM && !isCurrentUser && member.role !== 'dm';

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-600 rounded-full">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {member.user_display_name || member.user_username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-blue-400">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-400">{getRoleLabel(member.role)}</p>
                  </div>
                </div>

                {canRemove && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user_display_name || member.user_username)}
                    disabled={removing === member.id}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                    title="Remove member"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
