/** Écran d'erreur fatale si React ne peut pas démarrer (hors ErrorBoundary). */
export function showFatalBootScreen(error) {
  const root = document.getElementById('root')
  if (!root) return
  const msg = error?.message || String(error || 'Erreur inconnue')
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Nunito,sans-serif;background:#faf4ee;color:#1c1c24;">
      <div style="max-width:440px;width:100%;padding:24px;border-radius:16px;background:#fff;border:1px solid #e6e6e6;box-shadow:0 12px 40px rgba(0,0,0,.12);text-align:center;">
        <div style="font-size:32px;margin-bottom:12px;">⚠</div>
        <h2 style="font-family:Syne,sans-serif;font-size:18px;margin:0 0 8px;">Forma n'a pas pu démarrer</h2>
        <p style="font-size:13px;color:#888;line-height:1.5;margin-bottom:16px;">${msg.replace(/</g, '&lt;')}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a href="/" style="padding:10px 16px;border-radius:10px;background:#d4714a;color:#fff;text-decoration:none;font-weight:700;font-size:13px;">Recharger</a>
          <button type="button" id="forma-boot-reset" style="padding:10px 16px;border-radius:10px;border:1px solid #e9456044;background:#e9456010;color:#e94560;font-weight:600;font-size:13px;cursor:pointer;">
            Réinitialiser données locales
          </button>
        </div>
      </div>
    </div>
  `
  document.getElementById('forma-boot-reset')?.addEventListener('click', () => {
    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && (k.startsWith('forma_') || k.startsWith('forma-') || k.startsWith('forma_pages_') || k.startsWith('archnote'))) {
          keys.push(k)
        }
      }
      keys.forEach((k) => localStorage.removeItem(k))
    } catch { /* ignore */ }
    window.location.href = '/'
  })
}
