import { createContext, useContext, useEffect, useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
import { buildGlobalThemeCSS } from '@/theme/globalStyles'
import { getGoogleFontHref } from '@/lib/fontUtils'
import {
  resolveBaseTheme,
  resolveTheme,
  resolveAnimationType,
  resolveBackground,
} from '@/config/appearance'

const SYSTEM_FONTS =
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'

const APPEARANCE_CLASSES = ['forma-light', 'forma-soft-gray', 'forma-dark', 'forma-black']

export const FormaThemeContext = createContext(null)

function useFormaThemeEngine() {
  const themeId = useAppStore((s) => s.themeId)
  const appearanceMode = useAppStore((s) => s.appearanceMode)
  const appFont = useAppStore((s) => s.appFont)
  const animationsEnabled = useAppStore((s) => s.animationsEnabled)
  const animType = useAppStore((s) => s.animType)
  const animSpeed = useAppStore((s) => s.animSpeed)
  const bgId = useAppStore((s) => s.bgId)
  const customBg = useAppStore((s) => s.customBg)
  const getTheme = useAppStore((s) => s.getTheme)

  const T = getTheme()
  const baseTheme = resolveBaseTheme(themeId)
  const resolvedAnim = resolveAnimationType(animType, baseTheme)
  const background = resolveBackground(bgId, customBg)
  const fontFamily = appFont || T.font || 'Nunito'

  const shellClassName = [
    'forma-app',
    `forma-theme-${themeId || 'horizon'}`,
    `forma-appearance-${appearanceMode || 'light'}`,
    animationsEnabled ? `forma-animation-${resolvedAnim}` : 'forma-animation-off',
    background ? 'forma-has-background' : '',
  ].filter(Boolean).join(' ')

  const shellStyle = useMemo(() => ({
    '--app-font': `'${fontFamily}', sans-serif`,
    '--forma-bg': T.bg,
    '--forma-ink': T.ink,
    '--forma-surface': T.surface,
    '--forma-border': T.border,
    '--forma-muted': T.muted,
    '--forma-panel': T.panel,
    '--forma-paper': T.paper || T.surface,
    '--forma-accent': T.accent,
    ...(customBg ? { '--app-background-image': `url(${customBg})` } : {}),
  }), [T.bg, T.ink, T.surface, T.border, T.muted, T.panel, T.paper, T.accent, fontFamily, customBg])

  useEffect(() => {
    const root = document.documentElement
    APPEARANCE_CLASSES.forEach((c) => root.classList.remove(c))
    root.classList.add(`forma-${appearanceMode || 'light'}`)
    root.classList.toggle('forma-animations-off', !animationsEnabled)
    root.classList.toggle('forma-has-bg', !!(bgId || customBg))

    root.dataset.theme = themeId || 'horizon'
    root.dataset.appearance = appearanceMode || 'light'
    root.dataset.animation = animationsEnabled ? resolvedAnim : 'off'
    root.dataset.background = customBg ? 'custom' : (bgId || 'none')

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
    if (T.fontUrl) {
      themeLink.href = `https://fonts.googleapis.com/css2?family=${T.fontUrl}&display=swap`
    }

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
    style.textContent = buildGlobalThemeCSS(T, fontFamily, appearanceMode)

    document.body.style.background = T.bg
    document.body.style.color = T.ink
  }, [
    T.bg, T.ink, T.border, T.surface, T.panel, T.muted, T.paper, T.accent,
    T.fontUrl, themeId, appearanceMode, appFont, fontFamily, animationsEnabled,
    bgId, customBg, resolvedAnim,
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
    fontFamily,
    shellClassName,
    shellStyle,
    previewTheme: (tid, mode) => resolveTheme(tid, mode),
  }
}

export function useFormaTheme() {
  const ctx = useContext(FormaThemeContext)
  if (!ctx) {
    throw new Error('useFormaTheme must be used within ThemeProvider')
  }
  return ctx
}

export { useFormaThemeEngine }
