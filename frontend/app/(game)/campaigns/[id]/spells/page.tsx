'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, ArrowLeft, Sparkles, Search } from 'lucide-react';
import SpellCreator from '@/components/spells/SpellCreator';

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string[];
  material_components?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  at_higher_levels?: string;
  damage_dice?: string;
  damage_type?: string;
  save_type?: string;
  spell_attack: boolean;
  source: string;
  campaign_id?: string;
  classes: string[];
  tags: string[];
  is_public: boolean;
}

interface Campaign {
  id: string;
  name: string;
  dm_user_id: string;
}

export default function CampaignSpellsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDM, setIsDM] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
      loadSpells();
      checkUser();
    }
  }, [campaignId]);

  const checkUser = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data);
        
        // Check if current user is DM (for now, assume they are in mock mode)
        setIsDM(true);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    }
  };

  const loadSpells = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/spells/campaigns/${campaignId}/spells`);
      if (response.ok) {
        const data = await response.json();
        setSpells(data);
      } else {
        console.error('Failed to load spells');
      }
    } catch (error) {
      console.error('Error loading spells:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpellCreated = () => {
    setShowCreator(false);
    loadSpells(); // Refresh spell list
  };

  const handleDeleteSpell = async (spellId: string, spellName: string) => {
    if (!confirm(`Are you sure you want to remove "${spellName}" from this campaign? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/spells/${spellId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Spell removed from campaign!');
        loadSpells();
      } else {
        const errorText = await response.text();
        alert(`Failed to delete spell: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting spell:', error);
      alert('Network error. Please try again.');
    }
  };

  const getSchoolColor = (school: string) => {
    const colors: Record<string, string> = {
      abjuration: 'text-blue-400',
      conjuration: 'text-purple-400',
      divination: 'text-cyan-400',
      enchantment: 'text-pink-400',
      evocation: 'text-red-400',
      illusion: 'text-indigo-400',
      necromancy: 'text-green-400',
      transmutation: 'text-yellow-400',
    };
    return colors[school.toLowerCase()] || 'text-gray-400';
  };

  const getLevelLabel = (level: number) => {
    if (level === 0) return 'Cantrip';
    const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
    return `${level}${suffix} Level`;
  };

  const getSourceBadge = (source: string) => {
    if (source === 'srd') {
      return { label: 'SRD', bg: 'bg-gray-700', text: 'text-gray-300' };
    }
    return { label: 'Homebrew', bg: 'bg-purple-600/20', text: 'text-purple-400' };
  };

  const filteredSpells = spells.filter(spell => {
    if (searchQuery && !spell.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedLevel !== 'all' && spell.level !== parseInt(selectedLevel)) {
      return false;
    }
    if (selectedSource !== 'all' && spell.source !== selectedSource) {
      return false;
    }
    return true;
  });

  const srdSpells = filteredSpells.filter(s => s.source === 'srd');
  const homebrewSpells = filteredSpells.filter(s => s.source === 'homebrew');

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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/campaigns/${campaignId}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaign
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Campaign Spell Library</h1>
                <p className="text-gray-400">
                  {campaign?.name || 'Loading...'} • {spells.length} spells available
                </p>
              </div>
            </div>

            {isDM && (
              <button
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all font-medium"
              >
                <Sparkles className="w-5 h-5" />
                Create Campaign Spell
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search spells..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
            >
              <option value="all">All Levels</option>
              <option value="0">Cantrips</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
            >
              <option value="all">All Sources</option>
              <option value="srd">SRD</option>
              <option value="homebrew">Homebrew</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-400">Loading spells...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* SRD Spells */}
            {srdSpells.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-gray-700 rounded text-sm">
                    {srdSpells.length}
                  </span>
                  SRD Spells
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {srdSpells.map(spell => (
                    <div
                      key={spell.id}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{spell.name}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{getLevelLabel(spell.level)}</span>
                            <span className={getSchoolColor(spell.school)}>
                              {spell.school}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{spell.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {spell.concentration && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                            Concentration
                          </span>
                        )}
                        {spell.ritual && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Ritual
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Homebrew Spells */}
            {homebrewSpells.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-600/20 rounded text-sm">
                    {homebrewSpells.length}
                  </span>
                  Campaign Homebrew Spells
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {homebrewSpells.map(spell => (
                    <div
                      key={spell.id}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors border border-purple-600/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{spell.name}</h3>
                            <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded">
                              Homebrew
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{getLevelLabel(spell.level)}</span>
                            <span className={getSchoolColor(spell.school)}>
                              {spell.school}
                            </span>
                          </div>
                        </div>
                        {isDM && (
                          <button
                            onClick={() => handleDeleteSpell(spell.id, spell.name)}
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                            title="Remove from campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{spell.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {spell.concentration && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                            Concentration
                          </span>
                        )}
                        {spell.ritual && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Ritual
                          </span>
                        )}
                        {spell.classes.length > 0 && (
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                            {spell.classes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredSpells.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No spells found</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery || selectedLevel !== 'all' || selectedSource !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first campaign spell to get started'}
                </p>
                {isDM && (
                  <button
                    onClick={() => setShowCreator(true)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                  >
                    Create Campaign Spell
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
