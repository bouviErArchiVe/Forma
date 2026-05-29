import { applyDarkAppearance } from './appearance'
import { getThemeById, type FormaVisualTheme } from './themes'

function themeToCss(t: FormaVisualTheme, dark: boolean) {
  const resolved = dark ? applyDarkAppearance(t) : t
  return {
    'forma-bg': resolved.bg,
    'forma-surface': resolved.surface,
    'forma-panel': resolved.panel,
    'forma-accent': resolved.accent,
    'forma-accent-hover': resolved.accent2,
    'forma-text': resolved.ink,
    'forma-muted': resolved.muted,
    'forma-border': resolved.border,
    'forma-paper': resolved.paper,
    'forma-font': resolved.fontFamily,
  }
}

/** Applique le thème visuel FTheme sur :root (Tailwind + glass). */
export function applyVisualTheme(themeId: string, dark: boolean): void {
  const t = getThemeById(themeId)
  const css = themeToCss(t, dark)
  const root = document.documentElement
  root.dataset.formaTheme = t.id
  for (const [key, value] of Object.entries(css)) {
    root.style.setProperty(`--${key}`, value)
    if (key === 'forma-text') root.style.setProperty('--color-forma-text', value)
    else if (key === 'forma-bg') root.style.setProperty('--color-forma-bg', value)
    else if (key === 'forma-surface') root.style.setProperty('--color-forma-surface', value)
    else if (key === 'forma-border') root.style.setProperty('--color-forma-border', value)
    else if (key === 'forma-muted') root.style.setProperty('--color-forma-muted', value)
    else if (key === 'forma-accent') root.style.setProperty('--color-forma-accent', value)
    else if (key === 'forma-accent-hover') root.style.setProperty('--color-forma-accent-hover', value)
    else if (key === 'forma-paper') root.style.setProperty('--color-forma-paper', value)
  }
  root.style.fontFamily = css['forma-font']
}
