import { useState } from 'react'
import { Heart, Shield, Zap, Footprints, Plus, Minus } from 'lucide-react'
import { Character } from '@/lib/types/character'
import { apiCharacters } from '@/lib/api'

interface CombatStatsProps {
  character: Character
  isEditing: boolean
  onSave: (updates: Partial<Character>) => void
}

export default function CombatStats({ character, isEditing, onSave }: CombatStatsProps) {
  const [currentHp, setCurrentHp] = useState(character.current_hp)
  const [tempHp, setTempHp] = useState(character.temp_hp)
  const [maxHp, setMaxHp] = useState(character.max_hp)
  const [ac, setAc] = useState(character.armor_class)
  const [speed, setSpeed] = useState(character.speed)
  const [damageAmount, setDamageAmount] = useState(0)
  const [healAmount, setHealAmount] = useState(0)

  async function applyDamage() {
    if (damageAmount <= 0) return
    
    try {
      const response = await apiCharacters.applyDamage(character.id, damageAmount)
      if (response.data) {
        setCurrentHp(response.data.current_hp)
        setTempHp(response.data.temp_hp)
      }
      setDamageAmount(0)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply damage')
    }
  }

  async function applyHealing() {
    if (healAmount <= 0) return
    
    try {
      const response = await apiCharacters.applyHealing(character.id, healAmount)
      if (response.data) {
        setCurrentHp(response.data.current_hp)
      }
      setHealAmount(0)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply healing')
    }
  }

  function handleSave() {
    onSave({
      current_hp: currentHp,
      temp_hp: tempHp,
      max_hp: maxHp,
      armor_class: ac,
      speed: speed,
    })
  }

  const hpPercent = (currentHp / maxHp) * 100
  const isBloodied = currentHp <= maxHp / 2
  const isDying = currentHp <= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Combat Stats</h2>
        {isEditing && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hit Points */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Heart className={`w-6 h-6 ${isDying ? 'text-red-700' : isBloodied ? 'text-yellow-500' : 'text-red-500'}`} />
            <h3 className="text-xl font-semibold">Hit Points</h3>
          </div>

          <div className="space-y-4">
            {/* HP Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Current HP</span>
                <span className={`font-semibold ${
                  isDying ? 'text-red-500' : isBloodied ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {currentHp} / {maxHp}
                </span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isDying ? 'bg-red-700' : isBloodied ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
                />
              </div>
            </div>

            {/* Temp HP */}
            {tempHp > 0 && (
              <div className="px-3 py-2 bg-blue-900/30 border border-blue-700 rounded">
                <span className="text-sm text-gray-400">Temporary HP: </span>
                <span className="font-semibold text-blue-400">{tempHp}</span>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-400">Current HP</label>
                  <input
                    type="number"
                    value={currentHp}
                    onChange={(e) => setCurrentHp(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                    min="0"
                    max={maxHp}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Max HP</label>
                  <input
                    type="number"
                    value={maxHp}
                    onChange={(e) => setMaxHp(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Temp HP</label>
                  <input
                    type="number"
                    value={tempHp}
                    onChange={(e) => setTempHp(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                    min="0"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400">Damage</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={damageAmount}
                      onChange={(e) => setDamageAmount(parseInt(e.target.value) || 0)}
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      min="0"
                      placeholder="0"
                    />
                    <button
                      onClick={applyDamage}
                      className="px-3 bg-red-600 hover:bg-red-700 rounded transition"
                      disabled={damageAmount <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Heal</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={healAmount}
                      onChange={(e) => setHealAmount(parseInt(e.target.value) || 0)}
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      min="0"
                      placeholder="0"
                    />
                    <button
                      onClick={applyHealing}
                      className="px-3 bg-green-600 hover:bg-green-700 rounded transition"
                      disabled={healAmount <= 0}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Death Saves */}
          {isDying && character.death_saves && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm font-semibold text-red-500 mb-2">Death Saves</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-400">Successes</p>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full border-2 ${
                          i <= character.death_saves!.successes
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Failures</p>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full border-2 ${
                          i <= character.death_saves!.failures
                            ? 'bg-red-500 border-red-500'
                            : 'border-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Defensive Stats */}
        <div className="space-y-4">
          {/* Armor Class */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-semibold">Armor Class</h3>
            </div>
            {isEditing ? (
              <input
                type="number"
                value={ac}
                onChange={(e) => setAc(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-center text-3xl font-bold"
                min="0"
              />
            ) : (
              <p className="text-5xl font-bold text-center text-blue-400">{ac}</p>
            )}
          </div>

          {/* Initiative */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-semibold">Initiative</h3>
            </div>
            <p className="text-5xl font-bold text-center text-yellow-400">
              {character.initiative_bonus >= 0 ? '+' : ''}{character.initiative_bonus}
            </p>
          </div>

          {/* Speed */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Footprints className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-semibold">Speed</h3>
            </div>
            {isEditing ? (
              <input
                type="number"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-center text-3xl font-bold"
                min="0"
              />
            ) : (
              <p className="text-5xl font-bold text-center text-green-400">{speed} ft</p>
            )}
          </div>
        </div>
      </div>

      {/* Hit Dice */}
      {character.hit_dice && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-3">Hit Dice</h3>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-bold">
              {character.hit_dice.current} / {character.hit_dice.total}
            </p>
            <p className="text-gray-400">{character.hit_dice.type}</p>
          </div>
        </div>
      )}
    </div>
  )
}
