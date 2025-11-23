'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
  onClose: () => void
}

export default function Toast({ id, type, message, description, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const styles = {
    success: 'bg-green-500/90 border-green-400 text-white',
    error: 'bg-red-500/90 border-red-400 text-white',
    warning: 'bg-yellow-500/90 border-yellow-400 text-white',
    info: 'bg-blue-500/90 border-blue-400 text-white',
  }

  return (
    <div
      className={`${styles[type]} border rounded-lg shadow-lg p-4 mb-3 min-w-[320px] max-w-md animate-slide-in-right backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{message}</p>
          {description && (
            <p className="text-sm opacity-90 mt-1">{description}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
