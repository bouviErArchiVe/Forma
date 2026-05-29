import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'surface' | 'panel' | 'modal' | 'float'
  children: ReactNode
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel(
  { variant = 'surface', className = '', children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={`forma-glass-${variant} forma-animate-in ${className}`} {...rest}>
      {children}
    </div>
  )
})
