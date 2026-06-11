import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-forma-accent text-white hover:bg-forma-accent-hover active:scale-[0.97] shadow-sm',
  secondary:
    'bg-forma-surface-raised text-forma-text border border-forma-border hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.97]',
  outline:
    'bg-transparent text-forma-text border border-forma-border hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.97]',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97] shadow-sm',
  ghost:
    'bg-transparent text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.97]',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-0.5 text-xs rounded-md gap-1',
  sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  md: 'px-3 py-1.5 text-sm rounded-lg gap-2',
  lg: 'px-4 py-2 text-sm rounded-xl gap-2',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  loading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-[120ms] ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forma-accent/50 focus-visible:ring-offset-1',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  )
}
