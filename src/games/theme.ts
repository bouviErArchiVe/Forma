/** Thème canvas pour les mini-jeux FPause, dérivé des variables CSS Forma. */

export interface GameTheme {
  bg: string
  surface: string
  ink: string
  accent: string
  muted: string
  border: string
}

const FALLBACK: GameTheme = {
  bg: '#faf8f5',
  surface: '#ffffff',
  ink: '#2a2320',
  accent: '#c8622a',
  muted: '#8a8178',
  border: '#e4ddd4',
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || !document?.documentElement) return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** Lit les couleurs courantes du thème actif (recalculées à chaque ouverture de jeu). */
export function readGameTheme(): GameTheme {
  return {
    bg: cssVar('--forma-bg', FALLBACK.bg),
    surface: cssVar('--forma-surface', FALLBACK.surface),
    ink: cssVar('--forma-text', FALLBACK.ink),
    accent: cssVar('--forma-accent', FALLBACK.accent),
    muted: cssVar('--forma-muted', FALLBACK.muted),
    border: cssVar('--forma-border', FALLBACK.border),
  }
}

export interface GameProps {
  T: GameTheme
  onClose: () => void
  bestScore?: number
  onSaveScore?: (score: number) => void
}
