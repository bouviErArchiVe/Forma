/**
 * Configuration centralisée apparence FORMA
 * (thème + mode clair/sombre + animation + fond + police)
 */
export { APPEARANCE_MODES, applyAppearanceToTheme } from '@/lib/appearance'
export { APP_FONT_CHOICES, getGoogleFontHref } from '@/lib/fontUtils'
export { BACKGROUNDS } from '@/lib/backgrounds'
export { THEMES } from '@/lib/themes'

import { applyAppearanceToTheme } from '@/lib/appearance'
import { THEMES } from '@/lib/themes'
import { BACKGROUNDS } from '@/lib/backgrounds'

export const APPEARANCE_STORAGE_KEY = 'forma-store'

/** Opacité du filigrane de fond global */
export const GLOBAL_BG_OPACITY = 0.14

/** Opacité du canvas d'animation particules */
export const GLOBAL_ANIM_OPACITY = 0.55

export const ANIM_TYPE_LABELS = {
  fireflies: 'Lucioles',
  drops: 'Gouttes',
  sparkles: 'Étincelles',
  geometry: 'Géométrie',
  waves: 'Vagues',
  leaves: 'Feuilles',
  pulses: 'Pulsations',
  pencil: 'Crayon',
}

export function resolveBaseTheme(themeId) {
  return THEMES.find(t => t.id === themeId) || THEMES[0]
}

export function resolveTheme(themeId, appearanceMode) {
  return applyAppearanceToTheme(resolveBaseTheme(themeId), appearanceMode)
}

export function resolveAnimationType(animType, theme) {
  if (animType) return animType
  return theme?.anim || 'fireflies'
}

export function resolveBackground(bgId, customBg) {
  if (customBg) return { kind: 'custom', src: customBg }
  if (bgId) {
    const bg = BACKGROUNDS.find(b => b.id === bgId)
    if (bg) return { kind: 'preset', bg }
  }
  return null
}

/** Styles réutilisables pour cartes d'options (Ambiance) */
export function optionCardStyle(T, active) {
  return {
    padding: '12px 12px',
    borderRadius: 12,
    border: `1px solid ${active ? T.accent : T.border}`,
    background: active ? `${T.accent}18` : T.surface,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all .15s',
    color: T.ink,
  }
}

export function optionChipStyle(T, active) {
  return {
    padding: '10px 6px',
    borderRadius: 10,
    border: `1px solid ${active ? T.accent : T.border}`,
    background: active ? `${T.accent}18` : T.surface,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    transition: 'all .15s',
  }
}

export function optionPanelStyle(T) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: T.surface,
    borderRadius: 13,
    border: `1px solid ${T.border}`,
  }
}
