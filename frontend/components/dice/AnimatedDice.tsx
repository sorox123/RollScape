import { Dices } from 'lucide-react'

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

interface AnimatedDiceProps {
  rolling: boolean
  result: RollResult | null
}

export default function AnimatedDice({ rolling, result }: AnimatedDiceProps) {
  if (!result && !rolling) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Dices className="w-32 h-32 text-gray-600 mb-6" />
        <p className="text-2xl text-gray-400">Ready to roll!</p>
        <p className="text-gray-500 mt-2">Select a die or enter custom notation below</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Animated Die */}
      <div className={`mb-8 ${rolling ? 'animate-roll' : ''}`}>
        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-red-300 transform hover:scale-110 transition-transform">
            {!rolling && result && (
              <span className="text-6xl font-bold text-white">
                {result.rolls.length === 1 ? result.rolls[0] : '?'}
              </span>
            )}
            {rolling && (
              <Dices className="w-16 h-16 text-white animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Result Display */}
      {result && !rolling && (
        <div className="text-center w-full">
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">{result.notation}</p>
            <p className="text-7xl font-bold text-red-500 mb-2">{result.result}</p>
          </div>

          {/* Individual Rolls */}
          {result.rolls.length > 1 && (
            <div className="bg-gray-700 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-400 mb-2">Individual Rolls</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {result.rolls.map((roll, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center font-bold text-lg"
                  >
                    {roll}
                  </div>
                ))}
              </div>
              
              {result.modifier && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-sm text-gray-400">
                    Modifier: <span className="font-bold text-white">
                      {result.modifier > 0 ? '+' : ''}{result.modifier}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
