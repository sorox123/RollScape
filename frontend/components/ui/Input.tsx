import { InputHTMLAttributes, forwardRef } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  helpText?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, helpText, icon, className = '', ...props }, ref) => {
    const hasError = !!error
    const hasSuccess = !!success && !hasError

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 
              ${icon ? 'pl-10' : ''}
              bg-gray-700 border rounded-lg 
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                hasError
                  ? 'border-red-500 focus:ring-red-500/50'
                  : hasSuccess
                  ? 'border-green-500 focus:ring-green-500/50'
                  : 'border-gray-600 focus:ring-red-500/50'
              }
              ${className}
            `}
            {...props}
          />

          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}

          {hasSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>

        {helpText && !error && !success && (
          <p className="mt-1.5 text-sm text-gray-400">{helpText}</p>
        )}

        {error && (
          <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {success && !error && (
          <p className="mt-1.5 text-sm text-green-400 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
