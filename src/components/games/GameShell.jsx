/** Conteneur commun pour les mini-jeux canvas. */
export default function GameShell({ T, title, hint, score, best, onClose, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: T.ink }}>{title}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.muted }}>Score <strong style={{ color: T.ink }}>{score}</strong></span>
          {best > 0 && <span style={{ fontSize: 11, color: T.accent }}>Record {best}</span>}
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 11, cursor: 'pointer' }}
          >
            Fermer ✕
          </button>
        </div>
      </div>
      <div style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex',
        justifyContent: 'center',
        touchAction: 'none',
      }}>
        {children}
      </div>
      {hint && <p style={{ margin: 0, fontSize: 11, color: T.muted, textAlign: 'center' }}>{hint}</p>}
    </div>
  )
}
