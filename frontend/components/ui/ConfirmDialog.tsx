'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}

interface ConfirmProviderProps {
  children: ReactNode
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
  })
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions({ ...opts, confirmText: opts.confirmText || 'Confirm', cancelText: opts.cancelText || 'Cancel', variant: opts.variant || 'danger' })
      setIsOpen(true)
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (resolver) {
      resolver(true)
      setResolver(null)
    }
    setIsOpen(false)
  }, [resolver])

  const handleCancel = useCallback(() => {
    if (resolver) {
      resolver(false)
      setResolver(null)
    }
    setIsOpen(false)
  }, [resolver])

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const styles = variantStyles[options.variant || 'danger']

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full animate-slide-up">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${styles.icon}`} />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{options.title}</h3>
                  <p className="text-gray-400">{options.message}</p>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-gray-700 rounded transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                >
                  {options.cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2 ${styles.button} text-white rounded-lg font-semibold transition`}
                >
                  {options.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
