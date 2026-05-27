import { TOKENS } from './tokens'

function isDarkAppearance(mode) {
  return mode === 'dark' || mode === 'black'
}

/** CSS global injecté dans App.jsx — reset + tokens CSS + animations + classes UI */
export function buildGlobalThemeCSS(T, appFont, appearanceMode = 'light') {
  const font = appFont || T.font || 'Nunito'
  const { radius, spacing, transition, shadow } = TOKENS
  const dark = isDarkAppearance(appearanceMode)

  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; }
    :root {
      --accent: ${T.accent};
      --app-font: '${font}', sans-serif;
      --forma-accent: ${T.accent};
      --forma-accent-2: ${T.a2 || T.accent};
      --forma-bg: ${T.bg};
      --forma-ink: ${T.ink};
      --forma-muted: ${T.muted};
      --forma-border: ${T.border};
      --forma-surface: ${T.surface};
      --forma-panel: ${T.panel};
      --forma-paper: ${T.paper || T.surface};
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
    html {
      background: ${T.bg};
      color: ${T.ink};
    }
    body {
      font-family: var(--app-font);
      -webkit-font-smoothing: antialiased;
      background: ${T.bg};
      color: ${T.ink};
    }
    html.forma-dark, html.forma-black { color-scheme: dark; }
    html.forma-light, html.forma-soft-gray { color-scheme: light; }
    #root {
      height: 100%;
      min-height: 100%;
      background: transparent;
      color: var(--forma-ink);
      font-family: var(--app-font);
    }
    button, input, select, textarea {
      font-family: var(--app-font);
      color: inherit;
    }
    input, select, textarea {
      background: ${T.surface};
      color: ${T.ink};
      border-color: ${T.border};
    }
    input::placeholder, textarea::placeholder {
      color: ${T.muted};
      opacity: .85;
    }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: .92em;
    }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }

    /* Mode sombre — surfaces hardcodées remplacées par tokens */
    html.forma-dark .forma-surface-auto,
    html.forma-black .forma-surface-auto {
      background: var(--forma-surface) !important;
      color: var(--forma-ink) !important;
      border-color: var(--forma-border) !important;
    }

    html.forma-animations-off .forma-animate-in,
    html.forma-animations-off .forma-animate-scale,
    html.forma-animations-off .fade-up {
      animation: none !important;
    }

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
      box-shadow: 0 4px 14px rgba(0,0,0,${dark ? '.35' : '.1'});
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

    .forma-editor-topbar {
      transition: opacity .28s ease, min-height .35s ease;
    }
    .forma-toolbar-group {
      flex-shrink: 0;
    }
    @media (max-width: 900px) {
      .forma-editor-topbar {
        max-height: 88px;
        overflow-y: auto;
      }
    }

    .forma-glass-divider {
      width: 1px;
      align-self: stretch;
      background: linear-gradient(to bottom, transparent, ${T.border}88, transparent);
      margin: 0 2px;
    }

    .forma-logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .forma-logo-container .forma-logo {
      margin: 0 auto;
      display: block;
      flex-shrink: 0;
      object-fit: contain;
      object-position: center center;
    }
    .forma-logo-container .forma-logo-wordmark {
      margin: 0;
      padding: 0;
      letter-spacing: 0;
      text-align: center;
      width: 100%;
    }

    .forma-brand-title {
      font-family: 'Syne', sans-serif;
      letter-spacing: 0;
    }

    #forma-app-root {
      min-height: 100%;
      height: 100%;
      position: relative;
      isolation: isolate;
      background: var(--forma-bg);
      color: var(--forma-ink);
      font-family: var(--app-font);
    }
    .forma-app-content {
      position: relative;
      z-index: 2;
      min-height: 100%;
      height: 100%;
    }
    .forma-app-bg {
      z-index: 0 !important;
    }
    .forma-app-animation {
      z-index: 1 !important;
    }
    .forma-page-shell {
      min-height: 100vh;
      height: 100%;
      background: transparent;
      color: var(--forma-ink);
      font-family: var(--app-font);
      position: relative;
    }
    .forma-app-loading {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      background: var(--forma-bg);
      color: var(--forma-muted);
      font-family: var(--app-font);
    }
  `
}
