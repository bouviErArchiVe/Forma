/** Écran de chargement initial — visible avant le 1er paint React. */
export default function AppLoading({ label = 'Chargement…' }) {
  return (
    <div className="forma-app-loading">
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: 'var(--forma-ink, #1c1c24)',
            marginBottom: 8,
            letterSpacing: 0.5,
          }}
        >
          Forma
        </div>
        <div style={{ fontSize: 13, color: 'var(--forma-muted, #888)' }}>{label}</div>
      </div>
    </div>
  )
}
