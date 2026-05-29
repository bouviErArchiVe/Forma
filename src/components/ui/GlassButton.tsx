import type { ButtonHTMLAttributes, ReactNode } from 'react'

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  accent?: boolean
  danger?: boolean
  size?: 'sm' | 'md'
  children: ReactNode
}

export function GlassButton({
  active,
  accent,
  danger,
  size = 'md',
  className = '',
  children,
  ...rest
}: GlassButtonProps) {
  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  let variant = 'forma-glass-btn'
  if (danger) variant = 'forma-glass-btn-danger'
  else if (accent || active) variant = 'forma-glass-btn-accent'

  return (
    <button
      type="button"
      className={`${variant} ${sizeClass} font-medium rounded-xl transition-all forma-animate-in ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
