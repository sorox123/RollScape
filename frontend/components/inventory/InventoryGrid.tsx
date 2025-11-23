import React, { useState } from 'react';

interface Item {
  id: string;
  name: string;
  description: string;
  item_type: string;
  rarity: string;
  weight: number;
  value: number;
  quantity: number;
  equippable: boolean;
  equipment_slot?: string;
  is_equipped: boolean;
  damage_dice?: string;
  damage_type?: string;
  armor_class?: number;
  armor_type?: string;
  is_magical: boolean;
  requires_attunement: boolean;
  is_attuned: boolean;
  properties: string[];
  notes: string;
}

interface InventoryGridProps {
  characterId: string;
  items: Item[];
  onEquip: (itemId: string) => void;
  onUnequip: (itemId: string) => void;
  onAttune: (itemId: string) => void;
  onUnattune: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Item>) => void;
}

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 border-gray-400',
  uncommon: 'text-green-400 border-green-400',
  rare: 'text-blue-400 border-blue-400',
  very_rare: 'text-purple-400 border-purple-400',
  legendary: 'text-orange-400 border-orange-400',
  artifact: 'text-red-400 border-red-400',
};

const typeIcons: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  potion: '🧪',
  scroll: '📜',
  wondrous: '✨',
  tool: '🔧',
  gear: '🎒',
  treasure: '💎',
  consumable: '🍎',
};

export default function InventoryGrid({
  characterId,
  items,
  onEquip,
  onUnequip,
  onAttune,
  onUnattune,
  onDelete,
  onUpdate,
}: InventoryGridProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'value' | 'weight'>('name');

  // Filter items
  const filteredItems = items.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'equipped') return item.is_equipped;
    if (filterType === 'magical') return item.is_magical;
    return item.item_type === filterType;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.item_type.localeCompare(b.item_type);
      case 'value':
        return b.value - a.value;
      case 'weight':
        return b.weight - a.weight;
      default:
        return 0;
    }
  });

  // Calculate totals
  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Inventory</h2>
          <div className="text-sm text-gray-400">
            <span className="mr-4">Weight: {totalWeight.toFixed(1)} lbs</span>
            <span>Value: {totalValue} gp</span>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="equipped">Equipped</option>
            <option value="magical">Magical</option>
            <option value="weapon">Weapons</option>
            <option value="armor">Armor</option>
            <option value="potion">Potions</option>
            <option value="scroll">Scrolls</option>
            <option value="gear">Gear</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="value">Sort by Value</option>
            <option value="weight">Sort by Weight</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedItems.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl mb-2">No items found</p>
            <p className="text-sm">Your inventory is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`
                  p-4 bg-gray-800 rounded-lg border-2 cursor-pointer
                  transition-all duration-200 hover:shadow-lg hover:-translate-y-1
                  ${selectedItem?.id === item.id ? 'border-blue-500' : 'border-gray-700'}
                  ${item.is_equipped ? 'ring-2 ring-green-500' : ''}
                  ${rarityColors[item.rarity]}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeIcons[item.item_type] || '📦'}</span>
                    <div>
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">
                        {item.rarity.replace('_', ' ')} {item.item_type}
                      </p>
                    </div>
                  </div>
                  {item.quantity > 1 && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-white">
                      x{item.quantity}
                    </span>
                  )}
                </div>

                {/* Item Stats */}
                <div className="text-sm text-gray-300 space-y-1">
                  {item.damage_dice && (
                    <p>⚔️ {item.damage_dice} {item.damage_type}</p>
                  )}
                  {item.armor_class !== null && item.armor_class !== undefined && (
                    <p>🛡️ AC {item.armor_class}</p>
                  )}
                  {item.weight > 0 && (
                    <p>⚖️ {item.weight} lbs</p>
                  )}
                  {item.value > 0 && (
                    <p>💰 {item.value} gp</p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.is_equipped && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      Equipped
                    </span>
                  )}
                  {item.is_attuned && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                      Attuned
                    </span>
                  )}
                  {item.is_magical && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                      ✨ Magical
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Details Panel */}
      {selectedItem && (
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
              <p className="text-sm text-gray-400 capitalize">
                {selectedItem.rarity.replace('_', ' ')} {selectedItem.item_type}
              </p>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {selectedItem.description && (
            <p className="text-sm text-gray-300 mb-4">{selectedItem.description}</p>
          )}

          {/* Properties */}
          {selectedItem.properties.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Properties:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedItem.properties.map((prop, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {selectedItem.equippable && !selectedItem.is_equipped && (
              <button
                onClick={() => onEquip(selectedItem.id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Equip
              </button>
            )}
            {selectedItem.is_equipped && (
              <button
                onClick={() => onUnequip(selectedItem.id)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
              >
                Unequip
              </button>
            )}
            {selectedItem.requires_attunement && !selectedItem.is_attuned && (
              <button
                onClick={() => onAttune(selectedItem.id)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Attune
              </button>
            )}
            {selectedItem.is_attuned && (
              <button
                onClick={() => onUnattune(selectedItem.id)}
                className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded transition-colors"
              >
                Break Attunement
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(`Delete ${selectedItem.name}?`)) {
                  onDelete(selectedItem.id);
                  setSelectedItem(null);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
