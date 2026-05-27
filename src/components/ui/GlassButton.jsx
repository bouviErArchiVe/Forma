import { TOKENS } from '@/theme/tokens'
import { rgbaFromHex } from '@/theme/glass'

export default function GlassButton({
  T,
  active = false,
  accent = false,
  danger = false,
  size = 'sm',
  className = '',
  style = {},
  children,
  ...props
}) {
  const pad = size === 'md' ? '7px 12px' : '5px 9px'
  const fs = size === 'md' ? 12 : 10

  let border = rgbaFromHex(T.border, 0.4)
  let bg = rgbaFromHex(T.bg, 0.35)
  let color = T.muted

  if (danger) {
    border = 'rgba(233,69,96,.35)'
    bg = 'rgba(233,69,96,.12)'
    color = '#e94560'
  } else if (active || accent) {
    border = rgbaFromHex(T.accent, 0.55)
    bg = `${T.accent}22`
    color = T.accent
  }

  return (
    <button
      className={`forma-btn-glass ${className}`.trim()}
      style={{
        padding: pad,
        borderRadius: TOKENS.radius.sm,
        border: `1px solid ${border}`,
        background: bg,
        color,
        cursor: 'pointer',
        fontSize: fs,
        fontWeight: 600,
        lineHeight: 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
