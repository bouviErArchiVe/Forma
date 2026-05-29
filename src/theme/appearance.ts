import { mix } from './color-utils'
import type { FormaVisualTheme } from './themes'

function ensureHex(color: string | undefined, fallback: string): string {
  if (typeof color !== 'string') return fallback
  if (color.startsWith('#') && (color.length === 4 || color.length === 7)) return color
  return fallback
}

/** Remappe les neutres pour le mode sombre (accents conservés). */
export function applyDarkAppearance(theme: FormaVisualTheme): FormaVisualTheme {
  const base = theme
  const bg = ensureHex(base.bg, '#faf4ee')
  const surface = ensureHex(base.surface, '#ffffff')
  const panel = ensureHex(base.panel, '#1c1c24')
  const paper = ensureHex(base.paper, '#fafaf7')

  const darkBg = '#0f1016'
  const darkSurface = '#151724'
  const darkPaper = '#10111a'
  const darkPanel = mix(panel, '#0b0c10', 0.85)

  return {
    ...base,
    bg: mix(bg, darkBg, 0.92),
    surface: mix(surface, darkSurface, 0.9),
    paper: mix(paper, darkPaper, 0.92),
    panel: darkPanel,
    ink: '#f1f4ff',
    muted: '#9aa2b6',
    border: 'rgba(255,255,255,.12)',
  }
}
