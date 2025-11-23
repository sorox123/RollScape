import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: ReactNode
}

export default function Button({
  children,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white',
    success: 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-lg font-semibold transition-all
        disabled:cursor-not-allowed disabled:opacity-50
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}
