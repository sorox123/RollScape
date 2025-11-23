'use client';

import React, { useState } from 'react';
import { Sparkles, X, Plus, Trash2 } from 'lucide-react';

interface SpellCreatorProps {
  campaignId?: string;
  onSpellCreated?: (spell: any) => void;
  onClose?: () => void;
}

export default function SpellCreator({
  campaignId,
  onSpellCreated,
  onClose
}: SpellCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    level: 0,
    school: 'evocation',
    casting_time: '1 action',
    range: '30 feet',
    components: [] as string[],
    material_components: '',
    duration: 'Instantaneous',
    concentration: false,
    ritual: false,
    description: '',
    at_higher_levels: '',
    damage_dice: '',
    damage_type: '',
    save_type: '',
    spell_attack: false,
    classes: [] as string[],
    tags: [] as string[],
    is_public: false
  });

  const [currentClass, setCurrentClass] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const schools = [
    'abjuration',
    'conjuration',
    'divination',
    'enchantment',
    'evocation',
    'illusion',
    'necromancy',
    'transmutation'
  ];

  const availableClasses = [
    'bard',
    'cleric',
    'druid',
    'paladin',
    'ranger',
    'sorcerer',
    'warlock',
    'wizard'
  ];

  const componentOptions = ['V', 'S', 'M'];

  const damageTypes = [
    'acid',
    'bludgeoning',
    'cold',
    'fire',
    'force',
    'lightning',
    'necrotic',
    'piercing',
    'poison',
    'psychic',
    'radiant',
    'slashing',
    'thunder'
  ];

  const saveTypes = [
    '',
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma'
  ];

  const handleComponentToggle = (component: string) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.includes(component)
        ? prev.components.filter(c => c !== component)
        : [...prev.components, component]
    }));
  };

  const handleAddClass = () => {
    if (currentClass && !formData.classes.includes(currentClass)) {
      setFormData(prev => ({
        ...prev,
        classes: [...prev.classes, currentClass]
      }));
      setCurrentClass('');
    }
  };

  const handleRemoveClass = (cls: string) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c !== cls)
    }));
  };

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.classes.length === 0) {
      alert('Please fill in at least the spell name and classes');
      return;
    }

    setSubmitting(true);

    try {
      const url = campaignId
        ? `http://localhost:8000/api/spells/campaigns/${campaignId}/spells`
        : 'http://localhost:8000/api/spells/';

      const payload = {
        ...formData,
        save_type: formData.save_type || undefined,
        damage_type: formData.damage_type || undefined,
        damage_dice: formData.damage_dice || undefined,
        material_components: formData.material_components || undefined,
        at_higher_levels: formData.at_higher_levels || undefined
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const spell = await response.json();
        if (onSpellCreated) {
          onSpellCreated(spell);
        }
        alert('Spell created successfully!');
        if (onClose) {
          onClose();
        }
      } else {
        const error = await response.json();
        alert(`Failed to create spell: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating spell:', error);
      alert('Failed to create spell');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Create Homebrew Spell</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spell Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="e.g., Arcane Explosion"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Level
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value={0}>Cantrip</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              School of Magic
            </label>
            <select
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white capitalize"
            >
              {schools.map(school => (
                <option key={school} value={school} className="capitalize">
                  {school}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Casting Time
            </label>
            <input
              type="text"
              value={formData.casting_time}
              onChange={(e) => setFormData({ ...formData, casting_time: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="e.g., 1 action, 1 bonus action"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Range
            </label>
            <input
              type="text"
              value={formData.range}
              onChange={(e) => setFormData({ ...formData, range: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="e.g., Self, 30 feet, Touch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="e.g., Instantaneous, 1 minute"
            />
          </div>
        </div>

        {/* Components */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Components
          </label>
          <div className="flex gap-4 mb-2">
            {componentOptions.map(component => (
              <label key={component} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.components.includes(component)}
                  onChange={() => handleComponentToggle(component)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-white">
                  {component === 'V' ? 'Verbal' : component === 'S' ? 'Somatic' : 'Material'}
                </span>
              </label>
            ))}
          </div>
          {formData.components.includes('M') && (
            <input
              type="text"
              value={formData.material_components}
              onChange={(e) => setFormData({ ...formData, material_components: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="Describe material components..."
            />
          )}
        </div>

        {/* Flags */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.concentration}
              onChange={(e) => setFormData({ ...formData, concentration: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white">Concentration</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.ritual}
              onChange={(e) => setFormData({ ...formData, ritual: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white">Ritual</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.spell_attack}
              onChange={(e) => setFormData({ ...formData, spell_attack: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white">Spell Attack</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white">Public (Share with community)</span>
          </label>
        </div>

        {/* Damage & Saves */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Damage Dice
            </label>
            <input
              type="text"
              value={formData.damage_dice}
              onChange={(e) => setFormData({ ...formData, damage_dice: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="e.g., 3d6, 1d10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Damage Type
            </label>
            <select
              value={formData.damage_type}
              onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white capitalize"
            >
              <option value="">None</option>
              {damageTypes.map(type => (
                <option key={type} value={type} className="capitalize">
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Saving Throw
            </label>
            <select
              value={formData.save_type}
              onChange={(e) => setFormData({ ...formData, save_type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white capitalize"
            >
              <option value="">None</option>
              {saveTypes.filter(t => t).map(type => (
                <option key={type} value={type} className="capitalize">
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
            rows={4}
            placeholder="Describe what the spell does..."
            required
          />
        </div>

        {/* At Higher Levels */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            At Higher Levels (Optional)
          </label>
          <textarea
            value={formData.at_higher_levels}
            onChange={(e) => setFormData({ ...formData, at_higher_levels: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
            rows={2}
            placeholder="Describe what happens when cast at higher spell slot levels..."
          />
        </div>

        {/* Classes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Available to Classes <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 mb-2">
            <select
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white capitalize"
            >
              <option value="">Select a class...</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls} className="capitalize">
                  {cls}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddClass}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.classes.map(cls => (
              <span
                key={cls}
                className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center gap-2 capitalize"
              >
                {cls}
                <button
                  type="button"
                  onClick={() => handleRemoveClass(cls)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (Optional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="e.g., damage, utility, control..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>Creating...</>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Spell
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
