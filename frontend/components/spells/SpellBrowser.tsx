'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Sparkles, Plus, X } from 'lucide-react';

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
  world_id?: string;
  created_by?: string;
  classes: string[];
  tags: string[];
  is_public: boolean;
}

interface SpellBrowserProps {
  characterId?: string;
  campaignId?: string;
  onAddToSpellbook?: (spellId: string) => void;
  showAddButton?: boolean;
}

export default function SpellBrowser({
  characterId,
  campaignId,
  onAddToSpellbook,
  showAddButton = true
}: SpellBrowserProps) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const schools = [
    'all',
    'abjuration',
    'conjuration',
    'divination',
    'enchantment',
    'evocation',
    'illusion',
    'necromancy',
    'transmutation'
  ];

  const classes = [
    'all',
    'bard',
    'cleric',
    'druid',
    'paladin',
    'ranger',
    'sorcerer',
    'warlock',
    'wizard'
  ];

  const sources = ['all', 'srd', 'homebrew', 'world'];

  const levels = ['all', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Fetch spells
  useEffect(() => {
    fetchSpells();
  }, [campaignId]);

  const fetchSpells = async () => {
    try {
      setLoading(true);
      const url = campaignId
        ? `http://localhost:8000/api/spells/campaigns/${campaignId}/spells`
        : 'http://localhost:8000/api/spells/';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSpells(data);
        setFilteredSpells(data);
      }
    } catch (error) {
      console.error('Error fetching spells:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...spells];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(spell =>
        spell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spell.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(spell => spell.level === selectedLevel);
    }

    // School filter
    if (selectedSchool !== 'all') {
      filtered = filtered.filter(spell => spell.school === selectedSchool);
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(spell =>
        spell.classes.includes(selectedClass)
      );
    }

    // Source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(spell => spell.source === selectedSource);
    }

    setFilteredSpells(filtered);
  }, [searchQuery, selectedLevel, selectedSchool, selectedClass, selectedSource, spells]);

  const getSchoolColor = (school: string) => {
    const colors: { [key: string]: string } = {
      abjuration: 'text-blue-400',
      conjuration: 'text-yellow-400',
      divination: 'text-cyan-400',
      enchantment: 'text-pink-400',
      evocation: 'text-red-400',
      illusion: 'text-purple-400',
      necromancy: 'text-green-400',
      transmutation: 'text-orange-400'
    };
    return colors[school] || 'text-gray-400';
  };

  const getSourceBadge = (source: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      srd: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'SRD' },
      homebrew: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Homebrew' },
      world: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'World' }
    };
    return badges[source] || badges.srd;
  };

  const getLevelLabel = (level: number) => {
    if (level === 0) return 'Cantrip';
    const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
    return `${level}${suffix} Level`;
  };

  const handleAddToSpellbook = async (spellId: string) => {
    if (!characterId) return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/spells/characters/${characterId}/spellbook?spell_id=${spellId}&prepared=false`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        if (onAddToSpellbook) {
          onAddToSpellbook(spellId);
        }
        alert('Spell added to spellbook!');
      }
    } catch (error) {
      console.error('Error adding spell:', error);
      alert('Failed to add spell to spellbook');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedSchool('all');
    setSelectedClass('all');
    setSelectedSource('all');
  };

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) +
    (selectedLevel !== 'all' ? 1 : 0) +
    (selectedSchool !== 'all' ? 1 : 0) +
    (selectedClass !== 'all' ? 1 : 0) +
    (selectedSource !== 'all' ? 1 : 0);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Spell Library</h2>
          </div>
          <div className="text-sm text-gray-400">
            {filteredSpells.length} of {spells.length} spells
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search spells by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level === 0 ? 'Cantrips' : `Level ${level}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  School
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {schools.map(school => (
                    <option key={school} value={school}>
                      {school === 'all' ? 'All Schools' : school.charAt(0).toUpperCase() + school.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>
                      {cls === 'all' ? 'All Classes' : cls.charAt(0).toUpperCase() + cls.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Source
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {sources.map(source => (
                    <option key={source} value={source}>
                      {source === 'all' ? 'All Sources' : source.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spell List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading spells...</div>
        ) : filteredSpells.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No spells found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpells.map(spell => (
              <div
                key={spell.id}
                onClick={() => setSelectedSpell(spell)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500 cursor-pointer transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{spell.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-400">
                        {getLevelLabel(spell.level)}
                      </span>
                      <span className={`text-sm ${getSchoolColor(spell.school)}`}>
                        {spell.school}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${getSourceBadge(spell.source).bg} ${getSourceBadge(spell.source).text}`}>
                    {getSourceBadge(spell.source).label}
                  </span>
                </div>

                {/* Quick Info */}
                <div className="space-y-1 text-sm text-gray-400 mb-3">
                  <div className="flex gap-4">
                    <span>⏱️ {spell.casting_time}</span>
                    <span>📏 {spell.range}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span>🧩 {spell.components.join(', ')}</span>
                    {spell.concentration && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        Concentration
                      </span>
                    )}
                    {spell.ritual && (
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                        Ritual
                      </span>
                    )}
                  </div>
                </div>

                {/* Description Preview */}
                <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                  {spell.description}
                </p>

                {/* Classes */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {spell.classes.slice(0, 4).map(cls => (
                    <span
                      key={cls}
                      className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                    >
                      {cls}
                    </span>
                  ))}
                  {spell.classes.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                      +{spell.classes.length - 4}
                    </span>
                  )}
                </div>

                {/* Add Button */}
                {showAddButton && characterId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToSpellbook(spell.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Spellbook
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spell Detail Modal */}
      {selectedSpell && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSpell(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{selectedSpell.name}</h2>
                  <span className={`px-2 py-1 text-xs rounded ${getSourceBadge(selectedSpell.source).bg} ${getSourceBadge(selectedSpell.source).text}`}>
                    {getSourceBadge(selectedSpell.source).label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {getLevelLabel(selectedSpell.level)}
                  </span>
                  <span className={getSchoolColor(selectedSpell.school)}>
                    {selectedSpell.school}
                  </span>
                  {selectedSpell.concentration && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                      Concentration
                    </span>
                  )}
                  {selectedSpell.ritual && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                      Ritual
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedSpell(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Casting Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Casting Time:</span>
                  <span className="ml-2 text-white">{selectedSpell.casting_time}</span>
                </div>
                <div>
                  <span className="text-gray-400">Range:</span>
                  <span className="ml-2 text-white">{selectedSpell.range}</span>
                </div>
                <div>
                  <span className="text-gray-400">Components:</span>
                  <span className="ml-2 text-white">{selectedSpell.components.join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="ml-2 text-white">{selectedSpell.duration}</span>
                </div>
              </div>

              {selectedSpell.material_components && (
                <div className="p-3 bg-gray-900 rounded-lg text-sm">
                  <span className="text-gray-400">Materials:</span>
                  <span className="ml-2 text-white">{selectedSpell.material_components}</span>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="font-bold mb-2">Description</h3>
                <p className="text-gray-300 whitespace-pre-line">{selectedSpell.description}</p>
              </div>

              {/* At Higher Levels */}
              {selectedSpell.at_higher_levels && (
                <div>
                  <h3 className="font-bold mb-2">At Higher Levels</h3>
                  <p className="text-gray-300 whitespace-pre-line">{selectedSpell.at_higher_levels}</p>
                </div>
              )}

              {/* Mechanics */}
              {(selectedSpell.damage_dice || selectedSpell.save_type || selectedSpell.spell_attack) && (
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h3 className="font-bold mb-3">Mechanics</h3>
                  <div className="space-y-2 text-sm">
                    {selectedSpell.damage_dice && (
                      <div>
                        <span className="text-gray-400">Damage:</span>
                        <span className="ml-2 text-white">
                          {selectedSpell.damage_dice} {selectedSpell.damage_type}
                        </span>
                      </div>
                    )}
                    {selectedSpell.save_type && (
                      <div>
                        <span className="text-gray-400">Saving Throw:</span>
                        <span className="ml-2 text-white capitalize">{selectedSpell.save_type}</span>
                      </div>
                    )}
                    {selectedSpell.spell_attack && (
                      <div>
                        <span className="text-white">Requires spell attack roll</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Classes */}
              <div>
                <h3 className="font-bold mb-2">Available to Classes</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSpell.classes.map(cls => (
                    <span
                      key={cls}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm capitalize"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {selectedSpell.tags.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpell.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Spellbook Button */}
              {showAddButton && characterId && (
                <button
                  onClick={() => {
                    handleAddToSpellbook(selectedSpell.id);
                    setSelectedSpell(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add to Spellbook
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
