export default function GameCard({ T, game, bestScore, onPlay }) {
  return (
    <button
      type="button"
      onClick={() => onPlay(game.id)}
      style={{
        padding: '18px 16px 16px',
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.surface,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        transition: 'transform .15s, box-shadow .15s, border-color .15s',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 22px ${T.accent}16`
        e.currentTarget.style.borderColor = `${T.accent}55`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)'
        e.currentTarget.style.borderColor = T.border
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }}>{game.icon}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: T.ink, marginBottom: 6 }}>
        {game.title}
      </div>
      <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginBottom: 12, minHeight: 34 }}>
        {game.description}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: T.accent, fontWeight: 700 }}>▶ Jouer</span>
        {bestScore > 0 && (
          <span style={{ fontSize: 10, color: T.muted }}>Record : {bestScore}</span>
        )}
      </div>
    </button>
  )
}
