'use client';

import React, { useState } from 'react';
import { Sword, X, Plus } from 'lucide-react';

interface AbilityCreatorProps {
  campaignId?: string;
  onAbilityCreated?: (ability: any) => void;
  onClose?: () => void;
}

export default function AbilityCreator({
  campaignId,
  onAbilityCreated,
  onClose
}: AbilityCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ability_type: 'feature',
    classes: [] as string[],
    subclass: '',
    level_required: 1,
    resource_type: 'none',
    resource_cost: 0,
    uses_per_rest: undefined as number | undefined,
    recharge_on: 'none',
    action_type: 'action',
    damage_dice: '',
    damage_type: '',
    save_type: '',
    attack_bonus: false,
    duration: '',
    range: '',
    conditions_applied: [] as string[],
    enhancement_text: '',
    tags: [] as string[],
    is_public: false
  });

  const [currentClass, setCurrentClass] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [currentCondition, setCurrentCondition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const abilityTypes = [
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

  const availableClasses = [
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
    'none',
    'superiority_dice',
    'ki_points',
    'rage_uses',
    'channel_divinity',
    'uses_per_short_rest',
    'uses_per_long_rest',
    'daily'
  ];

  const actionTypes = [
    'action',
    'bonus_action',
    'reaction',
    'free',
    'passive'
  ];

  const rechargeOptions = [
    'none',
    'short_rest',
    'long_rest'
  ];

  const damageTypes = [
    '',
    'weapon',
    'bludgeoning',
    'piercing',
    'slashing',
    'acid',
    'cold',
    'fire',
    'force',
    'lightning',
    'necrotic',
    'poison',
    'psychic',
    'radiant',
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

  const commonConditions = [
    'blinded',
    'charmed',
    'deafened',
    'frightened',
    'grappled',
    'incapacitated',
    'invisible',
    'paralyzed',
    'petrified',
    'poisoned',
    'prone',
    'restrained',
    'stunned',
    'unconscious'
  ];

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

  const handleAddCondition = () => {
    if (currentCondition && !formData.conditions_applied.includes(currentCondition)) {
      setFormData(prev => ({
        ...prev,
        conditions_applied: [...prev.conditions_applied, currentCondition]
      }));
      setCurrentCondition('');
    }
  };

  const handleRemoveCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      conditions_applied: prev.conditions_applied.filter(c => c !== condition)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.classes.length === 0) {
      alert('Please fill in at least the ability name and classes');
      return;
    }

    setSubmitting(true);

    try {
      const url = campaignId
        ? `http://localhost:8000/api/abilities/campaigns/${campaignId}/abilities`
        : 'http://localhost:8000/api/abilities/';

      const payload = {
        ...formData,
        subclass: formData.subclass || undefined,
        damage_dice: formData.damage_dice || undefined,
        damage_type: formData.damage_type || undefined,
        save_type: formData.save_type || undefined,
        duration: formData.duration || undefined,
        range: formData.range || undefined,
        enhancement_text: formData.enhancement_text || undefined,
        uses_per_rest: formData.uses_per_rest || undefined
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const ability = await response.json();
        if (onAbilityCreated) {
          onAbilityCreated(ability);
        }
        alert('Ability created successfully!');
        if (onClose) {
          onClose();
        }
      } else {
        const error = await response.json();
        alert(`Failed to create ability: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating ability:', error);
      alert('Failed to create ability');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sword className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Create Homebrew Ability</h2>
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
              Ability Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
              placeholder="e.g., Whirlwind Strike"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ability Type
            </label>
            <select
              value={formData.ability_type}
              onChange={(e) => setFormData({ ...formData, ability_type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
            >
              {abilityTypes.map(type => (
                <option key={type} value={type} className="capitalize">
                  {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Level Required
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.level_required}
              onChange={(e) => setFormData({ ...formData, level_required: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Action Type
            </label>
            <select
              value={formData.action_type}
              onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
            >
              {actionTypes.map(type => (
                <option key={type} value={type} className="capitalize">
                  {type.split('_').join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subclass (Optional)
            </label>
            <input
              type="text"
              value={formData.subclass}
              onChange={(e) => setFormData({ ...formData, subclass: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
              placeholder="e.g., battle_master"
            />
          </div>
        </div>

        {/* Resource Management */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-semibold mb-4">Resource Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resource Type
              </label>
              <select
                value={formData.resource_type}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
              >
                {resourceTypes.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type.split('_').join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {formData.resource_type !== 'none' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Resource Cost
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.resource_cost}
                    onChange={(e) => setFormData({ ...formData, resource_cost: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Uses Per Rest
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.uses_per_rest || ''}
                    onChange={(e) => setFormData({ ...formData, uses_per_rest: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recharge On
                  </label>
                  <select
                    value={formData.recharge_on}
                    onChange={(e) => setFormData({ ...formData, recharge_on: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
                  >
                    {rechargeOptions.map(option => (
                      <option key={option} value={option} className="capitalize">
                        {option.split('_').join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mechanics */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-semibold mb-4">Mechanics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Damage Dice
              </label>
              <input
                type="text"
                value={formData.damage_dice}
                onChange={(e) => setFormData({ ...formData, damage_dice: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                placeholder="e.g., 1d8, 2d6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Damage Type
              </label>
              <select
                value={formData.damage_type}
                onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
              >
                {damageTypes.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type || 'None'}
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
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
              >
                {saveTypes.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type || 'None'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Range
              </label>
              <input
                type="text"
                value={formData.range}
                onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                placeholder="e.g., Self, 30 feet"
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
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                placeholder="e.g., 1 minute, Instantaneous"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={formData.attack_bonus}
              onChange={(e) => setFormData({ ...formData, attack_bonus: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-500"
            />
            <label className="text-white">Adds to attack roll</label>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conditions Applied
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={currentCondition}
                onChange={(e) => setCurrentCondition(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
              >
                <option value="">Select condition...</option>
                {commonConditions.map(cond => (
                  <option key={cond} value={cond} className="capitalize">
                    {cond}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCondition}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.conditions_applied.map(condition => (
                <span
                  key={condition}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-2 capitalize"
                >
                  {condition}
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(condition)}
                    className="hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
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
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
            rows={4}
            placeholder="Describe what the ability does..."
            required
          />
        </div>

        {/* Enhancement Text */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enhancement/Effect Summary (Optional)
          </label>
          <input
            type="text"
            value={formData.enhancement_text}
            onChange={(e) => setFormData({ ...formData, enhancement_text: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
            placeholder="e.g., +5 AC for 1 round"
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
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white capitalize"
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
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
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
              placeholder="e.g., damage, control, defense..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Public Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-500"
          />
          <label className="text-white">Public (Share with community)</label>
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
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>Creating...</>
            ) : (
              <>
                <Sword className="w-5 h-5" />
                Create Ability
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
