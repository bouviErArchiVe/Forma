import { TOKENS } from './tokens'

function hexToRgb(hex) {
  const h = (hex || '').replace('#', '').trim()
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    }
  }
  if (h.length !== 6) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbaFromHex(hex, alpha = 1) {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(255,255,255,${alpha})`
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

const VARIANT_BG = {
  surface: (T) => T.surface,
  panel: (T) => T.panel,
  toolbar: (T) => T.panel,
  modal: (T) => T.surface,
  float: (T) => T.surface,
}

const VARIANT_SHADOW = {
  surface: TOKENS.shadow.md,
  panel: TOKENS.shadow.panel,
  toolbar: TOKENS.shadow.toolbar,
  modal: TOKENS.shadow.panel,
  float: TOKENS.shadow.float,
}

const VARIANT_RADIUS = {
  surface: TOKENS.radius.md,
  panel: TOKENS.radius.lg,
  toolbar: 0,
  modal: TOKENS.radius.xl,
  float: TOKENS.radius.lg,
}

/** Styles glassmorphism inline — compatible thèmes clair/sombre */
export function glassStyle(T, opts = {}) {
  const {
    variant = 'surface',
    blur = TOKENS.blur.md,
    opacity,
    border = true,
    radius,
  } = opts

  const defaultOpacity = TOKENS.glass.opacity[variant] ?? TOKENS.glass.opacity.surface
  const bg = VARIANT_BG[variant]?.(T) ?? T.surface

  return {
    background: rgbaFromHex(bg, opacity ?? defaultOpacity),
    backdropFilter: `blur(${blur}px) saturate(${TOKENS.glass.saturate})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${TOKENS.glass.saturate})`,
    border: border ? `1px solid ${rgbaFromHex(T.border, 0.45)}` : 'none',
    boxShadow: VARIANT_SHADOW[variant] ?? TOKENS.shadow.md,
    borderRadius: radius ?? VARIANT_RADIUS[variant],
  }
}
