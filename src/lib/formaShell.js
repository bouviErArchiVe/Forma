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
    contentBg: `linear-gradient(135deg, ${mix(bg, accent, 0.10)} 0%, ${bg} 42%, ${mix(surface, accent, 0.08)} 100%)`,
    sidebar: mix(surface, bg, 0.18),
    sidebarActive: mix(surface, accent, 0.12),
    header: mix(surface, accent, 0.08),
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
  { id: 'subjects', label: 'Matières', tab: 'subjects', icon: 'Pencil' },
]

export const MODULE_LINKS = [
  { icon: 'Image', label: MODULES.fMoodboard.name, route: MODULES.fMoodboard.route },
  { icon: 'Ruler', label: MODULES.formules.name, route: MODULES.formules.route },
  { icon: 'Table2', label: MODULES.formaTab.name, route: MODULES.formaTab.route },
  { icon: 'FileText', label: MODULES.formaDoc.name, route: MODULES.formaDoc.route },
  { icon: 'CalendarDays', label: MODULES.formatCal.name, route: MODULES.formatCal.route },
  { icon: 'Paperclip', label: MODULES.formaCombine.name, route: MODULES.formaCombine.route },
  { icon: 'MessageCircle', label: MODULES.formaReview.name, route: MODULES.formaReview.route },
  { icon: 'Presentation', label: MODULES.formaPresent.name, route: MODULES.formaPresent.route },
  { icon: 'Library', label: MODULES.formaLibrary.name, route: MODULES.formaLibrary.route },
  { icon: 'Sparkles', label: MODULES.formaAI.name, route: MODULES.formaAI.route },
  { icon: 'BookOpen', label: MODULES.formaDico.name, route: MODULES.formaDico.route },
  { icon: 'MessagesSquare', label: MODULES.formaMessage.name, route: MODULES.formaMessage.route },
  { icon: 'Globe2', label: MODULES.formaHub.name, route: MODULES.formaHub.route },
  { icon: 'Gamepad2', label: MODULES.fPause.name, route: MODULES.fPause.route },
]

export const ACCOUNT_LINKS = [
  { icon: 'Handshake', label: 'Amis', route: '/account/friends' },
  { icon: 'Share2', label: 'Partage', route: '/account/sharing' },
  { icon: 'FolderOpen', label: 'Partagés', route: '/account/folders' },
]

export const FormaShellContext = createContext(null)

export function useFormaShellColors() {
  const ctx = useContext(FormaShellContext)
  const { T } = useTheme()
  const fallback = useMemo(() => getFormaShellColors(T), [T])
  return ctx ?? fallback
}
