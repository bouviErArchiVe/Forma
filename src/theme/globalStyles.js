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
      --forma-space-xs: ${spacing.xs}px;
      --forma-space-sm: ${spacing.sm}px;
      --forma-space-md: ${spacing.md}px;
      --forma-space-lg: ${spacing.lg}px;
      --forma-space-xl: ${spacing.xl}px;
      --forma-space-page: ${spacing.page}px;
      --forma-shadow-sm: ${shadow.sm};
      --forma-shadow-md: ${shadow.md};
      --forma-shadow-lg: ${shadow.lg};
      --forma-shadow-card: ${shadow.card};
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
    html.forma-animations-off .forma-animate-sheet,
    html.forma-animations-off .forma-route-enter,
    html.forma-animations-off .forma-panel-enter,
    html.forma-animations-off .fade-up,
    html.forma-animations-off .nb-card {
      animation: none !important;
    }

    @keyframes formaBackdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes formaRouteEnter {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes formaRouteEditor {
      from { opacity: 0; transform: translateX(12px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes formaPanelFromRight {
      from { opacity: 0; transform: translateX(18px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes formaPanelFromLeft {
      from { opacity: 0; transform: translateX(-18px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes formaPanelFromTop {
      from { opacity: 0; transform: translateY(-14px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes formaPanelFromBottom {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: none; }
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
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(14px) scale(.97); }
      to { opacity: 1; transform: none; }
    }
    @keyframes formaSheetIn {
      from { opacity: 0; transform: translateY(100%); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes formaDictationBar {
      0%, 100% { height: 6px; opacity: .55; }
      50% { height: 20px; opacity: 1; }
    }

    .fade-up { animation: fadeUp .28s ease forwards; }
    .forma-animate-in { animation: formaFadeUp .24s var(--forma-transition-spring) forwards; }
    .forma-animate-scale { animation: formaScaleIn .22s var(--forma-transition-spring) forwards; }
    .forma-animate-sheet { animation: formaSheetIn .32s var(--forma-transition-spring) forwards; }

    .forma-route-enter {
      animation: formaRouteEnter .32s cubic-bezier(.2,.8,.2,1) forwards;
    }
    .forma-route-enter--editor {
      animation: formaRouteEditor .34s cubic-bezier(.2,.8,.2,1) forwards;
    }

    .forma-panel-enter--right { animation: formaPanelFromRight .28s var(--forma-transition-spring) forwards; }
    .forma-panel-enter--left { animation: formaPanelFromLeft .28s var(--forma-transition-spring) forwards; }
    .forma-panel-enter--top { animation: formaPanelFromTop .28s var(--forma-transition-spring) forwards; }
    .forma-panel-enter--bottom { animation: formaPanelFromBottom .28s var(--forma-transition-spring) forwards; }
    .forma-panel-enter--float { animation: formaScaleIn .24s var(--forma-transition-spring) forwards; }

    .forma-modal-backdrop {
      position: fixed;
      inset: 0;
      display: flex;
      justify-content: center;
      animation: formaBackdropIn .2s ease forwards;
      padding: 16px;
      padding-top: max(16px, env(safe-area-inset-top));
      padding-bottom: max(16px, env(safe-area-inset-bottom));
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
    }
    .forma-modal-backdrop--center { align-items: center; }
    .forma-modal-backdrop--sheet {
      align-items: flex-end;
      padding-left: 0;
      padding-right: 0;
      padding-bottom: 0;
    }
    .forma-modal-panel { max-width: 100%; }
    .forma-modal-backdrop--sheet .forma-modal-panel {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
    }
    .forma-modal-backdrop--sheet .forma-modal-panel > * {
      border-bottom-left-radius: 0 !important;
      border-bottom-right-radius: 0 !important;
      border-top-left-radius: var(--forma-radius-xl) !important;
      border-top-right-radius: var(--forma-radius-xl) !important;
      padding-bottom: max(26px, env(safe-area-inset-bottom)) !important;
      max-height: min(88vh, 92dvh) !important;
    }

    .forma-sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.32);
      opacity: 0;
      pointer-events: none;
      transition: opacity .24s ease;
      z-index: ${TOKENS.zIndex.float + 1};
    }
    .forma-sidebar-backdrop--open {
      opacity: 1;
      pointer-events: auto;
    }
    .forma-editor-sidebar {
      position: fixed;
      left: 0;
      top: 46px;
      bottom: 32px;
      width: min(288px, 86vw);
      padding: 16px 14px;
      transform: translateX(-105%);
      transition: transform .28s cubic-bezier(.2,.8,.2,1);
      z-index: ${TOKENS.zIndex.float + 2};
      overflow-y: auto;
      box-shadow: ${TOKENS.shadow.panel};
    }
    .forma-editor-sidebar--open {
      transform: translateX(0);
    }
    .forma-profile-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.32);
      opacity: 0;
      pointer-events: none;
      transition: opacity .24s ease;
      z-index: ${TOKENS.zIndex.float + 1};
    }
    .forma-profile-backdrop--open {
      opacity: 1;
      pointer-events: auto;
    }
    .forma-profile-panel {
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      width: min(320px, 90vw);
      padding: 20px 16px;
      padding-top: max(20px, env(safe-area-inset-top));
      padding-bottom: max(20px, env(safe-area-inset-bottom));
      padding-right: max(16px, env(safe-area-inset-right));
      transform: translateX(105%);
      transition: transform .28s cubic-bezier(.2,.8,.2,1);
      z-index: ${TOKENS.zIndex.float + 2};
      overflow-y: auto;
      box-shadow: ${TOKENS.shadow.panel};
    }
    .forma-profile-panel--open {
      transform: translateX(0);
    }
    .forma-editor-sidebar-tab {
      transition: transform .18s ease, opacity .18s ease;
    }
    .forma-editor-sidebar-tab:active {
      transform: translateY(-50%) scale(.96);
    }
    .forma-nb-swipe-wrap {
      position: relative;
      overflow: hidden;
      border-radius: inherit;
    }
    .forma-nb-swipe-actions {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: stretch;
      justify-content: flex-end;
      gap: 0;
      pointer-events: none;
    }
    .forma-nb-swipe-actions button {
      pointer-events: auto;
      border: none;
      cursor: pointer;
      font-size: 18px;
      width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .forma-nb-swipe-card {
      position: relative;
      z-index: 1;
      transition: transform .18s ease;
      touch-action: pan-y;
    }

    .forma-library-header {
      padding: 0 22px;
      padding-left: max(22px, env(safe-area-inset-left));
      padding-right: max(22px, env(safe-area-inset-right));
      position: sticky;
      top: 0;
      z-index: ${TOKENS.zIndex.toolbar};
    }
    .forma-library-header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 62px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .forma-library-content {
      padding: var(--forma-space-page) 22px;
      max-width: 1400px;
      margin: 0 auto;
      padding-left: max(22px, env(safe-area-inset-left));
      padding-right: max(22px, env(safe-area-inset-right));
      padding-bottom: max(var(--forma-space-page), env(safe-area-inset-bottom));
    }
    @media (min-width: 768px) {
      .forma-library-content {
        padding: var(--forma-space-page) 32px 48px;
        padding-left: max(32px, env(safe-area-inset-left));
        padding-right: max(32px, env(safe-area-inset-right));
        padding-bottom: max(48px, env(safe-area-inset-bottom));
      }
      .forma-library-header { padding: 0 32px; }
    }
    @media (min-width: 1024px) {
      .forma-library-content {
        padding: 32px 40px 56px;
        padding-left: max(40px, env(safe-area-inset-left));
        padding-right: max(40px, env(safe-area-inset-right));
        padding-bottom: max(56px, env(safe-area-inset-bottom));
      }
    }

    .forma-library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px;
    }
    @media (min-width: 768px) {
      .forma-library-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 18px;
      }
    }
    @media (min-width: 1024px) {
      .forma-library-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
      }
    }

    .forma-ipad-bottom-toolbar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: ${TOKENS.zIndex.toolbar + 2};
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 8px 10px;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      padding-left: max(10px, env(safe-area-inset-left));
      padding-right: max(10px, env(safe-area-inset-right));
      box-shadow: ${TOKENS.shadow.lg};
    }
    .forma-ipad-bottom-toolbar__scroll {
      flex: 1;
      display: flex;
      align-items: stretch;
      gap: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .forma-ipad-bottom-toolbar__scroll::-webkit-scrollbar { display: none; }
    .forma-ipad-bottom-toolbar__btn {
      flex: 0 0 auto;
      min-width: 52px;
      min-height: 48px;
      padding: 6px 8px;
      border-radius: var(--forma-radius-md);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .forma-ipad-bottom-toolbar__icon { font-size: 17px; line-height: 1; }
    .forma-ipad-bottom-toolbar__label {
      font-size: 8px;
      font-weight: 700;
      line-height: 1;
      opacity: 0.85;
    }
    .forma-ipad-bottom-toolbar__meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      flex-shrink: 0;
      padding-left: 4px;
    }
    .forma-ipad-bottom-toolbar__more {
      width: 44px;
      height: 44px;
      border-radius: var(--forma-radius-md);
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .forma-review-sidebar-overlay {
      position: fixed;
      left: 0;
      top: 46px;
      bottom: 0;
      width: min(260px, 82vw);
      transform: translateX(-105%);
      transition: transform .28s cubic-bezier(.2,.8,.2,1);
      z-index: ${TOKENS.zIndex.float + 2};
      overflow: hidden;
      box-shadow: ${TOKENS.shadow.panel};
    }
    .forma-review-sidebar-overlay--open {
      transform: translateX(0);
    }
    .forma-review-bottom-toolbar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: ${TOKENS.zIndex.toolbar + 1};
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      padding-left: max(10px, env(safe-area-inset-left));
      padding-right: max(10px, env(safe-area-inset-right));
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      box-shadow: 0 -4px 24px rgba(0,0,0,.25);
    }
    .forma-review-bottom-toolbar::-webkit-scrollbar { display: none; }
    .forma-review-bottom-toolbar__btn {
      flex: 0 0 auto;
      min-width: 48px;
      min-height: 48px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      font-size: 16px;
      transition: transform var(--forma-transition-fast);
    }
    .forma-review-bottom-toolbar__btn:active {
      transform: scale(.96);
    }

    .forma-stat-chip {
      padding: 8px 14px;
      min-height: 44px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
      transition: transform var(--forma-transition-fast),
        border-color var(--forma-transition-fast),
        background var(--forma-transition-fast);
    }
    .forma-stat-chip--clickable { cursor: pointer; }
    .forma-stat-chip--clickable:active { transform: scale(.97); }

    .nb-card {
      animation: cardIn .34s cubic-bezier(.2,.8,.2,1) both;
      transition: transform .24s cubic-bezier(.2,.8,.2,1), box-shadow .24s ease;
      box-shadow: var(--forma-shadow-card);
      border: none;
    }
    .nb-card:hover {
      transform: translateY(-5px) !important;
      box-shadow: ${shadow.cardHover} !important;
    }
    .nb-card--list:hover,
    .nb-card--timeline:hover {
      transform: translateY(-2px) !important;
      box-shadow: var(--forma-shadow-md) !important;
    }
    .nb-btn-action { opacity: 0; transition: opacity .15s; }
    @media (hover: hover) {
      .nb-card:hover .nb-btn-action { opacity: 1; }
    }
    @media (hover: none) {
      .nb-btn-action { opacity: 1; }
    }
    .star-btn { transition: transform .15s, color .15s; }
    .star-btn:hover { transform: scale(1.3); }
    .nb-card:nth-child(1) { animation-delay: 0ms; }
    .nb-card:nth-child(2) { animation-delay: 35ms; }
    .nb-card:nth-child(3) { animation-delay: 70ms; }
    .nb-card:nth-child(4) { animation-delay: 105ms; }
    .nb-card:nth-child(5) { animation-delay: 140ms; }
    .nb-card:nth-child(6) { animation-delay: 175ms; }
    .nb-card:nth-child(7) { animation-delay: 210ms; }
    .nb-card:nth-child(8) { animation-delay: 245ms; }
    .nb-card:nth-child(9) { animation-delay: 280ms; }
    .nb-card:nth-child(10) { animation-delay: 315ms; }
    .nb-card:nth-child(11) { animation-delay: 350ms; }
    .nb-card:nth-child(12) { animation-delay: 385ms; }

    .nb-card--selected {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--forma-accent, #c8622a) 32%, transparent), var(--forma-shadow-md) !important;
    }
    .nb-card--selecting:hover {
      transform: none !important;
    }

    .forma-dictation-bar {
      animation: formaDictationBar .85s ease-in-out infinite;
    }

    .forma-tap-target {
      min-width: 44px;
      min-height: 44px;
    }

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
      min-height: 100dvh;
      height: 100%;
      background: transparent;
      color: var(--forma-ink);
      font-family: var(--app-font);
      position: relative;
    }
    .forma-app-loading {
      height: 100vh;
      height: 100dvh;
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
