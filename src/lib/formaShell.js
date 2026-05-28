import { createContext, useContext, useMemo } from 'react'
import { useTheme } from '@/hooks/useAppearance'
import { MODULES } from '@/config/branding'
import { mix } from '@/lib/appearance'

/** Palette module branchée sur les CSS vars du ThemeProvider (thèmes dynamiques). */
export const FORMA_THEME_VARS = {
  bg: 'var(--forma-bg)',
  surface: 'var(--forma-surface)',
  panel: 'var(--forma-panel)',
  border: 'var(--forma-border)',
  ink: 'var(--forma-ink)',
  muted: 'var(--forma-muted)',
  accent: 'var(--forma-accent)',
  accent2: 'var(--forma-a2, var(--forma-accent))',
  paper: 'var(--forma-paper, var(--forma-surface))',
  danger: '#FF453A',
  success: '#4a7c59',
  warning: '#FFD60A',
  highlight: '#fbbf24',
}

export function getFormaShellColors(T) {
  const bg = T?.bg || '#0f1016'
  const surface = T?.surface || '#151724'
  const panel = T?.panel || '#1c1c24'
  const paper = T?.paper || surface
  const accent = T?.accent || '#0A84FF'

  return {
    bg,
    sidebar: surface,
    sidebarActive: mix(surface, accent, 0.12),
    header: surface,
    card: mix(paper, panel, 0.35),
    cardBorder: T?.border || 'rgba(255,255,255,.12)',
    text: T?.ink || '#f1f4ff',
    textSecondary: T?.muted || '#9aa2b6',
    textMuted: mix(T?.muted || '#9aa2b6', bg, 0.25),
    accent,
    separator: T?.border || 'rgba(255,255,255,.12)',
    inactive: mix(T?.muted || '#9aa2b6', T?.ink || '#f1f4ff', 0.55),
    star: '#FFD60A',
    destructive: '#FF453A',
  }
}

/** Palette interne module — remplace les constantes *_DARK figées. */
export function themeModulePalette(T) {
  return {
    bg: T.bg,
    surface: T.surface,
    panel: T.panel,
    border: T.border,
    ink: T.ink,
    muted: T.muted,
    accent: T.accent,
    accent2: T.a2 || T.accent,
    danger: '#FF453A',
    success: '#4a7c59',
    warning: '#FFD60A',
  }
}

export const LIBRARY_SIDEBAR = [
  { id: 'notebooks', label: 'Carnets', tab: 'notebooks', icon: 'BookOpen' },
  { id: 'favorites', label: 'Favoris', tab: 'favorites', icon: 'Star' },
  { id: 'folders', label: MODULES.formaFolder.name, tab: 'folders', icon: 'FolderOpen' },
  { id: 'dashboard', label: 'Tableau', tab: 'dashboard', icon: 'LayoutDashboard' },
  { id: 'subjects', label: 'Matières', tab: 'subjects', emoji: '✏' },
]

export const MODULE_LINKS = [
  { emoji: '🎭', label: MODULES.fMoodboard.name, route: MODULES.fMoodboard.route },
  { emoji: '📐', label: MODULES.formules.name, route: MODULES.formules.route },
  { emoji: '📊', label: MODULES.formaTab.name, route: MODULES.formaTab.route },
  { emoji: '📄', label: MODULES.formaDoc.name, route: MODULES.formaDoc.route },
  { emoji: '📅', label: MODULES.formatCal.name, route: MODULES.formatCal.route },
  { emoji: '📎', label: MODULES.formaCombine.name, route: MODULES.formaCombine.route },
  { emoji: '💬', label: MODULES.formaReview.name, route: MODULES.formaReview.route },
  { emoji: '📽', label: MODULES.formaPresent.name, route: MODULES.formaPresent.route },
  { emoji: '📚', label: MODULES.formaLibrary.name, route: MODULES.formaLibrary.route },
  { emoji: '✦', label: MODULES.formaAI.name, route: MODULES.formaAI.route },
  { emoji: '📖', label: MODULES.formaDico.name, route: MODULES.formaDico.route },
  { emoji: '💬', label: MODULES.formaMessage.name, route: MODULES.formaMessage.route },
  { emoji: '🌐', label: MODULES.formaHub.name, route: MODULES.formaHub.route },
  { emoji: '🎮', label: MODULES.fPause.name, route: MODULES.fPause.route },
]

export const ACCOUNT_LINKS = [
  { emoji: '🤝', label: 'Amis', route: '/account/friends' },
  { emoji: '🔗', label: 'Partage', route: '/account/sharing' },
  { emoji: '📂', label: 'Partagés', route: '/account/folders' },
]

export const FormaShellContext = createContext(null)

export function useFormaShellColors() {
  const ctx = useContext(FormaShellContext)
  const { T } = useTheme()
  const fallback = useMemo(() => getFormaShellColors(T), [T])
  return ctx ?? fallback
}
