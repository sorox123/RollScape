import { TextareaHTMLAttributes, forwardRef, useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  helpText?: string
  showCount?: boolean
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, success, helpText, showCount = false, maxLength, className = '', value, onChange, ...props }, ref) => {
    const hasError = !!error
    const hasSuccess = !!success && !hasError
    const [count, setCount] = useState(0)

    useEffect(() => {
      if (value !== undefined) {
        setCount(String(value).length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCount(e.target.value.length)
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            className={`
              w-full px-4 py-2.5 
              bg-gray-700 border rounded-lg 
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              resize-y min-h-[100px]
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

          {showCount && maxLength && (
            <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 ${
              count > maxLength * 0.9 ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {count}/{maxLength}
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

TextArea.displayName = 'TextArea'

export default TextArea
