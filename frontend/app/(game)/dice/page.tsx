'use client'

import { useState } from 'react'
import { Dices, Plus, Minus, ArrowLeft, History, Sparkles, Settings, Palette } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiDice } from '@/lib/api'
import { useToast } from '@/components/ui/ToastContainer'
import AnimatedDice from '@/components/dice/AnimatedDice'
import RollHistory from '@/components/dice/RollHistory'
import CannonDiceOverlay from '@/components/dice/CannonDiceOverlay'
import DiceSettingsPanel, { DEFAULT_DICE_SETTINGS, type DiceSettings } from '@/components/dice/DiceSettingsPanel'
import DiceTextureSelector from '@/components/dice/DiceTextureSelector'

interface RollResult {
  id: string
  notation: string
  result: number
  rolls: number[]
  timestamp: Date
  modifier?: number
  kept?: number[]
  dropped?: number[]
}

export default function DiceRollerPage() {
  const router = useRouter()
  const toast = useToast()
  const [notation, setNotation] = useState('1d20')
  const [modifier, setModifier] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null)
  const [history, setHistory] = useState<RollResult[]>([])
  const [showHistory, setShowHistory] = useState(true)
  
  // 3D Overlay state
  const [diceSettings, setDiceSettings] = useState<DiceSettings>(DEFAULT_DICE_SETTINGS)
  const [overlayRollData, setOverlayRollData] = useState<any>(null)
  const [selectedTextureId, setSelectedTextureId] = useState<string | undefined>(undefined)
  const [textureUrls, setTextureUrls] = useState<{ [key: string]: string } | undefined>(undefined)
  const [showSettings, setShowSettings] = useState(false)
  const [showTextureSelector, setShowTextureSelector] = useState(false)

  async function roll(customNotation?: string) {
    const rollNotation = customNotation || `${notation}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`
    
    try {
      setRolling(true)
      
      // If using 3D overlay with animation enabled, use PHYSICS ONLY
      if (diceSettings.use3DOverlay && diceSettings.animateRolls) {
        // Create minimal roll data for physics simulation (no backend call)
        const diceMatch = rollNotation.match(/(\d+)d(\d+)/);
        if (!diceMatch) {
          throw new Error('Invalid dice notation');
        }
        
        const numDice = parseInt(diceMatch[1]);
        const dieType = parseInt(diceMatch[2]);
        const modifierMatch = rollNotation.match(/([+-]\d+)$/);
        const rollModifier = modifierMatch ? parseInt(modifierMatch[1]) : 0;
        
        // Create physics-only roll data structure
        const physicsRollData = {
          roll_id: `physics_${Date.now()}`,
          dice_notation: rollNotation,
          dice_results: Array.from({ length: numDice }, (_, i) => ({
            die_type: `d${dieType}`,
            value: 0, // Will be determined by physics
            initial_position: [(Math.random() - 0.5) * 6, 4 + Math.random() * 2, -8],
            initial_rotation: [Math.random() * 360, Math.random() * 360, Math.random() * 360],
            initial_velocity: [(Math.random() - 0.5) * 3, 2 + Math.random() * 0.5, 8 + Math.random() * 2],
            angular_velocity: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8],
            bounce_points: [],
            settle_time: 2.0,
            is_critical: false,
            is_fumble: false,
          })),
          total: 0, // Will be calculated by physics
          modifier: rollModifier,
          texture_id: selectedTextureId,
          total_animation_time: 3.0,
          camera_focus: [0, 0, 0],
        };
        
        setOverlayRollData(physicsRollData);
        // Result will be set by onRollComplete callback
      } else if (diceSettings.use3DOverlay && !diceSettings.animateRolls) {
        // Animation OFF - use BACKEND ONLY
        const response = await fetch('http://localhost:8000/api/dice/rolls/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dice_notation: rollNotation,
            texture_id: selectedTextureId,
            throw_force: diceSettings.throwForce,
            throw_angle: 45,
            spin_intensity: diceSettings.spinIntensity,
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to roll dice')
        }
        
        const rollData = await response.json()
        setOverlayRollData(rollData)
        
        // Use backend results
        const result: RollResult = {
          id: rollData.roll_id,
          notation: rollNotation,
          result: rollData.total,
          rolls: rollData.dice_results.map((d: any) => d.value),
          timestamp: new Date(),
          modifier: rollData.modifier || undefined,
        }
        
        setCurrentResult(result)
        setHistory([result, ...history].slice(0, 20))
        
        // Reset after showing
        setTimeout(() => {
          setRolling(false)
          setOverlayRollData(null)
        }, 2000)
      } else {
        // Original 2D roll
        const response = await apiDice.roll(rollNotation)
        
        if (response.error) {
          toast.error('Invalid Roll', response.error.error || 'Invalid dice notation')
          setRolling(false)
          return
        }
        
        if (!response.data) {
          throw new Error('No response data')
        }
        
        // Extract individual roll values from the response
        const rollValues = response.data.rolls || [response.data.total]
        
        const result: RollResult = {
          id: Date.now().toString(),
          notation: rollNotation,
          result: response.data.total,
          rolls: rollValues,
          timestamp: new Date(),
          modifier: response.data.modifier || undefined,
        }
        
        setCurrentResult(result)
        setHistory([result, ...history].slice(0, 20)) // Keep last 20 rolls
        
        // Special toasts for natural 20s and 1s
        if (rollNotation.includes('d20') && rollValues.length === 1) {
          if (rollValues[0] === 20) {
            toast.success('Natural 20!', 'Critical success!')
          } else if (rollValues[0] === 1) {
            toast.error('Natural 1!', 'Critical failure!')
          }
        }
        
        // Reset rolling animation after a delay
        setTimeout(() => setRolling(false), 1200)
      }
    } catch (err: any) {
      toast.error('Roll Failed', err.response?.data?.detail || 'Failed to roll dice')
      setRolling(false)
    }
  }

  function quickRoll(notation: string) {
    const tempMod = modifier
    setModifier(0)
    setNotation(notation)
    roll(notation + (tempMod !== 0 ? (tempMod > 0 ? '+' : '') + tempMod : ''))
  }

  const presets = [
    { label: 'd20', notation: '1d20', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Advantage', notation: '2d20kh1', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Disadvantage', notation: '2d20kl1', color: 'bg-red-600 hover:bg-red-700' },
    { label: 'd12', notation: '1d12', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'd10', notation: '1d10', color: 'bg-pink-600 hover:bg-pink-700' },
    { label: 'd8', notation: '1d8', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: 'd6', notation: '1d6', color: 'bg-yellow-600 hover:bg-yellow-700' },
    { label: 'd4', notation: '1d4', color: 'bg-teal-600 hover:bg-teal-700' },
    { label: '2d6', notation: '2d6', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: '3d6', notation: '3d6', color: 'bg-cyan-600 hover:bg-cyan-700' },
    { label: '4d6 drop lowest', notation: '4d6dl1', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'd%', notation: '1d100', color: 'bg-violet-600 hover:bg-violet-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Dices className="w-8 h-8" />
                  Dice Roller
                </h1>
                <p className="text-gray-400 mt-1">Roll dice for your D&D adventure</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTextureSelector(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition"
                title="Choose Dice Texture"
              >
                <Palette className="w-5 h-5" />
                Textures
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition"
                title="Dice Settings"
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                  showHistory ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <History className="w-5 h-5" />
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Roller */}
          <div className="lg:col-span-2 space-y-6">
            {/* Result Display */}
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <AnimatedDice rolling={rolling} result={currentResult} />
            </div>

            {/* Custom Notation Input */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Custom Roll</h3>
              
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-2">Dice Notation</label>
                  <input
                    type="text"
                    value={notation}
                    onChange={(e) => setNotation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-lg font-mono"
                    placeholder="1d20"
                  />
                </div>

                <div className="w-32">
                  <label className="block text-sm text-gray-400 mb-2">Modifier</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModifier(Math.max(-99, modifier - 1))}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={modifier}
                      onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-3 bg-gray-700 border border-gray-600 rounded-lg text-center"
                    />
                    <button
                      onClick={() => setModifier(Math.min(99, modifier + 1))}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => roll()}
                disabled={rolling || !notation}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold text-xl transition flex items-center justify-center gap-2"
              >
                <Dices className="w-6 h-6" />
                {rolling ? 'Rolling...' : 'Roll Dice'}
              </button>

              <div className="mt-4 text-sm text-gray-400">
                <p className="mb-1"><strong>Examples:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• <code className="bg-gray-700 px-2 py-0.5 rounded">1d20+5</code> - d20 with +5 modifier</li>
                  <li>• <code className="bg-gray-700 px-2 py-0.5 rounded">3d6</code> - 3 six-sided dice</li>
                  <li>• <code className="bg-gray-700 px-2 py-0.5 rounded">2d20kh1</code> - Advantage (keep highest)</li>
                  <li>• <code className="bg-gray-700 px-2 py-0.5 rounded">2d20kl1</code> - Disadvantage (keep lowest)</li>
                  <li>• <code className="bg-gray-700 px-2 py-0.5 rounded">4d6dl1</code> - Drop lowest die</li>
                </ul>
              </div>
            </div>

            {/* Quick Roll Presets */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Quick Rolls
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.notation}
                    onClick={() => quickRoll(preset.notation)}
                    disabled={rolling}
                    className={`px-4 py-3 rounded-lg font-semibold transition ${preset.color} disabled:opacity-50`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className="lg:col-span-1">
              <RollHistory 
                history={history} 
                onClear={() => setHistory([])}
                onReroll={(notation: string) => roll(notation)}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* 3D Dice Overlay */}
      {diceSettings.use3DOverlay && overlayRollData && (
        <CannonDiceOverlay
          rollData={overlayRollData}
          settings={diceSettings}
          textureUrls={textureUrls}
          onRollComplete={(rolls, total) => {
            // Physics results received - record them
            const result: RollResult = {
              id: `physics_${Date.now()}`,
              notation: overlayRollData.dice_notation,
              result: total,
              rolls: rolls,
              timestamp: new Date(),
              modifier: overlayRollData.modifier || undefined,
            }
            setCurrentResult(result)
            setHistory([result, ...history].slice(0, 20))
            
            // Special toasts for natural 20s and 1s
            if (overlayRollData.dice_notation.includes('d20') && rolls.length === 1) {
              if (rolls[0] === 20) {
                toast.success('Natural 20!', 'Critical success!')
              } else if (rolls[0] === 1) {
                toast.error('Natural 1!', 'Critical failure!')
              }
            }
          }}
          onAnimationComplete={() => {
            setRolling(false)
            setOverlayRollData(null)
          }}
        />
      )}
      
      {/* Settings Panel */}
      {showSettings && (
        <DiceSettingsPanel
          settings={diceSettings}
          onSettingsChange={setDiceSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {/* Texture Selector */}
      {showTextureSelector && (
        <DiceTextureSelector
          selectedTextureId={selectedTextureId}
          onSelectTexture={(textureId, urls) => {
            setSelectedTextureId(textureId)
            setTextureUrls(urls)
            setShowTextureSelector(false)
          }}
          onClose={() => setShowTextureSelector(false)}
        />
      )}
    </div>
  )
}
