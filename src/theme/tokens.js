/** Design tokens FORMA — valeurs statiques (indépendantes du thème couleur) */
export const TOKENS = {
  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  blur: { sm: 8, md: 14, lg: 22, xl: 32 },
  glass: {
    saturate: 1.45,
    opacity: { surface: 0.68, panel: 0.78, toolbar: 0.82, modal: 0.88, float: 0.72 },
  },
  shadow: {
    sm: '0 2px 8px rgba(0,0,0,.07)',
    md: '0 8px 28px rgba(0,0,0,.14)',
    lg: '0 8px 32px rgba(0,0,0,.12)',
    panel: '0 12px 40px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.06)',
    toolbar: '0 4px 20px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.07)',
    float: '0 16px 48px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.08)',
  },
  transition: {
    fast: '120ms ease',
    normal: '200ms ease',
    slow: '320ms ease',
    spring: '280ms cubic-bezier(.34, 1.2, .64, 1)',
  },
  zIndex: { base: 1, toolbar: 30, panel: 90, float: 100, modal: 200, toast: 300 },
}
