import { Trash2, RotateCcw, Clock } from 'lucide-react'

interface RollResult {
  id: string
  notation: string
  result: number
  rolls: number[]
  timestamp: Date
  modifier?: number
}

interface RollHistoryProps {
  history: RollResult[]
  onClear: () => void
  onReroll: (notation: string) => void
}

export default function RollHistory({ history, onClear, onReroll }: RollHistoryProps) {
  function formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  function getResultColor(result: number) {
    if (result === 20) return 'text-green-400'
    if (result === 1) return 'text-red-400'
    return 'text-white'
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Roll History
        </h3>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="p-2 hover:bg-gray-700 rounded transition"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No rolls yet</p>
            <p className="text-sm mt-1">Your roll history will appear here</p>
          </div>
        ) : (
          history.map((roll) => (
            <div
              key={roll.id}
              className="bg-gray-700 rounded-lg p-3 hover:bg-gray-650 transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-mono text-sm text-gray-400">{roll.notation}</p>
                  <p className={`text-3xl font-bold ${getResultColor(roll.result)}`}>
                    {roll.result}
                  </p>
                </div>
                
                <button
                  onClick={() => onReroll(roll.notation)}
                  className="p-2 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition"
                  title="Reroll"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {roll.rolls.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {roll.rolls.map((r, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-gray-600 rounded"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">{formatTime(roll.timestamp)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
