import React from 'react';

interface Item {
  id: string;
  name: string;
  equipment_slot?: string;
  is_equipped: boolean;
  damage_dice?: string;
  damage_type?: string;
  armor_class?: number;
  armor_type?: string;
  is_magical: boolean;
  is_attuned: boolean;
}

interface EquipmentSlotsProps {
  items: Item[];
  onSlotClick: (slot: string) => void;
}

const slots = [
  { key: 'head', label: 'Head', icon: '👑' },
  { key: 'neck', label: 'Neck', icon: '📿' },
  { key: 'chest', label: 'Chest', icon: '🎽' },
  { key: 'back', label: 'Back', icon: '🧥' },
  { key: 'hands', label: 'Hands', icon: '🧤' },
  { key: 'waist', label: 'Waist', icon: '🔗' },
  { key: 'feet', label: 'Feet', icon: '👢' },
  { key: 'main_hand', label: 'Main Hand', icon: '⚔️' },
  { key: 'off_hand', label: 'Off Hand', icon: '🛡️' },
  { key: 'two_hand', label: 'Two-Handed', icon: '⚔️⚔️' },
  { key: 'ring_1', label: 'Ring 1', icon: '💍' },
  { key: 'ring_2', label: 'Ring 2', icon: '💍' },
];

export default function EquipmentSlots({ items, onSlotClick }: EquipmentSlotsProps) {
  const getItemInSlot = (slotKey: string) => {
    return items.find((item) => item.equipment_slot === slotKey && item.is_equipped);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Equipment Slots</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slots.map((slot) => {
          const equippedItem = getItemInSlot(slot.key);

          return (
            <div
              key={slot.key}
              onClick={() => onSlotClick(slot.key)}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200 hover:shadow-lg hover:-translate-y-1
                ${
                  equippedItem
                    ? 'bg-gray-800 border-green-500'
                    : 'bg-gray-800/50 border-gray-700 border-dashed'
                }
              `}
            >
              {/* Slot Icon */}
              <div className="text-4xl text-center mb-2">{slot.icon}</div>

              {/* Slot Label */}
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">{slot.label}</p>
                {equippedItem ? (
                  <>
                    <p className="text-sm font-semibold text-white truncate">
                      {equippedItem.name}
                    </p>
                    {equippedItem.damage_dice && (
                      <p className="text-xs text-gray-400">
                        {equippedItem.damage_dice} {equippedItem.damage_type}
                      </p>
                    )}
                    {equippedItem.armor_class !== null &&
                      equippedItem.armor_class !== undefined && (
                        <p className="text-xs text-gray-400">AC {equippedItem.armor_class}</p>
                      )}
                    {equippedItem.is_magical && (
                      <span className="inline-block mt-1 text-xs text-blue-400">✨</span>
                    )}
                    {equippedItem.is_attuned && (
                      <span className="inline-block mt-1 text-xs text-purple-400 ml-1">
                        🔮
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-600">Empty</p>
                )}
              </div>

              {/* Equipped Indicator */}
              {equippedItem && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Attunement Slots */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Attunement Slots</h3>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((slotNum) => {
            const attunedItems = items.filter((item) => item.is_attuned);
            const attunedItem = attunedItems[slotNum - 1];

            return (
              <div
                key={slotNum}
                className={`
                  p-4 rounded-lg border-2 text-center
                  ${
                    attunedItem
                      ? 'bg-purple-900/30 border-purple-500'
                      : 'bg-gray-800/50 border-gray-700 border-dashed'
                  }
                `}
              >
                <div className="text-3xl mb-2">🔮</div>
                <p className="text-xs text-gray-400 mb-1">Slot {slotNum}</p>
                {attunedItem ? (
                  <p className="text-sm font-semibold text-white truncate">
                    {attunedItem.name}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">Empty</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          You can attune to a maximum of 3 magic items at once
        </p>
      </div>
    </div>
  );
}
