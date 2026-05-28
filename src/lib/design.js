/**
 * Design system FORMA — constantes partagées (iPad / premium UI).
 * Les tokens couleur restent dans theme/tokens.js ; ce fichier expose helpers réutilisables.
 */
import { TOKENS } from '@/theme/tokens'

export { TOKENS }

/** Ombres type iOS — préférer l'élévation aux bordures visibles */
export const ELEVATION = {
  none: 'none',
  sm: TOKENS.shadow.sm,
  md: TOKENS.shadow.md,
  lg: TOKENS.shadow.lg,
  card: TOKENS.shadow.card,
  cardHover: TOKENS.shadow.cardHover,
  panel: TOKENS.shadow.panel,
  float: TOKENS.shadow.float,
  toolbar: TOKENS.shadow.toolbar,
}

/** Échelle typographique */
export const TYPE = {
  display: { fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' },
  title: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: 0.2 },
  body: { fontSize: 13, fontWeight: 400, lineHeight: 1.45 },
  caption: { fontSize: 10, fontWeight: 500, lineHeight: 1.35 },
  micro: { fontSize: 9, fontWeight: 600, letterSpacing: 0.3 },
}

/** Surface carte bibliothèque — sans bordure, ombre douce */
export function notebookCardStyle(T, { selected = false, view = 'grid' } = {}) {
  const base = {
    background: selected ? `${T.accent}08` : T.surface,
    border: 'none',
    boxShadow: selected
      ? `0 0 0 2px color-mix(in srgb, ${T.accent} 28%, transparent), ${ELEVATION.md}`
      : ELEVATION.card,
    transition: 'transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s ease',
  }
  if (view === 'list') {
    return { ...base, background: selected ? `${T.accent}10` : T.surface, borderRadius: TOKENS.radius.md }
  }
  if (view === 'timeline') {
    return { ...base, background: selected ? `${T.accent}10` : T.bg, borderRadius: TOKENS.radius.sm }
  }
  return { ...base, borderRadius: TOKENS.radius.lg, overflow: 'hidden' }
}

/** Espace réservé sous le canvas quand la barre iPad est visible */
export function ipadBottomInset(extra = 0) {
  return `calc(56px + env(safe-area-inset-bottom) + ${extra}px)`
}

/** Padding page shell — safe-area iPad */
export function pageShellPadding(compact = false) {
  if (compact) {
    return {
      paddingLeft: 'max(20px, env(safe-area-inset-left))',
      paddingRight: 'max(20px, env(safe-area-inset-right))',
    }
  }
  return {
    paddingLeft: 'max(28px, env(safe-area-inset-left))',
    paddingRight: 'max(28px, env(safe-area-inset-right))',
    paddingTop: 'max(24px, env(safe-area-inset-top))',
    paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
  }
}
