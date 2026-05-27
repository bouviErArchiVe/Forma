import { applyAppearanceToTheme } from '@/lib/appearance'
import { THEMES } from '@/lib/themes'
import { safeGetLocalStorage, safeJsonParse } from '@/lib/storage'

const STORAGE_KEY = 'forma-store'

/** Applique thème / apparence / police avant le 1er paint React (évite flash clair). */
export function bootstrapFormaTheme() {
  if (typeof document === 'undefined') return
  try {
    const raw = safeGetLocalStorage(STORAGE_KEY)
    if (!raw) return
    const parsed = safeJsonParse(raw, null)
    const s = parsed?.state ?? parsed
    if (!s) return

    const root = document.documentElement
    const appearance = s.appearanceMode || 'light'
    ;['forma-light', 'forma-soft-gray', 'forma-dark', 'forma-black'].forEach((c) => root.classList.remove(c))
    root.classList.add(`forma-${appearance}`)
    root.dataset.theme = s.themeId || 'horizon'
    root.dataset.appearance = appearance
    root.dataset.animation = s.animationsEnabled === false ? 'off' : (s.animType || 'theme')
    root.dataset.background = s.customBg ? 'custom' : (s.bgId || 'none')

    const base = THEMES.find((t) => t.id === (s.themeId || 'horizon')) || THEMES[0]
    const T = applyAppearanceToTheme(base, appearance)
    const font = s.appFont || T.font || 'Nunito'

    root.style.setProperty('--forma-bg', T.bg)
    root.style.setProperty('--forma-ink', T.ink)
    root.style.setProperty('--forma-surface', T.surface)
    root.style.setProperty('--forma-border', T.border)
    root.style.setProperty('--forma-muted', T.muted)
    root.style.setProperty('--app-font', `'${font}', sans-serif`)
    root.style.background = T.bg
    root.style.color = T.ink
  } catch {
    /* ignore corrupt storage */
  }
}
