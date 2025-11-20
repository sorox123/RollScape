import { useState } from 'react'
import { Package, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { Character, Equipment } from '@/lib/types/character'

interface EquipmentListProps {
  character: Character
  isEditing: boolean
  onSave: (updates: Partial<Character>) => void
}

export default function EquipmentList({ character, isEditing, onSave }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>(character.equipment || [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Partial<Equipment> | null>(null)

  function handleSave() {
    onSave({ equipment })
  }

  function addItem() {
    setNewItem({
      id: `temp-${Date.now()}`,
      name: '',
      type: 'other',
      quantity: 1,
      weight: 0,
      equipped: false,
    })
  }

  function saveNewItem() {
    if (!newItem || !newItem.name) return
    setEquipment([...equipment, newItem as Equipment])
    setNewItem(null)
  }

  function updateItem(id: string, updates: Partial<Equipment>) {
    setEquipment(equipment.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  function deleteItem(id: string) {
    setEquipment(equipment.filter(item => item.id !== id))
  }

  function toggleEquipped(id: string) {
    setEquipment(equipment.map(item =>
      item.id === id ? { ...item, equipped: !item.equipped } : item
    ))
  }

  const equippedItems = equipment.filter(item => item.equipped)
  const inventoryItems = equipment.filter(item => !item.equipped)
  const totalWeight = equipment.reduce((sum, item) => sum + (item.weight * item.quantity), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Equipment & Inventory</h2>
          <p className="text-sm text-gray-400 mt-1">
            Total Weight: <span className="font-semibold">{totalWeight.toFixed(1)} lbs</span>
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <>
              <button
                onClick={addItem}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Equipped Items */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Equipped</h3>
        </div>

        {equippedItems.length === 0 ? (
          <p className="text-gray-400 text-sm">No items equipped</p>
        ) : (
          <div className="space-y-2">
            {equippedItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isEditing={isEditing}
                editingId={editingId}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onToggleEquipped={toggleEquipped}
                onStartEdit={setEditingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inventory */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Inventory</h3>
        </div>

        {inventoryItems.length === 0 ? (
          <p className="text-gray-400 text-sm">Inventory is empty</p>
        ) : (
          <div className="space-y-2">
            {inventoryItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isEditing={isEditing}
                editingId={editingId}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onToggleEquipped={toggleEquipped}
                onStartEdit={setEditingId}
              />
            ))}
          </div>
        )}

        {/* New Item Form */}
        {newItem && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              <input
                type="text"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="col-span-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded"
              />
              <input
                type="number"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="px-3 py-2 bg-gray-600 border border-gray-500 rounded"
                min="1"
              />
              <input
                type="number"
                placeholder="Weight"
                value={newItem.weight}
                onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 bg-gray-600 border border-gray-500 rounded"
                step="0.1"
              />
            </div>
            <textarea
              placeholder="Description (optional)"
              value={newItem.description || ''}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded mb-2"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={saveNewItem}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded flex items-center gap-1 transition"
              >
                <Check className="w-4 h-4" />
                Add
              </button>
              <button
                onClick={() => setNewItem(null)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded flex items-center gap-1 transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ItemRowProps {
  item: Equipment
  isEditing: boolean
  editingId: string | null
  onUpdate: (id: string, updates: Partial<Equipment>) => void
  onDelete: (id: string) => void
  onToggleEquipped: (id: string) => void
  onStartEdit: (id: string | null) => void
}

function ItemRow({ item, isEditing, editingId, onUpdate, onDelete, onToggleEquipped, onStartEdit }: ItemRowProps) {
  const [localItem, setLocalItem] = useState(item)
  const isLocalEditing = editingId === item.id

  function saveEdit() {
    onUpdate(item.id, localItem)
    onStartEdit(null)
  }

  function cancelEdit() {
    setLocalItem(item)
    onStartEdit(null)
  }

  if (isLocalEditing) {
    return (
      <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          <input
            type="text"
            value={localItem.name}
            onChange={(e) => setLocalItem({ ...localItem, name: e.target.value })}
            className="col-span-2 px-2 py-1 bg-gray-600 border border-gray-500 rounded"
          />
          <input
            type="number"
            value={localItem.quantity}
            onChange={(e) => setLocalItem({ ...localItem, quantity: parseInt(e.target.value) || 1 })}
            className="px-2 py-1 bg-gray-600 border border-gray-500 rounded"
            min="1"
          />
          <input
            type="number"
            value={localItem.weight}
            onChange={(e) => setLocalItem({ ...localItem, weight: parseFloat(e.target.value) || 0 })}
            className="px-2 py-1 bg-gray-600 border border-gray-500 rounded"
            step="0.1"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveEdit}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-1 transition"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={cancelEdit}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-lg ${item.equipped ? 'bg-blue-900/30 border border-blue-700' : 'bg-gray-700'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{item.name}</h4>
            <span className="text-sm text-gray-400">×{item.quantity}</span>
            {item.weight > 0 && (
              <span className="text-sm text-gray-400">
                ({(item.weight * item.quantity).toFixed(1)} lbs)
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-gray-400">{item.description}</p>
          )}
          {item.damage && (
            <p className="text-sm text-red-400 mt-1">Damage: {item.damage}</p>
          )}
          {item.ac && (
            <p className="text-sm text-blue-400 mt-1">AC: {item.ac}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => onToggleEquipped(item.id)}
              className={`px-3 py-1 rounded text-sm transition ${
                item.equipped
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {item.equipped ? 'Unequip' : 'Equip'}
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={() => onStartEdit(item.id)}
                className="p-1 hover:bg-gray-600 rounded transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 hover:bg-red-600 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
