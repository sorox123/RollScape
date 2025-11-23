'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import InventoryGrid from '@/components/inventory/InventoryGrid';
import EquipmentSlots from '@/components/inventory/EquipmentSlots';

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
  character_id: string;
  notes: string;
}

interface NewItemForm {
  name: string;
  description: string;
  item_type: string;
  rarity: string;
  weight: number;
  value: number;
  quantity: number;
  equippable: boolean;
  equipment_slot?: string;
  damage_dice?: string;
  damage_type?: string;
  armor_class?: number;
  armor_type?: string;
  is_magical: boolean;
  requires_attunement: boolean;
  properties: string[];
  notes: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [characterId] = useState('sample-character-id'); // Replace with actual character ID

  const [newItem, setNewItem] = useState<NewItemForm>({
    name: '',
    description: '',
    item_type: 'gear',
    rarity: 'common',
    weight: 0,
    value: 0,
    quantity: 1,
    equippable: false,
    is_magical: false,
    requires_attunement: false,
    properties: [],
    notes: '',
  });

  // Load sample items on mount
  useEffect(() => {
    loadSampleItems();
  }, []);

  const loadSampleItems = () => {
    const sampleItems: Item[] = [
      {
        id: '1',
        name: 'Longsword',
        description: 'A versatile blade',
        item_type: 'weapon',
        rarity: 'common',
        weight: 3,
        value: 15,
        quantity: 1,
        equippable: true,
        equipment_slot: 'main_hand',
        is_equipped: true,
        damage_dice: '1d8',
        damage_type: 'slashing',
        is_magical: false,
        requires_attunement: false,
        is_attuned: false,
        properties: ['Versatile (1d10)'],
        character_id: characterId,
        notes: '',
      },
      {
        id: '2',
        name: 'Shield',
        description: 'A sturdy wooden shield',
        item_type: 'armor',
        rarity: 'common',
        weight: 6,
        value: 10,
        quantity: 1,
        equippable: true,
        equipment_slot: 'off_hand',
        is_equipped: true,
        armor_class: 2,
        armor_type: 'shield',
        is_magical: false,
        requires_attunement: false,
        is_attuned: false,
        properties: [],
        character_id: characterId,
        notes: '',
      },
      {
        id: '3',
        name: 'Potion of Healing',
        description: 'Heals 2d4+2 HP',
        item_type: 'potion',
        rarity: 'common',
        weight: 0.5,
        value: 50,
        quantity: 3,
        equippable: false,
        is_equipped: false,
        is_magical: true,
        requires_attunement: false,
        is_attuned: false,
        properties: ['Consumable'],
        character_id: characterId,
        notes: '',
      },
      {
        id: '4',
        name: 'Ring of Protection',
        description: '+1 bonus to AC and saving throws',
        item_type: 'wondrous',
        rarity: 'rare',
        weight: 0,
        value: 3500,
        quantity: 1,
        equippable: true,
        equipment_slot: 'ring_1',
        is_equipped: true,
        is_magical: true,
        requires_attunement: true,
        is_attuned: true,
        properties: ['+1 AC', '+1 Saves'],
        character_id: characterId,
        notes: 'Found in the dragon\'s hoard',
      },
      {
        id: '5',
        name: 'Backpack',
        description: 'A leather backpack',
        item_type: 'gear',
        rarity: 'common',
        weight: 5,
        value: 2,
        quantity: 1,
        equippable: false,
        is_equipped: false,
        is_magical: false,
        requires_attunement: false,
        is_attuned: false,
        properties: [],
        character_id: characterId,
        notes: '',
      },
      {
        id: '6',
        name: 'Gold Pieces',
        description: 'Currency',
        item_type: 'treasure',
        rarity: 'common',
        weight: 0.02,
        value: 1,
        quantity: 250,
        equippable: false,
        is_equipped: false,
        is_magical: false,
        requires_attunement: false,
        is_attuned: false,
        properties: [],
        character_id: characterId,
        notes: '',
      },
    ];

    setItems(sampleItems);
    setLoading(false);
  };

  const handleEquip = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          // Unequip items in same slot
          const updatedItems = prevItems.map((i) =>
            i.equipment_slot === item.equipment_slot && i.is_equipped
              ? { ...i, is_equipped: false }
              : i
          );
          toast.success(`Equipped ${item.name}`);
          return { ...item, is_equipped: true };
        }
        return item;
      })
    );
  };

  const handleUnequip = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          toast.success(`Unequipped ${item.name}`);
          return { ...item, is_equipped: false };
        }
        return item;
      })
    );
  };

  const handleAttune = (itemId: string) => {
    const attunedCount = items.filter((i) => i.is_attuned).length;
    if (attunedCount >= 3) {
      toast.error('Maximum attunement slots (3) reached');
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          toast.success(`Attuned to ${item.name}`);
          return { ...item, is_attuned: true };
        }
        return item;
      })
    );
  };

  const handleUnattune = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          toast.success(`Broke attunement with ${item.name}`);
          return { ...item, is_attuned: false };
        }
        return item;
      })
    );
  };

  const handleDelete = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
    toast.success(`Deleted ${item?.name}`);
  };

  const handleUpdate = (itemId: string, updates: Partial<Item>) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  const handleAddItem = () => {
    const item: Item = {
      id: Date.now().toString(),
      ...newItem,
      character_id: characterId,
    };

    setItems((prevItems) => [...prevItems, item]);
    toast.success(`Added ${item.name} to inventory`);
    setShowAddForm(false);
    setNewItem({
      name: '',
      description: '',
      item_type: 'gear',
      rarity: 'common',
      weight: 0,
      value: 0,
      quantity: 1,
      equippable: false,
      is_magical: false,
      requires_attunement: false,
      properties: [],
      notes: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Character Inventory</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            {showAddForm ? 'Cancel' : '+ Add Item'}
          </button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Add New Item</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
              <select
                value={newItem.item_type}
                onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="potion">Potion</option>
                <option value="scroll">Scroll</option>
                <option value="wondrous">Wondrous</option>
                <option value="tool">Tool</option>
                <option value="gear">Gear</option>
                <option value="treasure">Treasure</option>
              </select>
              <input
                type="number"
                placeholder="Weight (lbs)"
                value={newItem.weight}
                onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) })}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
              <input
                type="number"
                placeholder="Value (gp)"
                value={newItem.value}
                onChange={(e) => setNewItem({ ...newItem, value: parseInt(e.target.value) })}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="col-span-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                rows={3}
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={!newItem.name}
              className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded transition-colors"
            >
              Add Item
            </button>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inventory Grid (2/3) */}
          <div className="lg:col-span-2">
            <InventoryGrid
              characterId={characterId}
              items={items}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              onAttune={handleAttune}
              onUnattune={handleUnattune}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          </div>

          {/* Equipment Slots (1/3) */}
          <div>
            <EquipmentSlots items={items} onSlotClick={(slot) => console.log('Clicked', slot)} />
          </div>
        </div>
      </div>
    </div>
  );
}
