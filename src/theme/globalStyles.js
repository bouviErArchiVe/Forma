import { TOKENS } from './tokens'

/** CSS global injecté dans App.jsx — reset + tokens CSS + animations + classes UI */
export function buildGlobalThemeCSS(T, appFont) {
  const font = appFont || T.font || 'Nunito'
  const { radius, spacing, transition, shadow } = TOKENS

  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; }
    :root {
      --accent: ${T.accent};
      --app-font: '${font}', sans-serif;
      --forma-accent: ${T.accent};
      --forma-bg: ${T.bg};
      --forma-ink: ${T.ink};
      --forma-border: ${T.border};
      --forma-surface: ${T.surface};
      --forma-panel: ${T.panel};
      --forma-radius-sm: ${radius.sm}px;
      --forma-radius-md: ${radius.md}px;
      --forma-radius-lg: ${radius.lg}px;
      --forma-radius-xl: ${radius.xl}px;
      --forma-space-sm: ${spacing.sm}px;
      --forma-space-md: ${spacing.md}px;
      --forma-transition-fast: ${transition.fast};
      --forma-transition-normal: ${transition.normal};
      --forma-transition-spring: ${transition.spring};
      --forma-shadow-float: ${shadow.float};
    }
    body {
      font-family: var(--app-font);
      -webkit-font-smoothing: antialiased;
      background: ${T.bg};
      color: ${T.ink};
    }
    #root { height: 100%; }
    button, input, select, textarea { font-family: var(--app-font); }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes formaFadeUp {
      from { opacity: 0; transform: translateY(10px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes formaScaleIn {
      from { opacity: 0; transform: scale(.94); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    .fade-up { animation: fadeUp .28s ease forwards; }
    .forma-animate-in { animation: formaFadeUp .24s var(--forma-transition-spring) forwards; }
    .forma-animate-scale { animation: formaScaleIn .2s var(--forma-transition-spring) forwards; }

    .forma-btn-glass {
      transition: transform var(--forma-transition-fast),
        background var(--forma-transition-fast),
        border-color var(--forma-transition-fast),
        box-shadow var(--forma-transition-fast),
        color var(--forma-transition-fast);
    }
    .forma-btn-glass:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0,0,0,.1);
    }
    .forma-btn-glass:active:not(:disabled) {
      transform: scale(.96) translateY(0);
    }

    .forma-tool-btn {
      transition: transform var(--forma-transition-fast),
        background var(--forma-transition-normal),
        border-color var(--forma-transition-normal),
        color var(--forma-transition-normal);
    }
    .forma-tool-btn:hover { transform: translateY(-1px); }
    .forma-tool-btn:active { transform: scale(.97); }

    .forma-glass-divider {
      width: 1px;
      align-self: stretch;
      background: linear-gradient(to bottom, transparent, ${T.border}88, transparent);
      margin: 0 2px;
    }
  `
}
