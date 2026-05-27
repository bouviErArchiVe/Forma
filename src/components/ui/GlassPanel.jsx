import { forwardRef } from 'react'
import { glassStyle } from '@/theme/glass'

const GlassPanel = forwardRef(function GlassPanel({
  T,
  variant = 'surface',
  animate = false,
  className = '',
  style = {},
  children,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      className={`${animate ? 'forma-animate-in' : ''} ${className}`.trim()}
      style={{ ...glassStyle(T, { variant }), ...style }}
      {...props}
    >
      {children}
    </div>
  )
})

export default GlassPanel
