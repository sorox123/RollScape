'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Toast, { ToastType, ToastProps } from './Toast'

interface ToastContextType {
  showToast: (type: ToastType, message: string, description?: string, duration?: number) => void
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  warning: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((
    type: ToastType,
    message: string,
    description?: string,
    duration?: number
  ) => {
    const id = Date.now().toString() + Math.random().toString(36)
    setToasts((prev) => [...prev, { id, type, message, description, duration }])
  }, [])

  const success = useCallback((message: string, description?: string) => {
    showToast('success', message, description)
  }, [showToast])

  const error = useCallback((message: string, description?: string) => {
    showToast('error', message, description)
  }, [showToast])

  const warning = useCallback((message: string, description?: string) => {
    showToast('warning', message, description)
  }, [showToast])

  const info = useCallback((message: string, description?: string) => {
    showToast('info', message, description)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="flex flex-col items-end pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
