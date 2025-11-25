/**
 * EquipmentTab - Weapons, armor, inventory, and currency management
 */

'use client';

import { Character } from '@/lib/types/character';
import { useState } from 'react';

interface EquipmentTabProps {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
  editable: boolean;
}

export function EquipmentTab({ character, updateCharacter, editable }: EquipmentTabProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const updateCurrency = (type: 'cp' | 'sp' | 'ep' | 'gp' | 'pp', value: number) => {
    if (!editable) return;
    updateCharacter({
      currency: {
        ...character.currency,
        [type]: Math.max(0, value),
      } as any,
    });
  };

  const toggleEquipped = (itemId: string, type: 'weapon' | 'armor') => {
    if (!editable) return;

    if (type === 'weapon') {
      const updatedWeapons = character.weapons?.map(w =>
        w.name === itemId ? { ...w, equipped: !w.equipped } : w
      );
      updateCharacter({ weapons: updatedWeapons });
    } else {
      const updatedArmor = character.armor
        ? { ...character.armor, equipped: !character.armor.equipped }
        : undefined;
      updateCharacter({ armor: updatedArmor });
    }
  };

  const totalWeight = character.inventory?.reduce((sum, item) => {
    return sum + ((item.weight || 0) * item.quantity);
  }, 0) || 0;

  const strScore = character.ability_scores.str || 10;
  const carryingCapacity = strScore * 15;

  const totalValue = (currency: any) => {
    if (!currency) return 0;
    return (
      (currency.cp || 0) * 0.01 +
      (currency.sp || 0) * 0.1 +
      (currency.ep || 0) * 0.5 +
      (currency.gp || 0) +
      (currency.pp || 0) * 10
    );
  };

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div>
        <h2 className="text-xl font-bold mb-4">Currency</h2>
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
          <div className="grid grid-cols-5 gap-3 mb-3">
            {[
              { key: 'cp', label: 'CP', color: 'text-orange-700' },
              { key: 'sp', label: 'SP', color: 'text-gray-500' },
              { key: 'ep', label: 'EP', color: 'text-gray-400' },
              { key: 'gp', label: 'GP', color: 'text-yellow-600' },
              { key: 'pp', label: 'PP', color: 'text-gray-300' },
            ].map(({ key, label, color }) => (
              <div key={key} className="text-center">
                <div className={`text-xs font-medium ${color} mb-1`}>{label}</div>
                {editable ? (
                  <input
                    type="number"
                    value={character.currency?.[key as keyof typeof character.currency] || 0}
                    onChange={(e) => updateCurrency(key as any, parseInt(e.target.value) || 0)}
                    className="w-full text-center py-2 border border-gray-300 rounded font-bold"
                    min="0"
                  />
                ) : (
                  <div className="py-2 font-bold">
                    {character.currency?.[key as keyof typeof character.currency] || 0}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600 pt-2 border-t border-yellow-200">
            Total Value: <span className="font-bold">{totalValue(character.currency).toFixed(2)} gp</span>
          </div>
        </div>
      </div>

      {/* Weapons */}
      <div>
        <h2 className="text-xl font-bold mb-4">Weapons</h2>
        {!character.weapons || character.weapons.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            No weapons equipped
          </div>
        ) : (
          <div className="space-y-2">
            {character.weapons.map((weapon, index) => (
              <div
                key={weapon.name + index}
                className={`bg-white border-2 rounded-lg p-4 transition-all ${
                  weapon.equipped ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {editable && (
                      <input
                        type="checkbox"
                        checked={weapon.equipped || false}
                        onChange={() => toggleEquipped(weapon.name, 'weapon')}
                        className="mt-1 w-5 h-5 text-blue-600 rounded"
                        title="Equipped"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{weapon.name}</h3>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span className="font-medium">{weapon.damage}</span>
                        <span>{weapon.damage_type}</span>
                      </div>
                      {weapon.properties && weapon.properties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {weapon.properties.map((prop) => (
                            <span
                              key={prop}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {prop}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {weapon.equipped && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      Equipped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {editable && (
          <button
            className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400"
            onClick={() => alert('Add weapon feature coming soon!')}
          >
            + Add Weapon
          </button>
        )}
      </div>

      {/* Armor */}
      <div>
        <h2 className="text-xl font-bold mb-4">Armor</h2>
        {!character.armor ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            No armor equipped
          </div>
        ) : (
          <div
            className={`bg-white border-2 rounded-lg p-4 ${
              character.armor.equipped ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {editable && (
                  <input
                    type="checkbox"
                    checked={character.armor.equipped || false}
                    onChange={() => toggleEquipped(character.armor!.name, 'armor')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded"
                    title="Equipped"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{character.armor.name}</h3>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span className="font-medium">AC {character.armor.ac}</span>
                    <span>{character.armor.type}</span>
                  </div>
                </div>
              </div>
              {character.armor.equipped && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Equipped</span>
              )}
            </div>
          </div>
        )}
        {editable && (
          <button
            className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400"
            onClick={() => alert('Add armor feature coming soon!')}
          >
            + Add Armor
          </button>
        )}
      </div>

      {/* Inventory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Inventory</h2>
          <div className="text-sm text-gray-600">
            <span className={totalWeight > carryingCapacity ? 'text-red-600 font-bold' : ''}>
              {totalWeight.toFixed(1)} / {carryingCapacity} lbs
            </span>
          </div>
        </div>

        {!character.inventory || character.inventory.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
            Inventory is empty
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y">
            {character.inventory.map((item, index) => (
              <div
                key={item.name + index}
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedItem(expandedItem === item.name + index ? null : item.name + index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        x{item.quantity}
                      </span>
                    </div>
                    {expandedItem === item.name + index && item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                  </div>
                  {item.weight && (
                    <span className="text-sm text-gray-500 ml-2">
                      {(item.weight * item.quantity).toFixed(1)} lb
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editable && (
          <button
            className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400"
            onClick={() => alert('Add item feature coming soon!')}
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Attunement */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-purple-900">Attunement Slots</h3>
            <p className="text-sm text-purple-700">Magical items requiring attunement</p>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {character.attunement_slots_used || 0} / 3
          </div>
        </div>
      </div>
    </div>
  );
}
