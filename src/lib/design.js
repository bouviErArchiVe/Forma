import { TOKENS } from '@/theme/tokens'

/** Constantes layout / motion partagées (Partie 2 — polish iPad). */
export const LAYOUT = {
  contentMaxWidth: 1400,
  pagePaddingMobile: '20px 22px',
  pagePaddingTablet: '28px 32px 40px',
  pagePaddingDesktop: '32px 40px 48px',
  headerHeight: 62,
  tapTargetMin: 44,
}

export const CARD = {
  radius: TOKENS.radius.lg,
  radiusSm: TOKENS.radius.md,
  shadowRest: TOKENS.shadow.sm,
  shadowHover: '0 8px 32px rgba(0,0,0,.12)',
  liftHover: '-4px',
}

export const MOTION = {
  cardIn: 'cardIn .32s cubic-bezier(.2,.8,.2,1) both',
  spring: TOKENS.transition.spring,
  staggerStepMs: 35,
}

export function pageContentStyle() {
  return { maxWidth: LAYOUT.contentMaxWidth, margin: '0 auto' }
}
