'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Sword, Shield, Plus, X, Zap } from 'lucide-react';

interface Ability {
  id: string;
  name: string;
  description: string;
  ability_type: string;
  source: string;
  classes: string[];
  subclass?: string;
  level_required: number;
  resource_type: string;
  resource_cost: number;
  uses_per_rest?: number;
  recharge_on: string;
  action_type: string;
  damage_dice?: string;
  damage_type?: string;
  save_type?: string;
  attack_bonus: boolean;
  duration?: string;
  range?: string;
  conditions_applied: string[];
  enhancement_text?: string;
  tags: string[];
  is_public: boolean;
}

interface AbilityBrowserProps {
  characterId?: string;
  campaignId?: string;
  onAddToCharacter?: (abilityId: string) => void;
  showAddButton?: boolean;
}

export default function AbilityBrowser({
  characterId,
  campaignId,
  onAddToCharacter,
  showAddButton = true
}: AbilityBrowserProps) {
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [filteredAbilities, setFilteredAbilities] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const abilityTypes = [
    'all',
    'maneuver',
    'ki_ability',
    'rage',
    'channel_divinity',
    'fighting_style',
    'feature',
    'passive',
    'reaction',
    'bonus_action',
    'action'
  ];

  const classes = [
    'all',
    'barbarian',
    'bard',
    'cleric',
    'druid',
    'fighter',
    'monk',
    'paladin',
    'ranger',
    'rogue',
    'sorcerer',
    'warlock',
    'wizard'
  ];

  const resourceTypes = [
    'all',
    'none',
    'superiority_dice',
    'ki_points',
    'rage_uses',
    'channel_divinity',
    'uses_per_short_rest',
    'uses_per_long_rest'
  ];

  const sources = ['all', 'srd', 'homebrew', 'world'];

  // Fetch abilities
  useEffect(() => {
    fetchAbilities();
  }, [campaignId]);

  const fetchAbilities = async () => {
    try {
      setLoading(true);
      const url = campaignId
        ? `http://localhost:8000/api/abilities/campaigns/${campaignId}/abilities`
        : 'http://localhost:8000/api/abilities/';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAbilities(data);
        setFilteredAbilities(data);
      }
    } catch (error) {
      console.error('Error fetching abilities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...abilities];

    if (searchQuery) {
      filtered = filtered.filter(ability =>
        ability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ability.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(ability => ability.ability_type === selectedType);
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(ability =>
        ability.classes.includes(selectedClass)
      );
    }

    if (selectedResource !== 'all') {
      filtered = filtered.filter(ability => ability.resource_type === selectedResource);
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(ability => ability.source === selectedSource);
    }

    setFilteredAbilities(filtered);
  }, [searchQuery, selectedType, selectedClass, selectedResource, selectedSource, abilities]);

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      maneuver: 'text-red-400',
      ki_ability: 'text-blue-400',
      rage: 'text-orange-400',
      channel_divinity: 'text-yellow-400',
      feature: 'text-green-400',
      passive: 'text-gray-400',
      reaction: 'text-purple-400',
      fighting_style: 'text-cyan-400'
    };
    return colors[type] || 'text-gray-400';
  };

  const getSourceBadge = (source: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      srd: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'SRD' },
      homebrew: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Homebrew' },
      world: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'World' }
    };
    return badges[source] || badges.srd;
  };

  const getResourceIcon = (resourceType: string) => {
    if (resourceType === 'superiority_dice') return '🎲';
    if (resourceType === 'ki_points') return '⚡';
    if (resourceType === 'rage_uses') return '💢';
    if (resourceType === 'channel_divinity') return '✨';
    return '';
  };

  const formatAbilityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatResourceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleAddToCharacter = async (abilityId: string) => {
    if (!characterId) return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/abilities/characters/${characterId}/abilities?ability_id=${abilityId}&source=class`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        if (onAddToCharacter) {
          onAddToCharacter(abilityId);
        }
        alert('Ability added to character!');
      }
    } catch (error) {
      console.error('Error adding ability:', error);
      alert('Failed to add ability to character');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedClass('all');
    setSelectedResource('all');
    setSelectedSource('all');
  };

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedClass !== 'all' ? 1 : 0) +
    (selectedResource !== 'all' ? 1 : 0) +
    (selectedSource !== 'all' ? 1 : 0);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sword className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold">Ability Library</h2>
          </div>
          <div className="text-sm text-gray-400">
            {filteredAbilities.length} of {abilities.length} abilities
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search abilities by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ability Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {abilityTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : formatAbilityType(type)}
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
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>
                      {cls === 'all' ? 'All Classes' : cls.charAt(0).toUpperCase() + cls.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resource
                </label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {resourceTypes.map(resource => (
                    <option key={resource} value={resource}>
                      {resource === 'all' ? 'All Resources' : formatResourceType(resource)}
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
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
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

      {/* Ability List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading abilities...</div>
        ) : filteredAbilities.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <Sword className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No abilities found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAbilities.map(ability => (
              <div
                key={ability.id}
                onClick={() => setSelectedAbility(ability)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-red-500 cursor-pointer transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{ability.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${getTypeColor(ability.ability_type)}`}>
                        {formatAbilityType(ability.ability_type)}
                      </span>
                      {ability.subclass && (
                        <span className="text-xs text-gray-400">
                          ({ability.subclass.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${getSourceBadge(ability.source).bg} ${getSourceBadge(ability.source).text}`}>
                    {getSourceBadge(ability.source).label}
                  </span>
                </div>

                {/* Quick Info */}
                <div className="space-y-1 text-sm text-gray-400 mb-3">
                  <div className="flex gap-4 flex-wrap">
                    <span>Level {ability.level_required}+</span>
                    <span className="capitalize">{ability.action_type.replace('_', ' ')}</span>
                    {ability.resource_type !== 'none' && (
                      <span>
                        {getResourceIcon(ability.resource_type)} {ability.resource_cost}
                      </span>
                    )}
                  </div>
                  {ability.recharge_on !== 'none' && (
                    <div className="text-xs text-green-400">
                      Recharges on {ability.recharge_on.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {/* Description Preview */}
                <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                  {ability.description}
                </p>

                {/* Classes */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {ability.classes.slice(0, 3).map(cls => (
                    <span
                      key={cls}
                      className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded capitalize"
                    >
                      {cls}
                    </span>
                  ))}
                  {ability.classes.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                      +{ability.classes.length - 3}
                    </span>
                  )}
                </div>

                {/* Add Button */}
                {showAddButton && characterId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCharacter(ability.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Character
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ability Detail Modal */}
      {selectedAbility && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAbility(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{selectedAbility.name}</h2>
                  <span className={`px-2 py-1 text-xs rounded ${getSourceBadge(selectedAbility.source).bg} ${getSourceBadge(selectedAbility.source).text}`}>
                    {getSourceBadge(selectedAbility.source).label}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={getTypeColor(selectedAbility.ability_type)}>
                    {formatAbilityType(selectedAbility.ability_type)}
                  </span>
                  {selectedAbility.subclass && (
                    <span className="text-gray-400">
                      • {selectedAbility.subclass.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  )}
                  <span className="text-gray-400">• Level {selectedAbility.level_required}+</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAbility(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Action & Resource Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Action Type:</span>
                  <span className="ml-2 text-white capitalize">{selectedAbility.action_type.replace('_', ' ')}</span>
                </div>
                {selectedAbility.resource_type !== 'none' && (
                  <>
                    <div>
                      <span className="text-gray-400">Resource Cost:</span>
                      <span className="ml-2 text-white">
                        {getResourceIcon(selectedAbility.resource_type)} {selectedAbility.resource_cost} {formatResourceType(selectedAbility.resource_type)}
                      </span>
                    </div>
                    {selectedAbility.uses_per_rest && (
                      <div>
                        <span className="text-gray-400">Uses Per Rest:</span>
                        <span className="ml-2 text-white">{selectedAbility.uses_per_rest}</span>
                      </div>
                    )}
                    {selectedAbility.recharge_on !== 'none' && (
                      <div>
                        <span className="text-gray-400">Recharges:</span>
                        <span className="ml-2 text-green-400 capitalize">{selectedAbility.recharge_on.replace('_', ' ')}</span>
                      </div>
                    )}
                  </>
                )}
                {selectedAbility.range && (
                  <div>
                    <span className="text-gray-400">Range:</span>
                    <span className="ml-2 text-white">{selectedAbility.range}</span>
                  </div>
                )}
                {selectedAbility.duration && (
                  <div>
                    <span className="text-gray-400">Duration:</span>
                    <span className="ml-2 text-white">{selectedAbility.duration}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold mb-2">Description</h3>
                <p className="text-gray-300 whitespace-pre-line">{selectedAbility.description}</p>
              </div>

              {/* Enhancement Text */}
              {selectedAbility.enhancement_text && (
                <div className="p-3 bg-gray-900 rounded-lg">
                  <h3 className="font-bold mb-2">Effect</h3>
                  <p className="text-gray-300">{selectedAbility.enhancement_text}</p>
                </div>
              )}

              {/* Mechanics */}
              {(selectedAbility.damage_dice || selectedAbility.save_type || selectedAbility.attack_bonus || selectedAbility.conditions_applied.length > 0) && (
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h3 className="font-bold mb-3">Mechanics</h3>
                  <div className="space-y-2 text-sm">
                    {selectedAbility.damage_dice && (
                      <div>
                        <span className="text-gray-400">Damage:</span>
                        <span className="ml-2 text-white">
                          {selectedAbility.damage_dice} {selectedAbility.damage_type}
                        </span>
                      </div>
                    )}
                    {selectedAbility.save_type && (
                      <div>
                        <span className="text-gray-400">Saving Throw:</span>
                        <span className="ml-2 text-white capitalize">{selectedAbility.save_type}</span>
                      </div>
                    )}
                    {selectedAbility.attack_bonus && (
                      <div>
                        <span className="text-white">Adds to attack roll</span>
                      </div>
                    )}
                    {selectedAbility.conditions_applied.length > 0 && (
                      <div>
                        <span className="text-gray-400">Conditions Applied:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedAbility.conditions_applied.map(condition => (
                            <span
                              key={condition}
                              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs capitalize"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Classes */}
              <div>
                <h3 className="font-bold mb-2">Available to Classes</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAbility.classes.map(cls => (
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
              {selectedAbility.tags.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAbility.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Character Button */}
              {showAddButton && characterId && (
                <button
                  onClick={() => {
                    handleAddToCharacter(selectedAbility.id);
                    setSelectedAbility(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add to Character
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
