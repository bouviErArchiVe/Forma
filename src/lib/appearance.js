function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function hexToRgb(hex) {
  const h = (hex || '').replace('#', '').trim()
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16)
    const g = parseInt(h[1] + h[1], 16)
    const b = parseInt(h[2] + h[2], 16)
    return { r, g, b }
  }
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return { r, g, b }
}

function rgbToHex({ r, g, b }) {
  const to = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function mix(aHex, bHex, t) {
  const a = hexToRgb(aHex)
  const b = hexToRgb(bHex)
  if (!a || !b) return aHex || bHex
  const tt = clamp(t, 0, 1)
  return rgbToHex({
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt,
  })
}

function ensureHex(color, fallback) {
  if (typeof color !== 'string') return fallback
  if (color.startsWith('#') && (color.length === 4 || color.length === 7)) return color
  return fallback
}

export const APPEARANCE_MODES = [
  { id: 'light', label: 'Clair', desc: 'Luminosité standard' },
  { id: 'soft-gray', label: 'Gris doux', desc: 'Moins de contraste, plus reposant' },
  { id: 'dark', label: 'Sombre', desc: 'Thème sombre lisible' },
  { id: 'black', label: 'Noir profond', desc: 'OLED / maximum contraste' },
]

export function applyAppearanceToTheme(theme, appearanceMode) {
  const mode = appearanceMode || 'light'
  const base = theme || {}

  const bg = ensureHex(base.bg, '#faf4ee')
  const surface = ensureHex(base.surface, '#ffffff')
  const panel = ensureHex(base.panel, '#1c1c24')
  const ink = ensureHex(base.ink, '#1c1c24')
  const muted = ensureHex(base.muted, '#888888')
  const border = ensureHex(base.border, '#e6e6e6')
  const paper = ensureHex(base.paper, '#fafaf7')

  if (mode === 'light') return base

  if (mode === 'soft-gray') {
    const grayBg = mix(bg, '#f2f2f2', 0.55)
    const graySurface = mix(surface, '#f7f7f7', 0.55)
    const grayPaper = mix(paper, '#f6f6f6', 0.55)
    const grayBorder = mix(border, '#dcdcdc', 0.65)
    const grayInk = mix(ink, '#1c1c24', 0.15)
    const grayMuted = mix(muted, '#6f6f76', 0.25)
    return {
      ...base,
      bg: grayBg,
      surface: graySurface,
      paper: grayPaper,
      border: grayBorder,
      ink: grayInk,
      muted: grayMuted,
      grid: base.grid || `rgba(0,0,0,.04)`,
      pline: base.pline || `rgba(0,0,0,.06)`,
    }
  }

  // Dark & black: keep accents but remap neutrals
  const darkBg = mode === 'black' ? '#07070a' : '#0f1016'
  const darkSurface = mode === 'black' ? '#0f1118' : '#151724'
  const darkPaper = mode === 'black' ? '#0b0c10' : '#10111a'
  const darkPanel = mix(panel, '#0b0c10', 0.85)
  const darkInk = '#f1f4ff'
  const darkMuted = mode === 'black' ? '#a0a6b8' : '#9aa2b6'
  const darkBorder = mode === 'black' ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.12)'

  return {
    ...base,
    bg: mix(bg, darkBg, 0.92),
    surface: mix(surface, darkSurface, 0.9),
    paper: mix(paper, darkPaper, 0.92),
    panel: darkPanel,
    ink: darkInk,
    muted: darkMuted,
    border: darkBorder,
    grid: 'rgba(255,255,255,.06)',
    pline: 'rgba(255,255,255,.08)',
  }
}

