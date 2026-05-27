/** Design tokens FORMA — valeurs statiques (indépendantes du thème couleur) */
export const TOKENS = {
  radius: { sm: 10, md: 16, lg: 22, xl: 24, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, page: 28 },
  blur: { sm: 8, md: 14, lg: 22, xl: 32 },
  glass: {
    saturate: 1.45,
    opacity: { surface: 0.68, panel: 0.78, toolbar: 0.82, modal: 0.88, float: 0.72 },
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.08)',
    md: '0 4px 16px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.06)',
    lg: '0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)',
    card: '0 2px 8px rgba(0,0,0,.08)',
    cardHover: '0 12px 40px rgba(0,0,0,.14), 0 4px 12px rgba(0,0,0,.08)',
    panel: '0 12px 40px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.06)',
    toolbar: '0 4px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.07)',
    float: '0 16px 48px rgba(0,0,0,.20), 0 2px 8px rgba(0,0,0,.08)',
  },
  transition: {
    fast: '120ms ease',
    normal: '200ms ease',
    slow: '320ms ease',
    spring: '280ms cubic-bezier(.34, 1.2, .64, 1)',
  },
  zIndex: { base: 1, toolbar: 30, panel: 90, float: 100, modal: 200, toast: 300 },
}
