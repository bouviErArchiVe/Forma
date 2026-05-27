import { useEffect } from 'react'
import useAppStore from '@/stores/useAppStore'
import { buildGlobalThemeCSS } from '@/theme/globalStyles'
import { getGoogleFontHref } from '@/lib/fontUtils'
import {
  resolveTheme,
  resolveBaseTheme,
  resolveAnimationType,
  resolveBackground,
} from '@/config/appearance'

const SYSTEM_FONTS =
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"

const APPEARANCE_CLASSES = ['forma-light', 'forma-soft-gray', 'forma-dark', 'forma-black']

/**
 * Applique l'apparence globale sur document + retourne l'état résolu.
 * À appeler une fois dans App.jsx (racine).
 */
export function useGlobalAppearance() {
  const themeId = useAppStore(s => s.themeId)
  const appearanceMode = useAppStore(s => s.appearanceMode)
  const appFont = useAppStore(s => s.appFont)
  const animationsEnabled = useAppStore(s => s.animationsEnabled)
  const animType = useAppStore(s => s.animType)
  const animSpeed = useAppStore(s => s.animSpeed)
  const bgId = useAppStore(s => s.bgId)
  const customBg = useAppStore(s => s.customBg)
  const getTheme = useAppStore(s => s.getTheme)

  const T = getTheme()
  const baseTheme = resolveBaseTheme(themeId)
  const resolvedAnim = resolveAnimationType(animType, baseTheme)
  const background = resolveBackground(bgId, customBg)

  useEffect(() => {
    const root = document.documentElement
    APPEARANCE_CLASSES.forEach(c => root.classList.remove(c))
    root.classList.add(`forma-${appearanceMode || 'light'}`)
    root.classList.toggle('forma-animations-off', !animationsEnabled)
    root.classList.toggle('forma-has-bg', !!(bgId || customBg))

    if (!document.getElementById('forma-system-fonts')) {
      const link = document.createElement('link')
      link.id = 'forma-system-fonts'
      link.href = SYSTEM_FONTS
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    let themeLink = document.getElementById('forma-theme-font')
    if (!themeLink) {
      themeLink = document.createElement('link')
      themeLink.id = 'forma-theme-font'
      themeLink.rel = 'stylesheet'
      document.head.appendChild(themeLink)
    }
    themeLink.href = `https://fonts.googleapis.com/css2?family=${T.fontUrl}&display=swap`

    const appFontHref = appFont ? getGoogleFontHref(appFont) : null
    let appFontLink = document.getElementById('forma-app-font')
    if (appFontHref) {
      if (!appFontLink) {
        appFontLink = document.createElement('link')
        appFontLink.id = 'forma-app-font'
        appFontLink.rel = 'stylesheet'
        document.head.appendChild(appFontLink)
      }
      appFontLink.href = appFontHref
    } else if (appFontLink) {
      appFontLink.remove()
    }

    let style = document.getElementById('forma-global-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'forma-global-style'
      document.head.appendChild(style)
    }
    style.textContent = buildGlobalThemeCSS(T, appFont || T.font, appearanceMode)
  }, [
    T.bg, T.ink, T.border, T.surface, T.panel, T.muted, T.paper, T.accent,
    T.fontUrl, T.font, appFont, appearanceMode, animationsEnabled, bgId, customBg,
  ])

  return {
    T,
    baseTheme,
    themeId,
    appearanceMode,
    appFont,
    animationsEnabled,
    animType,
    animSpeed,
    bgId,
    customBg,
    resolvedAnim,
    background,
  }
}

/** Thème résolu pour les pages (sans effet document) */
export function useTheme() {
  const themeId = useAppStore(s => s.themeId)
  const appearanceMode = useAppStore(s => s.appearanceMode)
  const appFont = useAppStore(s => s.appFont)
  const getTheme = useAppStore(s => s.getTheme)
  const T = getTheme()
  return {
    T,
    baseTheme: resolveBaseTheme(themeId),
    appearanceMode,
    appFont,
    previewTheme: (tid, mode) => resolveTheme(tid, mode),
  }
}
